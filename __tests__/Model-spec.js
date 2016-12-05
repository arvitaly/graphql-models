"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const collection1_1 = require("./../__fixtures__/collection1");
const AttributeTypes_1 = require("./../AttributeTypes");
const Model_1 = require("./../Model");
const ResolveTypes_1 = require("./../ResolveTypes");
const test_util_1 = require("./../test-util");
const animalModel = collection1_1.default.get("animal");
const postModel = collection1_1.default.get("post");
describe("Model spec", () => {
    it("getPrimaryAttribute, when not exists primary key, should throw error", () => {
        const m1 = new Model_1.default({
            id: "m1",
            attributes: [],
        }, {});
        expect(m1.getPrimaryKeyAttribute.bind(m1)).
            toThrowError("Not found primary key attribute for model `" + m1.name + "`");
    });
    describe("base type", () => {
        const expectedUserType = new graphql_1.GraphQLObjectType({
            name: "user",
            fields: {
                key: { type: graphql_1.GraphQLFloat },
                name: { type: graphql_1.GraphQLString },
                pets: { type: collection1_1.default.get("animal").getConnectionType() },
            },
            interfaces: [],
        });
        it("when generate base type with scalar attributes, should return equals", () => {
            const animalModelBaseType = animalModel.getBaseType();
            expect(test_util_1.printGraphQLObjectType(animalModelBaseType)).toMatchSnapshot();
        });
        it("when generate base type with sub-model, should generate sub model", () => {
            const userModelBaseType = collection1_1.default.get("user").getBaseType();
            expect(test_util_1.printGraphQLObjectType(userModelBaseType)).toMatchSnapshot();
        });
        it("when model required few times, need generate one time only", () => {
            const postModelBaseType = collection1_1.default.get("post").getBaseType();
            expect(test_util_1.printGraphQLObjectType(postModelBaseType)).toMatchSnapshot();
            // tslint:disable:line no-string-literal
            expect(postModelBaseType.getFields()["animals"].type.ofType).toBe((postModelBaseType.getFields()["owner"].type
                .getFields()["pets"].type).ofType);
        });
    });
    describe("Creation Type", () => {
        it("animal creation type", () => {
            const animalCreationType = collection1_1.default.get("animal").getCreateType();
            expect(test_util_1.printGraphQLInputObjectType(animalCreationType)).toMatchSnapshot();
        });
        it("user creation type", () => {
            const userCreationType = collection1_1.default.get("user").getCreateType();
            expect(test_util_1.printGraphQLInputObjectType(userCreationType)).toMatchSnapshot();
        });
        it("post creation type", () => {
            const postCreationType = collection1_1.default.get("post").getCreateType();
            expect(test_util_1.printGraphQLInputObjectType(postCreationType)).toMatchSnapshot();
        });
    });
    describe("Args", () => {
        it("args for one", () => {
            const argsForOne = animalModel.getOneArgs();
            const expectedArgsForOne = {};
            expectedArgsForOne[animalModel.getPrimaryKeyAttribute().name] = {
                type: new graphql_1.GraphQLNonNull(Model_1.scalarTypeToGraphQL(animalModel.getPrimaryKeyAttribute().type)),
            };
            expect(argsForOne).toEqual(expectedArgsForOne);
        });
        it("args for connection", () => {
            const argsForConnection = animalModel.getConnectionArgs();
            const expectedArgsForConnection = graphql_relay_1.connectionArgs;
            expectedArgsForConnection[Model_1.whereArgName] = { type: animalModel.getWhereInputType() };
            expect(argsForConnection).toEqual(expectedArgsForConnection);
        });
    });
    it("whereArgHelpers string", () => {
        expect(Model_1.whereArgHelpers[AttributeTypes_1.default.String]({ name: "n1", type: AttributeTypes_1.default.String, required: false }).length).toBe(8);
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
            Model_1.whereArgHelpers[attr.type](attr).map((t) => {
                where[t.name] = { type: t.type };
            });
        });
        const expectedWhereInputType = new graphql_1.GraphQLInputObjectType({
            name: postModel.name + "WhereInput",
            fields: where,
        });
        expect(whereInputType).toEqual(expectedWhereInputType); /* , fail(whereInputType, expectedWhereInputType) */
    });
    describe("Queries", () => {
        let resolveFn;
        beforeEach(() => {
            resolveFn = jasmine.createSpy("");
            animalModel.setResolveFn(resolveFn);
        });
        it("Query one", () => {
            const animalSingleQuery = animalModel.getQueryOne();
            expect(test_util_1.printGraphQLFieldConfig(animalSingleQuery)).toMatchSnapshot();
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
            const queryConnection = animalModel.getConnectionQuery();
            expect(test_util_1.printGraphQLFieldConfig(queryConnection)).toMatchSnapshot();
        });
        it("all queries", () => {
            const getQueryOneSpy = spyOn(animalModel, "getQueryOne").and.returnValue("q1");
            const getQueryConnectionSpy = spyOn(animalModel, "getConnectionQuery").and.returnValue("q2");
            const queries = animalModel.getQueries();
            const expectedQueries = [{
                    name: Model_1.uncapitalize(animalModel.name),
                    field: animalModel.getQueryOne(),
                }, {
                    name: Model_1.uncapitalize(animalModel.name) + "s",
                    field: animalModel.getConnectionQuery(),
                }];
            expect(queries).toEqual(expectedQueries);
            getQueryOneSpy.and.callThrough();
            getQueryConnectionSpy.and.callThrough();
        });
    });
    describe("Mutations", () => {
        let resolveFn;
        beforeEach(() => {
            resolveFn = jasmine.createSpy("");
            animalModel.setResolveFn(resolveFn);
        });
        it("create mutation", () => __awaiter(this, void 0, void 0, function* () {
            const createMutation = animalModel.getCreateMutation();
            expect(test_util_1.printGraphQLFieldConfig(createMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = yield createMutation.resolve("source", args, "f3", "f4");
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[{
                        type: ResolveTypes_1.default.MutationCreate,
                        model: animalModel.id,
                        args: args.input,
                        source: null,
                        context: "f3",
                        info: null,
                    }]]);
        }));
        it("getAllMutations", () => {
            const getCreateMutationSpy = spyOn(animalModel, "getCreateMutation").and.returnValue("f1");
            const getUpdateMutationSpy = spyOn(animalModel, "getUpdateMutation").and.returnValue("f2");
            const getUpdateManyMutationSpy = spyOn(animalModel, "getUpdateManyMutation").and.returnValue("f3");
            const mutations = animalModel.getMutations();
            const expectedMutations = [{
                    name: "createAnimal",
                    field: animalModel.getCreateMutation(),
                }, {
                    name: "updateAnimal",
                    field: animalModel.getUpdateMutation(),
                }, {
                    name: "updateAnimals",
                    field: animalModel.getUpdateManyMutation(),
                }];
            expect(mutations).toEqual(expectedMutations);
            getCreateMutationSpy.and.callThrough();
            getUpdateMutationSpy.and.callThrough();
            getUpdateManyMutationSpy.and.callThrough();
        });
    });
});
