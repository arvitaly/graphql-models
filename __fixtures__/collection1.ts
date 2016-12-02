import AttributeTypes from "./../AttributeTypes";
import Collector from "./../Collection";
import { ModelConfig } from "./../typings";
export const postModel: ModelConfig = {
    id: "post",
    attributes: [{
        name: "id",
        type: AttributeTypes.Integer,
        primaryKey: true,
    }, {
        name: "owner",
        type: AttributeTypes.Model,
        model: "user",
    }, {
        name: "animals",
        type: AttributeTypes.Collection,
        model: "animal",
    }],
};
export const userModel: ModelConfig = {
    id: "user",
    name: "user",
    attributes: [{
        name: "key",
        type: AttributeTypes.Float,
        primaryKey: true,
    }, {
        name: "name",
        type: AttributeTypes.String,
        required: true,
    }, {
        name: "pets",
        type: AttributeTypes.Collection,
        model: "animal",
    }],
};
export const animalModel: ModelConfig = {
    id: "animal",
    attributes: [{
        name: "id",
        type: AttributeTypes.Integer,
        primaryKey: true,
    }, {
        type: AttributeTypes.String,
        name: "name",
    }, {
        type: AttributeTypes.Integer,
        name: "age",
    }, {
        type: AttributeTypes.Float,
        name: "Weight",
    }, {
        type: AttributeTypes.Date,
        name: "birthday",
    }, {
        type: AttributeTypes.Boolean,
        name: "isCat",
    }],
};
const models: ModelConfig[] = [postModel, userModel, animalModel];

export default new Collector(models);
