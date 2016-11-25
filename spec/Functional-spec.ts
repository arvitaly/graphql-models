// tslint:disable:no-string-literal
import { graphql } from "graphql";
import { AttributeTypes, Collection, ResolveOpts, ResolveTypes, Schema } from "./..";
import { animalModel, postModel, userModel } from "./fixtures/collection1";
const rex = { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: (new Date()).toString(), isCat: false };
describe("Functional tests", () => {
    it("simple query", async (done) => {
        const models = new Collection([animalModel]);
        const resolveFn = (opts): any => {
            if (opts.type === ResolveTypes.Viewer) {
                return {};
            }
            if (opts.type === ResolveTypes.QueryOne && opts.model === "animal") {
                return rex;
            }
        };
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();

        const result = await graphql(graphQLSchema, `query Q1{
            viewer{
                animal(id:15){
                    id
                    name
                    age
                    Weight
                    birthday
                    isCat
                }
            }
        }`);
        expect(j(result.data)).toEqual({ viewer: { animal: rex } });
        done();
    });
    it("connection of users", async (done) => {
        const models = new Collection([userModel, animalModel]);
        const users = [
            { key: 1, name: "John", pets: { edges: [{ node: { name: "x1" } }] } },
            { key: 2, name: "Jordan", pets: { edges: [{ node: { name: "x2" } }] } },
            { id: 3, name: "Nike", pets: { edges: [{ node: { name: "x3" } }] } }];
        const resolveFn = (opts: ResolveOpts): any => {
            if (opts.type === ResolveTypes.Viewer) {
                return {};
            }
            if (opts.type === ResolveTypes.QueryConnection && opts.model === "user") {
                return {
                    edges: users.filter((u) => {
                        return u.name.indexOf(opts.args["where"]["nameContains"]) > -1;
                    }).map((u) => {
                        return {
                            node: u,
                        }
                    }),
                }
            }
        };
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();

        const result = await graphql(graphQLSchema, `query Q1{
            viewer{
                users(where:{nameContains:"Jo"}){
                    edges{
                        node{
                            key
                            name
                            pets{
                                edges{
                                    node{
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`);
        if (result.errors) {
            fail(result.errors);
            done();
            return;
        }
        expect(j(result.data)).toEqual({
            viewer: {
                users: {
                    edges: users.filter((_, i) => i < 2).map((u) => { return { node: u } })
                }
            }
        });
        done();
    });
    it("create animal", async (done) => {
        const models = new Collection([animalModel]);
        const resolveFn = jasmine.createSpy("");
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const dog = {
            name: "Tor",
        };
        resolveFn.and.returnValue({
            animal: dog,
        });
        const result = await graphql(graphQLSchema, `
            mutation M1{
                createAnimal(input:{clientMutationId:"5", name: "Tor"} ){
                    clientMutationId
                    animal {
                        name
                    }
                }
            }
        `);
        expect(j(result.data)).toEqual({ createAnimal: { clientMutationId: "5", animal: dog } });
        done();
    });
    it("create post", async (done) => {
        const models = new Collection([animalModel, postModel, userModel]);
        const resolveFn = jasmine.createSpy("");
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const animal1 = { name: "Zeus" };
        const user1 = { name: "John" };
        resolveFn.and.callFake((opts: ResolveOpts) => {
            return {
                post: {
                    owner: {
                        name: opts.args["createOwner"].name,
                    },
                    animals: {
                        edges: [{
                            node: {
                                name: opts.args["createAnimals"][0].name,
                            },
                        }],
                    },
                },
            };
        });
        const result = await graphql(graphQLSchema, `
            mutation M1{
                createPost(input:{ 
                    createOwner:{name: "${user1.name}" }
                    createAnimals:[{ name: "${animal1.name}" }]
                 } ){
                    clientMutationId
                    post {
                        animals{
                            edges{
                                node{
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `);
        if (result.errors) {
            fail(result.errors);
            done();
            return;
        }
        expect(j(result.data)).toEqual({
            createPost: {
                clientMutationId: null,
                post: {
                    animals: {
                        edges: [{
                            node: {
                                name: animal1.name,
                            },
                        }],
                    },
                },
            },
        });
        done();
    });
    it("update post", async (done) => {
        const models = new Collection([animalModel, postModel, userModel]);
        const data = { post: null };
        const resolveFn = jasmine.createSpy("").and.returnValue(Object.assign({}, data));
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const result = await graphql(graphQLSchema, `mutation M1{
            updatePost(input:{
                    clientMutationId:"6"
                    createAnimals:{ name: "Sta" }
                    createOwner:{name: "John"}
                }){
                post{
                    animals{
                        edges{
                            node{
                                name
                            }
                        }
                    }
                    owner{
                        name
                    }
                }
            }
        }`);
        if (result.errors) {
            fail(result.errors);
            done();
            return;
        }
        expect(resolveFn.calls.count()).toBe(1);
        expect(j(resolveFn.calls.argsFor(0)[0])).toEqual({
            type: ResolveTypes.MutationUpdate,
            model: "post",
            source: null,
            info: null,
            args: {
                createAnimals: [{
                    name: "Sta",
                }],
                createOwner: {
                    name: "John",
                },
                clientMutationId: "6",
            },
        });
        expect(j(result.data)).toEqual({ updatePost: data });
        done();
    })
});

// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
