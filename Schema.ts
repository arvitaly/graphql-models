import { GraphQLFieldConfigMap, GraphQLObjectType, GraphQLSchema } from "graphql";
import Collection from "./Collection";
import ResolveTypes from "./ResolveTypes";
import { Queries, ResolveFn } from "./typings";
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

    }
    public getSubscriptions() {

    }
    public getGraphQLSchema() {
        const queryViewer = new GraphQLObjectType({
            name: "QueryViewer",
            fields: queriesToMap(this.getQueries()),
        })
        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: {
                        type: queryViewer, resolve: (source, args, context, info) => {
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
            }),
        });
    }
}
export function queriesToMap(queries: Queries): GraphQLFieldConfigMap<any> {
    let out: GraphQLFieldConfigMap<any> = {};
    queries.map((q) => {
        out[q.name] = q.field;
    });
    return out;
}
export default Schema;
