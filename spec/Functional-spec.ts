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
    // tslint:disable:no-string-literal
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
});

// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
