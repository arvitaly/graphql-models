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
import collector1, { postModel } from "./fixtures/collector1";
fdescribe("Model spec", () => {
    const expectedAnimalType = new GraphQLObjectType({
        name: "AnimalType",
        fields: {
            name: { type: GraphQLString },
            age: { type: GraphQLInt },
            Weight: { type: GraphQLFloat },
            birthday: { type: GraphQLString },
            isCat: { type: GraphQLBoolean },
        },
    });
    const expectedUserType = new GraphQLObjectType({
        name: "userType",
        fields: {
            name: { type: GraphQLString },
            pets: { type: new GraphQLList(expectedAnimalType) },
        },
    });
    it("when generate base type with scalar attributes, should return equals", () => {
        const animalModelBaseType = collector1.getModel("animal").getBaseType();
        expect(animalModelBaseType).toEqual(expectedAnimalType,
            "Animal-model not equal, expected " +
            JSON.stringify(animalModelBaseType.getFields()) + " to equal " +
            JSON.stringify(expectedAnimalType.getFields()));
    });
    it("when generate base type with sub-model, should generate sub model", () => {
        const userModelBaseType = collector1.getModel("user").getBaseType();
        expect(userModelBaseType).toEqual(expectedUserType,
            "User-model not equal, expected " +
            JSON.stringify(userModelBaseType.getFields()) + " to equal " +
            JSON.stringify(expectedUserType.getFields()));
    });
    // tslint:disable:no-string-literal
    it("when model required few times, need generate one time only", () => {
        const postModelBaseType = collector1.getModel("post").getBaseType();
        expect((postModelBaseType.getFields()["animals"].type as GraphQLList<any>).ofType).toBe(
            (((postModelBaseType.getFields()["owner"].type as GraphQLObjectType)
                .getFields()["pets"].type) as GraphQLList<any>).ofType);
    });
});
