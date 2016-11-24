"use strict";
const AttributeTypes_1 = require("./../../AttributeTypes");
const Collector_1 = require("./../../Collector");
exports.postModel = {
    id: "post",
    attributes: [{
            name: "id",
            type: AttributeTypes_1.default.Integer,
        }, {
            name: "owner",
            type: AttributeTypes_1.default.Model,
            modelId: "user",
        }, {
            name: "animals",
            type: AttributeTypes_1.default.Collection,
            modelId: "animal",
        }],
};
exports.userModel = {
    id: "user",
    name: "user",
    attributes: [{
            name: "name",
            type: AttributeTypes_1.default.String,
        }, {
            name: "pets",
            type: AttributeTypes_1.default.Collection,
            modelId: "animal",
        }],
};
exports.animalModel = {
    id: "animal",
    attributes: [{
            type: AttributeTypes_1.default.String,
            name: "name",
        }, {
            type: AttributeTypes_1.default.Integer,
            name: "age",
        }, {
            type: AttributeTypes_1.default.Float,
            name: "Weight",
        }, {
            type: AttributeTypes_1.default.Date,
            name: "birthday",
        }, {
            type: AttributeTypes_1.default.Boolean,
            name: "isCat",
        }],
};
const models = [exports.postModel, exports.userModel, exports.animalModel];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new Collector_1.default(models);
