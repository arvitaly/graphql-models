import {
    GraphQLBoolean,
    GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import collector1, { postModel } from "./fixtures/collector1";
describe("Model spec", () => {
    describe("base type", () => {
        const expectedAnimalType = new GraphQLObjectType({
            name: "Animal",
            fields: {
                id: { type: GraphQLInt },
                name: { type: GraphQLString },
                age: { type: GraphQLInt },
                Weight: { type: GraphQLFloat },
                birthday: { type: GraphQLString },
                isCat: { type: GraphQLBoolean },
            },
        });
        const expectedUserType = new GraphQLObjectType({
            name: "user",
            fields: {
                key: { type: GraphQLFloat },
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
    describe("Creation Type", () => {
        const expectedAnimalCreationType = new GraphQLInputObjectType({
            name: "CreateAnimalInput",
            fields: {
                id: { type: GraphQLInt },
                name: { type: GraphQLString },
                age: { type: GraphQLInt },
                Weight: { type: GraphQLFloat },
                birthday: { type: GraphQLString },
                isCat: { type: GraphQLBoolean },
            },
        });
        const expectedUserCreationType = new GraphQLInputObjectType({
            name: "CreateuserInput",
            fields: {
                key: { type: GraphQLFloat },
                name: { type: new GraphQLNonNull(GraphQLString) },
                pets: { type: new GraphQLList(GraphQLInt) },
                createPets: { type: new GraphQLList(expectedAnimalCreationType) },
            },
        });
        const expectedPostCreationType = new GraphQLInputObjectType({
            name: "CreatePostInput",
            fields: {
                owner: { type: GraphQLFloat },
                createOwner: { type: expectedUserCreationType },
                animals: { type: new GraphQLList(GraphQLInt) },
                createAnimals: { type: new GraphQLList(expectedAnimalCreationType) },
            },
        });
        it("animal creation type", () => {
            const animalCreationType = collector1.getModel("animal").getCreationType();
            expect(animalCreationType).toEqual(expectedAnimalCreationType,
                fail(animalCreationType, expectedAnimalCreationType));
        });
        it("user creation type", () => {
            const userCreationType = collector1.getModel("user").getCreationType();
            expect(userCreationType).toEqual(expectedUserCreationType,
                fail(userCreationType, expectedUserCreationType));
        });
        it("post creation type", () => {
            const postCreationType = collector1.getModel("post").getCreationType();
            expect(postCreationType).toEqual(expectedPostCreationType,
                fail(postCreationType, expectedPostCreationType));
        });
    });
});

function fail(obj1: { name, getFields }, obj2: { name, getFields }) {
    return `GraphQL objects not equal: 
        Object1:
            name: ${obj1.name},
            fields: ${ JSON.stringify(obj1.getFields())}
        Object2:
            name: ${obj2.name},
            fields: ${JSON.stringify(obj2.getFields())}
    `;
};
