"use strict";
function fail(obj1, obj2) {
    return `GraphQL objects not equal: 
        Object1:
            name: ${obj1.name},
            fields: ${JSON.stringify(obj1.getFields())}
        Object2:
            name: ${obj2.name},
            fields: ${JSON.stringify(obj2.getFields())}
    `;
}
exports.fail = fail;
;
// tslint:disable:no-string-literal
function compareMutations(mutation1, mutation2) {
    // Check name
    expect(mutation1.type["name"]).toBe(mutation2.type["name"]);
    // Check output payload fields
    expect(mutation1.type["_typeConfig"].fields())
        .toEqual(mutation2.type["_typeConfig"].fields());
    // Check input fields        
    expect(mutation1.args["input"].type["ofType"]._typeConfig.fields()).
        toEqual(mutation2.args["input"].type["ofType"]._typeConfig.fields());
}
exports.compareMutations = compareMutations;
