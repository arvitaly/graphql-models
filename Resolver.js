"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_relay_1 = require("graphql-relay");
const _1 = require(".");
const ArgumentTypes_1 = require("./ArgumentTypes");
const AttributeTypes_1 = require("./AttributeTypes");
const CreateDuplicateError_1 = require("./CreateDuplicateError");
const getQueryConnectionFields_1 = require("./getQueryConnectionFields");
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
                        const data = yield this.resolveOne(model.id, globalId, subscribe.type === "one" ?
                            getQueryConnectionFields_1.default(subscribe.opts.resolveInfo.getQueryOneFields()) :
                            getQueryConnectionFields_1.default(subscribe.opts.resolveInfo.getQueryConnectionFields()), subscribe.opts.resolveInfo);
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
            case ResolveTypes_1.default.MutationCreateOrUpdate:
                return this.resolveMutationCreateOrUpdate(modelId, opts);
            default:
                throw new Error("Unsupported resolve type: " + type);
        }
    }
    resolveViewer(_) {
        // TODO this resolve should make adapter
        return { id: "1" };
    }
    resolveNode(_, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type } = graphql_relay_1.fromGlobalId(opts.source);
            const modelId = type.replace(/Type$/gi, "").toLowerCase();
            if (opts.context && opts.context.subscriptionId) {
                this.subscribeOne(opts.context.subscriptionId, modelId, opts.source, opts);
            }
            return this.resolveOne(modelId, opts.source, opts.resolveInfo.getNodeFields(), opts.resolveInfo);
        });
    }
    resolveQueryOne(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.resolveOne(modelId, opts.args[_1.idArgName], getQueryConnectionFields_1.default(opts.resolveInfo.getQueryOneFields()), opts.resolveInfo);
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
            if (!attr) {
                return;
            }
            if (typeof (row[attr.name]) === "undefined") {
                return;
            }
            if (attr.realName === "id") {
                row._id = row.id;
            }
            if (attr.type === AttributeTypes_1.default.Model) {
                row[attr.name] = this.resolveRow(attr.model, row[attr.name], field.fields, resolveInfo);
            }
            if (attr.type === AttributeTypes_1.default.Collection) {
                if (!row[attr.name] || row[attr.name].length === 0) {
                    row[attr.name] = {
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
                    const edges = row[attr.name].map((r) => {
                        const node = this.resolveRow(attr.model, r, field.fields, resolveInfo);
                        return {
                            cursor: node.id,
                            node,
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
            }
        });
        row[_1.idArgName] = graphql_relay_1.toGlobalId(model.getNameForGlobalId(), row[model.getPrimaryKeyAttribute().realName]);
        return row;
    }
    resolveQueryConnection(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            const findCriteria = this.argsToFindCriteria(modelId, opts.args);
            const fields = getQueryConnectionFields_1.default(opts.resolveInfo.getQueryConnectionFields(model.connectionName));
            const rows = yield this.adapter.findMany(modelId, findCriteria, this.getPopulates(modelId, fields));
            let result;
            if (!rows || rows.length === 0) {
                result = {
                    edges: [],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        endCursor: "",
                        startCursor: "",
                    },
                };
            }
            else {
                const edges = rows.map((row) => {
                    const node = this.resolveRow(modelId, row, getQueryConnectionFields_1.default(opts.resolveInfo.getQueryConnectionFields(model.connectionName)), opts.resolveInfo);
                    return {
                        cursor: node.id,
                        node,
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
                this.subscribeConnection(opts.context.subscriptionId, modelId, result.edges.map((r) => r.node.id), findCriteria, opts);
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
    createOrUpdateOne(modelId, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            try {
                return yield this.createOne(modelId, Object.assign({}, args.create));
            }
            catch (e) {
                if (e instanceof CreateDuplicateError_1.default) {
                    const result = yield this.adapter.findOrCreateOne(modelId, args.create);
                    if (!result) {
                        throw new Error("Not found record for createOrUpdate");
                    }
                    const globalId = graphql_relay_1.toGlobalId(modelId, "" + result[model.getPrimaryKeyAttribute().realName]);
                    const forUpdatings = Object.assign({}, args.update);
                    forUpdatings.id = globalId;
                    return yield this.updateOne(modelId, forUpdatings);
                }
                else {
                    throw e;
                }
            }
        });
    }
    resolveMutationCreateOrUpdate(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            try {
                return yield this.resolveMutationCreate(modelId, {
                    args: opts.args.create,
                    attrName: opts.attrName,
                    context: opts.context,
                    info: opts.info,
                    resolveInfo: opts.resolveInfo,
                    source: opts.source,
                });
            }
            catch (e) {
                if (e instanceof CreateDuplicateError_1.default) {
                    const result = yield this.adapter.findOrCreateOne(modelId, opts.args.create);
                    if (!result) {
                        throw new Error("Not found record for createOrUpdate");
                    }
                    const globalId = graphql_relay_1.toGlobalId(modelId, "" + result[model.getPrimaryKeyAttribute().realName]);
                    const updated = Object.assign({}, opts.args.update);
                    updated.id = globalId;
                    return this.resolveMutationUpdate(modelId, {
                        args: updated,
                        attrName: opts.attrName,
                        context: opts.context,
                        info: opts.info,
                        resolveInfo: opts.resolveInfo,
                        source: opts.source,
                    });
                }
                else {
                    throw e;
                }
            }
        });
    }
    resolveMutationUpdate(modelId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const argsForUpdate = Object.assign({}, opts.args);
            delete argsForUpdate.clientMutationId;
            const globalId = yield this.updateOne(modelId, argsForUpdate);
            const row = yield this.resolveOne(modelId, globalId, opts.resolveInfo.getMutationPayloadFields(), opts.resolveInfo);
            return {
                clientMutationId: opts.args.clientMutationId,
                [this.collection.get(modelId).queryName]: row,
            };
        });
    }
    updateOne(modelId, argsForUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            const updating = {};
            let id;
            yield Promise.all(Object.keys(argsForUpdate).map((updateArgName) => {
                const arg = Object.assign({}, model.getUpdateArguments().find((a) => a.name === updateArgName));
                arg.value = argsForUpdate[updateArgName];
                return arg;
            }).map((arg) => __awaiter(this, void 0, void 0, function* () {
                switch (arg.type) {
                    case ArgumentTypes_1.default.UpdateSetter:
                        if (arg.attribute.type === AttributeTypes_1.default.ID) {
                            updating[arg.attribute.name] = graphql_relay_1.fromGlobalId(arg.value[arg.attribute.name]);
                        }
                        else if (arg.attribute.type === AttributeTypes_1.default.Model) {
                            updating[arg.attribute.name] = graphql_relay_1.fromGlobalId(arg.value[arg.attribute.name]);
                        }
                        else if (arg.attribute.type === AttributeTypes_1.default.Collection) {
                            updating[arg.attribute.name] =
                                arg.value[arg.attribute.name].map((v) => graphql_relay_1.fromGlobalId(v).id);
                        }
                        else {
                            updating[arg.attribute.name] = arg.value[arg.attribute.name];
                        }
                        break;
                    case ArgumentTypes_1.default.CreateArgument:
                        const attr = arg.attribute;
                        updating[arg.attribute.name] = graphql_relay_1.fromGlobalId(yield this.createOne(attr.model, arg.value)).id;
                        break;
                    case ArgumentTypes_1.default.CreateOrUpdateSubModel:
                        const attr2 = arg.attribute;
                        updating[arg.attribute.name] = graphql_relay_1.fromGlobalId(yield this.createOrUpdateOne(attr2.model, arg.value)).id;
                        break;
                    case ArgumentTypes_1.default.CreateSubCollection:
                        const attr3 = arg.attribute;
                        updating[arg.attribute.name] = yield Promise.all(arg.value.map((v) => __awaiter(this, void 0, void 0, function* () {
                            return graphql_relay_1.fromGlobalId(yield this.createOne(attr3.model, v)).id;
                        })));
                        break;
                    case ArgumentTypes_1.default.CreateOrUpdateSubCollection:
                        const attr4 = arg.attribute;
                        updating[arg.attribute.name] = yield Promise.all(arg.value.map((v) => __awaiter(this, void 0, void 0, function* () {
                            return graphql_relay_1.fromGlobalId(yield this.createOrUpdateOne(attr4.model, v)).id;
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
            return graphql_relay_1.toGlobalId(model.getNameForGlobalId(), updated[model.getPrimaryKeyAttribute().realName]);
        });
    }
    createOne(modelId, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.collection.get(modelId);
            // Fill createArgs
            let createArgs = Object.keys(args).map((createArgName) => {
                const arg = Object.assign({}, model.getCreateArguments().find((a) => a.name === createArgName));
                arg.value = args[createArgName];
                return arg;
            });
            // Create all submodels
            const submodels = yield Promise.all(createArgs.filter((arg) => arg.type === ArgumentTypes_1.default.CreateSubModel).map((arg) => __awaiter(this, void 0, void 0, function* () {
                const childModel = arg.attribute.model;
                return {
                    name: arg.attribute.name,
                    value: yield this.createOne(childModel, arg.value),
                    attribute: arg.attribute,
                    type: ArgumentTypes_1.default.CreateArgument,
                    graphQLType: null,
                };
            })));
            createArgs = createArgs.concat(submodels);
            // create or update all submodels
            const submodels2 = yield Promise.all(createArgs.filter((arg) => arg.type === ArgumentTypes_1.default.CreateOrUpdateSubModel).map((arg) => __awaiter(this, void 0, void 0, function* () {
                const childModel = arg.attribute.model;
                return {
                    name: arg.attribute.name,
                    value: yield this.createOrUpdateOne(childModel, arg.value),
                    attribute: arg.attribute,
                    type: ArgumentTypes_1.default.CreateArgument,
                    graphQLType: null,
                };
            })));
            createArgs = createArgs.concat(submodels2);
            const subcollections = yield Promise.all(createArgs.filter((arg) => arg.type === ArgumentTypes_1.default.CreateSubCollection).map((arg) => __awaiter(this, void 0, void 0, function* () {
                const childModel = arg.attribute.model;
                const ids = yield Promise.all(arg.value.map((row) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.createOne(childModel, row);
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
            const subcollections2 = yield Promise.all(createArgs.filter((arg) => arg.type === ArgumentTypes_1.default.CreateOrUpdateSubCollection).map((arg) => __awaiter(this, void 0, void 0, function* () {
                const childModel = arg.attribute.model;
                const ids = yield Promise.all(arg.value.map((row) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.createOrUpdateOne(childModel, row);
                })));
                return {
                    name: arg.attribute.name,
                    value: ids,
                    attribute: arg.attribute,
                    type: ArgumentTypes_1.default.CreateArgument,
                    graphQLType: null,
                };
            })));
            createArgs = createArgs.concat(subcollections2);
            const creating = {};
            createArgs.map((arg) => {
                switch (arg.type) {
                    case ArgumentTypes_1.default.CreateSubModel:
                        break;
                    case ArgumentTypes_1.default.CreateSubCollection:
                        break;
                    case ArgumentTypes_1.default.CreateOrUpdateSubCollection:
                        break;
                    case ArgumentTypes_1.default.CreateOrUpdateSubModel:
                        break;
                    default:
                        if (arg.attribute.type === AttributeTypes_1.default.ID) {
                            creating[arg.attribute.name] = graphql_relay_1.fromGlobalId(arg.value).id;
                        }
                        else if (arg.attribute.type === AttributeTypes_1.default.Model) {
                            creating[arg.attribute.name] = graphql_relay_1.fromGlobalId(arg.value).id;
                        }
                        else if (arg.attribute.type === AttributeTypes_1.default.Collection) {
                            creating[arg.attribute.name] = arg.value.map((v) => graphql_relay_1.fromGlobalId(v).id);
                        }
                        else {
                            creating[arg.attribute.name] = arg.value;
                        }
                }
            });
            const created = yield this.adapter.createOne(modelId, creating);
            return graphql_relay_1.toGlobalId(modelId, "" + created[model.getPrimaryKeyAttribute().realName]);
        });
    }
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
            if (!field) {
                throw new Error("Not found field with name " + attr.name);
            }
            return {
                attribute: attr,
                fields: this.getPopulates(attr.model, field.fields),
            };
        });
    }
    equalRowToFindCriteria(_, row, findCriteria) {
        // if all criteria not false
        if (!findCriteria.where) {
            return true;
        }
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
                switch (arg.attribute.type) {
                    case AttributeTypes_1.default.ID:
                        arg.value = graphql_relay_1.fromGlobalId(args.where[whereArgName]).id;
                        break;
                    case AttributeTypes_1.default.Model:
                        switch (arg.type) {
                            case ArgumentTypes_1.default.IsNull:
                            case ArgumentTypes_1.default.IsNotNull:
                                arg.value = args.where[whereArgName];
                                break;
                            case ArgumentTypes_1.default.In:
                            case ArgumentTypes_1.default.NotIn:
                                arg.value = args.where[whereArgName].map((v) => graphql_relay_1.fromGlobalId(v).id);
                                break;
                            case ArgumentTypes_1.default.Equal:
                            case ArgumentTypes_1.default.NotEqual:
                            default:
                                arg.value = graphql_relay_1.fromGlobalId(args.where[whereArgName]).id;
                        }
                        break;
                    case AttributeTypes_1.default.Collection:
                        arg.value = args.where[whereArgName].map((v) => graphql_relay_1.fromGlobalId(v).id);
                        break;
                    default:
                        arg.value = args.where[whereArgName];
                }
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
exports.default = Resolver;
