import {
    GraphQLArgumentConfig, GraphQLEnumType, GraphQLField, GraphQLFieldConfig,
    GraphQLFieldConfigArgumentMap, GraphQLInputField, GraphQLInputFieldMap, GraphQLInputObjectType,
    GraphQLInputType, GraphQLInterfaceType, GraphQLList,
    GraphQLNonNull, GraphQLObjectType, GraphQLScalarType, GraphQLSchema,
    GraphQLType, GraphQLUnionType,
} from "graphql";
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
export function printGraphQLInputType(type: GraphQLInputType) {
    if (type instanceof GraphQLScalarType) {
        return type;
    }
    if (type instanceof GraphQLInputObjectType) {
        return printGraphQLInputObjectType(type);
    }
    if (type instanceof GraphQLNonNull) {
        return {
            type: "GraphQLNonNull",
            of: printGraphQLInputType(type.ofType),
        };
    }
    if (type instanceof GraphQLList) {
        return {
            type: "GraphQLList",
            of: printGraphQLInputType(type.ofType),
        };
    }
    if (type instanceof GraphQLEnumType) {
        throw new Error("Unsupported enum type: " + type);
    }
}
export function printGraphQLInputObjectType(type: GraphQLInputObjectType) {
    return {
        type: "GraphQLInputObjectType",
        name: type.name,
        description: type.description,
        fields: printGraphQLInputFieldMap(type.getFields()),
    };
}
export function printGraphQLInputFieldMap(fields: GraphQLInputFieldMap) {
    return _(fields, printGraphQLInputField);
}
export function printGraphQLObjectType(type: GraphQLObjectType) {
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
export function printGraphQLInterfaceType(type: GraphQLInterfaceType) {
    return {
        type: "GraphQLInterfaceType",
        name: type.name,
        description: type.description,
        fields: _(type.getFields(), printField),
        resolveType: typeof (type.resolveType),
    };
}
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
export function printGraphQLType(type: GraphQLType) {
    if (type instanceof GraphQLScalarType) {
        return type;
    }
    if (type instanceof GraphQLObjectType) {
        return printGraphQLObjectType(type);
    }
    if (type instanceof GraphQLInterfaceType) {
        return printGraphQLInterfaceType(type);
    }
    if (type instanceof GraphQLInputObjectType) {
        return printGraphQLInputObjectType(type);
    }
    if (type instanceof GraphQLEnumType) {
        throw new Error("Unsupported enum type: " + type);
    }
    if (type instanceof GraphQLUnionType) {
        throw new Error("Unsupported union type: " + type);
    }
    if (type instanceof GraphQLList) {
        return {
            type: "GraphQLList",
            of: printGraphQLType(type.ofType),
        };
    }
    if (type instanceof GraphQLNonNull) {
        return {
            type: "GraphQLNonNull",
            of: printGraphQLType(type.ofType),
        };
    }
}
export function printGraphQLFieldConfigArgumentMap(args: GraphQLFieldConfigArgumentMap) {
    return _(args, printGraphQLArgumentConfig);
}
export function printGraphQLArgumentConfig(arg: GraphQLArgumentConfig) {
    return {
        defaultValue: arg.defaultValue,
        description: arg.description,
        type: printGraphQLInputType(arg.type),
    };
}
export function printGraphQLFieldConfig(config: GraphQLFieldConfig<any, any>) {
    return {
        args: printGraphQLFieldConfigArgumentMap(config.args),
        deprecationReason: config.deprecationReason,
        description: config.description,
        resolve: typeof (config.resolve),
        type: printGraphQLType(config.type),
    };
}
export function printGraphQLInputField(field: GraphQLInputField) {
    return {
        name: field.name,
        description: field.description,
        defaultValue: field.defaultValue,
        type: printGraphQLType(field.type),
    };
}
export function printField(field: GraphQLField<any, any>) {
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
};
export function printGraphQLSchema(schema: GraphQLSchema) {
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
function _<T, F>(obj: { [index: string]: T }, cb: (field: T) => F): Array<{ name: string; field: F }> {
    return Object.keys(obj).map((name) => {
        return {
            name,
            field: cb(obj[name]),
        };
    });
};
