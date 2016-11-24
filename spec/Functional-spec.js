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
});
// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
