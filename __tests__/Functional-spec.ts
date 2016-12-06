// tslint:disable:no-string-literal arrow-parens
import { graphql, GraphQLSchema } from "graphql";
import { toGlobalId } from "graphql-relay";
import { AttributeTypes, Collection, ResolveOpts, Resolver, ResolveTypes, Schema } from "./..";
import { animalModel, postModel, userModel } from "./../__fixtures__/collection1";
import { callbacks, createAnimal, DataAdapter, publisher } from "./../__fixtures__/data";
const animalId1 = toGlobalId("Animal", "1");
fdescribe("Functional tests", () => {
    let adapter: DataAdapter;
    let resolver: Resolver;
    let schema: Schema;
    let collection: Collection;
    let graphqlSchema: GraphQLSchema;
    beforeEach(() => {
        adapter = new DataAdapter();
        resolver = new Resolver(adapter, callbacks, publisher);
        schema = new Schema(resolver);
        collection = new Collection([animalModel, postModel, userModel], {
            interfaces: [schema.getNodeDefinition().nodeInterface],
            resolveFn: resolver.resolve.bind(resolver),
        });
        schema.setCollection(collection);
        resolver.setCollection(collection);
        graphqlSchema = schema.getGraphQLSchema();
    });
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
                    id
                    name
                    age
                    birthday
                    Weight
                    isCat
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
    it("subscribe one", async () => {
        const subscriptionId = "123";
        const result = await graphql(graphqlSchema, `query Q1{  
            viewer{
                animal(id:"${animalId1}"){
                    name
                }
            }
        }`, {}, {
                subscriptionId,
            });
        if (result.errors) {
            result.errors.map((e) => {
                console.error(e);
                console.error(e.stack);
            });
        }
        expect(result).toMatchSnapshot();
        const publishUpdateSpy = spyOn(publisher, "publishUpdate");
        adapter.update("animal", 1, { name: "testn" });
        expect(publishUpdateSpy.calls.allArgs()).toMatchSnapshot();
    });
    it("subscribe connection", async () => {
        const subscriptionId = "123";
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
        }`, {}, {
                subscriptionId,
            });
        if (result.errors) {
            result.errors.map((e) => {
                console.error(e);
                console.error(e.stack);
            });
        }
        expect(result).toMatchSnapshot();
        const publishUpdateSpy = spyOn(publisher, "publishUpdate");
        adapter.update("animal", 1, { name: "testn" });
        expect(publishUpdateSpy.calls.allArgs()).toMatchSnapshot();
        const publishAddSpy = spyOn(publisher, "publishAdd");
        adapter.create("animal", { name: "y" });
        expect(publishAddSpy.calls.allArgs()).toMatchSnapshot();
        adapter.create("animal", { name: "axz" });
        expect(publishAddSpy.calls.allArgs()).toMatchSnapshot();
    });
});
