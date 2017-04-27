"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_fields_info_1 = require("graphql-fields-info");
const graphql_relay_1 = require("graphql-relay");
const _1 = require(".");
const ArgumentTypes_1 = require("./ArgumentTypes");
const AttributeTypes_1 = require("./AttributeTypes");
const ResolveTypes_1 = require("./ResolveTypes");
const Date_1 = require("./scalars/Date");
const JSON_1 = require("./scalars/JSON");
class Model {
    constructor(config, collector, opts = {}) {
        this.config = config;
        this.collector = collector;
        this.opts = opts;
        this.opts.interfaces = this.opts.interfaces || [];
        this.resolveFn = this.opts.resolveFn;
        this.name = this.config.name || capitalize(this.config.id);
        this.queryName = uncapitalize(this.name);
        this.connectionName = uncapitalize(this.name) + "s";
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
        const args = {};
        args[_1.idArgName] = { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) };
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
                return this.resolveFn(this.id, ResolveTypes_1.default.QueryOne, {
                    source, args, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
                });
            },
        };
    }
    getConnectionQuery() {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.QueryConnection, {
                    source, args, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
                });
            },
        };
    }
    getConnectionArgs() {
        const args = {};
        Object.keys(graphql_relay_1.connectionArgs).map((argName) => {
            args[argName] = graphql_relay_1.connectionArgs[argName];
        });
        args[_1.whereArgName] = { type: this.getWhereInputType() };
        args[_1.sortArgName] = { type: graphql_1.GraphQLString };
        return args;
    }
    getWhereInputType() {
        if (!this.whereInputType) {
            this.whereInputType = this.generateWhereInputType();
        }
        return this.whereInputType;
    }
    getQueries() {
        const queries = [];
        queries.push({
            name: uncapitalize(this.name),
            field: this.getQueryOne(),
        });
        queries.push({
            name: this.connectionName,
            field: this.getConnectionQuery(),
        });
        return queries;
    }
    // Mutations
    getCreateMutation() {
        const outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "CreateMutation",
            inputFields: this.getCreateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationCreate, {
                    source: null, args: object, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
                });
            },
        });
    }
    getCreateOrUpdateMutation() {
        const outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        const updateFields = Object.assign({}, this.getUpdateType().getFields());
        delete updateFields[_1.idArgName];
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "CreateOrUpdateMutation",
            inputFields: {
                create: {
                    type: new graphql_1.GraphQLNonNull(this.getCreateType()),
                },
                update: {
                    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLInputObjectType({
                        name: this.name + "CreateOrUpdateMutationUpdate",
                        fields: updateFields,
                    })),
                },
            },
            outputFields,
            mutateAndGetPayload: (object, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationCreateOrUpdate, {
                    source: null, args: object, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
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
        const outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "DeleteMutation",
            inputFields: this.getOneArgs(),
            outputFields,
            mutateAndGetPayload: (object, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationDelete, {
                    source: null, args: object, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
                });
            },
        });
    }
    getUpdateMutation() {
        const outputFields = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "UpdateMutation",
            inputFields: this.getUpdateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationUpdate, {
                    source: null, args: object, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
                });
            },
        });
    }
    getUpdateManyMutation() {
        const outputFields = {};
        outputFields[this.connectionName] = {
            type: new graphql_1.GraphQLList(this.getBaseType()),
        };
        const inputFields = {};
        inputFields[_1.whereArgName] = { type: this.getWhereInputType() };
        inputFields[uncapitalize(this.name)] = {
            type: this.getUpdateType(),
        };
        return graphql_relay_1.mutationWithClientMutationId({
            name: this.name + "sUpdateMutation",
            inputFields,
            outputFields,
            mutateAndGetPayload: (object, context, info) => {
                return this.resolveFn(this.id, ResolveTypes_1.default.MutationUpdateMany, {
                    source: null, args: object, context, info,
                    resolveInfo: graphql_fields_info_1.fromResolveInfo(info),
                });
            },
        });
    }
    getMutations() {
        const mutations = [];
        mutations.push({
            name: "create" + this.name,
            field: this.getCreateMutation(),
        });
        mutations.push({
            name: "createOrUpdate" + this.name,
            field: this.getCreateOrUpdateMutation(),
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
    getCreateArguments() {
        if (!this.createArguments) {
            this.createArguments = this.generateCreateArguments();
        }
        return this.createArguments;
    }
    getUpdateArguments() {
        if (!this.updateArguments) {
            this.updateArguments = this.generateUpdateArguments();
        }
        return this.updateArguments;
    }
    getNameForGlobalId() {
        return capitalize(this.name);
    }
    generateCreateArguments() {
        const args = [];
        this.attributes.map((attr) => {
            if (attr.name === _1.idArgName) {
                return;
            }
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = graphql_1.GraphQLID;
                args.push({
                    attribute: attr,
                    graphQLType: childModel.getCreateType(),
                    name: "create" + capitalize(attr.name),
                    type: ArgumentTypes_1.default.CreateSubModel,
                    value: undefined,
                });
                args.push({
                    attribute: attr,
                    graphQLType: childModel.getCreateOrUpdateType(),
                    name: "createOrUpdate" + capitalize(attr.name),
                    type: ArgumentTypes_1.default.CreateOrUpdateSubModel,
                    value: undefined,
                });
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                graphQLType = new graphql_1.GraphQLList(graphql_1.GraphQLID);
                args.push({
                    attribute: attr,
                    graphQLType: new graphql_1.GraphQLList(childModel.getCreateType()),
                    name: "create" + capitalize(attr.name),
                    type: ArgumentTypes_1.default.CreateSubCollection,
                    value: undefined,
                });
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            args.push({
                attribute: attr,
                name: attr.name,
                graphQLType: attr.required ? new graphql_1.GraphQLNonNull(graphQLType) : graphQLType,
                type: ArgumentTypes_1.default.CreateArgument,
                value: undefined,
            });
        });
        return args;
    }
    generateWhereArguments() {
        const args = [];
        this.attributes.map((attr) => {
            let type;
            if (attr.type === AttributeTypes_1.default.Model || attr.type === AttributeTypes_1.default.Collection) {
                type = AttributeTypes_1.default.ID;
            }
            else {
                type = attr.type;
            }
            const graphqlType = scalarTypeToGraphQL(type);
            // EQUALS
            if (attr.type !== AttributeTypes_1.default.Collection && !attr.primaryKey && attr.name !== _1.idArgName) {
                args.push({
                    name: attr.name,
                    type: ArgumentTypes_1.default.Equal,
                    attribute: attr,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "NotEqual",
                    type: ArgumentTypes_1.default.NotEqual,
                    attribute: attr,
                    graphQLType: graphqlType,
                });
            }
            // IN
            if (attr.type !== AttributeTypes_1.default.Collection && attr.type !== AttributeTypes_1.default.Boolean && !attr.primaryKey) {
                args.push({
                    name: attr.name + "In",
                    type: ArgumentTypes_1.default.In,
                    attribute: attr,
                    graphQLType: new graphql_1.GraphQLList(graphqlType),
                });
                args.push({
                    name: attr.name + "NotIn",
                    type: ArgumentTypes_1.default.NotIn,
                    attribute: attr,
                    graphQLType: new graphql_1.GraphQLList(graphqlType),
                });
            }
            // IS NULL
            if (attr.type !== AttributeTypes_1.default.Collection &&
                !attr.required && !attr.primaryKey && attr.name !== _1.idArgName) {
                args.push({
                    name: attr.name + "IsNull",
                    type: ArgumentTypes_1.default.IsNull,
                    attribute: attr,
                    graphQLType: graphql_1.GraphQLBoolean,
                });
                args.push({
                    name: attr.name + "IsNotNull",
                    type: ArgumentTypes_1.default.IsNotNull,
                    attribute: attr,
                    graphQLType: graphql_1.GraphQLBoolean,
                });
            }
            if (!attr.primaryKey) {
                exports.whereArgHelpers[attr.type](attr).map((t) => {
                    args.push({
                        attribute: attr,
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
        return new graphql_1.GraphQLObjectType({
            name: capitalize(this.name),
            fields: () => {
                const fields = {};
                this.attributes.map((attr) => {
                    let graphQLType;
                    // let resolve; ???
                    if (attr.type === AttributeTypes_1.default.Model) {
                        graphQLType = this.collector.get(attr.model).getBaseType();
                    }
                    else if (attr.type === AttributeTypes_1.default.Collection) {
                        graphQLType = this.collector.get(attr.model).getConnectionType();
                    }
                    else if (attr.type === AttributeTypes_1.default.ID) {
                        graphQLType = new graphql_1.GraphQLNonNull(graphql_1.GraphQLID);
                    }
                    else {
                        graphQLType = scalarTypeToGraphQL(attr.type);
                    }
                    fields[attr.name] = { type: graphQLType };
                    /*if (resolve) {
                        fields[attr.name].resolve = resolve;
                    }*/ // ???
                });
                return fields;
            },
            interfaces: this.opts.interfaces,
        });
    }
    generateCreationType() {
        return new graphql_1.GraphQLInputObjectType({
            name: "Create" + capitalize(this.name) + "Input",
            fields: () => {
                const fields = {};
                this.getCreateArguments().map((arg) => {
                    fields[arg.name] = { type: arg.graphQLType };
                });
                return fields;
            },
        });
    }
    generateUpdateArguments() {
        const args = [];
        this.attributes.map((attr) => {
            if (attr.name === _1.idArgName) {
                return;
            }
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = graphql_1.GraphQLID;
                args.push({
                    type: ArgumentTypes_1.default.CreateArgument,
                    name: "create" + capitalize(attr.name),
                    attribute: attr,
                    graphQLType: childModel.getCreateType(),
                });
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                const childModel = this.collector.get(attr.model);
                graphQLType = graphql_1.GraphQLID;
                graphQLType = new graphql_1.GraphQLList(graphQLType);
                args.push({
                    name: "create" + capitalize(attr.name),
                    type: ArgumentTypes_1.default.CreateSubCollection,
                    graphQLType: new graphql_1.GraphQLList(childModel.getCreateType()),
                    attribute: attr,
                });
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            args.push({
                attribute: attr,
                name: "set" + capitalize(attr.name),
                type: ArgumentTypes_1.default.UpdateSetter,
                graphQLType: new graphql_1.GraphQLInputObjectType({
                    name: "Update" + this.name + "InputSet" + capitalize(attr.name),
                    fields: {
                        [attr.name]: { type: attr.required ? new graphql_1.GraphQLNonNull(graphQLType) : graphQLType },
                    },
                }),
            });
        });
        args.push({
            attribute: this.attributes.find((a) => a.name === _1.idArgName),
            name: _1.idArgName,
            type: ArgumentTypes_1.default.Equal,
            graphQLType: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
        });
        return args;
    }
    generateUpdateType() {
        return new graphql_1.GraphQLInputObjectType({
            name: "Update" + this.name + "Input",
            fields: () => {
                const fields = {};
                this.getUpdateArguments().map((arg) => {
                    fields[arg.name] = { type: arg.graphQLType };
                });
                return fields;
            },
        });
    }
    generateWhereInputType() {
        const where = {};
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
        case AttributeTypes_1.default.JSON:
            graphQLType = JSON_1.default;
            break;
        case AttributeTypes_1.default.Date:
            graphQLType = Date_1.default;
            break;
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
    [AttributeTypes_1.default.JSON]: (attr) => {
        const types = [];
        stringFunctions.map((f) => {
            types.push({
                name: attr.name + capitalize(f),
                type: JSON_1.default,
                argumentType: f,
            });
        });
        return types;
    },
    [AttributeTypes_1.default.Integer]: (attr) => {
        const types = [];
        numberFunctions.map((f) => {
            types.push({
                name: attr.name + capitalize(f),
                type: graphql_1.GraphQLInt,
                argumentType: f,
            });
        });
        return types;
    },
    [AttributeTypes_1.default.Float]: (attr) => {
        const types = [];
        numberFunctions.map((f) => {
            types.push({
                name: attr.name + capitalize(f),
                type: graphql_1.GraphQLFloat,
                argumentType: f,
            });
        });
        return types;
    },
    [AttributeTypes_1.default.Date]: (attr) => {
        const types = [];
        numberFunctions.map((f) => {
            types.push({
                name: attr.name + capitalize(f),
                type: Date_1.default,
                argumentType: f,
            });
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
exports.default = Model;
//# sourceMappingURL=Model.js.map