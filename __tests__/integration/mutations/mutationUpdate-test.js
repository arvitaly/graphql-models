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
const date1 = "Wed, 07 Dec 2016 10:42:48 GMT";
it("mutationUpdate: animal", () => __awaiter(this, void 0, void 0, function* () {
    const tester = new utils_1.default();
    const animal = tester.generateModel("animal");
    tester.adapter.findOne.mockReturnValueOnce(animal);
    tester.adapter.updateOne.mockReturnValue(animal);
    const result = yield tester.query(`mutation M1{
                updateAnimal(input:{
                    id: "${tester.toGlobalId("Animal", animal.id)}",
                    setName:{name:"testName1"}
                    setBirthday:{birthday: "${date1}"}
                    setSome:{ some: "{\\"What\\":\\"Yepp\\"}" }
                }
            ){
                animal{
                    name
                    some
                    birthday
                }
            }
        }`);
    expect(tester.adapter.updateOne.mock.calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
}));
it("mutationUpdate with createOrUpdateSubModel", () => __awaiter(this, void 0, void 0, function* () {
    const tester = new utils_1.default();
    const animal1 = tester.generateModel("animal");
    const user = tester.generateModel("user");
    const post = tester.generateModel("post");
    tester.adapter.findOne.mockImplementation((modelId) => {
        switch (modelId) {
            case "post":
                return Object.assign({}, post, {
                    owner: Object.assign({}, user, {
                        pets: [animal1],
                    }),
                });
        }
    });
    tester.adapter.createOne.mockImplementation((modelId) => {
        switch (modelId) {
            case "animal":
                throw new CreateDuplicateError_1.default("");
            case "user":
                throw new CreateDuplicateError_1.default("");
            case "post":
                break;
        }
    });
    tester.adapter.updateOne.mockImplementation((modelId) => {
        switch (modelId) {
            case "animal":
                return animal1;
            case "user":
                return user;
            case "post":
                return post;
        }
    });
    tester.adapter.findOrCreateOne.mockImplementation((modelId) => {
        switch (modelId) {
            case "animal":
                return animal1;
            case "user":
                return user;
        }
    });
    const result = yield tester.query(`mutation M1{
        updatePost(input:{
            id: "1",
            createOrUpdateOwner:{
                create:{
                    name: "OwnerName1"
                    createOrUpdatePets:[{
                        create:{
                            name: "animalNew1"
                        },
                        update: {
                            setName: {name: "updateNameAnimal1"}
                        }
                    }]
                }
                update:{
                    setName:{name: "NewNameOwner"}
                }
            }
        }){
            post{
                owner{
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
    }`);
    expect(tester.adapter.createOne.mock.calls).toMatchSnapshot();
    expect(tester.adapter.findOrCreateOne.mock.calls).toMatchSnapshot();
    expect(tester.adapter.updateOne.mock.calls).toMatchSnapshot();
    expect(tester.adapter.findOne.mock.calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
}));
