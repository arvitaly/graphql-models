import CreateDuplicateError from "./../../../CreateDuplicateError";
import Tester from "./../utils";
const date1 = "Wed, 07 Dec 2016 10:42:48 GMT";
it("mutationUpdate: animal", async () => {
    const tester = new Tester();
    const animal = tester.generateModel("animal");
    tester.adapter.findOne.mockReturnValueOnce(animal);
    tester.adapter.updateOne.mockReturnValue(animal);
    const result = await tester.query(`mutation M1{
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
});
it("mutationUpdate with createOrUpdateSubModel", async () => {
    const tester = new Tester();
    const animal1 = tester.generateModel("animal")
    const user = tester.generateModel("user");
    const post = tester.generateModel("post");
    tester.adapter.findOne.mockImplementation((modelId: string) => {
        switch (modelId) {
            case "post":
                return Object.assign({}, post, {
                    owner: Object.assign({}, user, {
                        pets: [animal1],
                    }),
                });
        }
    });
    tester.adapter.createOne.mockImplementation((modelId: string) => {
        switch (modelId) {
            case "animal":
                throw new CreateDuplicateError("");
            case "user":
                throw new CreateDuplicateError("");
            case "post":
                break;
        }
    });
    tester.adapter.updateOne.mockImplementation((modelId: string) => {
        switch (modelId) {
            case "animal":
                return animal1;
            case "user":
                return user;
            case "post":
                return post;
        }
    });
    tester.adapter.findOrCreateOne.mockImplementation((modelId: string) => {
        switch (modelId) {
            case "animal":
                return animal1;
            case "user":
                return user;
        }
    });
    const result = await tester.query(`mutation M1{
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
});

