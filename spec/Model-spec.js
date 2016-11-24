"use strict";
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const AttributeTypes_1 = require("./../AttributeTypes");
const Model_1 = require("./../Model");
const ResolveTypes_1 = require("./../ResolveTypes");
const fail_1 = require("./fail");
const collection1_1 = require("./fixtures/collection1");
const animalModel = collection1_1.default.get("animal");
const postModel = collection1_1.default.get("post");
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
            const animalModelBaseType = animalModel.getBaseType();
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
                id: { type: graphql_1.GraphQLInt },
                owner: { type: graphql_1.GraphQLFloat },
                createOwner: { type: expectedUserCreationType },
                animals: { type: new graphql_1.GraphQLList(graphql_1.GraphQLInt) },
                createAnimals: { type: new graphql_1.GraphQLList(expectedAnimalCreationType) },
            },
        });
        it("animal creation type", () => {
            const animalCreationType = collection1_1.default.get("animal").getCreationType();
            expect(animalCreationType).toEqual(expectedAnimalCreationType, fail_1.default(animalCreationType, expectedAnimalCreationType));
        });
        it("user creation type", () => {
            const userCreationType = collection1_1.default.get("user").getCreationType();
            expect(userCreationType).toEqual(expectedUserCreationType, fail_1.default(userCreationType, expectedUserCreationType));
        });
        it("post creation type", () => {
            const postCreationType = collection1_1.default.get("post").getCreationType();
            expect(postCreationType).toEqual(expectedPostCreationType, fail_1.default(postCreationType, expectedPostCreationType));
        });
    });
    describe("Args", () => {
        it("args for one", () => {
            const argsForOne = animalModel.getOneArgs();
            const expectedArgsForOne = {};
            expectedArgsForOne[animalModel.getPrimaryKeyAttribute().name] =
                { type: new graphql_1.GraphQLNonNull(Model_1.scalarTypeToGraphQL(animalModel.getPrimaryKeyAttribute().type)) };
            expect(argsForOne).toEqual(expectedArgsForOne);
        });
        it("args for connection", () => {
            const argsForConnection = animalModel.getConnectionArgs();
            const expectedArgsForConnection = graphql_relay_1.connectionArgs;
            expectedArgsForConnection[Model_1.whereArgName] = { type: animalModel.getWhereInputType() };
            expect(argsForConnection).toEqual(expectedArgsForConnection);
        });
    });
    it("WhereInput type", () => {
        const whereInputType = postModel.getWhereInputType();
        let where = {};
        postModel.attributes.map((attr) => {
            let type;
            if (attr.type === AttributeTypes_1.default.Model || attr.type === AttributeTypes_1.default.Collection) {
                type = collection1_1.default.get(attr.model).getPrimaryKeyAttribute().type;
            }
            else {
                type = attr.type;
            }
            where[attr.name] = { type: Model_1.scalarTypeToGraphQL(type) };
        });
        const expectedWhereInputType = new graphql_1.GraphQLInputObjectType({
            name: postModel.name + "WhereInput",
            fields: where,
        });
        expect(whereInputType).toEqual(expectedWhereInputType, fail_1.default(whereInputType, expectedWhereInputType));
    });
    describe("Queries", () => {
        let resolveFn;
        beforeEach(() => {
            resolveFn = jasmine.createSpy("");
        });
        it("Query one", () => {
            const animalSingleQuery = animalModel.getQueryOne(resolveFn);
            const expectedAnimalSingleQuery = {
                args: animalModel.getOneArgs(),
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
        it("Query connection", () => {
            const queryConnection = animalModel.getConnectionQuery(resolveFn);
            const expectedQueryConnection = {
                args: animalModel.getConnectionArgs(),
                type: animalModel.getConnectionType(),
                resolve: jasmine.any(Function),
            };
        });
        it("all queries", () => {
            const getQueryOneSpy = spyOn(animalModel, "getQueryOne").and.returnValue("q1");
            const getQueryConnectionSpy = spyOn(animalModel, "getConnectionQuery").and.returnValue("q2");
            const queries = animalModel.getQueries(resolveFn);
            const expectedQueries = [{
                    name: Model_1.uncapitalize(animalModel.name),
                    field: animalModel.getQueryOne(resolveFn),
                }, {
                    name: Model_1.uncapitalize(animalModel.name) + "s",
                    field: animalModel.getConnectionQuery(resolveFn),
                }];
            expect(queries).toEqual(expectedQueries);
            getQueryOneSpy.and.callThrough();
            getQueryConnectionSpy.and.callThrough();
        });
    });
});
