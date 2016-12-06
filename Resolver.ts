import { } from "graphql";
import { Connection, fromGlobalId, toGlobalId } from "graphql-relay";
import Adapter from "./Adapter";
import ArgumentTypes from "./ArgumentTypes";
import AttributeTypes from "./AttributeTypes";
import Collection from "./Collection";
import Model, { idArgName } from "./Model";
import Publisher from "./Publisher";
import ResolveTypes from "./ResolveTypes";
import { Callbacks, FindCriteria, ModelID, ResolveOpts, ResolveType, SubscriptionID } from "./typings";
class Resolver {
    public collection: Collection;
    protected subscribes: {
        [index: string]: {
            modelId: string;
            ids: string[];
            findCriteria?: FindCriteria;
            opts: ResolveOpts;
        };
    } = {};
    constructor(public adapter: Adapter, protected callbacks: Callbacks, public publisher: Publisher) {

    }
    public setCollection(coll: Collection) {
        this.collection = coll;
        this.collection.map((model) => {
            this.callbacks.onUpdate(model.id, (updated) => {
                const globalId = toGlobalId(model.getNameForGlobalId(),
                    updated[model.getPrimaryKeyAttribute().realName]);
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
                    } else {
                        if (globalId === subscribe.ids[0]) {
                            // publish update
                            this.publisher.publishUpdate(subscriptionId, model.id, updated, subscribe.opts.context);
                        }
                    }
                });
            });
            this.callbacks.onCreate(model.id, (created) => {
                const globalId = toGlobalId(model.getNameForGlobalId(),
                    created[model.getPrimaryKeyAttribute().realName]);
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
        return this.collection.get(modelId).prepareRow(result);
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
        if (opts.context && opts.context.subscriptionId) {
            this.subscribeOne(opts.context.subscriptionId, modelId, opts.args[idArgName], opts);
        }
        return model.prepareRow(result);
    }
    public async resolveQueryConnection(modelId: ModelID, opts: ResolveOpts): Promise<Connection<any>> {
        const model = this.collection.get(modelId);
        const findCriteria: FindCriteria = this.argsToFindCriteria(modelId, opts.args);
        const rows = await this.adapter.findMany(modelId, findCriteria);
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
                    node: model.prepareRow(row),
                };
            });
            result = {
                edges,
                pageInfo: {
                    hasNextPage: await this.adapter.hasNextPage(modelId, findCriteria),
                    hasPreviousPage: await this.adapter.hasPreviousPage(modelId, findCriteria),
                    startCursor: edges[0].node.id,
                    endCursor: edges[edges.length - 1].node.id,
                },
            };
        }
        if (opts.context && opts.context.subscriptionId) {
            this.subscribeConnection(opts.context.subscriptionId, modelId,
                result.edges.map((r) => { return r.node.id; }),
                findCriteria, opts);
        }
        return result;
    }
    public resolveModel(modelId: ModelID, opts: ResolveOpts) {
        return this.resolveNode(modelId, opts);
    }
    public async resolveConnection(modelId: ModelID, opts: ResolveOpts): Promise<Connection<any>> {
        const rows = await this.adapter.populate(modelId, opts.source);
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
    public subscribeOne(subscriptionId: string, modelId: ModelID, globalId: string, opts: ResolveOpts) {
        this.subscribes[subscriptionId] = {
            modelId,
            ids: [globalId],
            opts,
        };
    }
    public subscribeConnection(
        subscriptionId: string,
        modelId: ModelID,
        ids: string[],
        findCriteria: FindCriteria,
        opts: ResolveOpts) {
        this.subscribes[subscriptionId] = {
            ids,
            findCriteria,
            modelId,
            opts,
        };
    }
    protected equalRowToFindCriteria(modelId: ModelID, row: any, findCriteria: FindCriteria) {
        // if all criteria not false
        return !findCriteria.where.some((arg) => {
            const rowValue = row[arg.attribute];
            switch (arg.type) {
                case ArgumentTypes.Contains:
                    return rowValue.indexOf(arg.value) === -1;
                case ArgumentTypes.NotContains:
                    return rowValue.indexOf(arg.value) > -1;
                case ArgumentTypes.StartsWith:
                    return (rowValue as string).substr(0, arg.value.length) !== arg.value;
                case ArgumentTypes.NotStartsWith:
                    return (rowValue as string).substr(0, arg.value.length) === arg.value;
                case ArgumentTypes.GreaterThan:
                    return (rowValue as number) > arg.value;
                default:
                    throw new Error("Unsupported argument type " + arg.type);
            }
        });
    }
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
}
export default Resolver;
