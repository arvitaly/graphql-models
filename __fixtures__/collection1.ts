import AttributeTypes from "./../AttributeTypes";
import Collector from "./../Collection";
import { ModelConfig } from "./../typings";
export const postModel: ModelConfig = {
    id: "post",
    attributes: [{
        name: "id",
        realName: "id",
        type: AttributeTypes.Integer,
        primaryKey: true,
    }, {
        name: "owner",
        realName: "owner",
        type: AttributeTypes.Model,
        model: "user",
    }, {
        name: "animals",
        realName: "animals",
        type: AttributeTypes.Collection,
        model: "animal",
    }],
};
export const userModel: ModelConfig = {
    id: "user",
    name: "user",
    attributes: [{
        name: "key",
        realName: "key",
        type: AttributeTypes.Float,
        primaryKey: true,
    }, {
        name: "name",
        realName: "name",
        type: AttributeTypes.String,
        required: true,
    }, {
        name: "pets",
        realName: "pets",
        type: AttributeTypes.Collection,
        model: "animal",
    }],
};
export const animalModel: ModelConfig = {
    id: "animal",
    attributes: [{
        name: "id",
        realName: "id",
        type: AttributeTypes.Integer,
        primaryKey: true,
    }, {
        type: AttributeTypes.String,
        name: "name",
        realName: "name",
        required: true,
    }, {
        type: AttributeTypes.Integer,
        name: "age",
        realName: "age",
    }, {
        type: AttributeTypes.Float,
        name: "Weight",
        realName: "Weight",
    }, {
        type: AttributeTypes.Date,
        name: "birthday",
        realName: "birthday",
    }, {
        type: AttributeTypes.JSON,
        name: "some",
        realName: "some",
    }, {
        type: AttributeTypes.Boolean,
        name: "isCat",
        realName: "isCat",
    }],
};
const models: ModelConfig[] = [postModel, userModel, animalModel];

export default new Collector(models);
