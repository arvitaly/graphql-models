"use strict";
const AttributeTypes_1 = require("./../../AttributeTypes");
const Collector_1 = require("./../../Collector");
exports.postModel = {
    id: "post",
    attributes: [{
            name: "owner",
            type: AttributeTypes_1.default.Model,
            model: "user",
        }, {
            name: "animals",
            type: AttributeTypes_1.default.Collection,
            model: "animal",
        }],
};
exports.userModel = {
    id: "user",
    name: "user",
    attributes: [{
            name: "key",
            type: AttributeTypes_1.default.Float,
            primaryKey: true,
        }, {
            name: "name",
            type: AttributeTypes_1.default.String,
            required: true,
        }, {
            name: "pets",
            type: AttributeTypes_1.default.Collection,
            model: "animal",
        }],
};
exports.animalModel = {
    id: "animal",
    attributes: [{
            name: "id",
            type: AttributeTypes_1.default.Integer,
            primaryKey: true,
        }, {
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
