import {
    GraphQLArgumentConfig,
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
import { connectionArgs, mutationWithClientMutationId } from "graphql-relay";
import collection1 from "./../__fixtures__/collection1";
import AttributeTypes from "./../AttributeTypes";
import Model, { capitalize, scalarTypeToGraphQL, uncapitalize, whereArgHelpers, whereArgName } from "./../Model";
import ResolveTypes from "./../ResolveTypes";
import { compareMutations, fail } from "./../test-util";
import { AttributeType, ModelAttribute, Queries } from "./../typings";
const animalModel = collection1.get("animal");
const postModel = collection1.get("post");
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
            interfaces: [],
        });
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
            expect(animalModelBaseType).toEqual(expectedAnimalType); /* "Animal-model not equal, expected " +
                JSON.stringify(animalModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedAnimalType.getFields())*/
        });
        it("when generate base type with sub-model, should generate sub model", () => {
            const userModelBaseType = collection1.get("user").getBaseType();
            expect(userModelBaseType).toEqual(expectedUserType); /* ,
                "User-model not equal, expected " +
                JSON.stringify(userModelBaseType.getFields()) + " to equal " +
                JSON.stringify(expectedUserType.getFields())*/
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
                id: { type: GraphQLInt },
                owner: { type: GraphQLFloat },
                createOwner: { type: expectedUserCreationType },
                animals: { type: new GraphQLList(GraphQLInt) },
                createAnimals: { type: new GraphQLList(expectedAnimalCreationType) },
            },
        });
        it("animal creation type", () => {
            const animalCreationType = collection1.get("animal").getCreateType();
            expect(animalCreationType).toEqual(expectedAnimalCreationType); /* ,
                fail(animalCreationType, expectedAnimalCreationType)*/
        });
        it("user creation type", () => {
            const userCreationType = collection1.get("user").getCreateType();
            expect(userCreationType).toEqual(expectedUserCreationType); /* ,
                fail(userCreationType, expectedUserCreationType) */
        });
        it("post creation type", () => {
            const postCreationType = collection1.get("post").getCreateType();
            expect(postCreationType).toEqual(expectedPostCreationType); /* ,
                fail(postCreationType, expectedPostCreationType)*/
        });
    });
    describe("Args", () => {
        it("args for one", () => {
            const argsForOne = animalModel.getOneArgs();
            const expectedArgsForOne = {};
            expectedArgsForOne[animalModel.getPrimaryKeyAttribute().name] = {
                type: new GraphQLNonNull(scalarTypeToGraphQL(animalModel.getPrimaryKeyAttribute().type)),
            };
            expect(argsForOne).toEqual(expectedArgsForOne);
        });
        it("args for connection", () => {
            const argsForConnection = animalModel.getConnectionArgs();
            const expectedArgsForConnection = connectionArgs;
            expectedArgsForConnection[whereArgName] = { type: animalModel.getWhereInputType() };
            expect(argsForConnection).toEqual(expectedArgsForConnection);
        });
    });
    it("whereArgHelpers string", () => {
        expect(
            whereArgHelpers[AttributeTypes.String]({ name: "n1", type: AttributeTypes.String, required: false }).length,
        ).toBe(8);
    });
    it("WhereInput type", () => {
        const whereInputType = postModel.getWhereInputType();
        let where = {};
        postModel.attributes.map((attr) => {
            let type: AttributeType;
            if (attr.type === AttributeTypes.Model || attr.type === AttributeTypes.Collection) {
                type = collection1.get((attr as ModelAttribute).model).getPrimaryKeyAttribute().type;
            } else {
                type = attr.type;
            }
            where[attr.name] = { type: scalarTypeToGraphQL(type) };
            whereArgHelpers[attr.type](attr).map((t) => {
                where[t.name] = { type: t.type };
            });
        });
        const expectedWhereInputType: GraphQLInputObjectType = new GraphQLInputObjectType({
            name: postModel.name + "WhereInput",
            fields: where,
        });
        expect(whereInputType).toEqual(expectedWhereInputType); /* , fail(whereInputType, expectedWhereInputType) */
    });
    describe("Queries", () => {
        let resolveFn: jasmine.Spy;
        beforeEach(() => {
            resolveFn = jasmine.createSpy("");
        });
        it("Query one", () => {
            const animalSingleQuery = animalModel.getQueryOne(resolveFn);
            const expectedAnimalSingleQuery: GraphQLFieldConfig<any, any> = {
                args: animalModel.getOneArgs(),
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
            }]]);
        });
        it("Query connection", () => {
            const queryConnection = animalModel.getConnectionQuery(resolveFn);
            const expectedQueryConnection: GraphQLFieldConfig<any, any> = {
                args: animalModel.getConnectionArgs(),
                type: animalModel.getConnectionType(),
                resolve: jasmine.any(Function) as any,
            };
        });
        it("all queries", () => {
            const getQueryOneSpy = spyOn(animalModel, "getQueryOne").and.returnValue("q1");
            const getQueryConnectionSpy = spyOn(animalModel, "getConnectionQuery").and.returnValue("q2");
            const queries = animalModel.getQueries(resolveFn);
            const expectedQueries: Queries = [{
                name: uncapitalize(animalModel.name),
                field: animalModel.getQueryOne(resolveFn),
            }, {
                name: uncapitalize(animalModel.name) + "s",
                field: animalModel.getConnectionQuery(resolveFn),
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
        });
        // tslint:disable:line arrow-parens
        it("create mutation", async (done) => {
            const createMutation = animalModel.getCreateMutation(resolveFn);
            const expectedCreateMutation = mutationWithClientMutationId({
                name: animalModel.name + "CreateMutation",
                inputFields: animalModel.getCreateType().getFields(),
                outputFields: {
                    [uncapitalize(animalModel.name)]: { type: animalModel.getBaseType() },
                },
                mutateAndGetPayload: jasmine.any(Function) as any,
            });
            compareMutations(createMutation, expectedCreateMutation);
            const args = { clientMutationId: "5", input: { f1: "hello" } };
            const result = { clientMutationId: "5", animal: { name: "m1" } };
            resolveFn.and.returnValue(result);
            const mutationResut = await createMutation.resolve("source", args, "f3", "f4" as any);
            expect(mutationResut).toEqual(result);
            expect(resolveFn.calls.allArgs()).toEqual([[{
                type: ResolveTypes.MutationCreate,
                model: animalModel.id,
                args: args.input,
                source: null,
                context: "f3",
                info: null,
            }]]);
            done();
        });
        it("getAllMutations", () => {
            const getCreateMutationSpy = spyOn(animalModel, "getCreateMutation").and.returnValue("f1");
            const getUpdateMutationSpy = spyOn(animalModel, "getUpdateMutation").and.returnValue("f2");
            const mutations = animalModel.getMutations(resolveFn);
            const expectedMutations = [{
                name: "createAnimal",
                field: animalModel.getCreateMutation(resolveFn),
            }, {
                name: "updateAnimal",
                field: animalModel.getUpdateMutation(resolveFn),
            }];
            expect(mutations).toEqual(expectedMutations);
            getCreateMutationSpy.and.callThrough();
            getUpdateMutationSpy.and.callThrough();
        });
    });
});
