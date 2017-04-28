import CreateDuplicateError from "./../../../CreateDuplicateError";
import Tester from "./../utils";
it("mutationCreateOrUpdate: animal", async () => {
    const tester = new Tester();
    const animal = tester.generateModel("animal");
    tester.adapter.createOne.mockImplementation(() => {
        throw new CreateDuplicateError("");
    });
    tester.adapter.findOrCreateOne.mockReturnValue(animal);
    tester.adapter.findOne.mockReturnValueOnce(animal);
    tester.adapter.updateOne.mockReturnValue(animal);
    const result = await tester.query(`mutation M1{
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
});
