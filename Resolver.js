"use strict";
const graphql_relay_1 = require("graphql-relay");
const ArgumentTypes_1 = require("./ArgumentTypes");
const Model_1 = require("./Model");
const ResolveTypes_1 = require("./ResolveTypes");
class Resolver {
    constructor(adapter, callbacks, publisher) {
        this.adapter = adapter;
        this.callbacks = callbacks;
        this.publisher = publisher;
        this.subscribes = [];
        this.findSubscribes = [];
    }
    setCollection(coll) {
        this.collection = coll;
        this.collection.map((model) => {
            this.callbacks.onUpdate(model.id, (updated) => {
                const globalId = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), updated[model.getPrimaryKeyAttribute().realName]);
                let subscribes = this.subscribes.filter((subscribe) => {
                    return subscribe.modelId === model.id && subscribe.globalId === globalId;
                });
                if (subscribes.length === 0) {
                    const newSubscribes = this.findSubscribes.filter((subscribe) => {
                        return this.equalRowToFindCriteria(model.id, updated, subscribe.findCriteria);
                    }).map((subscribe) => {
                        return {
                            globalId,
                            modelId: model.id,
                            subscriptionId: subscribe.subscriptionId,
                        };
                    });
                    if (newSubscribes.length > 0) {
                        this.subscribes = this.subscribes.concat(newSubscribes);
                        subscribes = subscribes.concat(newSubscribes);
                    }
                }
                subscribes.map((subscribe) => {
                    this.publisher.publishUpdate(subscribe.subscriptionId, model.id, updated);
                });
            });
            this.callbacks.onCreate(model.id, (created) => {
                const globalId = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), created[model.getPrimaryKeyAttribute().realName]);
                const newSubscribes = this.findSubscribes.filter((subscribe) => {
                    return this.equalRowToFindCriteria(model.id, created, subscribe.findCriteria);
                }).map((subscribe) => {
                    return {
                        globalId,
                        modelId: model.id,
                        subscriptionId: subscribe.subscriptionId,
                    };
                });
                this.subscribes = this.subscribes.concat(newSubscribes);
                newSubscribes.map((subscribe) => {
                    this.publisher.publishCreate(subscribe.subscriptionId, model.id, created);
                });
            });
        });
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
        return this.collection.get(modelId).prepareRow(result);
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
        if (opts.context && opts.context.subscriptionId) {
            this.subscribeOne(opts.context.subscriptionId, modelId, opts.args[Model_1.idArgName], opts);
        }
        return model.prepareRow(result);
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
                    node: model.prepareRow(row),
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
        if (opts.context && opts.context.subscriptionId) {
            this.subscribeConnection(opts.context.subscriptionId, modelId, result.edges.map((r) => { return r.node.id; }), findCriteria, opts);
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
                node: this.collection.get(modelId).prepareRow(row),
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
    subscribeOne(subscriptionId, modelId, globalId, opts) {
        this.subscribes.push({
            globalId,
            modelId,
            subscriptionId,
        });
    }
    subscribeConnection(subscriptionId, modelId, ids, findCriteria, opts) {
        this.subscribes = this.subscribes.concat(ids.map((globalId) => {
            return {
                modelId,
                globalId,
                subscriptionId,
            };
        }));
        this.findSubscribes.push({
            findCriteria,
            modelId,
            subscriptionId,
        });
    }
    equalRowToFindCriteria(modelId, row, findCriteria) {
        // if all criteria not false
        return !findCriteria.where.some((arg) => {
            const rowValue = row[arg.attribute];
            switch (arg.type) {
                case ArgumentTypes_1.default.Contains:
                    return rowValue.indexOf(arg.value) === -1;
                case ArgumentTypes_1.default.NotContains:
                    return rowValue.indexOf(arg.value) > -1;
                case ArgumentTypes_1.default.StartsWith:
                    return rowValue.substr(0, arg.value.length) !== arg.value;
                case ArgumentTypes_1.default.NotStartsWith:
                    return rowValue.substr(0, arg.value.length) === arg.value;
                case ArgumentTypes_1.default.GreaterThan:
                    return rowValue > arg.value;
                default:
                    throw new Error("Unsupported argument type " + arg.type);
            }
        });
    }
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
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resolver;
//# sourceMappingURL=Resolver.js.map