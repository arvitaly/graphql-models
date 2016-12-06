"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const graphql_relay_1 = require("graphql-relay");
const ArgumentTypes_1 = require("./ArgumentTypes");
const Model_1 = require("./Model");
const ResolveTypes_1 = require("./ResolveTypes");
class Resolver {
    constructor(adapter, callbacks, publisher) {
        this.adapter = adapter;
        this.callbacks = callbacks;
        this.publisher = publisher;
        this.subscribes = {};
    }
    setCollection(coll) {
        this.collection = coll;
        this.collection.map((model) => {
            this.callbacks.onUpdate(model.id, (updated) => {
                const globalId = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), updated[model.getPrimaryKeyAttribute().realName]);
                Object.keys(this.subscribes).map((subscriptionId) => {
                    const subscribe = this.subscribes[subscriptionId];
                    if (subscribe.findCriteria) {
                        const isCriteriaEqual = this.equalRowToFindCriteria(model.id, updated, subscribe.findCriteria);
                        const isExists = subscribe.ids.indexOf(globalId) > -1;
                        if (isExists && isCriteriaEqual) {
                            // publish update
                            this.publisher.publishUpdate(subscriptionId, model.id, updated, subscribe.opts.context);
                        }
                        if (isExists && !isCriteriaEqual) {
                            // publish remove
                            this.publisher.publishRemove(subscriptionId, model.id, updated, subscribe.opts.context);
                        }
                        if (!isExists && isCriteriaEqual) {
                            // publish add
                            this.publisher.publishAdd(subscriptionId, model.id, updated, subscribe.opts.context);
                        }
                    }
                    else {
                        if (globalId === subscribe.ids[0]) {
                            // publish update
                            this.publisher.publishUpdate(subscriptionId, model.id, updated, subscribe.opts.context);
                        }
                    }
                });
            });
            this.callbacks.onCreate(model.id, (created) => {
                const globalId = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), created[model.getPrimaryKeyAttribute().realName]);
                Object.keys(this.subscribes).map((subscriptionId) => {
                    const subscribe = this.subscribes[subscriptionId];
                    if (!subscribe.findCriteria) {
                        return;
                    }
                    const isCriteriaEqual = this.equalRowToFindCriteria(model.id, created, subscribe.findCriteria);
                    if (isCriteriaEqual) {
                        // publish add
                        this.publisher.publishAdd(subscriptionId, model.id, created, subscribe.opts.context);
                    }
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
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            const findCriteria = this.argsToFindCriteria(modelId, opts.args);
            const rows = yield this.adapter.findMany(modelId, findCriteria);
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
                        hasNextPage: yield this.adapter.hasNextPage(modelId, findCriteria),
                        hasPreviousPage: yield this.adapter.hasPreviousPage(modelId, findCriteria),
                        startCursor: edges[0].node.id,
                        endCursor: edges[edges.length - 1].node.id,
                    },
                };
            }
            if (opts.context && opts.context.subscriptionId) {
                this.subscribeConnection(opts.context.subscriptionId, modelId, result.edges.map((r) => { return r.node.id; }), findCriteria, opts);
            }
            return result;
        });
    }
    resolveModel(modelId, opts) {
        return this.resolveNode(modelId, opts);
    }
    resolveConnection(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.adapter.populate(modelId, opts.source);
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
        });
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
        this.subscribes[subscriptionId] = {
            modelId,
            ids: [globalId],
            opts,
        };
    }
    subscribeConnection(subscriptionId, modelId, ids, findCriteria, opts) {
        this.subscribes[subscriptionId] = {
            ids,
            findCriteria,
            modelId,
            opts,
        };
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