"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function identity(value) {
    return value;
}
function parseLiteral(ast) {
    switch (ast.kind) {
        case language_1.Kind.STRING:
        case language_1.Kind.BOOLEAN:
            return ast.value;
        case language_1.Kind.INT:
        case language_1.Kind.FLOAT:
            return parseFloat(ast.value);
        case language_1.Kind.OBJECT: {
            const value = Object.create(null);
            ast.fields.forEach((field) => {
                value[field.name.value] = parseLiteral(field.value);
            });
            return value;
        }
        case language_1.Kind.LIST:
            return ast.values.map(parseLiteral);
        default:
            return null;
    }
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "JSON",
    description: "The `JSON` scalar type represents JSON values as specified by " +
        "[ECMA-404](http://www.ecma-international.org/" +
        "publications/files/ECMA-ST/ECMA-404.pdf).",
    serialize: identity,
    parseValue: identity,
    parseLiteral,
});
//# sourceMappingURL=JSON.js.map