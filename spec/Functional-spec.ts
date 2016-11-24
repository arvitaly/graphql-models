import { graphql } from "graphql";
import { AttributeTypes, Collection, ResolveTypes, Schema } from "./..";
import { animalModel } from "./fixtures/collection1";
const rex = { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: (new Date()).toString(), isCat: false };
describe("Functional tests", () => {
    it("simple query", async (done) => {
        const models = new Collection([animalModel]);
        const resolveFn = (opts): any => {
            if (opts.type === ResolveTypes.Viewer) {
                return {};
            }
            if (opts.type === ResolveTypes.QueryOne && opts.model === "animal") {
                return rex;
            }
        };
        const schema = new Schema(models, resolveFn);
        const graphQLSchema = schema.getGraphQLSchema();

        const result = await graphql(graphQLSchema, `query Q1{
            viewer{
                animal(id:15){
                    id
                    name
                    age
                    Weight
                    birthday
                    isCat
                }
            }
        }`);
        expect(j(result.data)).toEqual({ viewer: { animal: rex } });
        done();
    });
});

// Convert GraphQL data to plain object
function j(v) {
    return JSON.parse(JSON.stringify(v));
}
