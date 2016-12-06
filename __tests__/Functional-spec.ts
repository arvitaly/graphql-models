// tslint:disable:no-string-literal arrow-parens
import { graphql, GraphQLSchema } from "graphql";
import { toGlobalId } from "graphql-relay";
import { AttributeTypes, Collection, ResolveOpts, Resolver, ResolveTypes, Schema } from "./..";
import { animalModel, postModel, userModel } from "./../__fixtures__/collection1";
import { DataAdapter } from "./../__fixtures__/data";
const collection = new Collection([animalModel, postModel, userModel]);
const animalId1 = toGlobalId("Animal", "1");
fdescribe("Functional tests", () => {
    let schema: GraphQLSchema;
    beforeEach(() => {
        const adapter = new DataAdapter();
        const resolver = new Resolver(collection, adapter);
        collection.map((model) => {
            model.setResolveFn(resolver.resolve.bind(resolver));
        });
        schema = (new Schema(collection, resolver)).getGraphQLSchema();
    });
    it("query one", async () => {
        const result = await graphql(schema, `query Q1{
            viewer{
                animal(id:"${animalId1}"){
                    name
                }
            }
        }`);
        console.log( `query Q1{
            viewer{
                animal(id: "${animalId1}" ){
                    name
                }
            }
        }`);
        console.log(JSON.stringify(result.errors));
        expect(result).toMatchSnapshot();
    });
});

// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
