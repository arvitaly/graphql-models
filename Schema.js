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
    }
    getSubscriptions() {
    }
    getGraphQLSchema() {
        const queryViewer = new graphql_1.GraphQLObjectType({
            name: "QueryViewer",
            fields: queriesToMap(this.getQueries()),
        });
        return new graphql_1.GraphQLSchema({
            query: new graphql_1.GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: {
                        type: queryViewer, resolve: (source, args, context, info) => {
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
            }),
        });
    }
}
function queriesToMap(queries) {
    let out = {};
    queries.map((q) => {
        out[q.name] = q.field;
    });
    return out;
}
exports.queriesToMap = queriesToMap;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Schema;
