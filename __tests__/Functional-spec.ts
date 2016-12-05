// tslint:disable:no-string-literal arrow-parens
import { graphql } from "graphql";
import { AttributeTypes, Collection, ResolveOpts, ResolveTypes, Schema } from "./..";
import { animalModel, postModel, userModel } from "./../__fixtures__/collection1";
const rex = { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: (new Date()).toString(), isCat: false };
describe("Functional tests", () => {
    it("simple query", async () => {
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
    });
    it("connection of users", async () => {
        const models = new Collection([userModel, animalModel]);
        const users = [
            { key: 1, name: "John", pets: { edges: [{ node: { name: "x1" } }] } },
            { key: 2, name: "Jordan", pets: { edges: [{ node: { name: "x2" } }] } },
            { key: 3, name: "Nike", pets: { edges: [{ node: { name: "x3" } }] } }];
        const resolveFn = (opts: ResolveOpts): any => {
            if (opts.type === ResolveTypes.Viewer) {
                return {};
            }
            if (opts.type === ResolveTypes.Connection && opts.model === "animal" && opts.parentModel === "user") {
                return users.find((u) => u.key === opts.source.key).pets;
            }
            if (opts.type === ResolveTypes.QueryConnection && opts.model === "user") {
                return {
                    edges: users.filter((u) => {
                        return u.name.indexOf(opts.args["where"]["nameContains"]) > -1;
                    }).map((u) => {
                        return {
                            node: u,
                        };
                    }),
                };
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
            return;
        }
        expect(j(result.data)).toEqual({
            viewer: {
                users: {
                    edges: users.filter((_, i) => i < 2).map((u) => { return { node: u }; }),
                },
            },
        });
    });
    it("create animal", async () => {
        const models = new Collection([animalModel]);
        const dog = {
            name: "Tor",
        };
        const resolveFn = jest.fn(() => {
            return {
                animal: dog,
            };
        });
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
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
    });
    it("create post", async () => {
        const models = new Collection([animalModel, postModel, userModel]);
        const resolveFn = jest.fn((opts: ResolveOpts): any => {
            if (opts.type === ResolveTypes.MutationCreate && opts.model === "post") {
                return { post: {} };
            }
            if (opts.type === ResolveTypes.Model &&
                opts.model === "user" && opts.parentModel === "post") {
                return { name: opts.args["createOwner"].name };
            }
            if (opts.type === ResolveTypes.Connection &&
                opts.model === "animal" && opts.parentModel === "post") {
                return {
                    edges: [{
                        node: {
                            name: animal1.name,
                        },
                    }],
                };
            }
        });
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const animal1 = { name: "Zeus" };
        const user1 = { name: "John" };
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
    });
    it("update post", async () => {
        const models = new Collection([animalModel, postModel, userModel]);
        const data = { post: null };
        const resolveFn = jest.fn((opts: ResolveOpts) => {
            return Object.assign({}, data);
        });
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
            return;
        }
        expect(resolveFn.mock.calls.length).toBe(1);
        expect(j(resolveFn.mock.calls[0][0])).toEqual({
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
    });
});

// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
