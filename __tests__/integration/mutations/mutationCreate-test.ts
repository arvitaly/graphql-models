import CreateDuplicateError from "./../../../CreateDuplicateError";
import Tester from "./../utils";
const date1 = "Wed, 07 Dec 2016 10:42:48 GMT";
it("mutation create", async () => {
    const tester = new Tester();
    const animals = [tester.generateModel("animal"), tester.generateModel("animal"), tester.generateModel("animal")];
    const post = tester.generateModel("post");
    const user = tester.generateModel("user");
    let current = 0;
    tester.adapter.findOne.mockImplementation((modelId: string, id: string) => {
        switch (modelId) {
            case "animal":
                return animals.find((r) => r.id === id);
            case "post":
                return Object.assign({}, post, {
                    animals: [animals[0], animals[1]], owner:
                    Object.assign({}, user, { pets: [animals[2]] }),
                });
        }
    });
    tester.adapter.createOne.mockImplementation((modelId: string) => {
        switch (modelId) {
            case "animal":
                return animals[current++];
            case "user":
                return user;
            case "post":
                return post;
        }
    });
    const result = await tester.query(`mutation M1{
            createPost(input:{createAnimals:[
                    {name:"animal1", birthday:"${date1}"},
                    {name:"animal2"}],
                    createOwner:{name:"user5",
                        createPets:[{name:"pet1"}]
                    }
                } ){
                post{
                    owner{
                        name
                        pets{
                            ...FE
                        }
                    }
                    animals{
                        ...FE
                    }
                }
            }
        }
        fragment FE on AnimalConnection{
            edges{
                node{
                    ...F1
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
        }
        `);
    expect(result).toMatchSnapshot();
});
it("mutationCreate with createOrUpdateSubModel", async () => {
    const tester = new Tester();
    const animal1 = tester.generateModel("animal");
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
                return post;
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
        createPost(input:{
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
