"use strict";
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const ArgumentTypes_1 = require("./ArgumentTypes");
const AttributeTypes_1 = require("./AttributeTypes");
const ResolveTypes_1 = require("./ResolveTypes");
exports.whereArgName = "where";
class Model {
    constructor(config, collector, opts = {}) {
        this.config = config;
        this.collector = collector;
        this.opts = opts;
        this.opts.interfaces = this.opts.interfaces || [];
        this.resolveFn = this.opts.resolveFn;
        this.name = this.config.name || capitalize(this.config.id);
        this.id = this.config.id;
        let idAttr;
        this.attributes = this.config.attributes.map((attrConfig) => {
            if (attrConfig.type === AttributeTypes_1.default.Model || attrConfig.type === AttributeTypes_1.default.Collection) {
                if (!attrConfig.model) {
                    throw new Error("For attribute with type " + attrConfig.type + " should be set model");
                }
            }
            const attr = {
                name: attrConfig.name,
                type: attrConfig.type,
                model: attrConfig.model,
                required: typeof (attrConfig.required) !== "undefined" ? attrConfig.required : false,
            };
            if (attrConfig.primaryKey === true) {
                this.primaryKeyAttribute = attr;
            }
            if (attrConfig.name.toLowerCase() === "id") {
                idAttr = attr;
                attr.name = "_id";
            }
            if (!this.primaryKeyAttribute) {
                if (idAttr) {
                    this.primaryKeyAttribute = idAttr;
                }
            }
            return attr;
        });
        this.attributes.push({
            name: "id",
            type: AttributeTypes_1.default.ID,
            required: false,
        });
    }
    setResolveFn(resolveFn) {
        this.resolveFn = resolveFn;
    }
    getPrimaryKeyAttribute() {
        if (!this.primaryKeyAttribute) {
            throw new Error("Not found primary key attribute for model `" + this.name + "`");
        }
        return this.primaryKeyAttribute;
    }
    getBaseType() {
        if (!this.baseType) {
            this.baseType = this.generateBaseType();
        }
        return this.baseType;
    }
    // Queries
    getConnectionType() {
        if (!this.connectionType) {
            this.connectionType = graphql_relay_1.connectionDefinitions({
                nodeType: this.getBaseType(),
            }).connectionType;
        }
        return this.connectionType;
    }
    getOneArgs() {
        let args = {};
        const primary = this.getPrimaryKeyAttribute();
        args[primary.name] = { type: new graphql_1.GraphQLNonNull(scalarTypeToGraphQL(this.getPrimaryKeyAttribute().type)) };
        return args;
    }
    getWhereArgument(name) {
        const arg = this.getWhereArguments().find((a) => a.name === name);
        if (!arg) {
            throw new Error("Unknown where argument " + name);
        }
        return arg;
    }
    getQueryOne() {
        return {
            args: this.getOneArgs(),
            type: this.getBaseType(),
            resolve: (source, args, context, info) => {
                const where = Object.keys(args[exports.whereArgName]).map((key) => {
                    return this.getWhereArgument(key);
                });
                return this.resolveFn({
                    type: ResolveTypes_1.default.QueryOne,
                    model: this.id,
                    source,
                    args,
                    context,
                    info,
                    where,
                });
            },
        };
    }
    getConnectionQuery() {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return this.resolveFn({
                    type: ResolveTypes_1.default.QueryConnection,
                    model: this.id,
                    source,
                    args,
                    context,
                    info,
                });
            },
        };
    }
    getConnectionArgs() {
        let args = graphql_relay_1.connectionArgs;
        args[exports.whereArgName] = { type: this.getWhereInputType() };
        return args;
    }
    getWhereInputType() {
        if (!this.whereInputType) {
            this.whereInputType = this.generateWhereInputType();
        }
        return this.whereInputType;
    }
    getQueries() {
        let queries = [];
        queries.push({
            name: uncapitalize(this.name),
            field: this.getQueryOne(),
        });
        queries.push({
            name: uncapitalize(this.name) + "s",
            field: this.getConnectionQuery(),
        });
        return queries;
    }
    // Mutations
    getCreateMutation() {
        let outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "CreateMutation",
            inputFields: this.getCreateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context) => {
                return this.resolveFn({
                    type: ResolveTypes_1.default.MutationCreate,
                    model: this.id,
                    source: null,
                    args: object,
                    context,
                    info: null,
                });
            },
        });
    }
    getCreateType() {
        if (!this.createType) {
            this.createType = this.generateCreationType();
        }
        return this.createType;
    }
    getUpdateType() {
        if (!this.updateType) {
            this.updateType = this.generateUpdateType();
        }
        return this.updateType;
    }
    getDeleteMutation() {
        // TODO
    }
    getUpdateMutation() {
        let outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "UpdateMutation",
            inputFields: this.getUpdateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context) => {
                return this.resolveFn({
                    type: ResolveTypes_1.default.MutationUpdate,
                    model: this.id,
                    source: null,
                    args: object,
                    context,
                    info: null,
                });
            },
        });
    }
    getUpdateManyMutation() {
        let outputFields = {};
        outputFields[uncapitalize(this.name) + "s"] = {
            type: new graphql_1.GraphQLList(this.getBaseType()),
        };
        let inputFields = {};
        inputFields[exports.whereArgName] = { type: this.getWhereInputType() };
        inputFields[uncapitalize(this.name)] = {
            type: this.getUpdateType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "sUpdateMutation",
            inputFields,
            outputFields,
            mutateAndGetPayload: (object, context) => {
                return this.resolveFn({
                    type: ResolveTypes_1.default.MutationUpdate,
                    model: this.id,
                    source: null,
                    args: object,
                    context,
                    info: null,
                });
            },
        });
    }
    getMutations() {
        let mutations = [];
        mutations.push({
            name: "create" + this.name,
            field: this.getCreateMutation(),
        });
        mutations.push({
            name: "update" + this.name,
            field: this.getUpdateMutation(),
        });
        mutations.push({
            name: "update" + this.name + "s",
            field: this.getUpdateManyMutation(),
        });
        /*mutations.push({
            name: "delete" + this.name,
            field: this.getDeleteMutation(resolveFn),
        });*/
        return mutations;
        // TODO delete
    }
    getWhereArguments() {
        if (!this.whereArguments) {
            this.whereArguments = this.generateWhereArguments();
        }
        return this.whereArguments;
    }
    generateWhereArguments() {
        let args = [];
        this.attributes.map((attr) => {
            let type;
            if (attr.type === AttributeTypes_1.default.Model || attr.type === AttributeTypes_1.default.Collection) {
                type = this.collector.get(attr.model).getPrimaryKeyAttribute().type;
            }
            else {
                type = attr.type;
            }
            let graphqlType = scalarTypeToGraphQL(type);
            if (attr.type !== AttributeTypes_1.default.Collection) {
                args.push({
                    name: attr.name,
                    type: ArgumentTypes_1.default.Equal,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "NotEqual",
                    type: ArgumentTypes_1.default.NotEqual,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
            }
            if (attr.type !== AttributeTypes_1.default.Boolean) {
                args.push({
                    name: attr.name + "In",
                    type: ArgumentTypes_1.default.In,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "NotIn",
                    type: ArgumentTypes_1.default.NotIn,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
            }
            if (!attr.required) {
                args.push({
                    name: attr.name + "IsNull",
                    type: ArgumentTypes_1.default.IsNull,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "IsNotNull",
                    type: ArgumentTypes_1.default.IsNotNull,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
            }
            exports.whereArgHelpers[attr.type](attr).map((t) => {
                args.push({
                    attribute: attr.name,
                    name: t.name,
                    type: t.argumentType,
                    graphQLType: t.type,
                });
            });
        });
        return args;
    }
    generateBaseType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            let resolve;
            if (attr.type === AttributeTypes_1.default.Model) {
                graphQLType = this.collector.get(attr.model).getBaseType();
                resolve = (source, args, context, info) => {
                    return this.resolveFn({
                        args,
                        context,
                        info,
                        model: attr.model,
                        parentModel: this.id,
                        source,
                        type: ResolveTypes_1.default.Model,
                    });
                };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                graphQLType = this.collector.get(attr.model).getConnectionType();
                resolve = (source, args, context, info) => {
                    return this.resolveFn({
                        args,
                        context,
                        info,
                        model: attr.model,
                        parentModel: this.id,
                        source,
                        type: ResolveTypes_1.default.Connection,
                    });
                };
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: graphQLType };
            if (resolve) {
                fields[attr.name].resolve = resolve;
            }
        });
        return new graphql_1.GraphQLObjectType({
            name: this.name,
            fields,
            interfaces: this.opts.interfaces,
        });
    }
    generateCreationType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                graphQLType = new graphql_1.GraphQLList(graphQLType);
                fields["create" + capitalize(attr.name)] = {
                    type: new graphql_1.GraphQLList(childModel.getCreateType()),
                };
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: attr.required ? new graphql_1.GraphQLNonNull(graphQLType) : graphQLType };
        });
        return new graphql_1.GraphQLInputObjectType({
            name: "Create" + this.name + "Input",
            fields,
        });
    }
    generateUpdateType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                graphQLType = new graphql_1.GraphQLList(graphQLType);
                fields["create" + capitalize(attr.name)] = {
                    type: new graphql_1.GraphQLList(childModel.getCreateType()),
                };
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields["set" + capitalize(attr.name)] = {
                type: new graphql_1.GraphQLInputObjectType({
                    name: "Update" + this.name + "InputSet" + capitalize(attr.name),
                    fields: {
                        [attr.name]: { type: attr.required ? new graphql_1.GraphQLNonNull(graphQLType) : graphQLType },
                    },
                }),
            };
        });
        return new graphql_1.GraphQLInputObjectType({
            name: "Update" + this.name + "Input",
            fields,
        });
    }
    generateWhereInputType() {
        let where = {};
        this.getWhereArguments().map((arg) => {
            where[arg.name] = { type: arg.graphQLType };
        });
        return new graphql_1.GraphQLInputObjectType({
            name: this.name + "WhereInput",
            fields: where,
        });
    }
}
function scalarTypeToGraphQL(type) {
    let graphQLType;
    switch (type) {
        case AttributeTypes_1.default.ID:
            graphQLType = graphql_1.GraphQLID;
            break;
        case AttributeTypes_1.default.Date:
        case AttributeTypes_1.default.String:
            graphQLType = graphql_1.GraphQLString;
            break;
        case AttributeTypes_1.default.Float:
            graphQLType = graphql_1.GraphQLFloat;
            break;
        case AttributeTypes_1.default.Integer:
            graphQLType = graphql_1.GraphQLInt;
            break;
        case AttributeTypes_1.default.Boolean:
            graphQLType = graphql_1.GraphQLBoolean;
            break;
        default:
            throw new Error("Unknown scalar type " + type);
    }
    return graphQLType;
}
exports.scalarTypeToGraphQL = scalarTypeToGraphQL;
function uncapitalize(str) {
    return str.charAt(0).toLowerCase() + str.substr(1);
}
exports.uncapitalize = uncapitalize;
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
}
exports.capitalize = capitalize;
const stringFunctions = ["contains", "notContains", "startsWith", "notStartsWith",
    "endsWith", "notEndsWith", "like", "notLike"];
const numberFunctions = ["greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual"];
exports.whereArgHelpers = {
    [AttributeTypes_1.default.String]: (attr) => {
        const types = [];
        stringFunctions.map((f) => {
            types.push({
                name: attr.name + capitalize(f),
                type: graphql_1.GraphQLString,
                argumentType: f,
            });
        });
        return types;
    },
    [AttributeTypes_1.default.Integer]: (attr) => {
        const types = [];
        numberFunctions.map((f) => {
            return {
                name: attr.name + capitalize(f),
                type: graphql_1.GraphQLInt,
                argumentType: f,
            };
        });
        return types;
    },
    [AttributeTypes_1.default.Float]: (attr) => {
        const types = [];
        numberFunctions.map((f) => {
            return {
                name: attr.name + capitalize(f),
                type: graphql_1.GraphQLFloat,
                argumentType: f,
            };
        });
        return types;
    },
    [AttributeTypes_1.default.Date]: (attr) => {
        const types = [];
        numberFunctions.map((f) => {
            return {
                name: attr.name + capitalize(f),
                type: graphql_1.GraphQLString,
                argumentType: f,
            };
        });
        return types;
    },
    [AttributeTypes_1.default.Boolean]: (attr) => {
        return [];
    },
    [AttributeTypes_1.default.Model]: (attr) => {
        return [];
    },
    [AttributeTypes_1.default.Collection]: (attr) => {
        return [];
    },
    [AttributeTypes_1.default.ID]: (attr) => {
        return [];
    },
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Model;
