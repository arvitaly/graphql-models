"use strict";
const graphql_1 = require("graphql");
const ResolveTypes_1 = require("./../ResolveTypes");
const collection1_1 = require("./fixtures/collection1");
const animalModel = collection1_1.default.get("animal");
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
            const animalModelBaseType = collection1_1.default.get("animal").getBaseType();
            expect(animalModelBaseType).toEqual(expectedAnimalType, "Animal-model not equal, expected " +
                JSON.stringify(animalModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedAnimalType.getFields()));
        });
        it("when generate base type with sub-model, should generate sub model", () => {
            const userModelBaseType = collection1_1.default.get("user").getBaseType();
            expect(userModelBaseType).toEqual(expectedUserType, "User-model not equal, expected " +
                JSON.stringify(userModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedUserType.getFields()));
        });
        // tslint:disable:no-string-literal
        it("when model required few times, need generate one time only", () => {
            const postModelBaseType = collection1_1.default.get("post").getBaseType();
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
            const animalCreationType = collection1_1.default.get("animal").getCreationType();
            expect(animalCreationType).toEqual(expectedAnimalCreationType, fail(animalCreationType, expectedAnimalCreationType));
        });
        it("user creation type", () => {
            const userCreationType = collection1_1.default.get("user").getCreationType();
            expect(userCreationType).toEqual(expectedUserCreationType, fail(userCreationType, expectedUserCreationType));
        });
        it("post creation type", () => {
            const postCreationType = collection1_1.default.get("post").getCreationType();
            expect(postCreationType).toEqual(expectedPostCreationType, fail(postCreationType, expectedPostCreationType));
        });
    });
    describe("Queries", () => {
        it("Single query", () => {
            const resolveFn = jasmine.createSpy("");
            const animalSingleQuery = animalModel.getSingleQuery(resolveFn);
            const expectedAnimalSingleQuery = {
                args: animalModel.getArgsForOne(),
                type: animalModel.getBaseType(),
                resolve: jasmine.any(Function),
            };
            expect(animalSingleQuery).toEqual(expectedAnimalSingleQuery);
            animalSingleQuery.resolve("f1", "f2", "f3", "f4");
            expect(resolveFn.calls.allArgs()).toEqual([[{
                        type: ResolveTypes_1.default.QueryOne,
                        model: animalModel.id,
                        source: "f1",
                        args: "f2",
                        context: "f3",
                        info: "f4",
                    }]]);
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
