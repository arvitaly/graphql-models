"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
function printGraphQLInputType(type) {
    if (type instanceof graphql_1.GraphQLScalarType) {
        return type;
    }
    if (type instanceof graphql_1.GraphQLInputObjectType) {
        return printGraphQLInputObjectType(type);
    }
    if (type instanceof graphql_1.GraphQLNonNull) {
        return {
            type: "GraphQLNonNull",
            of: printGraphQLInputType(type.ofType),
        };
    }
    if (type instanceof graphql_1.GraphQLList) {
        return {
            type: "GraphQLList",
            of: printGraphQLInputType(type.ofType),
        };
    }
    if (type instanceof graphql_1.GraphQLEnumType) {
        throw new Error("Unsupported enum type: " + type);
    }
}
exports.printGraphQLInputType = printGraphQLInputType;
function printGraphQLInputObjectType(type) {
    return {
        type: "GraphQLInputObjectType",
        name: type.name,
        description: type.description,
        fields: printGraphQLInputFieldMap(type.getFields()),
    };
}
exports.printGraphQLInputObjectType = printGraphQLInputObjectType;
function printGraphQLInputFieldMap(fields) {
    return _(fields, printGraphQLInputField);
}
exports.printGraphQLInputFieldMap = printGraphQLInputFieldMap;
function printGraphQLObjectType(type) {
    const fields = type.getFields();
    return {
        type: "GraphQLObjectType",
        name: type.name,
        description: type.description,
        interfaces: type.getInterfaces().map(printGraphQLInterfaceType),
        fields: Object.keys(fields).map((fieldName) => {
            return printField(fields[fieldName]);
        }),
    };
}
exports.printGraphQLObjectType = printGraphQLObjectType;
function printGraphQLInterfaceType(type) {
    return {
        type: "GraphQLInterfaceType",
        name: type.name,
        description: type.description,
        fields: _(type.getFields(), printField),
        resolveType: typeof (type.resolveType),
    };
}
exports.printGraphQLInterfaceType = printGraphQLInterfaceType;
function printGraphQLType(type) {
    if (type instanceof graphql_1.GraphQLScalarType) {
        return type;
    }
    if (type instanceof graphql_1.GraphQLObjectType) {
        return printGraphQLObjectType(type);
    }
    if (type instanceof graphql_1.GraphQLInterfaceType) {
        return printGraphQLInterfaceType(type);
    }
    if (type instanceof graphql_1.GraphQLInputObjectType) {
        return printGraphQLInputObjectType(type);
    }
    if (type instanceof graphql_1.GraphQLEnumType) {
        throw new Error("Unsupported enum type: " + type);
    }
    if (type instanceof graphql_1.GraphQLUnionType) {
        throw new Error("Unsupported union type: " + type);
    }
    if (type instanceof graphql_1.GraphQLList) {
        return {
            type: "GraphQLList",
            of: printGraphQLType(type.ofType),
        };
    }
    if (type instanceof graphql_1.GraphQLNonNull) {
        return {
            type: "GraphQLNonNull",
            of: printGraphQLType(type.ofType),
        };
    }
}
exports.printGraphQLType = printGraphQLType;
function printGraphQLFieldConfigArgumentMap(args) {
    return _(args, printGraphQLArgumentConfig);
}
exports.printGraphQLFieldConfigArgumentMap = printGraphQLFieldConfigArgumentMap;
function printGraphQLArgumentConfig(arg) {
    return {
        defaultValue: arg.defaultValue,
        description: arg.description,
        type: printGraphQLInputType(arg.type),
    };
}
exports.printGraphQLArgumentConfig = printGraphQLArgumentConfig;
function printGraphQLFieldConfig(config) {
    return {
        args: printGraphQLFieldConfigArgumentMap(config.args),
        deprecationReason: config.deprecationReason,
        description: config.description,
        resolve: typeof (config.resolve),
        type: printGraphQLType(config.type),
    };
}
exports.printGraphQLFieldConfig = printGraphQLFieldConfig;
function printGraphQLInputField(field) {
    return {
        name: field.name,
        description: field.description,
        defaultValue: field.defaultValue,
        type: printGraphQLType(field.type),
    };
}
exports.printGraphQLInputField = printGraphQLInputField;
function printField(field) {
    return {
        args: field.args.map((arg) => {
            return {
                description: arg.description,
                defaultValue: arg.defaultValue,
                name: arg.name,
                type: printGraphQLInputType(arg.type),
            };
        }),
        deprecationReason: field.deprecationReason,
        description: field.description,
        isDeprecated: field.isDeprecated,
        name: field.name,
        resolve: typeof (field.resolve),
        type: printGraphQLType(field.type),
    };
}
exports.printField = printField;
function printGraphQLSchema(schema) {
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    return {
        directives: schema.getDirectives(),
        mutationType: mutationType ? printGraphQLObjectType(mutationType) : undefined,
        queryType: queryType ? printGraphQLObjectType(schema.getQueryType()) : undefined,
        subscriptionType: subscriptionType ? printGraphQLObjectType(schema.getSubscriptionType()) : undefined,
    };
}
exports.printGraphQLSchema = printGraphQLSchema;
function printFieldNode(fieldNode) {
    return {
        alias: fieldNode.alias ? printNameNode(fieldNode.alias) : null,
        arguments: fieldNode.arguments.map(printArgumentNode),
        directives: fieldNode.directives.map(printDirectiveNode),
        kind: fieldNode.kind,
        loc: printLocation(fieldNode.loc),
        name: printNameNode(fieldNode.name),
        selectionSet: printSelectionSetNode(fieldNode.selectionSet),
    };
}
exports.printFieldNode = printFieldNode;
function printValueNode(node) {
    return {
        kind: node.kind,
        loc: printLocation(node.loc),
    };
}
exports.printValueNode = printValueNode;
function printArgumentNode(node) {
    return {
        kind: node.kind,
        loc: printLocation(node.loc),
        name: printNameNode(node.name),
        value: node.value,
    };
}
exports.printArgumentNode = printArgumentNode;
function printDirectiveNode(node) {
    return {
        kind: node.kind,
        loc: printLocation(node.loc),
        name: printNameNode(node.name),
        arguments: node.arguments.map(printArgumentNode),
    };
}
exports.printDirectiveNode = printDirectiveNode;
function printToken(token) {
    return {
        column: token.column,
        start: token.start,
        end: token.end,
        kine: token.kind,
        line: token.line,
        next: token.next ? printToken(token.next) : null,
        prev: token.prev ? "prevToken" : null,
        value: token.value,
    };
}
exports.printToken = printToken;
function printSource(source) {
    return {
        body: source.body,
        name: source.name,
    };
}
exports.printSource = printSource;
function printLocation(location) {
    return {
        start: location.start,
        end: location.end,
        startToken: printToken(location.startToken),
        endToken: printToken(location.endToken),
        source: printSource(location.source),
    };
}
exports.printLocation = printLocation;
function printNameNode(node) {
    return {
        kind: node.kind,
        loc: printLocation(node.loc),
        value: node.value,
    };
}
exports.printNameNode = printNameNode;
function printSelectionNode(node) {
    return {
        kind: node.kind,
        directives: node.directives.map(printDirectiveNode),
        loc: printLocation(node.loc),
    };
}
exports.printSelectionNode = printSelectionNode;
function printSelectionSetNode(node) {
    return {
        kind: node.kind,
        loc: printLocation(node.loc),
        selections: node.selections.map(printSelectionNode),
    };
}
exports.printSelectionSetNode = printSelectionSetNode;
function printNamedTypeNode(node) {
    return {
        kind: node.kind,
        loc: printLocation(node.loc),
        name: printNameNode(node.name),
    };
}
exports.printNamedTypeNode = printNamedTypeNode;
function printFragmentDefinitionNode(node) {
    return {
        directives: node.directives.map(printDirectiveNode),
        kind: node.kind,
        loc: printLocation(node.loc),
        name: printNameNode(node.name),
        selectionSet: printSelectionSetNode(node.selectionSet),
        typeCondition: printNamedTypeNode(node.typeCondition),
    };
}
exports.printFragmentDefinitionNode = printFragmentDefinitionNode;
function printGraphQLResolveInfo(info) {
    return {
        fieldName: info.fieldName,
        fieldNodes: info.fieldNodes.map(printFieldNode),
        fragments: Object.keys(info.fragments).map((fragmentName) => {
            return {
                fragmentName,
                fragment: printFragmentDefinitionNode(info.fragments[fragmentName]),
            };
        }),
    };
}
exports.printGraphQLResolveInfo = printGraphQLResolveInfo;
function _(obj, cb) {
    return Object.keys(obj).map((name) => {
        return {
            name,
            field: cb(obj[name]),
        };
    });
}
