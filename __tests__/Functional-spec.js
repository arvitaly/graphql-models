"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// tslint:disable:no-string-literal arrow-parens
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const __1 = require("./..");
const collection1_1 = require("./../__fixtures__/collection1");
const data_1 = require("./../__fixtures__/data");
const animalId1 = graphql_relay_1.toGlobalId("Animal", "1");
fdescribe("Functional tests", () => {
    let adapter;
    let resolver;
    let schema;
    let collection;
    let graphqlSchema;
    beforeEach(() => {
        adapter = new data_1.DataAdapter();
        resolver = new __1.Resolver(adapter, data_1.callbacks, data_1.publisher);
        schema = new __1.Schema(resolver);
        collection = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel], {
            interfaces: [schema.getNodeDefinition().nodeInterface],
            resolveFn: resolver.resolve.bind(resolver),
        });
        schema.setCollection(collection);
        resolver.setCollection(collection);
        graphqlSchema = schema.getGraphQLSchema();
    });
    it("node", () => __awaiter(this, void 0, void 0, function* () {
        const result = yield graphql_1.graphql(graphqlSchema, `query Q1{  
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
    }));
    it("query one", () => __awaiter(this, void 0, void 0, function* () {
        const result = yield graphql_1.graphql(graphqlSchema, `query Q1{  
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
    }));
    it("query connection", () => __awaiter(this, void 0, void 0, function* () {
        const result = yield graphql_1.graphql(graphqlSchema, `query Q1{
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
    }));
    it("subscribe one", () => __awaiter(this, void 0, void 0, function* () {
        const subscriptionId = "123";
        const result = yield graphql_1.graphql(graphqlSchema, `query Q1{  
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
        const publishUpdateSpy = spyOn(data_1.publisher, "publishUpdate");
        adapter.update("animal", 1, { name: "testn" });
        expect(publishUpdateSpy.calls.allArgs()).toMatchSnapshot();
    }));
    it("subscribe connection", () => __awaiter(this, void 0, void 0, function* () {
        const subscriptionId = "123";
        const result = yield graphql_1.graphql(graphqlSchema, `query Q1{
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
        const publishUpdateSpy = spyOn(data_1.publisher, "publishUpdate");
        adapter.update("animal", 1, { name: "testn" });
        expect(publishUpdateSpy.calls.allArgs()).toMatchSnapshot();
        const publishAddSpy = spyOn(data_1.publisher, "publishAdd");
        adapter.create("animal", { name: "y" });
        expect(publishAddSpy.calls.allArgs()).toMatchSnapshot();
        adapter.create("animal", { name: "axz" });
        expect(publishAddSpy.calls.allArgs()).toMatchSnapshot();
    }));
});
//# sourceMappingURL=Functional-spec.js.map