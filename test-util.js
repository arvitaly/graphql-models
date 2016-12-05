"use strict";
const graphql_1 = require("graphql");
/*
    export type GraphQLInputType =
        GraphQLScalarType |
        GraphQLEnumType |
        GraphQLInputObjectType |
        GraphQLList<any> |
        GraphQLNonNull<
        GraphQLScalarType |
        GraphQLEnumType |
        GraphQLInputObjectType |
        GraphQLList<any>
        >;
*/
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
    return _(fields).map(printGraphQLInputField);
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
        fields: _(type.getFields()).map(printField),
        resolveType: typeof (type.resolveType),
    };
}
exports.printGraphQLInterfaceType = printGraphQLInterfaceType;
/*     export type GraphQLType =
        GraphQLScalarType |
        GraphQLObjectType |
        GraphQLInterfaceType |
        GraphQLUnionType |
        GraphQLEnumType |
        GraphQLInputObjectType |
        GraphQLList<any> |
        GraphQLNonNull<any>;
*/
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
    return _(args).map(printGraphQLArgumentConfig);
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
;
function _(obj) {
    return Object.keys(obj).map((name) => {
        return obj[name];
    });
}
;
