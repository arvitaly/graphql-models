import { FieldNode, GraphQLResolveInfo, SelectionSetNode } from "graphql";
import { Connection, fromGlobalId, toGlobalId } from "graphql-relay";
import Adapter from "./Adapter";
import ArgumentTypes from "./ArgumentTypes";
import AttributeTypes from "./AttributeTypes";
import Collection from "./Collection";
import InfoParser, { Field as ResolveSelectionField } from "./GraphQLResolveInfoParser";
import Model, { idArgName, inputArgName } from "./Model";
import Publisher from "./Publisher";
import ResolveTypes from "./ResolveTypes";
import {
    Argument, Callbacks, FindCriteria, ModelID, PopulateFields,
    ResolveOpts, ResolveType, SubscriptionID,
} from "./typings";
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
            case ResolveTypes.QueryOne:
                return this.resolveQueryOne(modelId, opts);
            case ResolveTypes.QueryConnection:
                return this.resolveQueryConnection(modelId, opts);
            case ResolveTypes.MutationCreate:
                return this.resolveMutationCreate(modelId, opts);
            case ResolveTypes.MutationUpdate:
                return this.resolveMutationUpdate(modelId, opts);
            default:
                throw new Error("Unsupported resolve type: " + type);
        }
    }
    public resolveViewer(opts: ResolveOpts) {
        return {};
    }
    public async resolveNode(_: ModelID, opts: ResolveOpts) {
        const {id, type} = fromGlobalId(opts.source);
        const modelId = type.replace(/Type$/gi, "").toLowerCase();
        return this.resolveOne(modelId, opts.source, opts.resolveInfo.getNodeFields(), opts.resolveInfo);
    }
    public async resolveQueryOne(modelId: ModelID, opts: ResolveOpts) {
        const result = await this.resolveOne(modelId, opts.args[idArgName],
            opts.resolveInfo.getQueryOneFields(),
            opts.resolveInfo);
        if (!result) {
            return null;
        }
        if (opts.context && opts.context.subscriptionId) {
            this.subscribeOne(opts.context.subscriptionId, modelId, opts.args[idArgName], opts);
        }
        return result;
    }
    public async resolveOne(modelId: ModelID, globalId, fields: ResolveSelectionField[], resolveInfo: InfoParser) {
        const id = fromGlobalId(globalId).id;
        const result = this.adapter.findOne(modelId, id, this.getPopulates(modelId, fields));
        return await this.resolveRow(modelId, result);
    }
    public resolveRow(modelId: ModelID, row) {
        const model = this.collection.get(modelId);
        model.attributes.map((attr) => {
            if (typeof (row[attr.name]) === "undefined") {
                return;
            }
            if (attr.type === AttributeTypes.Date) {
                row[attr.name] = (row[attr.name] as Date).toUTCString();
            }
            if (attr.realName === "id") {
                row._id = row.id;
            }
            if (attr.type === AttributeTypes.Model) {
                row[attr.name] = this.resolveRow(attr.model, row[attr.name]);
            }
            if (attr.type === AttributeTypes.Collection) {
                const edges = row[attr.name].map((r) => {
                    return {
                        cursor: null,
                        node: this.resolveRow(attr.model, r),
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
        row[idArgName] = toGlobalId(model.getNameForGlobalId(), row[model.getPrimaryKeyAttribute().realName]);
        return row;
    }
    public async resolveQueryConnection(modelId: ModelID, opts: ResolveOpts): Promise<Connection<any>> {
        const model = this.collection.get(modelId);
        const findCriteria: FindCriteria = this.argsToFindCriteria(modelId, opts.args);
        const fields = opts.resolveInfo.getQueryConnectionFields();
        const rows = await this.adapter.findMany(modelId, findCriteria, this.getPopulates(modelId, fields));
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
                    node: this.resolveRow(modelId, row),
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
    public async resolveMutationCreate(modelId: string, opts: ResolveOpts) {
        const id = await this.createOne(modelId, opts.args);
        const row = await this.resolveOne(modelId, id,
            opts.resolveInfo.getMutationPayloadFields(), opts.resolveInfo);
        return {
            [this.collection.get(modelId).queryName]: row,
        };
    }
    public async resolveMutationUpdate(modelId: string, opts: ResolveOpts) {
        const model = this.collection.get(modelId);
        const updating: any = {};
        let id;
        await Promise.all(Object.keys(opts.args).map((updateArgName) => {
            let arg = model.getUpdateArguments().find((a) => a.name === updateArgName);
            arg.value = opts.args[updateArgName];
            return arg;
        }).map(async (arg) => {
            switch (arg.type) {
                case ArgumentTypes.UpdateSetter:
                    if (arg.attribute.type === AttributeTypes.Date) {
                        updating[arg.attribute.name] = new Date(arg.value[arg.attribute.name]);
                    } else {
                        updating[arg.attribute.name] = arg.value[arg.attribute.name];
                    }
                    break;
                case ArgumentTypes.CreateArgument:
                    updating[arg.attribute.name] = fromGlobalId(
                        await this.createOne(arg.attribute.model, arg.value),
                    ).id;
                    break;
                case ArgumentTypes.CreateSubCollection:
                    const childModel = arg.attribute.model;
                    updating[arg.attribute.name] = await Promise.all(arg.value.map(async (v) => {
                        return fromGlobalId(await this.createOne(childModel, v)).id;
                    }));
                    break;
                case ArgumentTypes.Equal:
                    id = fromGlobalId(arg.value).id;
                    break;
                default:
                    throw new Error("Unsupported argument type " + arg.type + " for update");
            }
        }));
        const updated = await this.adapter.updateOne(model.id, id, updating);

        const row = await this.resolveOne(modelId,
            toGlobalId(model.getNameForGlobalId(), updated[model.getPrimaryKeyAttribute().realName]),
            opts.resolveInfo.getMutationPayloadFields(), opts.resolveInfo);
        return {
            [this.collection.get(modelId).queryName]: row,
        };
    }
    public async createOne(modelId: string, args) {
        const model = this.collection.get(modelId);
        let createArgs = Object.keys(args).map((createArgName) => {
            let arg = model.getCreateArguments().find((a) => a.name === createArgName);
            arg.value = args[createArgName];
            return arg;
        });
        const submodels = await Promise.all(
            createArgs.filter((arg) => arg.type === ArgumentTypes.CreateSubModel).map(async (arg) => {
                const childModel = arg.attribute.model;
                return {
                    name: arg.attribute.name,
                    value: fromGlobalId(await this.createOne(childModel, arg.value)).id,
                    attribute: arg.attribute,
                    type: ArgumentTypes.CreateArgument,
                    graphQLType: null,
                };
            }),
        );
        createArgs = createArgs.concat(submodels);
        const subcollections = await Promise.all(
            createArgs.filter((arg) => arg.type === ArgumentTypes.CreateSubCollection).map(async (arg) => {
                const childModel = arg.attribute.model;
                const ids = await Promise.all(arg.value.map(async (row) => {
                    return fromGlobalId(await this.createOne(childModel, row)).id;
                }));
                return {
                    name: arg.attribute.name,
                    value: ids,
                    attribute: arg.attribute,
                    type: ArgumentTypes.CreateArgument,
                    graphQLType: null,
                };
            }),
        );
        createArgs = createArgs.concat(subcollections);
        let creating: any = {};
        createArgs.map((arg) => {
            if (arg.attribute.type === AttributeTypes.Date) {
                creating[arg.attribute.name] = new Date(arg.value);
            } else {
                creating[arg.attribute.name] = arg.value;
            }
        });
        const created = await this.adapter.createOne(modelId, creating);
        return toGlobalId(modelId, "" + created[model.getPrimaryKeyAttribute().realName]);
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
    protected getPopulates(modelId: ModelID, fields: ResolveSelectionField[]): PopulateFields {
        const model = this.collection.get(modelId);
        return model.attributes.filter((attr) => {
            return attr.type === AttributeTypes.Model || attr.type === AttributeTypes.Collection;
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
    protected equalRowToFindCriteria(modelId: ModelID, row: any, findCriteria: FindCriteria) {
        // if all criteria not false
        return !findCriteria.where.some((arg) => {
            const rowValue = row[arg.attribute.name];
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
