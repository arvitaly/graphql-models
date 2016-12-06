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
const collection = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel]);
const animalId1 = graphql_relay_1.toGlobalId("Animal", "1");
fdescribe("Functional tests", () => {
    let schema;
    beforeEach(() => {
        const adapter = new data_1.DataAdapter();
        const resolver = new __1.Resolver(collection, adapter);
        collection.map((model) => {
            model.setResolveFn(resolver.resolve.bind(resolver));
        });
        schema = (new __1.Schema(collection, resolver)).getGraphQLSchema();
    });
    it("query one", () => __awaiter(this, void 0, void 0, function* () {
        const result = yield graphql_1.graphql(schema, `query Q1{
            viewer{
                animal(id:"${animalId1}"){
                    name
                }
            }
        }`);
        console.log(`query Q1{
            viewer{
                animal(id: "${animalId1}" ){
                    name
                }
            }
        }`);
        console.log(JSON.stringify(result.errors));
        expect(result).toMatchSnapshot();
    }));
});
// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
//# sourceMappingURL=Functional-spec.js.map