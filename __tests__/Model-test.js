"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_fields_info_1 = require("graphql-fields-info");
const collection1_1 = require("./../__fixtures__/collection1");
const AttributeTypes_1 = require("./../AttributeTypes");
const Model_1 = require("./../Model");
const ResolveTypes_1 = require("./../ResolveTypes");
const test_util_1 = require("./../test-util");
const animalModel = collection1_1.default.get("animal");
const postModel = collection1_1.default.get("post");
const userModel = collection1_1.default.get("user");
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
        it("where args for animal", () => {
            expect(animalModel.getWhereArguments()).toMatchSnapshot();
        });
        it("where args for user", () => {
            expect(userModel.getWhereArguments()).toMatchSnapshot();
        });
        it("where args for post", () => {
            expect(postModel.getWhereArguments()).toMatchSnapshot();
        });
        it("args for one for animal", () => {
            expect(animalModel.getOneArgs()).toMatchSnapshot();
        });
        it("args for one for user", () => {
            expect(userModel.getOneArgs()).toMatchSnapshot();
        });
        it("args for one for post", () => {
            expect(postModel.getOneArgs()).toMatchSnapshot();
        });
        it("args for connection for animal", () => {
            expect(animalModel.getConnectionArgs()).toMatchSnapshot();
        });
        it("args for connection for user", () => {
            expect(userModel.getConnectionArgs()).toMatchSnapshot();
        });
        it("args for connection for post", () => {
            expect(postModel.getConnectionArgs()).toMatchSnapshot();
        });
    });
    it("whereArgHelpers string", () => {
        expect(Model_1.whereArgHelpers[AttributeTypes_1.default.String]({
            name: "n1",
            realName: "n1",
            type: AttributeTypes_1.default.String,
            required: false,
        }).length).toBe(8);
    });
    it("WhereInput type", () => {
        const whereInputType = postModel.getWhereInputType();
        expect(test_util_1.printGraphQLInputObjectType(whereInputType)).toMatchSnapshot();
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
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.QueryOne,
                    {
                        source: "f1",
                        args: "f2",
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
        });
        it("Query connection", () => {
            const queryConnection = animalModel.getConnectionQuery();
            expect(test_util_1.printGraphQLFieldConfig(queryConnection)).toMatchSnapshot();
            queryConnection.resolve("f1", "f2", "f3", "f4");
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.QueryConnection,
                    {
                        source: "f1",
                        args: "f2",
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
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
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.MutationCreate, {
                        args: args.input,
                        source: null,
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
        }));
        it("update mutation", () => __awaiter(this, void 0, void 0, function* () {
            const updateMutation = animalModel.getUpdateMutation();
            expect(test_util_1.printGraphQLFieldConfig(updateMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = yield updateMutation.resolve("source", args, "f3", "f4");
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.MutationUpdate, {
                        args: args.input,
                        source: null,
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
        }));
        it("update many mutation", () => __awaiter(this, void 0, void 0, function* () {
            const updateManyMutation = animalModel.getUpdateManyMutation();
            expect(test_util_1.printGraphQLFieldConfig(updateManyMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = yield updateManyMutation.resolve("source", args, "f3", "f4");
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.MutationUpdateMany, {
                        args: args.input,
                        source: null,
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
        }));
        it("create or update mutation", () => __awaiter(this, void 0, void 0, function* () {
            const createOrUpdateMutation = animalModel.getCreateOrUpdateMutation();
            expect(test_util_1.printGraphQLFieldConfig(createOrUpdateMutation)).toMatchSnapshot();
            const args = { clientMutationId: "6", input: { f1: "hello" } };
            const result = { clientMutationId: "6", animal: { name: "m2" } };
            resolveFn.and.returnValue(result);
            const mutationResut = yield createOrUpdateMutation.resolve("source", args, "f3", "f4");
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.MutationCreateOrUpdate, {
                        args: args.input,
                        source: null,
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
        }));
        it("delete mutation", () => __awaiter(this, void 0, void 0, function* () {
            const deleteMutation = animalModel.getDeleteMutation();
            expect(test_util_1.printGraphQLFieldConfig(deleteMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = yield deleteMutation.resolve("source", args, "f3", "f4");
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                    "animal",
                    ResolveTypes_1.default.MutationDelete, {
                        args: args.input,
                        source: null,
                        context: "f3",
                        info: "f4",
                        resolveInfo: graphql_fields_info_1.fromResolveInfo({}),
                    }
                ]]);
        }));
        it("getAllMutations", () => {
            const getCreateMutationSpy = spyOn(animalModel, "getCreateMutation").and.returnValue("f1");
            const getUpdateMutationSpy = spyOn(animalModel, "getUpdateMutation").and.returnValue("f2");
            const getUpdateManyMutationSpy = spyOn(animalModel, "getUpdateManyMutation").and.returnValue("f3");
            const getCreateOrUpdateManyMutationSpy = spyOn(animalModel, "getCreateOrUpdateMutation").and.returnValue("f5");
            const getDeleteMutationSpy = spyOn(animalModel, "getDeleteMutation").and.returnValue("f4");
            const mutations = animalModel.getMutations();
            const expectedMutations = [{
                    name: "createAnimal",
                    field: animalModel.getCreateMutation(),
                }, {
                    name: "createOrUpdateAnimal",
                    field: animalModel.getCreateOrUpdateMutation(),
                }, {
                    name: "updateAnimal",
                    field: animalModel.getUpdateMutation(),
                }, {
                    name: "updateAnimals",
                    field: animalModel.getUpdateManyMutation(),
                }, {
                    name: "deleteAnimal",
                    field: animalModel.getDeleteMutation(),
                }];
            expect(mutations).toEqual(expectedMutations);
            getCreateMutationSpy.and.callThrough();
            getUpdateMutationSpy.and.callThrough();
            getUpdateManyMutationSpy.and.callThrough();
            getCreateOrUpdateManyMutationSpy.and.callThrough();
            getDeleteMutationSpy.and.callThrough();
        });
    });
});
