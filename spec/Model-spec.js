"use strict";
const graphql_1 = require("graphql");
const collector1_1 = require("./fixtures/collector1");
fdescribe("Model spec", () => {
    const expectedAnimalType = new graphql_1.GraphQLObjectType({
        name: "AnimalType",
        fields: {
            name: { type: graphql_1.GraphQLString },
            age: { type: graphql_1.GraphQLInt },
            Weight: { type: graphql_1.GraphQLFloat },
            birthday: { type: graphql_1.GraphQLString },
            isCat: { type: graphql_1.GraphQLBoolean },
        },
    });
    const expectedUserType = new graphql_1.GraphQLObjectType({
        name: "userType",
        fields: {
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
