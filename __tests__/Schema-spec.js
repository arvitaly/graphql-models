"use strict";
const graphql_1 = require("graphql");
const collection1_1 = require("./../__fixtures__/collection1");
const Schema_1 = require("./../Schema");
const test_util_1 = require("./../test-util");
const fields1 = { f1: { type: graphql_1.GraphQLString } };
const obj1 = new graphql_1.GraphQLObjectType({ name: "obj1", fields: fields1 });
const fields2 = { f2: { type: graphql_1.GraphQLString } };
const obj2 = new graphql_1.GraphQLObjectType({ name: "obj2", fields: fields2 });
describe("Schema spec", () => {
    const resolver = { resolve: jasmine.createSpy("") };
    const schema = new Schema_1.default(collection1_1.default, resolver);
    it("getQueryViewerType", () => {
        const getQueriesSpy = spyOn(schema, "queriesToMap").and.returnValue(fields1);
        const queryViewerType = schema.getQueryViewerType();
        expect(test_util_1.printGraphQLObjectType(queryViewerType)).toMatchSnapshot();
        getQueriesSpy.and.callThrough();
    });
    it("getQueryType", () => {
        const getQueryViewerTypeSpy = spyOn(schema, "getQueryViewerType").and.returnValue(obj1);
        expect(test_util_1.printGraphQLObjectType(schema.getQueryType())).toMatchSnapshot();
        getQueryViewerTypeSpy.and.callThrough();
    });
    it("getMutationType", () => {
        const getMutationTypeSpy = spyOn(schema, "getMutationType").and.returnValue(obj1);
        expect(test_util_1.printGraphQLObjectType(schema.getMutationType())).toMatchSnapshot();
        getMutationTypeSpy.and.callThrough();
    });
    it("getGraphQLSchema", () => {
        const getQueryTypeSpy = spyOn(schema, "getQueryType").and.returnValue(obj1);
        const getMutationTypeSpy = spyOn(schema, "getMutationType").and.returnValue(obj2);
        expect(test_util_1.printGraphQLSchema(schema.getGraphQLSchema())).toMatchSnapshot();
        getQueryTypeSpy.and.callThrough();
        getMutationTypeSpy.and.callThrough();
    });
});
//# sourceMappingURL=Schema-spec.js.map