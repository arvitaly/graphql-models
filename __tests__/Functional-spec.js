"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// tslint:disable:no-string-literal arrow-parens
const graphql_1 = require("graphql");
const __1 = require("./..");
const collection1_1 = require("./../__fixtures__/collection1");
const rex = { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: (new Date()).toString(), isCat: false };
describe("Functional tests", () => {
    it("simple query", () => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.animalModel]);
        const resolveFn = (opts) => {
            if (opts.type === __1.ResolveTypes.Viewer) {
                return {};
            }
            if (opts.type === __1.ResolveTypes.QueryOne && opts.model === "animal") {
                return rex;
            }
        };
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const result = yield graphql_1.graphql(graphQLSchema, `query Q1{
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
    }));
    it("connection of users", () => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.userModel, collection1_1.animalModel]);
        const users = [
            { key: 1, name: "John", pets: { edges: [{ node: { name: "x1" } }] } },
            { key: 2, name: "Jordan", pets: { edges: [{ node: { name: "x2" } }] } },
            { key: 3, name: "Nike", pets: { edges: [{ node: { name: "x3" } }] } }];
        const resolveFn = (opts) => {
            if (opts.type === __1.ResolveTypes.Viewer) {
                return {};
            }
            if (opts.type === __1.ResolveTypes.Connection && opts.model === "animal" && opts.parentModel === "user") {
                return users.find((u) => u.key === opts.source.key).pets;
            }
            if (opts.type === __1.ResolveTypes.QueryConnection && opts.model === "user") {
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
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const result = yield graphql_1.graphql(graphQLSchema, `query Q1{
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
    }));
    it("create animal", () => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.animalModel]);
        const dog = {
            name: "Tor",
        };
        const resolveFn = jest.fn(() => {
            return {
                animal: dog,
            };
        });
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const result = yield graphql_1.graphql(graphQLSchema, `
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
    }));
    it("create post", () => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel]);
        const resolveFn = jest.fn((opts) => {
            if (opts.type === __1.ResolveTypes.MutationCreate && opts.model === "post") {
                return { post: {} };
            }
            if (opts.type === __1.ResolveTypes.Model &&
                opts.model === "user" && opts.parentModel === "post") {
                return { name: opts.args["createOwner"].name };
            }
            if (opts.type === __1.ResolveTypes.Connection &&
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
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const animal1 = { name: "Zeus" };
        const user1 = { name: "John" };
        const result = yield graphql_1.graphql(graphQLSchema, `
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
    }));
    it("update post", () => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel]);
        const data = { post: null };
        const resolveFn = jest.fn((opts) => {
            return Object.assign({}, data);
        });
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const result = yield graphql_1.graphql(graphQLSchema, `mutation M1{
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
            type: __1.ResolveTypes.MutationUpdate,
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
    }));
});
// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
