import Tester from "./../utils";
it("query node", async () => {
    const tester = new Tester();
    const animal = tester.generateModel("animal");
    tester.adapter.findOne.mockReturnValueOnce(animal);
    const result = await tester.query(`query Q1{
            node(id:"${ tester.toGlobalId("Animal", animal.id)}"){
                ... on Animal{
                    name
                }
            }
        }`);
    expect(result).toMatchSnapshot();
});
