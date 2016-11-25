import {
    GraphQLArgumentConfig,
    GraphQLBoolean,
    GraphQLFieldConfig,
    GraphQLFieldConfigArgumentMap,
    GraphQLFieldConfigMap,
    GraphQLFloat,
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
import { connectionArgs, connectionDefinitions, mutationWithClientMutationId } from "graphql-relay";
import AttributeTypes from "./AttributeTypes";
import Collection from "./Collection";
import ResolveTypes from "./ResolveTypes";
import {
    Attribute, AttributeType, CollectionAttribute, ModelAttribute,
    ModelConfig, Mutation, Mutations, Queries, ResolveFn,
} from "./typings";
export const whereArgName = "where";
class Model {
    public id: string;
    public name: string;
    public attributes: Attribute[];
    protected primaryKeyAttribute: Attribute;
    protected baseType: GraphQLObjectType;
    protected createType: GraphQLInputObjectType;
    protected connectionType: GraphQLObjectType;
    constructor(public config: ModelConfig, protected collector: Collection) {
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
        const primary = this.getPrimaryKeyAttribute();
        args[primary.name] = { type: new GraphQLNonNull(scalarTypeToGraphQL(this.getPrimaryKeyAttribute().type)) };
        return args;
    }
    public getQueryOne(resolveFn: ResolveFn): GraphQLFieldConfig<any> {
        return {
            args: this.getOneArgs(),
            type: this.getBaseType(),
            resolve: (source, args, context, info) => {
                return resolveFn({
                    type: ResolveTypes.QueryOne,
                    model: this.id,
                    source,
                    args,
                    context,
                    info,
                });
            },
        };
    }
    public getConnectionQuery(resolveFn: ResolveFn): GraphQLFieldConfig<any> {
        return {
            args: this.getConnectionArgs(),
            type: this.getConnectionType(),
            resolve: (source, args, context, info) => {
                return resolveFn({
                    type: ResolveTypes.QueryConnection,
                    model: this.id,
                    source,
                    args,
                    context,
                    info,
                });
            },
        };
    }
    public getConnectionArgs(): GraphQLFieldConfigArgumentMap {
        let args = connectionArgs;
        args[whereArgName] = { type: this.getWhereInputType() };
        return args;
    }
    public getWhereInputType(): GraphQLInputObjectType {
        let where: GraphQLInputFieldConfigMap = {};
        this.attributes.map((attr) => {
            let type;
            if (attr.type === AttributeTypes.Model || attr.type === AttributeTypes.Collection) {
                type = this.collector.get((attr as ModelAttribute).model).getPrimaryKeyAttribute().type;
            } else {
                type = attr.type;
            }
            where[attr.name] = { type: scalarTypeToGraphQL(type) };
            getWhereArgsForAttribute(attr)
        });
        return new GraphQLInputObjectType({
            name: this.name + "WhereInput",
            fields: where,
        });
    }
    public getQueries(resolveFn: ResolveFn): Queries {
        let queries: Queries = [];
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
    // Mutations
    public getCreateMutation(resolveFn: ResolveFn): GraphQLFieldConfig<any> {
        let outputFields: GraphQLFieldConfigMap<any> = {};
        outputFields[uncapitalize(this.name)] = {
            type: this.getBaseType(),
        };
        return mutationWithClientMutationId({
            name: this.name + "CreateMutation",
            inputFields: this.getCreateType().getFields(),
            outputFields,
            mutateAndGetPayload: (object, context: GraphQLResolveInfo) => {
                return resolveFn({
                    type: ResolveTypes.MutationCreate,
                    model: this.id,
                    source: null,
                    args: object,
                    context,
                    info: null,
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
    public getDeleteMutation() {
        // TODO
    }
    public getUpdateMutation() {
        // TODO 
    }
    public getMutations(resolveFn: ResolveFn): Mutations {
        let mutations: Mutations = [];
        mutations.push({
            name: "create" + this.name,
            field: this.getCreateMutation(resolveFn),
        });
        return mutations;
        // TODO
    }
    protected generateBaseType(): GraphQLObjectType {
        let fields: GraphQLFieldConfigMap<any> = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes.Model) {
                graphQLType = this.collector.get((attr as ModelAttribute).model).getBaseType();
            } else if (attr.type === AttributeTypes.Collection) {
                graphQLType = this.collector.get((attr as CollectionAttribute).model).getConnectionType();
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new GraphQLObjectType({
            name: this.name,
            fields,
        });
    }
    public generateCreationType(): GraphQLInputObjectType {
        let fields: GraphQLInputFieldConfigMap = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes.Model) {
                const childModel = this.collector.get(attr.model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                fields["create" + capitalize(attr.name)] = { type: childModel.getCreateType() };
            } else if (attr.type === AttributeTypes.Collection) {
                const childModel = this.collector.get((attr as CollectionAttribute).model);
                graphQLType = scalarTypeToGraphQL(childModel.getPrimaryKeyAttribute().type);
                graphQLType = new GraphQLList(graphQLType);
                fields["create" + capitalize(attr.name)] = {
                    type: new GraphQLList(childModel.getCreateType()),
                };
            } else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: attr.required ? new GraphQLNonNull(graphQLType) : graphQLType };
        });
        return new GraphQLInputObjectType({
            name: "Create" + this.name + "Input",
            fields,
        });
    }
}
export function scalarTypeToGraphQL(type: AttributeType): GraphQLScalarType {
    let graphQLType;
    switch (type) {
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

const stringFunctions = ["contains", "notContains", "notStartsWith", "endsWith", "notEndsWith", "like", "notLike"];
const numberFunctions = ["greaterThan", "lessThan", "greaterOrEqualThan", "lessOrEqualThan"];
export const whereArgHelpers: {
    [attrType: AttributeType]: (attr: Attribute) => Array<{ name: string; type: any; }>;
} = {
        [AttributeTypes.String]: (attr: Attribute) => {
            const types = [];
            stringFunctions.map((f) => {
                return ({
                    name: attr.name + capitalize(f),
                    type: GraphQLString,
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
                };
            });
        },
        [AttributeTypes.Float]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                return {
                    name: attr.name + capitalize(f),
                    type: GraphQLFloat,
                };
            });
        },
        [AttributeTypes.Date]: (attr: Attribute) => {
            const types = [];
            numberFunctions.map((f) => {
                return {
                    name: attr.name + capitalize(f),
                    type: GraphQLString,
                };
            });
        },
        [AttributeTypes.Boolean]: (attr: Attribute) => {
            
        },
    };
export default Model;
