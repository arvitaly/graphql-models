"use strict";
// tslint:disable:object-literal-sort-keys no-string-literal
const graphql_1 = require("graphql");
const __1 = require("./..");
const AttributeTypes_1 = require("./../AttributeTypes");
describe("GraphQL models spec", () => {
    it("should create all types with all modes", () => {
        const postModel = {
            id: "post",
            name: "Post",
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
        const userModel = {
            id: "user",
            attributes: [{
                    name: "name",
                    type: AttributeTypes_1.default.String,
                }, {
                    name: "pets",
                    type: AttributeTypes_1.default.Collection,
                    modelId: "animal",
                }],
        };
        const animalModel = {
            id: "animal",
            name: "Animal",
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
        const models = [postModel, userModel, animalModel];
        const animalType = new graphql_1.GraphQLObjectType({
            name: "Animal",
            fields: {
                name: { type: graphql_1.GraphQLString },
                age: { type: graphql_1.GraphQLInt },
                Weight: { type: graphql_1.GraphQLFloat },
                birthday: { type: graphql_1.GraphQLString },
                isCat: { type: graphql_1.GraphQLBoolean },
            },
        });
        const userType = new graphql_1.GraphQLObjectType({
            name: "user",
            fields: {
                name: { type: graphql_1.GraphQLString },
                pets: { type: new graphql_1.GraphQLList(animalType) },
            },
        });
        const postType = new graphql_1.GraphQLObjectType({
            name: "Post",
            fields: {
                id: { type: graphql_1.GraphQLInt },
                owner: { type: userType },
                animals: { type: new graphql_1.GraphQLList(animalType) },
            },
        });
        const types = __1.default(models);
        expect(types).toEqual({
            post: jasmine.any(Object),
            user: jasmine.any(Object),
            animal: jasmine.any(Object),
        });
        expect(types["animal"]).toEqual(animalType, "Animal not equal, expected " +
            JSON.stringify(types["animal"].getFields()) +
            " to equal " + JSON.stringify(animalType.getFields()));
        expect(types["user"]).toEqual(userType, "User not equal, expected " +
            JSON.stringify(types["user"].getFields()) +
            " to equal " + JSON.stringify(userType.getFields()));
        expect(types["post"]).toEqual(postType, "Post not equal, expected " +
            JSON.stringify(types["post"].getFields()) +
            " to equal " + JSON.stringify(postType.getFields()));
    });
});
