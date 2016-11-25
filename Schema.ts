import { GraphQLFieldConfigMap, GraphQLInputFieldConfigMap, GraphQLObjectType, GraphQLSchema } from "graphql";
import Collection from "./Collection";
import ResolveTypes from "./ResolveTypes";
import { Mutations, Queries, ResolveFn } from "./typings";
class Schema {
    constructor(protected collection: Collection, protected resolveFn: ResolveFn) {

    }
    public getQueries() {
        let queries: Queries = [];
        this.collection.map((model) => {
            queries = queries.concat(model.getQueries(this.resolveFn));
        });
        return queries;
    }
    public getMutations() {
        let mutations: Mutations = [];
        this.collection.map((model) => {
            mutations = mutations.concat(model.getMutations(this.resolveFn));
        });
        return mutations;
    }
    public getSubscriptions() {
        // TODO
    }
    public getQueryViewerType() {
        const queryViewer = new GraphQLObjectType({
            name: "QueryViewer",
            fields: this.queriesToMap(),
        });
        return queryViewer;
    }
    public getQueryType() {
        return new GraphQLObjectType({
            name: "Query",
            fields: {
                viewer: {
                    type: this.getQueryViewerType(),
                    resolve: (source, args, context, info) => {
                        return this.resolveFn({
                            type: ResolveTypes.Viewer,
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
    public getMutationType() {
        return new GraphQLObjectType({
            name: "Mutation",
            fields: this.mutationsToMap(),
        });
    }
    public getGraphQLSchema() {
        return new GraphQLSchema({
            query: this.getQueryType(),
            mutation: this.getMutationType(),
        });
    }
    protected mutationsToMap(): GraphQLFieldConfigMap<any> {
        let out: GraphQLFieldConfigMap<any> = {};
        this.getMutations().map((q) => {
            out[q.name] = q.field;
        });
        return out;
    }
    protected queriesToMap(): GraphQLFieldConfigMap<any> {
        let out: GraphQLFieldConfigMap<any> = {};
        this.getQueries().map((q) => {
            out[q.name] = q.field;
        });
        return out;
    }
}
export default Schema;
