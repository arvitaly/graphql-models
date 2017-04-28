"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./../utils");
it("query connection: animal", () => __awaiter(this, void 0, void 0, function* () {
    const tester = new utils_1.default();
    const animal = tester.generateModel("animal", { name: "withx" });
    const animal2 = tester.generateModel("animal", { name: "withx2" });
    tester.adapter.findMany.mockReturnValueOnce([animal, animal2]);
    const result = yield tester.query(`query Q1{
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
