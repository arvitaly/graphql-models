"use strict";
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const ArgumentTypes_1 = require("./ArgumentTypes");
const AttributeTypes_1 = require("./AttributeTypes");
const ResolveTypes_1 = require("./ResolveTypes");
exports.whereArgName = "where";
exports.idArgName = "id";
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
                realName: attrConfig.name,
                type: attrConfig.type,
                model: attrConfig.model,
                required: typeof (attrConfig.required) !== "undefined" ? attrConfig.required : false,
            };
            if (attrConfig.primaryKey === true) {
                this.primaryKeyAttribute = attr;
                attr.primaryKey = true;
            }
            if (attrConfig.name.toLowerCase() === "id") {
                idAttr = attr;
                attr.name = "_id";
            }
            return attr;
        });
        if (!this.primaryKeyAttribute) {
            if (idAttr) {
                this.primaryKeyAttribute = idAttr;
            }
        }
        this.attributes.push({
            name: "id",
            realName: null,
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
        args[exports.idArgName] = { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) };
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
                return this.resolveFn(this.id, ResolveTypes_1.default.QueryOne, { source, args, context, info });
            },
        };
    }
    getConnectionQuery() {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.QueryConnection, { source, args, context, info });
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
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationCreate, { source: null, args: object, context, info: null });
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
        let outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "DeleteMutation",
            inputFields: this.getOneArgs(),
            outputFields,
            mutateAndGetPayload: (object, context) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationDelete, { source: null, args: object, context, info: null });
            },
        });
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
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationUpdate, { source: null, args: object, context, info: null });
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
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationUpdateMany, { source: null, args: object, context, info: null });
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
        mutations.push({
            name: "delete" + this.name,
            field: this.getDeleteMutation(),
        });
        return mutations;
    }
    getWhereArguments() {
        if (!this.whereArguments) {
            this.whereArguments = this.generateWhereArguments();
        }
        return this.whereArguments;
    }
    getNameForGlobalId() {
        return capitalize(this.name);
    }
    prepareRow(row) {
        if (this.getPrimaryKeyAttribute().name.toLowerCase() === "_id") {
            row._id = row.id;
        }
        row.id = graphql_relay_1.toGlobalId(this.getNameForGlobalId(), row[this.getPrimaryKeyAttribute().name]);
        this.attributes.map((attr) => {
            if (typeof (row[attr.name]) !== "undefined") {
                if (attr.type === AttributeTypes_1.default.Date) {
                    row[attr.name] = row[attr.name].toString();
                }
            }
        });
        return row;
    }
    generateWhereArguments() {
        let args = [];
        this.attributes.map((attr) => {
            let type;
            if (attr.type === AttributeTypes_1.default.Model || attr.type === AttributeTypes_1.default.Collection) {
                type = AttributeTypes_1.default.ID;
            }
            else {
                type = attr.type;
            }
            let graphqlType = scalarTypeToGraphQL(type);
            // EQUALS
            if (attr.type !== AttributeTypes_1.default.Collection && !attr.primaryKey && attr.name !== exports.idArgName) {
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
            // IN
            if (attr.type !== AttributeTypes_1.default.Collection && attr.type !== AttributeTypes_1.default.Boolean && !attr.primaryKey) {
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
            // IS NULL
            if (attr.type !== AttributeTypes_1.default.Collection &&
                !attr.required && !attr.primaryKey && attr.name !== exports.idArgName) {
                args.push({
                    name: attr.name + "IsNull",
                    type: ArgumentTypes_1.default.IsNull,
                    attribute: attr.name,
                    graphQLType: graphql_1.GraphQLBoolean,
                });
                args.push({
                    name: attr.name + "IsNotNull",
                    type: ArgumentTypes_1.default.IsNotNull,
                    attribute: attr.name,
                    graphQLType: graphql_1.GraphQLBoolean,
                });
            }
            if (!attr.primaryKey) {
                exports.whereArgHelpers[attr.type](attr).map((t) => {
                    args.push({
                        attribute: attr.name,
                        name: t.name,
                        type: t.argumentType,
                        graphQLType: t.type,
                    });
                });
            }
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
                    return this.collector.get(attr.model).resolveFn(this.id, ResolveTypes_1.default.Node, { source: source[attr.name], args, context, info });
                };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                graphQLType = this.collector.get(attr.model).getConnectionType();
                resolve = (source, args, context, info) => {
                    return this.resolveFn(this.id, ResolveTypes_1.default.QueryConnection, { source: attr.name, args, context, info });
                };
            }
            else if (attr.type === AttributeTypes_1.default.ID) {
                graphQLType = new graphql_1.GraphQLNonNull(graphql_1.GraphQLID);
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
            name: capitalize(this.name),
            fields,
            interfaces: this.opts.interfaces,
        });
    }
    generateCreationType() {
        let fields = {};
        this.attributes.map((attr) => {
            if (attr.name === exports.idArgName) {
                return;
            }
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = graphql_1.GraphQLID;
                // scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                // graphQLType = scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                graphQLType = new graphql_1.GraphQLList(graphql_1.GraphQLID);
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
            name: "Create" + capitalize(this.name) + "Input",
            fields,
        });
    }
    generateUpdateType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = graphql_1.GraphQLID; // scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                graphQLType = graphql_1.GraphQLID; // scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
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
//# sourceMappingURL=Model.js.map