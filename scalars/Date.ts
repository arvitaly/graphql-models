import { GraphQLScalarType } from "graphql";
import { GraphQLError } from "graphql/error";
import { Kind } from "graphql/language";

function coerceDate(value) {
    if (!(value instanceof Date)) {
        // Is this how you raise a 'field error'?
        throw new Error("Field error: value is not an instance of Date");
    }
    if (isNaN(value.getTime())) {
        throw new Error("Field error: value is an invalid Date");
    }
    return value.toUTCString();
}

export default new GraphQLScalarType({
    name: "Date",
    description: "Date",
    serialize: coerceDate,
    parseValue: coerceDate,
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError("Query error: Can only parse strings to dates but got a: " + ast.kind, [ast]);
        }
        const result = new Date(ast.value);
        if (isNaN(result.getTime())) {
            throw new GraphQLError("Query error: Invalid date " + ast.value, [ast]);
        }
        if (ast.value !== result.toJSON() && ast.value !== result.toUTCString()) {
            throw new GraphQLError("Query error: Invalid date format " +
                ast.value
                + " , only accepts: YYYY-MM-DDTHH:MM:SS.SSSZ or UTC", [ast]);
        }
        return result;
    },
});
