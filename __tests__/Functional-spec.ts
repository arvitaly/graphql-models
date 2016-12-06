// tslint:disable:no-string-literal arrow-parens
import { graphql, GraphQLSchema } from "graphql";
import { toGlobalId } from "graphql-relay";
import { AttributeTypes, Collection, ResolveOpts, Resolver, ResolveTypes, Schema } from "./..";
import { animalModel, postModel, userModel } from "./../__fixtures__/collection1";
import { DataAdapter } from "./../__fixtures__/data";
const adapter = new DataAdapter();
const resolver = new Resolver(adapter);
const schema = new Schema(resolver);
const collection = new Collection([animalModel, postModel, userModel], {
    interfaces: [schema.getNodeDefinition().nodeInterface],
    resolveFn: resolver.resolve.bind(resolver),
});
schema.setCollection(collection);
resolver.setCollection(collection);
const graphqlSchema = schema.getGraphQLSchema();
const animalId1 = toGlobalId("Animal", "1");
fdescribe("Functional tests", () => {
    it("node", async () => {
        const result = await graphql(graphqlSchema, `query Q1{  
            node(id:"${animalId1}"){
                ... on Animal{
                    name
                }
            }
        }`);
        if (result.errors) {
            result.errors.map((e) => {
                console.error(e);
                console.error(e.stack);
            });
        }
        expect(result).toMatchSnapshot();
    });
    it("query one", async () => {
        const result = await graphql(graphqlSchema, `query Q1{  
            viewer{
                animal(id:"${animalId1}"){
                    name
                }
            }
        }`);
        if (result.errors) {
            result.errors.map((e) => {
                console.error(e);
                console.error(e.stack);
            });
        }
        expect(result).toMatchSnapshot();
    });
    it("query connection", async () => {
        const result = await graphql(graphqlSchema, `query Q1{
            viewer{            
                animals(where:{nameContains:"x"}){
                    edges{
                        node{
                            ... on Animal{
                                name
                            }
                        }
                    }
                }
            }
        }`);
        expect(result).toMatchSnapshot();
    });
});

// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
