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
const graphql_relay_1 = require("graphql-relay");
const __1 = require("./..");
const collection1_1 = require("./../__fixtures__/collection1");
const data_1 = require("./../__fixtures__/data");
const adapter = new data_1.DataAdapter();
const resolver = new __1.Resolver(adapter);
const schema = new __1.Schema(resolver);
const collection = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel], {
    interfaces: [schema.getNodeDefinition().nodeInterface],
    resolveFn: resolver.resolve.bind(resolver),
});
schema.setCollection(collection);
resolver.setCollection(collection);
const graphqlSchema = schema.getGraphQLSchema();
const animalId1 = graphql_relay_1.toGlobalId("Animal", "1");
fdescribe("Functional tests", () => {
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
});
// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
//# sourceMappingURL=Functional-spec.js.map