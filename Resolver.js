"use strict";
const graphql_relay_1 = require("graphql-relay");
const Model_1 = require("./Model");
const ResolveTypes_1 = require("./ResolveTypes");
class Resolver {
    constructor(adapter, subscriber) {
        this.adapter = adapter;
        this.subscriber = subscriber;
    }
    setCollection(coll) {
        this.collection = coll;
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
    resolveNode(_, opts) {
        const { id, type } = graphql_relay_1.fromGlobalId(opts.source);
        const modelId = type.replace(/Type$/gi, "").toLowerCase();
        const result = this.adapter.findOne(modelId, id);
        if (!result) {
            return null;
        }
        return this.prepareRow(modelId, result);
    }
    resolveViewer(opts) {
        return {};
    }
    resolveQueryOne(modelId, opts) {
        const id = graphql_relay_1.fromGlobalId(opts.args[Model_1.idArgName]).id;
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
    resolveQueryConnection(modelId, opts) {
        const model = this.collection.get(modelId);
        const findCriteria = this.argsToFindCriteria(modelId, opts.args);
        const rows = this.adapter.findMany(modelId, findCriteria);
        let result;
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
        }
        else {
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
    argsToFindCriteria(modelId, args) {
        const model = this.collection.get(modelId);
        const whereArguments = model.getWhereArguments();
        const criteria = {};
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
    prepareRow(modelId, row) {
        const model = this.collection.get(modelId);
        if (model.getPrimaryKeyAttribute().name.toLowerCase() === "_id") {
            row._id = row.id;
        }
        row.id = graphql_relay_1.toGlobalId(model.id, row[model.getPrimaryKeyAttribute().name]);
        return row;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resolver;
//# sourceMappingURL=Resolver.js.map