// tslint:disable:object-literal-sort-keys no-string-literal
import {
    GraphQLBoolean,
    GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import getTypes from "./..";
import AttributeTypes from "./../AttributeTypes";
import { Model } from "./../typings";
describe("GraphQL models spec", () => {
    it("should create all types with all modes", () => {
        const postModel: Model = {
            id: "post",
            name: "Post",
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
        const userModel: Model = {
            id: "user",
            attributes: [{
                name: "name",
                type: AttributeTypes.String,
            }, {
                name: "pets",
                type: AttributeTypes.Collection,
                modelId: "animal",
            }],
        };
        const animalModel: Model = {
            id: "animal",
            name: "Animal",
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
        const models: Model[] = [postModel, userModel, animalModel];
        const animalType = new GraphQLObjectType({
            name: "Animal",
            fields: {
                name: { type: GraphQLString },
                age: { type: GraphQLInt },
                Weight: { type: GraphQLFloat },
                birthday: { type: GraphQLString },
                isCat: { type: GraphQLBoolean },
            },
        });
        const userType = new GraphQLObjectType({
            name: "user",
            fields: {
                name: { type: GraphQLString },
                pets: { type: new GraphQLList(animalType) },
            },
        });
        const postType = new GraphQLObjectType({
            name: "Post",
            fields: {
                id: { type: GraphQLInt },
                owner: { type: userType },
                animals: { type: new GraphQLList(animalType) },
            },
        });
        const types = getTypes(models);
        expect(types).toEqual({
            post: jasmine.any(Object),
            user: jasmine.any(Object),
            animal: jasmine.any(Object),
        });
        expect(types["animal"]).toEqual(animalType,
            "Animal not equal, expected " +
            JSON.stringify(types["animal"].getFields()) +
            " to equal " + JSON.stringify(animalType.getFields()));
        expect(types["user"]).toEqual(userType,
            "User not equal, expected " +
            JSON.stringify(types["user"].getFields()) +
            " to equal " + JSON.stringify(userType.getFields()));
        expect(types["post"]).toEqual(postType,
            "Post not equal, expected " +
            JSON.stringify(types["post"].getFields()) +
            " to equal " + JSON.stringify(postType.getFields()));
    });
});
