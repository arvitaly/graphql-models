"use strict";
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const ResolveTypes_1 = require("./ResolveTypes");
class Schema {
    constructor(collection, resolveFn) {
        this.collection = collection;
        this.resolveFn = resolveFn;
        this.collection.map((model) => {
            model.setResolveFn(resolveFn);
        });
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
    getMutationType() {
        return new graphql_1.GraphQLObjectType({
            name: "Mutation",
            fields: this.mutationsToMap(),
        });
    }
    getNodeType() {
        graphql_relay_1.nodeDefinitions((id, info) => {
            return this.resolveFn({
                type: "node",
                model: null,
                args: id,
                source: null,
                context: null,
                info,
            });
        }, (type) => {
            const t = type.replace(/Type$/gi, "");
            return this.collection.get(t.charAt(0) + t.substr(1)).getBaseType();
        });
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
