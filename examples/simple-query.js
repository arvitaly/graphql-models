"use strict";
const graphql_1 = require("graphql");
const __1 = require("./..");
const collection1_1 = require("./../spec/fixtures/collection1");
const models = new __1.Collection([collection1_1.animalModel]);
const resolveFn = (opts) => {
    if (opts.type === __1.ResolveTypes.Viewer) {
        return {};
    }
    if (opts.type === __1.ResolveTypes.QueryOne && opts.model === "animal") {
        return { id: 15, name: "Rex", age: 2, Weight: 6.5, birthday: new Date(), isCat: false };
    }
};
const schema = new __1.Schema(models, resolveFn);
const graphQLSchema = schema.getGraphQLSchema();
graphql_1.graphql(graphQLSchema, `query Q1{
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
