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
const _1 = require(".");
const ArgumentTypes_1 = require("./ArgumentTypes");
const AttributeTypes_1 = require("./AttributeTypes");
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
                    const isCriteriaEqual = model.id === subscribe.modelId && (!subscribe.findCriteria ||
                        this.equalRowToFindCriteria(model.id, updated, subscribe.findCriteria));
                    const isExists = subscribe.ids.indexOf(globalId) > -1;
                    if (isExists && isCriteriaEqual) {
                        // publish update
                        this.publisher.publishUpdate(subscriptionId, model.id, globalId, updated, subscribe.opts.context);
                    }
                    if (isExists && !isCriteriaEqual) {
                        // publish remove
                        this.publisher.publishRemove(subscriptionId, model.id, globalId, updated, subscribe.opts.context);
                    }
                    if (!isExists && isCriteriaEqual) {
                        // publish add
                        this.publisher.publishAdd(subscriptionId, model.id, globalId, updated, subscribe.opts.context);
                    }
                });
            });
            this.callbacks.onCreate(model.id, (created) => {
                const globalId = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), created[model.getPrimaryKeyAttribute().realName]);
                Object.keys(this.subscribes).map((subscriptionId) => __awaiter(this, void 0, void 0, function* () {
                    const subscribe = this.subscribes[subscriptionId];
                    const isCriteriaEqual = model.id === subscribe.modelId && (!subscribe.findCriteria ||
                        this.equalRowToFindCriteria(model.id, created, subscribe.findCriteria));
                    if (isCriteriaEqual) {
                        const data = yield this.resolveOne(model.id, globalId, subscribe.type === "one" ? subscribe.opts.resolveInfo.getQueryOneFields() :
                            subscribe.opts.resolveInfo.getQueryConnectionFields(), subscribe.opts.resolveInfo);
                        subscribe.ids.push(globalId);
                        // publish add
                        this.publisher.publishAdd(subscriptionId, model.id, globalId, data, subscribe.opts.context);
                    }
                }));
            });
        });
    }
    resolve(modelId, type, opts) {
        switch (type) {
            case ResolveTypes_1.default.Viewer:
                return this.resolveViewer(opts);
            case ResolveTypes_1.default.Node:
                return this.resolveNode(modelId, opts);
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
    resolveViewer(opts) {
        // TODO this resolve should make adapter
        return { id: "1" };
    }
    resolveNode(_, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, type } = graphql_relay_1.fromGlobalId(opts.source);
            const modelId = type.replace(/Type$/gi, "").toLowerCase();
            return this.resolveOne(modelId, opts.source, opts.resolveInfo.getNodeFields(), opts.resolveInfo);
        });
    }
    resolveQueryOne(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.resolveOne(modelId, opts.args[_1.idArgName], opts.resolveInfo.getQueryOneFields(), opts.resolveInfo);
            if (!result) {
                return null;
            }
            if (opts.context && opts.context.subscriptionId) {
                this.subscribeOne(opts.context.subscriptionId, modelId, opts.args[_1.idArgName], opts);
            }
            return result;
        });
    }
    resolveOne(modelId, globalId, fields, resolveInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = graphql_relay_1.fromGlobalId(globalId).id;
            const result = yield this.adapter.findOne(modelId, id, this.getPopulates(modelId, fields));
            return this.resolveRow(modelId, result, fields, resolveInfo);
        });
    }
    resolveRow(modelId, row, fields, resolveInfo) {
        if (!row) {
            return row;
        }
        const model = this.collection.get(modelId);
        fields.map((field) => {
            const attr = model.attributes.find((a) => a.name === field.name);
            if (typeof (row[attr.name]) === "undefined") {
                return;
            }
            if (attr.type === AttributeTypes_1.default.Date) {
                row[attr.name] = new Date(row[attr.name]).toUTCString();
            }
            if (attr.type === AttributeTypes_1.default.JSON) {
                row[attr.name] = JSON.stringify(row[attr.name]);
            }
            if (attr.realName === "id") {
                row._id = row.id;
            }
            if (attr.type === AttributeTypes_1.default.Model) {
                row[attr.name] = this.resolveRow(attr.model, row[attr.name], field.fields, resolveInfo);
            }
            if (attr.type === AttributeTypes_1.default.Collection) {
                const edges = row[attr.name].map((r) => {
                    return {
                        cursor: "",
                        node: this.resolveRow(attr.model, r, resolveInfo.getFieldsForConnection(field), resolveInfo),
                    };
                });
                row[attr.name] = {
                    edges,
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        startCursor: edges[0].node.id,
                        endCursor: edges[edges.length - 1].node.id,
                    },
                };
            }
        });
        row[_1.idArgName] = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), row[model.getPrimaryKeyAttribute().realName]);
        return row;
    }
    resolveQueryConnection(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            const findCriteria = this.argsToFindCriteria(modelId, opts.args);
            const fields = opts.resolveInfo.getQueryConnectionFields();
            const rows = yield this.adapter.findMany(modelId, findCriteria, this.getPopulates(modelId, fields));
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
                        node: this.resolveRow(modelId, row, opts.resolveInfo.getQueryConnectionFields(), opts.resolveInfo),
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
    resolveMutationCreate(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = Object.assign({}, opts.args);
            delete created.clientMutationId;
            const id = yield this.createOne(modelId, created);
            const row = yield this.resolveOne(modelId, id, opts.resolveInfo.getMutationPayloadFields(), opts.resolveInfo);
            return {
                clientMutationId: opts.args.clientMutationId,
                [this.collection.get(modelId).queryName]: row,
            };
        });
    }
    resolveMutationUpdate(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            const argsForUpdate = Object.assign({}, opts.args);
            delete argsForUpdate.clientMutationId;
            const updating = {};
            let id;
            yield Promise.all(Object.keys(argsForUpdate).map((updateArgName) => {
                const arg = Object.assign({}, model.getUpdateArguments().find((a) => a.name === updateArgName));
                arg.value = argsForUpdate[updateArgName];
                return arg;
            }).map((arg) => __awaiter(this, void 0, void 0, function* () {
                switch (arg.type) {
                    case ArgumentTypes_1.default.UpdateSetter:
                        if (arg.attribute.type === AttributeTypes_1.default.Date) {
                            updating[arg.attribute.name] = new Date(arg.value[arg.attribute.name]);
                        }
                        else if (arg.attribute.type === AttributeTypes_1.default.JSON) {
                            updating[arg.attribute.name] = JSON.parse(arg.value[arg.attribute.name]);
                        }
                        else {
                            updating[arg.attribute.name] = arg.value[arg.attribute.name];
                        }
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
            const updated = yield this.adapter.updateOne(model.id, id, updating);
            const row = yield this.resolveOne(modelId, graphql_relay_1.toGlobalId(model.getNameForGlobalId(), updated[model.getPrimaryKeyAttribute().realName]), opts.resolveInfo.getMutationPayloadFields(), opts.resolveInfo);
            return {
                clientMutationId: opts.args.clientMutationId,
                [this.collection.get(modelId).queryName]: row,
            };
        });
    }
    createOne(modelId, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            let createArgs = Object.keys(args).map((createArgName) => {
                const arg = Object.assign({}, model.getCreateArguments().find((a) => a.name === createArgName));
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
            const creating = {};
            createArgs.map((arg) => {
                if (arg.attribute.type === AttributeTypes_1.default.Date) {
                    creating[arg.attribute.name] = new Date(arg.value);
                }
                else if (arg.attribute.type === AttributeTypes_1.default.JSON) {
                    creating[arg.attribute.name] = JSON.parse(arg.value);
                }
                else {
                    creating[arg.attribute.name] = arg.value;
                }
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
            type: "one",
        };
    }
    subscribeConnection(subscriptionId, modelId, ids, findCriteria, opts) {
        this.subscribes[subscriptionId] = {
            ids,
            findCriteria,
            modelId,
            opts,
            type: "connection",
        };
    }
    unsubscribe(id) {
        delete this.subscribes[id];
    }
    getPopulates(modelId, fields) {
        const model = this.collection.get(modelId);
        return model.attributes.filter((attr) => {
            return attr.type === AttributeTypes_1.default.Model || attr.type === AttributeTypes_1.default.Collection;
        }).filter((attr) => {
            return !!fields.find((f) => f.name === attr.name);
        }).map((attr) => {
            const field = fields.find((f) => f.name === attr.name);
            return {
                attribute: attr,
                fields: this.getPopulates(attr.model, field.fields),
            };
        });
    }
    equalRowToFindCriteria(modelId, row, findCriteria) {
        // if all criteria not false
        return !findCriteria.where.some((arg) => {
            const rowValue = row[arg.attribute.name];
            switch (arg.type) {
                case ArgumentTypes_1.default.Equal:
                    return rowValue !== arg.value;
                case ArgumentTypes_1.default.NotEqual:
                    return rowValue === arg.value;
                case ArgumentTypes_1.default.IsNull:
                    return rowValue !== null;
                case ArgumentTypes_1.default.IsNotNull:
                    return rowValue === null;
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
                case ArgumentTypes_1.default.LessThan:
                    return rowValue < arg.value;
                case ArgumentTypes_1.default.GreaterThanOrEqual:
                    return rowValue >= arg.value;
                case ArgumentTypes_1.default.LessThanOrEqual:
                    return rowValue <= arg.value;
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
                const arg = Object.assign({}, whereArguments.find((w) => w.name === whereArgName));
                arg.value = args.where[whereArgName];
                return arg;
            });
        }
        criteria.first = args.first;
        criteria.after = args.after;
        criteria.before = args.before;
        criteria.last = args.last;
        criteria.sort = args.sort;
        return criteria;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Resolver;
//# sourceMappingURL=Resolver.js.map