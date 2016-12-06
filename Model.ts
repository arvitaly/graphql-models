import {
    GraphQLArgumentConfig,
    GraphQLBoolean,
    GraphQLFieldConfig,
    GraphQLFieldConfigArgumentMap,
    GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLID,
    GraphQLInputFieldConfigMap,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLResolveInfo,
    GraphQLScalarType,
    GraphQLString,
} from "graphql";
import {
    connectionArgs, connectionDefinitions,
    fromGlobalId, mutationWithClientMutationId,
} from "graphql-relay";
import Adapter from "./Adapter";
import ArgumentTypes from "./ArgumentTypes";
import AttributeTypes from "./AttributeTypes";
import Collection from "./Collection";
import ResolveTypes from "./ResolveTypes";
import {
    Argument, ArgumentType, Attribute, AttributeType, CollectionAttribute,
    ModelAttribute, ModelConfig, ModelOptions, Mutation, Mutations, Queries, ResolveFn,
} from "./typings";
export const whereArgName = "where";
export const idArgName = "id";
class Model {
    public id: string;
    public name: string;
    public attributes: Attribute[];
    protected primaryKeyAttribute: Attribute;
    protected baseType: GraphQLObjectType;
    protected createType: GraphQLInputObjectType;
    protected updateType: GraphQLInputObjectType;
    protected connectionType: GraphQLObjectType;
    protected whereInputType: GraphQLInputObjectType;
    protected whereArguments: Argument[];
    protected resolveFn: ResolveFn;
    constructor(public config: ModelConfig, protected collector: Collection, protected opts: ModelOptions = {}) {
        this.opts.interfaces = this.opts.interfaces || [];
        this.resolveFn = this.opts.resolveFn;
        this.name = this.config.name || capitalize(this.config.id);
        this.id = this.config.id;
        let idAttr: Attribute;
        this.attributes = this.config.attributes.map((attrConfig) => {
            if (attrConfig.type === AttributeTypes.Model || attrConfig.type === AttributeTypes.Collection) {
                if (!(attrConfig as ModelAttribute).model) {
                    throw new Error("For attribute with type " + attrConfig.type + " should be set model");
                }
            }
            const attr: Attribute = {
                name: attrConfig.name,
                type: attrConfig.type,
                model: (attrConfig as ModelAttribute).model,
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
            type: AttributeTypes.ID,
            required: false,
        });
    }
    public setResolveFn(resolveFn: ResolveFn) {
        this.resolveFn = resolveFn;
    }
    public getPrimaryKeyAttribute(): Attribute {
        if (!this.primaryKeyAttribute) {
            throw new Error("Not found primary key attribute for model `" + this.name + "`");
        }
        return this.primaryKeyAttribute;
    }
    public getBaseType() {
        if (!this.baseType) {
            this.baseType = this.generateBaseType();
        }
        return this.baseType;
    }
    // Queries
    public getConnectionType() {
        if (!this.connectionType) {
            this.connectionType = connectionDefinitions({
                nodeType: this.getBaseType(),
            }).connectionType;
        }
        return this.connectionType;
    }
    public getOneArgs(): GraphQLFieldConfigArgumentMap {
        let args: GraphQLFieldConfigArgumentMap = {};
        args[idArgName] = { type: GraphQLID };
        // new GraphQLNonNull(scalarTypeToGraphQL(this.get PrimaryKeyAttribute().type))
        return args;
    }
    public getWhereArgument(name) {
        const arg = this.getWhereArguments().find((a) => a.name === name);
        if (!arg) {
            throw new Error("Unknown where argument " + name);
        }
        return arg;
    }
    public getQueryOne(): GraphQLFieldConfig<any, any> {
        return {
            args: this.getOneArgs(),
            type: this.getBaseType(),
            resolve: (source, args, context, info) => {
                return this.resolveFn(this.id, ResolveTypes.QueryOne, { source, args, context, info });
            },
        };
    }
    public getConnectionQuery(): GraphQLFieldConfig<any, any> {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return this.resolveFn(this.id, ResolveTypes.QueryConnection, { source, args, context, info });
            },
        };
    }
    public getConnectionArgs(): GraphQLFieldConfigArgumentMap {
        let args = connectionArgs;
        args[whereArgName] = { type: this.getWhereInputType() };
        return args;
    }
    public getWhereInputType() {
        if (!this.whereInputType) {
            this.whereInputType = this.generateWhereInputType();
        }
        return this.whereInputType;
    }
    public getQueries(): Queries {
        let queries: Queries = [];
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
    public getCreateMutation(): GraphQLFieldConfig<any, any> {
        let outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "CreateMutation",
            inputFields: this.getCreateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context: GraphQLResolveInfo) => {
                return this.resolveFn(this.id,
                    ResolveTypes.MutationCreate, { source: null, args: object, context, info: null });
            },
        });
    }
    public getCreateType() {
        if (!this.createType) {
            this.createType = this.generateCreationType();
        }
        return this.createType;
    }
    public getUpdateType() {
        if (!this.updateType) {
            this.updateType = this.generateUpdateType();
        }
        return this.updateType;
    }
    public getDeleteMutation(): GraphQLFieldConfig<any, any> {
        let outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "DeleteMutation",
            inputFields: this.getOneArgs(),
            outputFields,
            mutateAndGetPayload: (object, context: GraphQLResolveInfo) => {
                return this.resolveFn(this.id,
                    ResolveTypes.MutationDelete, { source: null, args: object, context, info: null });
            },
        });
    }
    public getUpdateMutation() {
        let outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "UpdateMutation",
            inputFields: this.getUpdateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context: GraphQLResolveInfo) => {
                return this.resolveFn(this.id,
                    ResolveTypes.MutationUpdate, { source: null, args: object, context, info: null });
            },
        });
    }
    public getUpdateManyMutation() {
        let outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name) + "s"] = {
            type: new GraphQLList(this.getBaseType()),
        };
        let inputFields: GraphQLInputFieldConfigMap = {};
        inputFields[whereArgName] = { type: this.getWhereInputType() };
        inputFields[uncapitalize(this.name)] = {
            type: this.getUpdateType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "sUpdateMutation",
            inputFields,
            outputFields,
            mutateAndGetPayload: (object, context: GraphQLResolveInfo) => {
                return this.resolveFn(this.id, ResolveTypes.MutationUpdateMany,
                    { source: null, args: object, context, info: null });
            },
        });
    }
    public getMutations(): Mutations {
        let mutations: Mutations = [];
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
    public getWhereArguments() {
        if (!this.whereArguments) {
            this.whereArguments = this.generateWhereArguments();
        }
        return this.whereArguments;
    }
    protected generateWhereArguments() {
        let args: Argument[] = [];
        this.attributes.map((attr) => {
            let type: AttributeType;
            if (attr.type === AttributeTypes.Model || attr.type === AttributeTypes.Collection) {
                type = AttributeTypes.ID;
            } else {
                type = attr.type;
            }
            let graphqlType = scalarTypeToGraphQL(type);
            // EQUALS
            if (attr.type !== AttributeTypes.Collection && !attr.primaryKey && attr.name !== idArgName) {
                args.push({
                    name: attr.name,
                    type: ArgumentTypes.Equal,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "NotEqual",
                    type: ArgumentTypes.NotEqual,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
            }
            // IN
            if (attr.type !== AttributeTypes.Collection && attr.type !== AttributeTypes.Boolean && !attr.primaryKey) {
                args.push({
                    name: attr.name + "In",
                    type: ArgumentTypes.In,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "NotIn",
                    type: ArgumentTypes.NotIn,
                    attribute: attr.name,
                    graphQLType: graphqlType,
                });
            }
            // IS NULL
            if (attr.type !== AttributeTypes.Collection &&
                !attr.required && !attr.primaryKey && attr.name !== idArgName) {
                args.push({
                    name: attr.name + "IsNull",
                    type: ArgumentTypes.IsNull,
                    attribute: attr.name,
                    graphQLType: GraphQLBoolean,
                });
                args.push({
                    name: attr.name + "IsNotNull",
                    type: ArgumentTypes.IsNotNull,
                    attribute: attr.name,
                    graphQLType: GraphQLBoolean,
                });
            }
            if (!attr.primaryKey) {
                whereArgHelpers[attr.type](attr).map((t) => {
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
    protected generateBaseType(): GraphQLObjectType {
        let fields: GraphQLFieldConfigMap<any, any> = {};
        this.attributes.map((attr) => {
            let graphQLType;
            let resolve;
            if (attr.type === AttributeTypes.Model) {
                graphQLType = this.collector.get((attr as ModelAttribute).model).getBaseType();
                resolve = (source, args, context, info) => {
                    return this.collector.get(attr.model).resolveFn(this.id,
                        ResolveTypes.Node,
                        { source: source[attr.name], args, context, info });
                };
            } else if (attr.type === AttributeTypes.Collection) {
                graphQLType = this.collector.get((attr as CollectionAttribute).model).getConnectionType();
                resolve = (source, args, context, info) => {
                    return this.resolveFn(this.id, ResolveTypes.QueryConnection,
                        { source: attr.name, args, context, info });
                };
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: graphQLType };
            if (resolve) {
                fields[attr.name].resolve = resolve;
            }
        });
        return new GraphQLObjectType({
            name: this.name,
            fields,
            interfaces: this.opts.interfaces,
        });
    }
    protected generateCreationType(): GraphQLInputObjectType {
        let fields: GraphQLInputFieldConfigMap = {};
        this.attributes.map((attr) => {
            if (attr.name === idArgName) {
                return;
            }
            let graphQLType;
            if (attr.type === AttributeTypes.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = GraphQLID;
                // scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            } else if (attr.type === AttributeTypes.Collection) {
                const childModel = this.collector.get((attr as CollectionAttribute).model);
                // graphQLType = scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                graphQLType = new GraphQLList(GraphQLID);
                fields["create" + capitalize(attr.name)] = {
                    type: new GraphQLList(childModel.getCreateType()),
                };
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: attr.required ? new GraphQLNonNull(graphQLType) : graphQLType };
        });
        return new GraphQLInputObjectType({
            name: "Create" + capitalize(this.name) + "Input",
            fields,
        });
    }
    protected generateUpdateType(): GraphQLInputObjectType {
        let fields: GraphQLInputFieldConfigMap = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = GraphQLID; // scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            } else if (attr.type === AttributeTypes.Collection) {
                const childModel = this.collector.get((attr as CollectionAttribute).model);
                graphQLType = GraphQLID; // scalarTypeToGraphQL(childModel.get PrimaryKeyAttribute().type);
                graphQLType = new GraphQLList(graphQLType);
                fields["create" + capitalize(attr.name)] = {
                    type: new GraphQLList(childModel.getCreateType()),
                };
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields["set" + capitalize(attr.name)] = {
                type: new GraphQLInputObjectType({
                    name: "Update" + this.name + "InputSet" + capitalize(attr.name),
                    fields: {
                        [attr.name]: { type: attr.required ? new GraphQLNonNull(graphQLType) : graphQLType },
                    },
                }),
            };
        });
        return new GraphQLInputObjectType({
            name: "Update" + this.name + "Input",
            fields,
        });
    }
    protected generateWhereInputType(): GraphQLInputObjectType {
        let where: GraphQLInputFieldConfigMap = {};
        this.getWhereArguments().map((arg) => {
            where[arg.name] = { type: arg.graphQLType };
        });
        return new GraphQLInputObjectType({
            name: this.name + "WhereInput",
            fields: where,
        });
    }
}
export function scalarTypeToGraphQL(type: AttributeType): GraphQLScalarType {
    let graphQLType;
    switch (type) {
        case AttributeTypes.ID:
            graphQLType = GraphQLID;
            break;
        case AttributeTypes.Date:
        case AttributeTypes.String:
            graphQLType = GraphQLString;
            break;
        case AttributeTypes.Float:
            graphQLType = GraphQLFloat;
            break;
        case AttributeTypes.Integer:
            graphQLType = GraphQLInt;
            break;
        case AttributeTypes.Boolean:
            graphQLType = GraphQLBoolean;
            break;
        default:
            throw new Error("Unknown scalar type " + type);
    }
    return graphQLType;
}
export function uncapitalize(str: string) {
    return str.charAt(0).toLowerCase() + str.substr(1);
}
export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.substr(1);
}

const stringFunctions = ["contains", "notContains", "startsWith", "notStartsWith",
    "endsWith", "notEndsWith", "like", "notLike"];
const numberFunctions = ["greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual"];
export const whereArgHelpers: {
    [attrType: string]: (attr: Attribute) => Array<{
        name: string;
        type: any;
        argumentType: ArgumentType,
    }>;
} = {
        [AttributeTypes.String]: (attr: Attribute) => {
            const types = [];
            stringFunctions.map((f) => {
                types.push({
                    name: attr.name + capitalize(f),
                    type: GraphQLString,
                    argumentType: f,
                });
            });
            return types;
        },
        [AttributeTypes.Integer]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                return {
                    name: attr.name + capitalize(f),
                    type: GraphQLInt,
                    argumentType: f,
                };
            });
            return types;
        },
        [AttributeTypes.Float]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                return {
                    name: attr.name + capitalize(f),
                    type: GraphQLFloat,
                    argumentType: f,
                };
            });
            return types;
        },
        [AttributeTypes.Date]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                return {
                    name: attr.name + capitalize(f),
                    type: GraphQLString,
                    argumentType: f,
                };
            });
            return types;
        },
        [AttributeTypes.Boolean]: (attr: Attribute) => {
            return [];
        },
        [AttributeTypes.Model]: (attr: Attribute) => {
            return [];
        },
        [AttributeTypes.Collection]: (attr: Attribute) => {
            return [];
        },
        [AttributeTypes.ID]: (attr: Attribute) => {
            return [];
        },
    };
export default Model;
