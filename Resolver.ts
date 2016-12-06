import { } from "graphql";
import { Connection, fromGlobalId, toGlobalId } from "graphql-relay";
import Adapter from "./Adapter";
import Collection from "./Collection";
import Model from "./Model";
import ResolveTypes from "./ResolveTypes";
import { FindCriteria, ModelID, ResolveOpts, ResolveType } from "./typings";
class Resolver {
    constructor(public collection: Collection, public adapter: Adapter) {

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
    public resolveNode(modelId: ModelID, opts: ResolveOpts) {
        const result = this.adapter.findOne(modelId, opts.source);
        if (!result) {
            return null;
        }
        return this.prepareRow(modelId, result);
    }
    public resolveViewer(opts: ResolveOpts) {
        return {};
    }
    public resolveQueryOne(modelId: ModelID, opts: ResolveOpts) {
        const primaryAttrName = this.collection.get(modelId).getPrimaryKeyAttribute().name;
        const result = this.adapter.findOne(modelId, fromGlobalId(opts.args[primaryAttrName]).id);
        if (!result) {
            return null;
        }
        return this.prepareRow(modelId, result);
    }
    public resolveQueryConnection(modelId: ModelID, opts: ResolveOpts): Connection<any> {
        let findCriteria: FindCriteria = {};
        const result = this.adapter.findMany(modelId, findCriteria);
        if (!result || result.length === 0) {
            return {
                edges: [],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: undefined,
                    startCursor: undefined,
                },
            };
        }
        const edges = result.map((row) => {
            return {
                cursor: null,
                node: this.prepareRow(modelId, row),
            };
        });
        return {
            edges,
            pageInfo: {
                hasNextPage: this.adapter.hasNextPage(modelId, findCriteria),
                hasPreviousPage: this.adapter.hasPreviousPage(modelId, findCriteria),
                startCursor: edges[0].node.id,
                endCursor: edges[edges.length - 1].node.id,
            },
        };
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
    protected prepareRow(modelId: ModelID, row) {
        const model = this.collection.get(modelId);
        if (model.getPrimaryKeyAttribute().name.toLowerCase() === "id") {
            row._id = row.id;
        }
        row.id = toGlobalId(model.id, row[model.getPrimaryKeyAttribute().name]);
        return row;
    }
}
export default Resolver;
