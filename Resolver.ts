import { } from "graphql";
import { Connection, fromGlobalId, toGlobalId } from "graphql-relay";
import Adapter from "./Adapter";
import Collection from "./Collection";
import Model, { idArgName } from "./Model";
import ResolveTypes from "./ResolveTypes";
import Subscriber from "./Subscriber";
import { FindCriteria, ModelID, ResolveOpts, ResolveType } from "./typings";
class Resolver {
    public collection: Collection;
    constructor(public adapter: Adapter, public subscriber: Subscriber) {

    }
    public setCollection(coll: Collection) {
        this.collection = coll;
    }
    public resolve(modelId: ModelID, type: ResolveType, opts: ResolveOpts) {
        switch (type) {
            case ResolveTypes.Viewer:
                return this.resolveViewer(opts);
            case ResolveTypes.Node:
                return this.resolveNode(modelId, opts);
            case ResolveTypes.Model:
                return this.resolveModel(modelId, opts);
            case ResolveTypes.Connection:
                return this.resolveConnection(modelId, opts);
            case ResolveTypes.QueryOne:
                return this.resolveQueryOne(modelId, opts);
            case ResolveTypes.QueryConnection:
                return this.resolveQueryConnection(modelId, opts);
            default:
                throw new Error("Unsupported resolve type: " + type);
        }
    }
    public resolveNode(_: ModelID, opts: ResolveOpts) {
        const {id, type} = fromGlobalId(opts.source);
        const modelId = type.replace(/Type$/gi, "").toLowerCase();
        const result = this.adapter.findOne(modelId, id);
        if (!result) {
            return null;
        }
        return this.prepareRow(modelId, result);
    }
    public resolveViewer(opts: ResolveOpts) {
        return {};
    }
    public resolveQueryOne(modelId: ModelID, opts: ResolveOpts) {
        const id = fromGlobalId(opts.args[idArgName]).id;
        const model = this.collection.get(modelId);
        const result = this.adapter.findOne(modelId, id);
        if (!result) {
            return null;
        }
        if (opts.context.subscriptionId) {
            this.subscriber.subscribeOne(opts.context.subscriptionId, model, id, opts);
        }
        return this.prepareRow(modelId, result);
    }
    public resolveQueryConnection(modelId: ModelID, opts: ResolveOpts): Connection<any> {
        const model = this.collection.get(modelId);
        const findCriteria: FindCriteria = this.argsToFindCriteria(modelId, opts.args);
        const rows = this.adapter.findMany(modelId, findCriteria);
        let result: Connection<any>;
        if (!rows || rows.length === 0) {
            result = {
                edges: [],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: undefined,
                    startCursor: undefined,
                },
            };
        } else {
            const edges = rows.map((row) => {
                return {
                    cursor: null,
                    node: this.prepareRow(modelId, row),
                };
            });
            result = {
                edges,
                pageInfo: {
                    hasNextPage: this.adapter.hasNextPage(modelId, findCriteria),
                    hasPreviousPage: this.adapter.hasPreviousPage(modelId, findCriteria),
                    startCursor: edges[0].node.id,
                    endCursor: edges[edges.length - 1].node.id,
                },
            };
        }
        if (opts.context.subscriptionId) {
            this.subscriber.subscribeConnection(opts.context.subscriptionId, model, findCriteria, opts);
        }
        return result;
    }
    public resolveModel(modelId: ModelID, opts: ResolveOpts) {
        return this.resolveNode(modelId, opts);
    }
    public resolveConnection(modelId: ModelID, opts: ResolveOpts): Connection<any> {
        const rows = this.adapter.populate(modelId, opts.source);
        const edges = rows.map((row) => {
            return {
                cursor: null,
                node: this.prepareRow(modelId, row),
            };
        });
        return {
            edges,
            pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: edges[0].node.id,
                endCursor: edges[edges.length - 1].node.id,
            },
        };
    }
    public resolveMutationCreate(modelId: string, opts: ResolveOpts) {
        // TODO
    }
    public createOne() {
        // TODO
    }
    /*resolveMutationCreate();
    resolveMutationUpdate();
    resolveMutationUpdateMany();
    resolveMutationDelete();*/
    protected argsToFindCriteria(modelId: ModelID, args: any): FindCriteria {
        const model = this.collection.get(modelId);
        const whereArguments = model.getWhereArguments();
        const criteria: FindCriteria = {};
        criteria.where = [];
        if (args.where) {
            criteria.where = Object.keys(args.where).map((whereArgName) => {
                const arg = whereArguments.find((w) => w.name === whereArgName);
                arg.value = args.where[whereArgName];
                return arg;
            });
        }
        return criteria;
    }
    protected prepareRow(modelId: ModelID, row) {
        const model = this.collection.get(modelId);
        if (model.getPrimaryKeyAttribute().name.toLowerCase() === "_id") {
            row._id = row.id;
        }
        row.id = toGlobalId(model.id, row[model.getPrimaryKeyAttribute().name]);
        return row;
    }
}
export default Resolver;
