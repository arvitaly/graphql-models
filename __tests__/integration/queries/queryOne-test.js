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
it("query one: animal", () => __awaiter(this, void 0, void 0, function* () {
    const tester = new utils_1.default();
    const animal = tester.generateModel("animal");
    tester.adapter.findOne.mockReturnValueOnce(animal);
    const globalId = tester.toGlobalId("Animal", animal.id);
    const result = yield tester.query(`query Q1{
            viewer{
                animal(id:"${globalId}"){
                    id
                    name
                    age
                    birthday
                    some
                    Weight
                    isCat
                }
            }
        }`);
    expect(result).toMatchSnapshot();
}));
it("query one: post", () => __awaiter(this, void 0, void 0, function* () {
    const tester = new utils_1.default();
    const animal = tester.generateModel("animal");
    const animal2 = tester.generateModel("animal");
    const user = tester.generateModel("user", { pets: [animal2] });
    const post = tester.generateModel("post", {
        animals: [animal],
        owner: user,
    });
    tester.adapter.findOne.mockImplementation((modelId) => {
        switch (modelId) {
            case "post":
                return post;
            case "animal":
                return animal;
        }
    });
    const result = yield tester.query(`query Q1{
            viewer{
                post(id: "${tester.toGlobalId("Post", post.id)}"){
                    owner{
                        name
                        pets{
                            edges{
                                node{
                                    ...F1
                                }
                            }
                        }
                    }
                    animals{
                        edges{
                            node{
                                ...F1
                            }
                        }
                    }
                }
            }
        }
        fragment F1 on Animal{
            id
            name
            age
            birthday
            some
            Weight
            isCat
        }`);
    expect(result).toMatchSnapshot();
}));
