import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import collection1 from "./../__fixtures__/collection1";
import Schema from "./../Schema";
import { } from "./../test-util";
const fields1 = { f1: { type: GraphQLString } };
const obj1 = new GraphQLObjectType({ name: "obj1", fields: fields1 });
const fields2 = { f2: { type: GraphQLString } };
const obj2 = new GraphQLObjectType({ name: "obj2", fields: fields2 });
describe("Schema spec", () => {
    const resolveFn = jasmine.createSpy("");
    const schema = new Schema(collection1, resolveFn);
    it("getQueryViewerType", () => {
        const getQueriesSpy = spyOn(schema, "queriesToMap").and.returnValue(fields1);
        const queryViewerType = schema.getQueryViewerType();
        const expectedQueryViewerType = new GraphQLObjectType({
            name: "QueryViewer",
            fields: fields1,
        });
        expect(queryViewerType).toEqual(expectedQueryViewerType); /* , fail(queryViewerType, expectedQueryViewerType) */
        getQueriesSpy.and.callThrough();
    });
    it("getQueryType", () => {
        const getQueryViewerTypeSpy = spyOn(schema, "getQueryViewerType").and.returnValue(obj1);
        const queryType = schema.getQueryType();
        const expectedQueryType = new GraphQLObjectType({
            name: "Query",
            fields: {
                viewer: {
                    type: obj1,
                    resolve: jasmine.any(Function) as any,
                },
            },
        });
        expect(queryType).toEqual(expectedQueryType); /* , fail(queryType, expectedQueryType) */
    });
    it("getMutationType", () => {
        // TODO
    });
    it("getGraphQLSchema", () => {
        const getQueryTypeSpy = spyOn(schema, "getQueryType").and.returnValue(obj1);
        const getMutationTypeSpy = spyOn(schema, "getMutationType").and.returnValue(obj2);
        const graphQLSchema = schema.getGraphQLSchema();
        const fields = {};
        const expectedGraphQLSchema = new GraphQLSchema({
            query: schema.getQueryType(),
            mutation: schema.getMutationType(),
        });
        expect(graphQLSchema).toEqual(expectedGraphQLSchema);
        getQueryTypeSpy.and.callThrough();
        getMutationTypeSpy.and.callThrough();
    });
});
