import Tester from "./../utils";
it("query one: animal", async () => {
    const tester = new Tester();
    const animal = tester.generateModel("animal");
    tester.adapter.findOne.mockReturnValueOnce(animal);
    const globalId = tester.toGlobalId("Animal", animal.id);
    const result = await tester.query(`query Q1{
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
});
it("query one: post", async () => {
    const tester = new Tester();
    const animal = tester.generateModel("animal");
    const animal2 = tester.generateModel("animal");
    const user = tester.generateModel("user", { pets: [animal2] });
    const post = tester.generateModel("post", {
        animals: [animal],
        owner: user,
    });
    tester.adapter.findOne.mockImplementation((modelId: string) => {
        switch (modelId) {
            case "post":
                return post;
            case "animal":
                return animal;
        }
    });
    const result = await tester.query(`query Q1{
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
});
