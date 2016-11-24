import {
    GraphQLBoolean,
    GraphQLFieldConfig,
    GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import ResolveTypes from "./../ResolveTypes";
import collection1, { postModel } from "./fixtures/collection1";
const animalModel = collection1.get("animal");
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
            const animalModelBaseType = collection1.get("animal").getBaseType();
            expect(animalModelBaseType).toEqual(expectedAnimalType,
                "Animal-model not equal, expected " +
                JSON.stringify(animalModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedAnimalType.getFields()));
        });
        it("when generate base type with sub-model, should generate sub model", () => {
            const userModelBaseType = collection1.get("user").getBaseType();
            expect(userModelBaseType).toEqual(expectedUserType,
                "User-model not equal, expected " +
                JSON.stringify(userModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedUserType.getFields()));
        });
        // tslint:disable:no-string-literal
        it("when model required few times, need generate one time only", () => {
            const postModelBaseType = collection1.get("post").getBaseType();
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
            const animalCreationType = collection1.get("animal").getCreationType();
            expect(animalCreationType).toEqual(expectedAnimalCreationType,
                fail(animalCreationType, expectedAnimalCreationType));
        });
        it("user creation type", () => {
            const userCreationType = collection1.get("user").getCreationType();
            expect(userCreationType).toEqual(expectedUserCreationType,
                fail(userCreationType, expectedUserCreationType));
        });
        it("post creation type", () => {
            const postCreationType = collection1.get("post").getCreationType();
            expect(postCreationType).toEqual(expectedPostCreationType,
                fail(postCreationType, expectedPostCreationType));
        });
    });
    describe("Queries", () => {
        it("Single query", () => {
            const resolveFn = jasmine.createSpy("");
            const animalSingleQuery = animalModel.getSingleQuery(resolveFn);
            const expectedAnimalSingleQuery: GraphQLFieldConfig<any> = {
                args: animalModel.getArgsForOne(),
                type: animalModel.getBaseType(),
                resolve: jasmine.any(Function) as any,
            };
            expect(animalSingleQuery).toEqual(expectedAnimalSingleQuery);
            animalSingleQuery.resolve("f1", "f2" as any, "f3", "f4" as any);
            expect(resolveFn.calls.allArgs()).toEqual([[{
                type: ResolveTypes.QueryOne,
                model: animalModel.id,
                source: "f1",
                args: "f2",
                context: "f3",
                info: "f4",
            }]])
        })
    })
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
