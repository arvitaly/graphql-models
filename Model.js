"use strict";
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const AttributeTypes_1 = require("./AttributeTypes");
const ResolveTypes_1 = require("./ResolveTypes");
exports.whereArgName = "where";
class Model {
    constructor(config, collector) {
        this.config = config;
        this.collector = collector;
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
            }
            if (!this.primaryKeyAttribute) {
                if (idAttr) {
                    this.primaryKeyAttribute = idAttr;
                }
            }
            return attr;
        });
    }
    getPrimaryKeyAttribute() {
        if (!this.primaryKeyAttribute) {
            throw new Error("Not found primary key attribute for model `" + this.name + "`");
        }
        return this.primaryKeyAttribute;
    }
    getCreationType() {
        if (!this.creationType) {
            this.creationType = this.generateCreationType();
        }
        return this.creationType;
    }
    getBaseType() {
        if (!this.baseType) {
            this.baseType = this.generateBaseType();
        }
        return this.baseType;
    }
    generateCreationType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreationType() };
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                graphQLType = new graphql_1.GraphQLList(graphQLType);
                fields["create" + capitalize(attr.name)] = {
                    type: new graphql_1.GraphQLList(childModel.getCreationType()),
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
    getConnectionType() {
        if (!this.connectionType) {
            this.connectionType = graphql_relay_1.connectionDefinitions({
                nodeType: this.getBaseType()
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
    getQueryOne(resolveFn) {
        return {
            args: this.getOneArgs(),
            type: this.getBaseType(),
            resolve: (source, args, context, info) => {
                return resolveFn({
                    type: ResolveTypes_1.default.QueryOne,
                    model: this.id,
                    source,
                    args,
                    context,
                    info,
                });
            },
        };
    }
    getConnectionQuery(resolveFn) {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return resolveFn({
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
        let where = {};
        this.attributes.map((attr) => {
            let type;
            if (attr.type === AttributeTypes_1.default.Model || attr.type === AttributeTypes_1.default.Collection) {
                type = this.collector.get(attr.model).getPrimaryKeyAttribute().type;
            }
            else {
                type = attr.type;
            }
            where[attr.name] = { type: scalarTypeToGraphQL(type) };
        });
        return new graphql_1.GraphQLInputObjectType({
            name: this.name + "WhereInput",
            fields: where,
        });
    }
    getQueries(resolveFn) {
        let queries = [];
        queries.push({
            name: uncapitalize(this.name),
            field: this.getQueryOne(resolveFn),
        });
        queries.push({
            name: uncapitalize(this.name) + "s",
            field: this.getConnectionQuery(resolveFn),
        });
        return queries;
    }
    getDeleteMutation() {
    }
    getUpdateMutation() {
    }
    getCreateMutation() {
        graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "CreateMutation",
            inputFields: {},
            outputFields: {},
            mutateAndGetPayload: () => {
                return null;
            },
        });
    }
    getMutations() {
    }
    generateBaseType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                graphQLType = this.collector.get(attr.model).getBaseType();
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                graphQLType = this.collector.get(attr.model).getBaseType();
                graphQLType = new graphql_1.GraphQLList(graphQLType);
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new graphql_1.GraphQLObjectType({
            name: this.name,
            fields,
        });
    }
}
function scalarTypeToGraphQL(type) {
    let graphQLType;
    switch (type) {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Model;
