// tslint:disable:no-string-literal arrow-parens
import { graphql, GraphQLSchema } from "graphql";
import { toGlobalId } from "graphql-relay";
import { AttributeTypes, Collection, ResolveOpts, Resolver, ResolveTypes, Schema } from "./..";
import { animalModel, postModel, userModel } from "./../__fixtures__/collection1";
import { callbacks, createAnimal, DataAdapter, publisher } from "./../__fixtures__/data";
const animalId1 = toGlobalId("Animal", "1");
const postId1 = toGlobalId("Post", "1");
const date1 = "Wed, 07 Dec 2016 10:42:48 GMT";
describe("Functional tests", () => {
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
    it("query one: animal", async () => {
        const result = await graphql(graphqlSchema, `query Q1{  
            viewer{
                animal(id:"${animalId1}"){
                    id
                    name
                    age
                    birthday
                    some
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
    it("query one: post", async () => {
        const result = await graphql(graphqlSchema, `query Q1{  
            viewer{
                post(id: "${postId1}"){
                    owner{
                        name
                        pets{
                            edges{
                                node{
                                    ...F1
                                }
                            }
                        }
                    }
                    animals{
                        edges{
                            node{
                                ...F1
                            }
                        }
                    }
                }                
            }
        }
        fragment F1 on Animal{
            id
            name
            age
            birthday
            some
            Weight
            isCat
        }
        `);
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
        resolver.unsubscribe(subscriptionId);
        adapter.update("animal", 1, { name: "testn2" });
        expect(publishUpdateSpy.calls.allArgs()).toMatchSnapshot();
    });
    it("subscribe connection", async (done) => {
        const subscriptionId = "1234";
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
        const publishUpdateSpy = jest.fn(); // spyOn(publisher, "publishUpdate");
        publisher.publishUpdate = publishUpdateSpy;
        adapter.update("animal", 1, { name: "testn" });
        expect(publishUpdateSpy.mock.calls).toMatchSnapshot();
        let publishAddSpy = jest.fn(() => { /* */ }); // spyOn(publisher, "publishAdd");
        publisher.publishAdd = publishAddSpy;
        adapter.create("animal", { name: "y" });
        expect(publishAddSpy.mock.calls).toMatchSnapshot();
        publishAddSpy = jest.fn(() => {
            expect(publishAddSpy.mock.calls).toMatchSnapshot();
            done();
        });
        publisher.publishAdd = publishAddSpy;
        adapter.create("animal", { name: "axz" });
    });
    it("mutation create", async () => {
        const result = await graphql(graphqlSchema, `mutation M1{  
            createPost(input:{createAnimals:[
                    {name:"animal1", birthday:"${date1}"},
                    {name:"animal2"}], 
                    createOwner:{name:"user5", 
                        createPets:[{name:"pet1"}] 
                    } 
                } ){
                post{
                    owner{
                        name
                        pets{
                            ...FE
                        }
                    }
                    animals{
                        ...FE
                    }
                }
            }
        }
        fragment FE on AnimalConnection{
            edges{
                node{
                    ...F1
                }
            }
        }
        fragment F1 on Animal{
            id
            name
            age
            birthday
            some
            Weight
            isCat
        }        
        `);
        if (result.errors) {
            result.errors.map((e) => {
                console.error(e);
                console.error(e.stack);
            });
        }
        expect(result).toMatchSnapshot();
    });
    it("update mutation: animal", async () => {
        const result = await graphql(graphqlSchema, `mutation M1{  
                updateAnimal(input:{
                    id: "${animalId1}", 
                    setName:{name:"testName1"}
                    setBirthday:{birthday: "${date1}"}
                    setSome:{ some: "{\\"What\\":\\"Yepp\\"}" }
                }
            ){
                animal{
                    name
                    some
                    birthday
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
});
