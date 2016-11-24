"use strict";
const graphql_1 = require("graphql");
const Schema_1 = require("./../Schema");
const fail_1 = require("./fail");
const collection1_1 = require("./fixtures/collection1");
const fields1 = { f1: { type: graphql_1.GraphQLString } };
const obj1 = new graphql_1.GraphQLObjectType({ name: "obj1", fields: fields1 });
describe("Schema spec", () => {
    const resolveFn = jasmine.createSpy("");
    const schema = new Schema_1.default(collection1_1.default, resolveFn);
    it("getQueryViewerType", () => {
        const getQueriesSpy = spyOn(schema, "queriesToMap").and.returnValue(fields1);
        const queryViewerType = schema.getQueryViewerType();
        const expectedQueryViewerType = new graphql_1.GraphQLObjectType({
            name: "QueryViewer",
            fields: fields1,
        });
        expect(queryViewerType).toEqual(expectedQueryViewerType, fail_1.default(queryViewerType, expectedQueryViewerType));
        getQueriesSpy.and.callThrough();
    });
    it("getQueryType", () => {
        const getQueryViewerTypeSpy = spyOn(schema, "getQueryViewerType").and.returnValue(obj1);
        const queryType = schema.getQueryType();
        const expectedQueryType = new graphql_1.GraphQLObjectType({
            name: "Query",
            fields: {
                viewer: {
                    type: obj1,
                    resolve: jasmine.any(Function),
                }
            }
        });
        expect(queryType).toEqual(expectedQueryType, fail_1.default(queryType, expectedQueryType));
    });
    it("getGraphQLSchema", () => {
        const getQueryTypeSpy = spyOn(schema, "getQueryType").and.returnValue(obj1);
        const graphQLSchema = schema.getGraphQLSchema();
        const fields = {};
        const expectedGraphQLSchema = new graphql_1.GraphQLSchema({
            query: schema.getQueryType(),
        });
        expect(graphQLSchema).toEqual(expectedGraphQLSchema);
        getQueryTypeSpy.and.callThrough();
    });
});
