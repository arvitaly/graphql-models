import {
    GraphQLInputFieldConfig, GraphQLInterfaceType, GraphQLObjectType, GraphQLResolveInfo,
    GraphQLFieldConfig, GraphQLInputType,
} from "graphql";
export interface ModelConfig {
    id: string;
    name?: string;
    attributes: Array<AttributeConfig>;
}
export type ModelOptions = {
    interfaces?: Array<GraphQLInterfaceType>;
    resolveFn?: ResolveFn;
}
export type AttributeType = "string" | "integer" | "float" | "boolean" | "date" | "model" | "collection";
export interface BaseAttribute {
    name: string;
    type: AttributeType;
    required?: boolean | undefined;
    primaryKey?: boolean | undefined;
}
export interface StringAttribute extends BaseAttribute {
    type: "string"
}
export interface IntegerAttribute extends BaseAttribute {
    type: "integer"
}
export interface FloatAttribute extends BaseAttribute {
    type: "float"
}
export interface BooleandAttribute extends BaseAttribute {
    type: "boolean"
}
export interface DateAttribute extends BaseAttribute {
    type: "date"
}
export interface ModelAttribute extends BaseAttribute {
    type: "model";
    model: string;
}
export interface CollectionAttribute extends BaseAttribute {
    type: "collection";
    model: string;
}
export type AttributeConfig = BaseAttribute | StringAttribute | IntegerAttribute | FloatAttribute | BooleandAttribute | DateAttribute | ModelAttribute | CollectionAttribute;
export type Attribute = AttributeConfig & {
    required: boolean;
    model?: string;
}
export interface GraphQLTypes {
    [modelName: string]: GraphQLObjectType;
}
export type ResolveType = "node" | "viewer" | "model" | "connection" | "queryOne" | "queryConnection" | "mutationCreate" | "mutationUpdate" | "mutationDelete" | "subscriptionOne" | "subscriptionConnection";
export type ResolveOpts = {
    type: ResolveType;
    model?: string;
    parentModel?: string;
    source: any;
    args: any;
    context: any;
    info: GraphQLResolveInfo;
}
export type ResolveFn = (opts?: ResolveOpts) => any;

export type Query = {
    name: string;
    field: GraphQLFieldConfig<any, any>;
}
export type Queries = Array<Query>;

export type Mutation = {
    name: string;
    field: GraphQLFieldConfig<any, any>;
}
export type Mutations = Array<Mutation>;

export type WhereArgHelper = {

}
export type Argument = {
    name: string;
    attribute: string;
    graphQLType: GraphQLInputType
}