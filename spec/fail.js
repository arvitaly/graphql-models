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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fail;
;
