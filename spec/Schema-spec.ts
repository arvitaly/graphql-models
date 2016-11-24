import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import Schema, { queriesToMap } from "./../Schema";
import fail from "./fail";
import collection1 from "./fixtures/collection1";

describe("Schema spec", () => {
    const resolveFn = jasmine.createSpy("");
    const schema = new Schema(collection1, resolveFn);
    it("getSchema", () => {
        const getQueriesSpy = spyOn(schema, "getQueries").and.returnValue([{
            name: "q1",
            field: {
                args: {},
                type: GraphQLString,
            }
        }]);
        const graphQLSchema = schema.getGraphQLSchema();
        const fields = {};
        const expectedGraphQLSchema = new GraphQLSchema({
            query: new GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: {
                        type: new GraphQLObjectType({
                            name: "QueryViewer",
                            fields: queriesToMap(schema.getQueries())
                        }),
                    },
                },
            }),
        });
        expect(graphQLSchema.getQueryType()).toEqual(expectedGraphQLSchema.getQueryType(),
            fail(graphQLSchema.getQueryType(), expectedGraphQLSchema.getQueryType()));
        expect(graphQLSchema).toEqual(expectedGraphQLSchema);
    });
});
