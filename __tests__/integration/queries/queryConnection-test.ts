import Tester from "./../utils";
it("query connection: animal", async () => {
    const tester = new Tester();
    const animal = tester.generateModel("animal", { name: "withx" });
    const animal2 = tester.generateModel("animal", { name: "withx2" });
    tester.adapter.findMany.mockReturnValueOnce([animal, animal2]);
    const result = await tester.query(`query Q1{
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
});
