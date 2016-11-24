import { graphql } from "graphql";
import { AttributeTypes, Collection, ResolveTypes, Schema } from "./..";
import { animalModel } from "./../spec/fixtures/collection1";

const models = new Collection([animalModel]);

const resolveFn = (opts): any => {
    if (opts.type === ResolveTypes.Viewer) {
        return {};
    }
    if (opts.type === ResolveTypes.QueryOne && opts.model === "animal") {
        return { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: new Date(), isCat: false };
    }
};
const schema = new Schema(models, resolveFn);
const graphQLSchema = schema.getGraphQLSchema();

graphql(graphQLSchema, `query Q1{
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
}`).then((response) => {
        console.log(response.data);
        /*{ viewer:
            { animal:
                { id: 15,
                    name: 'Rex',
                    age: 2,
                    Weight: 6.5,
                    birthday: 'Fri Nov 25 2016 06:04:16 GMT+0700 (ICT)',
                    isCat: false } } }*/
    });
