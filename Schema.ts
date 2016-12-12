import {
    GraphQLFieldConfigMap, GraphQLInputFieldConfigMap, GraphQLObjectType,
    GraphQLResolveInfo, GraphQLSchema,
} from "graphql";
import { fromResolveInfo } from "graphql-fields-info";
import { fromGlobalId, GraphQLNodeDefinitions, nodeDefinitions } from "graphql-relay";
import Collection from "./Collection";
import Resolver from "./Resolver";
import ResolveTypes from "./ResolveTypes";
import { Mutations, Queries, ResolveFn } from "./typings";
class Schema {
    protected nodeDefinition: GraphQLNodeDefinitions;
    protected collection: Collection;
    constructor(protected resolver: Resolver) { }
    public setCollection(models: Collection) {
        this.collection = models;
    }
    public getQueries() {
        let queries: Queries = [];
        this.collection.map((model) => {
            queries = queries.concat(model.getQueries());
        });
        return queries;
    }
    public getMutations() {
        let mutations: Mutations = [];
        this.collection.map((model) => {
            mutations = mutations.concat(model.getMutations());
        });
        return mutations;
    }
    public getSubscriptions() {
        // TODO
    }
    public getQueryViewerType() {
        const queryViewer = new GraphQLObjectType({
            name: "Viewer",
            fields: this.queriesToMap(),
        });
        return queryViewer;
    }
    public getQueryType() {
        return new GraphQLObjectType({
            name: "Query",
            fields: {
                node: this.getNodeDefinition().nodeField,
                viewer: {
                    type: this.getQueryViewerType(),
                    resolve: (source, args, context, info) => {
                        return this.resolver.resolve(null, ResolveTypes.Viewer, {
                            source, args, context, info,
                            resolveInfo: fromResolveInfo(info),
                        });
                    },
                },
            },
        });
    }
    public getMutationType() {
        return new GraphQLObjectType({
            name: "Mutation",
            fields: this.mutationsToMap(),
        });
    }
    public getNodeDefinition() {
        if (!this.nodeDefinition) {
            this.nodeDefinition = nodeDefinitions((id: string, context, info: GraphQLResolveInfo) => {
                return this.resolver.resolve(null, ResolveTypes.Node, {
                    source: id, args: null, context, info,
                    resolveInfo: fromResolveInfo(info),
                });
            }, (value: any, context: any, info: GraphQLResolveInfo) => {
                return this.collection.get(fromGlobalId(value.id).type.replace(/Type$/gi, "").toLowerCase())
                    .getBaseType();
            });
        }
        return this.nodeDefinition;
    }
    public getGraphQLSchema() {
        return new GraphQLSchema({
            query: this.getQueryType(),
            mutation: this.getMutationType(),
        });
    }
    protected mutationsToMap(): GraphQLFieldConfigMap<any, any> {
        let out: GraphQLFieldConfigMap<any, any> = {};
        this.getMutations().map((q) => {
            out[q.name] = q.field;
        });
        return out;
    }
    protected queriesToMap(): GraphQLFieldConfigMap<any, any> {
        let out: GraphQLFieldConfigMap<any, any> = {};
        this.getQueries().map((q) => {
            out[q.name] = q.field;
        });
        return out;
    }
}
export default Schema;
