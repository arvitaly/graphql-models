"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const error_1 = require("graphql/error");
const language_1 = require("graphql/language");
function coerceDate(value) {
    if (!(value instanceof Date)) {
        // Is this how you raise a 'field error'?
        // throw new Error("Field error: value is not an instance of Date");
        value = new Date(value);
    }
    if (isNaN(value.getTime())) {
        throw new Error("Field error: value is an invalid Date");
    }
    return value.toUTCString();
}
exports.default = new graphql_1.GraphQLScalarType({
    name: "Date",
    description: "Date",
    serialize: coerceDate,
    parseValue: coerceDate,
    parseLiteral(ast) {
        if (ast.kind !== language_1.Kind.STRING) {
            throw new error_1.GraphQLError("Query error: Can only parse strings to dates but got a: " + ast.kind, [ast]);
        }
        const result = new Date(ast.value);
        if (isNaN(result.getTime())) {
            throw new error_1.GraphQLError("Query error: Invalid date " + ast.value, [ast]);
        }
        if (ast.value !== result.toJSON() && ast.value !== result.toUTCString() && ast.value !== result.toString()) {
            throw new error_1.GraphQLError("Query error: Invalid date format " +
                ast.value
                + " , only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ or UTC or local UTC", [ast]);
        }
        return result;
    },
});
