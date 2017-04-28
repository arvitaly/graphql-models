"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const AttributeTypes_1 = require("./../AttributeTypes");
const Collection_1 = require("./../Collection");
const Schema_1 = require("./../Schema");
const test_util_1 = require("./../test-util");
const fields1 = { f1: { type: graphql_1.GraphQLString } };
const obj1 = new graphql_1.GraphQLObjectType({ name: "obj1", fields: fields1 });
const fields2 = { f2: { type: graphql_1.GraphQLString } };
const obj2 = new graphql_1.GraphQLObjectType({ name: "obj2", fields: fields2 });
describe("Schema spec", () => {
    const resolver = { resolve: jasmine.createSpy("") };
    const schema = new Schema_1.default(resolver);
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
    it("circular dependencies", () => {
        const collection = new Collection_1.default([{
                attributes: [{
                        name: "field1",
                        required: false,
                        realName: "field1",
                        type: AttributeTypes_1.default.Model,
                        model: "model2",
                    }],
                id: "model1",
                name: "Model1",
            }, {
                attributes: [{
                        name: "field2",
                        required: false,
                        realName: "field2",
                        type: AttributeTypes_1.default.Model,
                        model: "model1",
                    }],
                id: "model2",
                name: "Model2",
            }]);
        schema.setCollection(collection);
        expect(schema.getGraphQLSchema()).toMatchSnapshot();
    });
});
