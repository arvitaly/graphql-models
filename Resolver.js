"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
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
            case ResolveTypes_1.default.MutationCreate:
                return this.resolveMutationCreate(modelId, opts);
            case ResolveTypes_1.default.MutationUpdate:
                return this.resolveMutationUpdate(modelId, opts);
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
        const row = this.collection.get(modelId).rowToResolve(result);
        return row;
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
        const row = model.rowToResolve(result);
        return row;
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
                        node: model.rowToResolve(row),
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
            const rows = yield this.adapter.populate(modelId, opts.source, opts.attrName);
            const edges = rows.map((row) => {
                return {
                    cursor: null,
                    node: this.collection.get(this.collection.get(modelId).attributes.find((a) => a.name === opts.attrName).model)
                        .rowToResolve(row),
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
        return __awaiter(this, void 0, void 0, function* () {
            const id = yield this.createOne(modelId, opts.args);
            const row = yield this.resolveModel(modelId, {
                source: id,
                args: null,
                context: opts.context,
                info: opts.info,
            });
            return {
                [this.collection.get(modelId).queryName]: row,
            };
        });
    }
    resolveMutationUpdate(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            const updating = {};
            let id;
            yield Promise.all(Object.keys(opts.args).map((updateArgName) => {
                let arg = model.getUpdateArguments().find((a) => a.name === updateArgName);
                arg.value = opts.args[updateArgName];
                return arg;
            }).map((arg) => __awaiter(this, void 0, void 0, function* () {
                switch (arg.type) {
                    case ArgumentTypes_1.default.UpdateSetter:
                        updating[arg.attribute.name] = arg.value[arg.attribute.name];
                        break;
                    case ArgumentTypes_1.default.CreateArgument:
                        updating[arg.attribute.name] = graphql_relay_1.fromGlobalId(yield this.createOne(arg.attribute.model, arg.value)).id;
                        break;
                    case ArgumentTypes_1.default.CreateSubCollection:
                        const childModel = arg.attribute.model;
                        updating[arg.attribute.name] = yield Promise.all(arg.value.map((v) => __awaiter(this, void 0, void 0, function* () {
                            return graphql_relay_1.fromGlobalId(yield this.createOne(childModel, v)).id;
                        })));
                        break;
                    case ArgumentTypes_1.default.Equal:
                        id = graphql_relay_1.fromGlobalId(arg.value).id;
                        break;
                    default:
                        throw new Error("Unsupported argument type " + arg.type + " for update");
                }
            })));
            const updated = this.adapter.updateOne(model.id, id, updating);
            const row = yield this.resolveModel(modelId, {
                source: graphql_relay_1.toGlobalId(model.getNameForGlobalId(), updated[model.getPrimaryKeyAttribute().realName]),
                args: null,
                context: opts.context,
                info: opts.info,
            });
            return {
                [this.collection.get(modelId).queryName]: row,
            };
        });
    }
    createOne(modelId, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            let createArgs = Object.keys(args).map((createArgName) => {
                let arg = model.getCreateArguments().find((a) => a.name === createArgName);
                arg.value = args[createArgName];
                return arg;
            });
            const submodels = yield Promise.all(createArgs.filter((arg) => arg.type === ArgumentTypes_1.default.CreateSubModel).map((arg) => __awaiter(this, void 0, void 0, function* () {
                const childModel = arg.attribute.model;
                return {
                    name: arg.attribute.name,
                    value: graphql_relay_1.fromGlobalId(yield this.createOne(childModel, arg.value)).id,
                    attribute: arg.attribute,
                    type: ArgumentTypes_1.default.CreateArgument,
                    graphQLType: null,
                };
            })));
            createArgs = createArgs.concat(submodels);
            const subcollections = yield Promise.all(createArgs.filter((arg) => arg.type === ArgumentTypes_1.default.CreateSubCollection).map((arg) => __awaiter(this, void 0, void 0, function* () {
                const childModel = arg.attribute.model;
                const ids = yield Promise.all(arg.value.map((row) => __awaiter(this, void 0, void 0, function* () {
                    return graphql_relay_1.fromGlobalId(yield this.createOne(childModel, row)).id;
                })));
                return {
                    name: arg.attribute.name,
                    value: ids,
                    attribute: arg.attribute,
                    type: ArgumentTypes_1.default.CreateArgument,
                    graphQLType: null,
                };
            })));
            createArgs = createArgs.concat(subcollections);
            let creating = {};
            createArgs.map((arg) => {
                creating[arg.attribute.name] = arg.value;
            });
            const created = yield this.adapter.createOne(modelId, creating);
            return graphql_relay_1.toGlobalId(modelId, "" + created[model.getPrimaryKeyAttribute().realName]);
        });
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
            const rowValue = row[arg.attribute.name];
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