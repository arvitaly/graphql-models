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
import { fromResolveInfo } from "graphql-fields-info";
import {
    connectionArgs, connectionDefinitions,
    fromGlobalId, mutationWithClientMutationId,
    toGlobalId,
} from "graphql-relay";
import { idArgName, inputArgName, sortArgName, whereArgName } from ".";
import Adapter from "./Adapter";
import ArgumentTypes from "./ArgumentTypes";
import AttributeTypes from "./AttributeTypes";
import Collection from "./Collection";
import ResolveTypes from "./ResolveTypes";
import {
    Argument, ArgumentType, Attribute, AttributeType, CollectionAttribute,
    ModelAttribute, ModelConfig, ModelOptions, Mutation, Mutations, Queries, ResolveFn,
} from "./typings";
class Model {
    public id: string;
    public name: string;
    public queryName: string;
    public attributes: Attribute[];
    protected primaryKeyAttribute: Attribute;
    protected baseType: GraphQLObjectType;
    protected createType: GraphQLInputObjectType;
    protected updateType: GraphQLInputObjectType;
    protected connectionType: GraphQLObjectType;
    protected whereInputType: GraphQLInputObjectType;
    protected whereArguments: Argument[];
    protected createArguments: Argument[];
    protected updateArguments: Argument[];
    protected resolveFn: ResolveFn;
    constructor(public config: ModelConfig, protected collector: Collection, protected opts: ModelOptions = {}) {
        this.opts.interfaces = this.opts.interfaces || [];
        this.resolveFn = this.opts.resolveFn;
        this.name = this.config.name || capitalize(this.config.id);
        this.queryName = uncapitalize(this.name);
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
                realName: attrConfig.name,
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
            realName: null,
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
        const args: GraphQLFieldConfigArgumentMap = {};
        args[idArgName] = { type: new GraphQLNonNull(GraphQLID) };
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
                return this.resolveFn(this.id, ResolveTypes.QueryOne, {
                    source, args, context, info,
                    resolveInfo: fromResolveInfo(info),
                });
            },
        };
    }
    public getConnectionQuery(): GraphQLFieldConfig<any, any> {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return this.resolveFn(this.id, ResolveTypes.QueryConnection, {
                    source, args, context, info,
                    resolveInfo: fromResolveInfo(info),
                });
            },
        };
    }
    public getConnectionArgs(): GraphQLFieldConfigArgumentMap {
        const args = {};
        Object.keys(connectionArgs).map((argName) => {
            args[argName] = connectionArgs[argName];
        });
        args[whereArgName] = { type: this.getWhereInputType() };
        args[sortArgName] = { type: GraphQLString };
        return args;
    }
    public getWhereInputType() {
        if (!this.whereInputType) {
            this.whereInputType = this.generateWhereInputType();
        }
        return this.whereInputType;
    }
    public getQueries(): Queries {
        const queries: Queries = [];
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
        const outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "CreateMutation",
            inputFields: this.getCreateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context, info: GraphQLResolveInfo) => {
                return this.resolveFn(this.id,
                    ResolveTypes.MutationCreate, {
                        source: null, args: object, context, info,
                        resolveInfo: fromResolveInfo(info),
                    });
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
        const outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "DeleteMutation",
            inputFields: this.getOneArgs(),
            outputFields,
            mutateAndGetPayload: (object, context, info: GraphQLResolveInfo) => {
                return this.resolveFn(this.id,
                    ResolveTypes.MutationDelete, {
                        source: null, args: object, context, info,
                        resolveInfo: fromResolveInfo(info),
                    });
            },
        });
    }
    public getUpdateMutation() {
        const outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "UpdateMutation",
            inputFields: this.getUpdateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context, info: GraphQLResolveInfo) => {
                return this.resolveFn(this.id,
                    ResolveTypes.MutationUpdate, {
                        source: null, args: object, context, info,
                        resolveInfo: fromResolveInfo(info),
                    });
            },
        });
    }
    public getUpdateManyMutation() {
        const outputFields: GraphQLFieldConfigMap<any, any> = {};
        outputFields[uncapitalize(this.name) + "s"] = {
            type: new GraphQLList(this.getBaseType()),
        };
        const inputFields: GraphQLInputFieldConfigMap = {};
        inputFields[whereArgName] = { type: this.getWhereInputType() };
        inputFields[uncapitalize(this.name)] = {
            type: this.getUpdateType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "sUpdateMutation",
            inputFields,
            outputFields,
            mutateAndGetPayload: (object, context, info: GraphQLResolveInfo) => {
                return this.resolveFn(this.id, ResolveTypes.MutationUpdateMany,
                    {
                        source: null, args: object, context, info,
                        resolveInfo: fromResolveInfo(info),
                    });
            },
        });
    }
    public getMutations(): Mutations {
        const mutations: Mutations = [];
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
    public getCreateArguments() {
        if (!this.createArguments) {
            this.createArguments = this.generateCreateArguments();
        }
        return this.createArguments;
    }
    public getUpdateArguments() {
        if (!this.updateArguments) {
            this.updateArguments = this.generateUpdateArguments();
        }
        return this.updateArguments;
    }
    public getNameForGlobalId() {
        return capitalize(this.name);
    }
    protected generateCreateArguments() {
        const args: Argument[] = [];
        this.attributes.map((attr) => {
            if (attr.name === idArgName) {
                return;
            }
            let graphQLType;
            if (attr.type === AttributeTypes.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = GraphQLID;
                args.push({
                    attribute: attr,
                    graphQLType: childModel.getCreateType(),
                    name: "create" + capitalize(attr.name),
                    type: ArgumentTypes.CreateSubModel,
                    value: undefined,
                });
            } else if (attr.type === AttributeTypes.Collection) {
                const childModel = this.collector.get((attr as CollectionAttribute).model);
                graphQLType = new GraphQLList(GraphQLID);
                args.push({
                    attribute: attr,
                    graphQLType: new GraphQLList(childModel.getCreateType()),
                    name: "create" + capitalize(attr.name),
                    type: ArgumentTypes.CreateSubCollection,
                    value: undefined,
                });
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            args.push({
                attribute: attr,
                name: attr.name,
                graphQLType: attr.required ? new GraphQLNonNull(graphQLType) : graphQLType,
                type: ArgumentTypes.CreateArgument,
                value: undefined,
            });
        });
        return args;
    }
    protected generateWhereArguments() {
        const args: Argument[] = [];
        this.attributes.map((attr) => {
            let type: AttributeType;
            if (attr.type === AttributeTypes.Model || attr.type === AttributeTypes.Collection) {
                type = AttributeTypes.ID;
            } else {
                type = attr.type;
            }
            const graphqlType = scalarTypeToGraphQL(type);
            // EQUALS
            if (attr.type !== AttributeTypes.Collection && !attr.primaryKey && attr.name !== idArgName) {
                args.push({
                    name: attr.name,
                    type: ArgumentTypes.Equal,
                    attribute: attr,
                    graphQLType: graphqlType,
                });
                args.push({
                    name: attr.name + "NotEqual",
                    type: ArgumentTypes.NotEqual,
                    attribute: attr,
                    graphQLType: graphqlType,
                });
            }
            // IN
            if (attr.type !== AttributeTypes.Collection && attr.type !== AttributeTypes.Boolean && !attr.primaryKey) {
                args.push({
                    name: attr.name + "In",
                    type: ArgumentTypes.In,
                    attribute: attr,
                    graphQLType: new GraphQLList(graphqlType),
                });
                args.push({
                    name: attr.name + "NotIn",
                    type: ArgumentTypes.NotIn,
                    attribute: attr,
                    graphQLType: new GraphQLList(graphqlType),
                });
            }
            // IS NULL
            if (attr.type !== AttributeTypes.Collection &&
                !attr.required && !attr.primaryKey && attr.name !== idArgName) {
                args.push({
                    name: attr.name + "IsNull",
                    type: ArgumentTypes.IsNull,
                    attribute: attr,
                    graphQLType: GraphQLBoolean,
                });
                args.push({
                    name: attr.name + "IsNotNull",
                    type: ArgumentTypes.IsNotNull,
                    attribute: attr,
                    graphQLType: GraphQLBoolean,
                });
            }
            if (!attr.primaryKey) {
                whereArgHelpers[attr.type](attr).map((t) => {
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
    protected generateBaseType(): GraphQLObjectType {
        return new GraphQLObjectType({
            name: capitalize(this.name),
            fields: () => {
                const fields: GraphQLFieldConfigMap<any, any> = {};
                this.attributes.map((attr) => {
                    let graphQLType;
                    // let resolve; ???
                    if (attr.type === AttributeTypes.Model) {
                        graphQLType = this.collector.get((attr as ModelAttribute).model).getBaseType();
                    } else if (attr.type === AttributeTypes.Collection) {
                        graphQLType = this.collector.get((attr as CollectionAttribute).model).getConnectionType();
                    } else if (attr.type === AttributeTypes.ID) {
                        graphQLType = new GraphQLNonNull(GraphQLID);
                    } else {
                        graphQLType = scalarTypeToGraphQL(attr.type);
                    }
                    fields[attr.name] = { type: graphQLType };
                    /*if (resolve) {
                        fields[attr.name].resolve = resolve;
                    }*/// ???
                });
                return fields;
            },
            interfaces: this.opts.interfaces,
        });
    }
    protected generateCreationType(): GraphQLInputObjectType {
        return new GraphQLInputObjectType({
            name: "Create" + capitalize(this.name) + "Input",
            fields: () => {
                const fields: GraphQLInputFieldConfigMap = {};
                this.getCreateArguments().map((arg) => {
                    fields[arg.name] = { type: arg.graphQLType };
                });
                return fields;
            },
        });
    }
    protected generateUpdateArguments() {
        const args: Argument[] = [];
        this.attributes.map((attr) => {
            if (attr.name === idArgName) {
                return;
            }
            let graphQLType;
            if (attr.type === AttributeTypes.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = GraphQLID;
                args.push({
                    type: ArgumentTypes.CreateArgument,
                    name: "create" + capitalize(attr.name),
                    attribute: attr,
                    graphQLType: childModel.getCreateType(),
                });
            } else if (attr.type === AttributeTypes.Collection) {
                const childModel = this.collector.get((attr as CollectionAttribute).model);
                graphQLType = GraphQLID;
                graphQLType = new GraphQLList(graphQLType);
                args.push({
                    name: "create" + capitalize(attr.name),
                    type: ArgumentTypes.CreateSubCollection,
                    graphQLType: new GraphQLList(childModel.getCreateType()),
                    attribute: attr,
                });
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            args.push({
                attribute: attr,
                name: "set" + capitalize(attr.name),
                type: ArgumentTypes.UpdateSetter,
                graphQLType: new GraphQLInputObjectType({
                    name: "Update" + this.name + "InputSet" + capitalize(attr.name),
                    fields: {
                        [attr.name]: { type: attr.required ? new GraphQLNonNull(graphQLType) : graphQLType },
                    },
                }),
            });
        });
        args.push({
            attribute: this.attributes.find((a) => a.name === idArgName),
            name: idArgName,
            type: ArgumentTypes.Equal,
            graphQLType: new GraphQLNonNull(GraphQLID),
        });
        return args;
    }
    protected generateUpdateType(): GraphQLInputObjectType {
        return new GraphQLInputObjectType({
            name: "Update" + this.name + "Input",
            fields: () => {
                const fields: GraphQLInputFieldConfigMap = {};
                this.getUpdateArguments().map((arg) => {
                    fields[arg.name] = { type: arg.graphQLType };
                });
                return fields;
            },
        });
    }
    protected generateWhereInputType(): GraphQLInputObjectType {
        const where: GraphQLInputFieldConfigMap = {};
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
        case AttributeTypes.JSON:
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
        [AttributeTypes.JSON]: (attr: Attribute) => {
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
                types.push({
                    name: attr.name + capitalize(f),
                    type: GraphQLInt,
                    argumentType: f,
                });
            });
            return types;
        },
        [AttributeTypes.Float]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                types.push({
                    name: attr.name + capitalize(f),
                    type: GraphQLFloat,
                    argumentType: f,
                });
            });
            return types;
        },
        [AttributeTypes.Date]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                types.push({
                    name: attr.name + capitalize(f),
                    type: GraphQLString,
                    argumentType: f,
                });
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
