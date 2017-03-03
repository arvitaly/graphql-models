import {
    GraphQLArgumentConfig,
    GraphQLBoolean,
    GraphQLFieldConfig,
    GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLID,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import { fromResolveInfo } from "graphql-fields-info";
import { connectionArgs, mutationWithClientMutationId } from "graphql-relay";
import { idArgName, whereArgName } from "./..";
import collection1 from "./../__fixtures__/collection1";
import AttributeTypes from "./../AttributeTypes";
import Model, {
    capitalize, scalarTypeToGraphQL,
    uncapitalize, whereArgHelpers,
} from "./../Model";
import ResolveTypes from "./../ResolveTypes";
import { printGraphQLFieldConfig, printGraphQLInputObjectType, printGraphQLObjectType } from "./../test-util";
import { AttributeType, ModelAttribute, Queries } from "./../typings";
const animalModel = collection1.get("animal");
const postModel = collection1.get("post");
const userModel = collection1.get("user");
describe("Model spec", () => {
    it("getPrimaryAttribute, when not exists primary key, should throw error", () => {
        const m1 = new Model({
            id: "m1",
            attributes: [],
        }, {} as any);
        expect(m1.getPrimaryKeyAttribute.bind(m1)).
            toThrowError("Not found primary key attribute for model `" + m1.name + "`");
    });
    describe("base type", () => {
        const expectedUserType = new GraphQLObjectType({
            name: "user",
            fields: {
                key: { type: GraphQLFloat },
                name: { type: GraphQLString },
                pets: { type: collection1.get("animal").getConnectionType() },
            },
            interfaces: [],
        });
        it("when generate base type with scalar attributes, should return equals", () => {
            const animalModelBaseType = animalModel.getBaseType();
            expect(printGraphQLObjectType(animalModelBaseType)).toMatchSnapshot();
        });
        it("when generate base type with sub-model, should generate sub model", () => {
            const userModelBaseType = collection1.get("user").getBaseType();
            expect(printGraphQLObjectType(userModelBaseType)).toMatchSnapshot();
        });
        it("when model required few times, need generate one time only", () => {
            const postModelBaseType = collection1.get("post").getBaseType();
            expect(printGraphQLObjectType(postModelBaseType)).toMatchSnapshot();
            // tslint:disable:line no-string-literal
            expect((postModelBaseType.getFields()["animals"].type as GraphQLList<any>).ofType).toBe(
                (((postModelBaseType.getFields()["owner"].type as GraphQLObjectType)
                    .getFields()["pets"].type) as GraphQLList<any>).ofType);
        });
    });
    describe("Creation Type", () => {
        it("animal creation type", () => {
            const animalCreationType = collection1.get("animal").getCreateType();
            expect(printGraphQLInputObjectType(animalCreationType)).toMatchSnapshot();
        });
        it("user creation type", () => {
            const userCreationType = collection1.get("user").getCreateType();
            expect(printGraphQLInputObjectType(userCreationType)).toMatchSnapshot();
        });
        it("post creation type", () => {
            const postCreationType = collection1.get("post").getCreateType();
            expect(printGraphQLInputObjectType(postCreationType)).toMatchSnapshot();
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
        expect(
            whereArgHelpers[AttributeTypes.String]({
                name: "n1",
                realName: "n1",
                type: AttributeTypes.String,
                required: false,
            }).length,
        ).toBe(8);
    });
    it("WhereInput type", () => {
        const whereInputType = postModel.getWhereInputType();
        expect(printGraphQLInputObjectType(whereInputType)).toMatchSnapshot();
    });
    describe("Queries", () => {
        let resolveFn: jasmine.Spy;
        beforeEach(() => {
            resolveFn = jasmine.createSpy("");
            animalModel.setResolveFn(resolveFn);
        });
        it("Query one", () => {
            const animalSingleQuery = animalModel.getQueryOne();
            expect(printGraphQLFieldConfig(animalSingleQuery)).toMatchSnapshot();
            animalSingleQuery.resolve("f1", "f2" as any, "f3", "f4" as any);
            expect(resolveFn.calls.allArgs()).toEqual([[
                "animal",
                ResolveTypes.QueryOne,
                {
                    source: "f1",
                    args: "f2",
                    context: "f3",
                    info: "f4",
                    resolveInfo: fromResolveInfo({} as any),
                }]]);
        });
        it("Query connection", () => {
            const queryConnection = animalModel.getConnectionQuery();
            expect(printGraphQLFieldConfig(queryConnection)).toMatchSnapshot();
            queryConnection.resolve("f1", "f2" as any, "f3", "f4" as any);
            expect(resolveFn.calls.allArgs()).toEqual([[
                "animal",
                ResolveTypes.QueryConnection,
                {
                    source: "f1",
                    args: "f2",
                    context: "f3",
                    info: "f4",
                    resolveInfo: fromResolveInfo({} as any),
                }]]);
        });
        it("all queries", () => {
            const getQueryOneSpy = spyOn(animalModel, "getQueryOne").and.returnValue("q1");
            const getQueryConnectionSpy = spyOn(animalModel, "getConnectionQuery").and.returnValue("q2");
            const queries = animalModel.getQueries();
            const expectedQueries: Queries = [{
                name: uncapitalize(animalModel.name),
                field: animalModel.getQueryOne(),
            }, {
                name: uncapitalize(animalModel.name) + "s",
                field: animalModel.getConnectionQuery(),
            }];
            expect(queries).toEqual(expectedQueries);
            getQueryOneSpy.and.callThrough();
            getQueryConnectionSpy.and.callThrough();
        });
    });
    describe("Mutations", () => {
        let resolveFn: jasmine.Spy;
        beforeEach(() => {
            resolveFn = jasmine.createSpy("");
            animalModel.setResolveFn(resolveFn);
        });
        it("create mutation", async () => {
            const createMutation = animalModel.getCreateMutation();
            expect(printGraphQLFieldConfig(createMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = await createMutation.resolve("source", args, "f3", "f4" as any);
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                "animal",
                ResolveTypes.MutationCreate, {
                    args: args.input,
                    source: null,
                    context: "f3",
                    info: "f4",
                    resolveInfo: fromResolveInfo({} as any),
                }]]);
        });
        it("update mutation", async () => {
            const updateMutation = animalModel.getUpdateMutation();
            expect(printGraphQLFieldConfig(updateMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = await updateMutation.resolve("source", args, "f3", "f4" as any);
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                "animal",
                ResolveTypes.MutationUpdate, {
                    args: args.input,
                    source: null,
                    context: "f3",
                    info: "f4",
                    resolveInfo: fromResolveInfo({} as any),
                }]]);
        });
        it("update many mutation", async () => {
            const updateManyMutation = animalModel.getUpdateManyMutation();
            expect(printGraphQLFieldConfig(updateManyMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = await updateManyMutation.resolve("source", args, "f3", "f4" as any);
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                "animal",
                ResolveTypes.MutationUpdateMany, {
                    args: args.input,
                    source: null,
                    context: "f3",
                    info: "f4",
                    resolveInfo: fromResolveInfo({} as any),
                }]]);
        });
        it("delete mutation", async () => {
            const deleteMutation = animalModel.getDeleteMutation();
            expect(printGraphQLFieldConfig(deleteMutation)).toMatchSnapshot();
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = await deleteMutation.resolve("source", args, "f3", "f4" as any);
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[
                "animal",
                ResolveTypes.MutationDelete, {
                    args: args.input,
                    source: null,
                    context: "f3",
                    info: "f4",
                    resolveInfo: fromResolveInfo({} as any),
                }]]);
        });
        it("getAllMutations", () => {
            const getCreateMutationSpy = spyOn(animalModel, "getCreateMutation").and.returnValue("f1");
            const getUpdateMutationSpy = spyOn(animalModel, "getUpdateMutation").and.returnValue("f2");
            const getUpdateManyMutationSpy = spyOn(animalModel, "getUpdateManyMutation").and.returnValue("f3");
            const getDeleteMutationSpy = spyOn(animalModel, "getDeleteMutation").and.returnValue("f4");
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
            }, {
                name: "deleteAnimal",
                field: animalModel.getDeleteMutation(),
            }];
            expect(mutations).toEqual(expectedMutations);
            getCreateMutationSpy.and.callThrough();
            getUpdateMutationSpy.and.callThrough();
            getUpdateManyMutationSpy.and.callThrough();
            getDeleteMutationSpy.and.callThrough();
        });
    });
});
