"use strict";
const AttributeTypes_1 = require("./../AttributeTypes");
const Collection_1 = require("./../Collection");
exports.postModel = {
    id: "post",
    attributes: [{
            name: "id",
            realName: "id",
            type: AttributeTypes_1.default.Integer,
            primaryKey: true,
        }, {
            name: "owner",
            realName: "owner",
            type: AttributeTypes_1.default.Model,
            model: "user",
        }, {
            name: "animals",
            realName: "animals",
            type: AttributeTypes_1.default.Collection,
            model: "animal",
        }],
};
exports.userModel = {
    id: "user",
    name: "user",
    attributes: [{
            name: "key",
            realName: "key",
            type: AttributeTypes_1.default.Float,
            primaryKey: true,
        }, {
            name: "name",
            realName: "name",
            type: AttributeTypes_1.default.String,
            required: true,
        }, {
            name: "pets",
            realName: "pets",
            type: AttributeTypes_1.default.Collection,
            model: "animal",
        }],
};
exports.animalModel = {
    id: "animal",
    attributes: [{
            name: "id",
            realName: "id",
            type: AttributeTypes_1.default.Integer,
            primaryKey: true,
        }, {
            type: AttributeTypes_1.default.String,
            name: "name",
            realName: "name",
            required: true,
        }, {
            type: AttributeTypes_1.default.Integer,
            name: "age",
            realName: "age",
        }, {
            type: AttributeTypes_1.default.Float,
            name: "Weight",
            realName: "Weight",
        }, {
            type: AttributeTypes_1.default.Date,
            name: "birthday",
            realName: "birthday",
        }, {
            type: AttributeTypes_1.default.Boolean,
            name: "isCat",
            realName: "isCat",
        }],
};
const models = [exports.postModel, exports.userModel, exports.animalModel];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new Collection_1.default(models);
//# sourceMappingURL=collection1.js.map