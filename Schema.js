"use strict";
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const ResolveTypes_1 = require("./ResolveTypes");
class Schema {
    constructor(resolver) {
        this.resolver = resolver;
    }
    setCollection(models) {
        this.collection = models;
    }
    getQueries() {
        let queries = [];
        this.collection.map((model) => {
            queries = queries.concat(model.getQueries());
        });
        return queries;
    }
    getMutations() {
        let mutations = [];
        this.collection.map((model) => {
            mutations = mutations.concat(model.getMutations());
        });
        return mutations;
    }
    getSubscriptions() {
        // TODO
    }
    getQueryViewerType() {
        const queryViewer = new graphql_1.GraphQLObjectType({
            name: "Viewer",
            fields: this.queriesToMap(),
        });
        return queryViewer;
    }
    getQueryType() {
        return new graphql_1.GraphQLObjectType({
            name: "Query",
            fields: {
                node: this.getNodeDefinition().nodeField,
                viewer: {
                    type: this.getQueryViewerType(),
                    resolve: (source, args, context, info) => {
                        return this.resolver.resolve(null, ResolveTypes_1.default.Viewer, { source, args, context, info });
                    },
                },
            }
        });
    }
    getMutationType() {
        return new graphql_1.GraphQLObjectType({
            name: "Mutation",
            fields: this.mutationsToMap(),
        });
    }
    getNodeDefinition() {
        if (!this.nodeDefinition) {
            this.nodeDefinition = graphql_relay_1.nodeDefinitions((id, info) => {
                return this.resolver.resolve(null, ResolveTypes_1.default.Node, { source: id, args: null, context: null, info });
            }, (value, context, info) => {
                return this.collection.get(graphql_relay_1.fromGlobalId(value.id).type.replace(/Type$/gi, "").toLowerCase())
                    .getBaseType();
            });
        }
        return this.nodeDefinition;
    }
    getGraphQLSchema() {
        return new graphql_1.GraphQLSchema({
            query: this.getQueryType(),
            mutation: this.getMutationType(),
        });
    }
    mutationsToMap() {
        let out = {};
        this.getMutations().map((q) => {
            out[q.name] = q.field;
        });
        return out;
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
//# sourceMappingURL=Schema.js.map