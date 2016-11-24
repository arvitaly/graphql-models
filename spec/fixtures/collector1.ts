import AttributeTypes from "./../../AttributeTypes";
import Collector from "./../../Collector";
import { ModelConfig } from "./../../typings";
export const postModel: ModelConfig = {
    id: "post",
    attributes: [{
        name: "id",
        type: AttributeTypes.Integer,
    }, {
        name: "owner",
        type: AttributeTypes.Model,
        modelId: "user",
    }, {
        name: "animals",
        type: AttributeTypes.Collection,
        modelId: "animal",
    }],
};
export const userModel: ModelConfig = {
    id: "user",
    name: "user",
    attributes: [{
        name: "name",
        type: AttributeTypes.String,
    }, {
        name: "pets",
        type: AttributeTypes.Collection,
        modelId: "animal",
    }],
};
export const animalModel: ModelConfig = {
    id: "animal",
    attributes: [{
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
