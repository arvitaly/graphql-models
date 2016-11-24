import { GraphQLFieldConfigMap, GraphQLObjectType, GraphQLSchema } from "graphql";
import Collection from "./Collection";
import { Queries, ResolveFn } from "./typings";
class Schema {
    protected queries: Queries = [];
    constructor(protected collection: Collection, protected resolveFn: ResolveFn) {

    }
    public getQueries() {
        if (!this.queries) {
            this.collection.map((model) => {
                this.queries = this.queries.concat(model.getQueries(this.resolveFn));
            });
            return this.queries;
        }
    }
    public getMutations() {

    }
    public getSubscriptions() {

    }
    public getSchema() {
        let queries: GraphQLFieldConfigMap<any>;
        this.getQueries().map((q) => {
            queries[q.name] = q.field;
        });
        const queryViewer = new GraphQLObjectType({
            name: "QueryViewer",
            fields: queries,
        })
        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: { type: queryViewer },
                },
            }),
        });
    }
}
export default Schema;
