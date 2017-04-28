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
const CreateDuplicateError_1 = require("./../../../CreateDuplicateError");
const utils_1 = require("./../utils");
it("mutationCreateOrUpdate: animal", () => __awaiter(this, void 0, void 0, function* () {
    const tester = new utils_1.default();
    const animal = tester.generateModel("animal");
    tester.adapter.createOne.mockImplementation(() => {
        throw new CreateDuplicateError_1.default("");
    });
    tester.adapter.findOrCreateOne.mockReturnValue(animal);
    tester.adapter.findOne.mockReturnValueOnce(animal);
    tester.adapter.updateOne.mockReturnValue(animal);
    const result = yield tester.query(`mutation M1{
            createOrUpdateAnimal(input:{
                create:{
                    name: "Hi",
                    Weight: 1.5
                }
                update: {
                    setWeight: {Weight: 5.7}
                }
            }){
                animal{
                    id
                    Weight
                }
            }}`);
    expect(tester.adapter.createOne.mock.calls).toMatchSnapshot();
    expect(tester.adapter.updateOne.mock.calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
}));
