import { GraphQLObjectType } from "graphql";
export interface ModelConfig {
    id: string;
    name?: string;
    attributes: Array<AttributeInfo>;
}
export type AttributeType = "string" | "integer" | "float" | "boolean" | "date" | "model" | "collection";
export interface BaseAttribute {
    name: string;
    type: AttributeType;
    required?: boolean;
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
    modelId: string;
}
export interface CollectionAttribute extends BaseAttribute {
    type: "collection";
    modelId: string;
}
export type AttributeInfo = BaseAttribute | StringAttribute | IntegerAttribute | FloatAttribute | BooleandAttribute | DateAttribute | ModelAttribute | CollectionAttribute;

export interface GraphQLTypes {
    [modelName: string]: GraphQLObjectType;
}
