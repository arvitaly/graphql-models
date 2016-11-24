"use strict";
const graphql_1 = require("graphql");
const Schema_1 = require("./../Schema");
const fail_1 = require("./fail");
const collection1_1 = require("./fixtures/collection1");
describe("Schema spec", () => {
    const resolveFn = jasmine.createSpy("");
    const schema = new Schema_1.default(collection1_1.default, resolveFn);
    it("getSchema", () => {
        const getQueriesSpy = spyOn(schema, "getQueries").and.returnValue([{
                name: "q1",
                field: {
                    args: {},
                    type: graphql_1.GraphQLString,
                }
            }]);
        const graphQLSchema = schema.getGraphQLSchema();
        const fields = {};
        const expectedGraphQLSchema = new graphql_1.GraphQLSchema({
            query: new graphql_1.GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: {
                        type: new graphql_1.GraphQLObjectType({
                            name: "QueryViewer",
                            fields: Schema_1.queriesToMap(schema.getQueries())
                        }),
                    },
                },
            }),
        });
        expect(graphQLSchema.getQueryType()).toEqual(expectedGraphQLSchema.getQueryType(), fail_1.default(graphQLSchema.getQueryType(), expectedGraphQLSchema.getQueryType()));
        expect(graphQLSchema).toEqual(expectedGraphQLSchema);
    });
});
