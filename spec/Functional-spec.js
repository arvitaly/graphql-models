"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const graphql_1 = require("graphql");
const __1 = require("./..");
const collection1_1 = require("./fixtures/collection1");
const rex = { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: (new Date()).toString(), isCat: false };
describe("Functional tests", () => {
    it("simple query", (done) => __awaiter(this, void 0, void 0, function* () {
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
        done();
    }));
    // tslint:disable:no-string-literal
    it("create animal", (done) => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.animalModel]);
        const resolveFn = jasmine.createSpy("");
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const dog = {
            name: "Tor",
        };
        resolveFn.and.returnValue({
            animal: dog,
        });
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
        done();
    }));
    it("create post", (done) => __awaiter(this, void 0, void 0, function* () {
        const models = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel]);
        const resolveFn = jasmine.createSpy("");
        const schema = new __1.Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();
        const animal1 = { name: "Zeus" };
        const user1 = { name: "John" };
        resolveFn.and.callFake((opts) => {
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
    }));
});
// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
