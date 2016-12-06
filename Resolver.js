"use strict";
const graphql_relay_1 = require("graphql-relay");
const ResolveTypes_1 = require("./ResolveTypes");
class Resolver {
    constructor(collection, adapter) {
        this.collection = collection;
        this.adapter = adapter;
    }
    resolve(modelId, type, opts) {
        switch (type) {
            case ResolveTypes_1.default.Viewer:
                return this.resolveViewer(opts);
            case ResolveTypes_1.default.Node:
                return this.resolveNode(modelId, opts);
            case ResolveTypes_1.default.Model:
                return this.resolveModel(modelId, opts);
            case ResolveTypes_1.default.Connection:
                return this.resolveConnection(modelId, opts);
            case ResolveTypes_1.default.QueryOne:
                return this.resolveQueryOne(modelId, opts);
            case ResolveTypes_1.default.QueryConnection:
                return this.resolveQueryConnection(modelId, opts);
            default:
                throw new Error("Unsupported resolve type: " + type);
        }
    }
    resolveNode(modelId, opts) {
        const result = this.adapter.findOne(modelId, opts.source);
        if (!result) {
            return null;
        }
        return this.prepareRow(modelId, result);
    }
    resolveViewer(opts) {
        return {};
    }
    resolveQueryOne(modelId, opts) {
        const primaryAttrName = this.collection.get(modelId).getPrimaryKeyAttribute().name;
        const result = this.adapter.findOne(modelId, graphql_relay_1.fromGlobalId(opts.args[primaryAttrName]).id);
        if (!result) {
            return null;
        }
        return this.prepareRow(modelId, result);
    }
    resolveQueryConnection(modelId, opts) {
        let findCriteria = {};
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
    resolveModel(modelId, opts) {
        return this.resolveNode(modelId, opts);
    }
    resolveConnection(modelId, opts) {
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
    resolveMutationCreate(modelId, opts) {
        // TODO
    }
    createOne() {
        // TODO
    }
    /*resolveMutationCreate();
    resolveMutationUpdate();
    resolveMutationUpdateMany();
    resolveMutationDelete();*/
    prepareRow(modelId, row) {
        const model = this.collection.get(modelId);
        if (model.getPrimaryKeyAttribute().name.toLowerCase() === "id") {
            row._id = row.id;
        }
        row.id = graphql_relay_1.toGlobalId(model.id, row[model.getPrimaryKeyAttribute().name]);
        return row;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resolver;
//# sourceMappingURL=Resolver.js.map