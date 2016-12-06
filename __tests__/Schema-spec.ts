import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import collection1 from "./../__fixtures__/collection1";
import Schema from "./../Schema";
import { printGraphQLObjectType, printGraphQLSchema } from "./../test-util";
const fields1 = { f1: { type: GraphQLString } };
const obj1 = new GraphQLObjectType({ name: "obj1", fields: fields1 });
const fields2 = { f2: { type: GraphQLString } };
const obj2 = new GraphQLObjectType({ name: "obj2", fields: fields2 });
describe("Schema spec", () => {
    const resolver = { resolve: jasmine.createSpy("") };
    const schema = new Schema(resolver as any);
    it("getQueryViewerType", () => {
        const getQueriesSpy = spyOn(schema, "queriesToMap").and.returnValue(fields1);
        const queryViewerType = schema.getQueryViewerType();
        expect(printGraphQLObjectType(queryViewerType)).toMatchSnapshot();
        getQueriesSpy.and.callThrough();
    });
    it("getQueryType", () => {
        const getQueryViewerTypeSpy = spyOn(schema, "getQueryViewerType").and.returnValue(obj1);
        expect(printGraphQLObjectType(schema.getQueryType())).toMatchSnapshot();
        getQueryViewerTypeSpy.and.callThrough();
    });
    it("getMutationType", () => {
        const getMutationTypeSpy = spyOn(schema, "getMutationType").and.returnValue(obj1);
        expect(printGraphQLObjectType(schema.getMutationType())).toMatchSnapshot();
        getMutationTypeSpy.and.callThrough();
    });
    it("getGraphQLSchema", () => {
        const getQueryTypeSpy = spyOn(schema, "getQueryType").and.returnValue(obj1);
        const getMutationTypeSpy = spyOn(schema, "getMutationType").and.returnValue(obj2);
        expect(printGraphQLSchema(schema.getGraphQLSchema())).toMatchSnapshot();
        getQueryTypeSpy.and.callThrough();
        getMutationTypeSpy.and.callThrough();
    });
});
