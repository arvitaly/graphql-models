import { GraphQLObjectType, GraphQLString } from "graphql";
import AttributeTypes from "./../AttributeTypes";
import Collection from "./../Collection";
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
    it("circular dependencies", () => {
        const collection = new Collection([{
            attributes: [{
                name: "field1",
                required: false,
                realName: "field1",
                type: AttributeTypes.Model,
                model: "model2",
            }],
            id: "model1",
            name: "Model1",
        }, {
            attributes: [{
                name: "field2",
                required: false,
                realName: "field2",
                type: AttributeTypes.Model,
                model: "model1",
            }],
            id: "model2",
            name: "Model2",
        }]);
        schema.setCollection(collection);
        expect(schema.getGraphQLSchema()).toMatchSnapshot();
    });
});
