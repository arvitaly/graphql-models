"use strict";
const graphql_1 = require("graphql");
class Schema {
    constructor(collection, resolveFn) {
        this.collection = collection;
        this.resolveFn = resolveFn;
        this.queries = [];
    }
    getQueries() {
        if (!this.queries) {
            this.collection.map((model) => {
                this.queries = this.queries.concat(model.getQueries(this.resolveFn));
            });
            return this.queries;
        }
    }
    getMutations() {
    }
    getSubscriptions() {
    }
    getSchema() {
        let queries;
        this.getQueries().map((q) => {
            queries[q.name] = q.field;
        });
        const queryViewer = new graphql_1.GraphQLObjectType({
            name: "QueryViewer",
            fields: queries,
        });
        return new graphql_1.GraphQLSchema({
            query: new graphql_1.GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: { type: queryViewer },
                },
            }),
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Schema;
