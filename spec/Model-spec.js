"use strict";
const graphql_1 = require("graphql");
const collector1_1 = require("./fixtures/collector1");
describe("Model spec", () => {
    describe("base type", () => {
        const expectedAnimalType = new graphql_1.GraphQLObjectType({
            name: "Animal",
            fields: {
                id: { type: graphql_1.GraphQLInt },
                name: { type: graphql_1.GraphQLString },
                age: { type: graphql_1.GraphQLInt },
                Weight: { type: graphql_1.GraphQLFloat },
                birthday: { type: graphql_1.GraphQLString },
                isCat: { type: graphql_1.GraphQLBoolean },
            },
        });
        const expectedUserType = new graphql_1.GraphQLObjectType({
            name: "user",
            fields: {
                key: { type: graphql_1.GraphQLFloat },
                name: { type: graphql_1.GraphQLString },
                pets: { type: new graphql_1.GraphQLList(expectedAnimalType) },
            },
        });
        it("when generate base type with scalar attributes, should return equals", () => {
            const animalModelBaseType = collector1_1.default.getModel("animal").getBaseType();
            expect(animalModelBaseType).toEqual(expectedAnimalType, "Animal-model not equal, expected " +
                JSON.stringify(animalModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedAnimalType.getFields()));
        });
        it("when generate base type with sub-model, should generate sub model", () => {
            const userModelBaseType = collector1_1.default.getModel("user").getBaseType();
            expect(userModelBaseType).toEqual(expectedUserType, "User-model not equal, expected " +
                JSON.stringify(userModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedUserType.getFields()));
        });
        // tslint:disable:no-string-literal
        it("when model required few times, need generate one time only", () => {
            const postModelBaseType = collector1_1.default.getModel("post").getBaseType();
            expect(postModelBaseType.getFields()["animals"].type.ofType).toBe((postModelBaseType.getFields()["owner"].type
                .getFields()["pets"].type).ofType);
        });
    });
    describe("Creation Type", () => {
        const expectedAnimalCreationType = new graphql_1.GraphQLInputObjectType({
            name: "CreateAnimalInput",
            fields: {
                id: { type: graphql_1.GraphQLInt },
                name: { type: graphql_1.GraphQLString },
                age: { type: graphql_1.GraphQLInt },
                Weight: { type: graphql_1.GraphQLFloat },
                birthday: { type: graphql_1.GraphQLString },
                isCat: { type: graphql_1.GraphQLBoolean },
            },
        });
        const expectedUserCreationType = new graphql_1.GraphQLInputObjectType({
            name: "CreateuserInput",
            fields: {
                key: { type: graphql_1.GraphQLFloat },
                name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                pets: { type: new graphql_1.GraphQLList(graphql_1.GraphQLInt) },
                createPets: { type: new graphql_1.GraphQLList(expectedAnimalCreationType) },
            },
        });
        const expectedPostCreationType = new graphql_1.GraphQLInputObjectType({
            name: "CreatePostInput",
            fields: {
                owner: { type: graphql_1.GraphQLFloat },
                createOwner: { type: expectedUserCreationType },
                animals: { type: new graphql_1.GraphQLList(graphql_1.GraphQLInt) },
                createAnimals: { type: new graphql_1.GraphQLList(expectedAnimalCreationType) },
            },
        });
        it("animal creation type", () => {
            const animalCreationType = collector1_1.default.getModel("animal").getCreationType();
            expect(animalCreationType).toEqual(expectedAnimalCreationType, fail(animalCreationType, expectedAnimalCreationType));
        });
        it("user creation type", () => {
            const userCreationType = collector1_1.default.getModel("user").getCreationType();
            expect(userCreationType).toEqual(expectedUserCreationType, fail(userCreationType, expectedUserCreationType));
        });
        it("post creation type", () => {
            const postCreationType = collector1_1.default.getModel("post").getCreationType();
            expect(postCreationType).toEqual(expectedPostCreationType, fail(postCreationType, expectedPostCreationType));
        });
    });
});
function fail(obj1, obj2) {
    return `GraphQL objects not equal: 
        Object1:
            name: ${obj1.name},
            fields: ${JSON.stringify(obj1.getFields())}
        Object2:
            name: ${obj2.name},
            fields: ${JSON.stringify(obj2.getFields())}
    `;
}
;
