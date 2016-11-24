"use strict";
const graphql_1 = require("graphql");
const ResolveTypes_1 = require("./ResolveTypes");
class Schema {
    constructor(collection, resolveFn) {
        this.collection = collection;
        this.resolveFn = resolveFn;
    }
    getQueries() {
        let queries = [];
        this.collection.map((model) => {
            queries = queries.concat(model.getQueries(this.resolveFn));
        });
        return queries;
    }
    getMutations() {
        // TDO
    }
    getSubscriptions() {
        // TODO
    }
    getQueryViewerType() {
        const queryViewer = new graphql_1.GraphQLObjectType({
            name: "QueryViewer",
            fields: this.queriesToMap(),
        });
        return queryViewer;
    }
    getQueryType() {
        return new graphql_1.GraphQLObjectType({
            name: "Query",
            fields: {
                viewer: {
                    type: this.getQueryViewerType(),
                    resolve: (source, args, context, info) => {
                        return this.resolveFn({
                            type: ResolveTypes_1.default.Viewer,
                            source,
                            args,
                            context,
                            info,
                        });
                    },
                },
            },
        });
    }
    getGraphQLSchema() {
        return new graphql_1.GraphQLSchema({
            query: this.getQueryType(),
        });
    }
    queriesToMap() {
        let out = {};
        this.getQueries().map((q) => {
            out[q.name] = q.field;
        });
        return out;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Schema;
