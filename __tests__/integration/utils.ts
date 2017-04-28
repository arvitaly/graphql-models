import { graphql, GraphQLSchema } from "graphql";
import { toGlobalId } from "graphql-relay";
import { AttributeTypes, Collection, ModelConfig, Resolver, Schema } from "./../..";
import { animalModel, postModel, userModel } from "./../../__fixtures__/collection1";
class Tester {
    public adapter = {
        findOne: jest.fn(),
        findMany: jest.fn(),
        hasNextPage: jest.fn(),
        hasPreviousPage: jest.fn(),
        createOne: jest.fn(),
        findOrCreateOne: jest.fn(),
        updateOne: jest.fn(),
    };
    public callbacks = {
        onUpdate: jest.fn(),
        onCreate: jest.fn(),
        onDelete: jest.fn(),
    };
    public resolver: Resolver;
    public schema: Schema;
    public collection: Collection;
    public graphqlSchema: GraphQLSchema;
    public toGlobalId = toGlobalId;
    protected ids: { [index: string]: number } = {
        animal: 1,
        post: 1,
        user: 1,
    };
    protected data: { [index: string]: any[] } = {
        animal: [],
        post: [],
        user: [],
    };
    constructor() {
        this.resolver = new Resolver(this.adapter, this.callbacks, {} as any);
        this.schema = new Schema(this.resolver);
        this.collection = new Collection([animalModel, postModel, userModel], {
            interfaces: [this.schema.getNodeDefinition().nodeInterface],
            resolveFn: this.resolver.resolve.bind(this.resolver),
        });
        this.schema.setCollection(this.collection);
        this.resolver.setCollection(this.collection);
        this.graphqlSchema = this.schema.getGraphQLSchema();
    }
    public async query(q: string) {
        const result = await graphql(this.graphqlSchema, q);
        if (result.errors) {
            result.errors.map((e) => {
                console.error(e);
                console.error(e.stack);
            });
            throw new Error("Invalid query");
        }
        return result.data;
    }
    public toGraphQL(type: string, row: any) {
        const newRow = Object.assign({}, row);
        newRow.id = this.toGlobalId(type, row);
        return newRow;
    }

    public generateModel(modelName: string, defaults: any = {}) {
        const row = {} as any;
        const attrs = modelName === "animal" ? animalModel.attributes :
            (modelName === "post" ? postModel.attributes : userModel.attributes);
        const id = this.ids[modelName];
        attrs.map((attr) => {
            if (attr.primaryKey) {
                row[attr.name] = id;
                return;
            }
            switch (attr.type) {
                case AttributeTypes.ID:
                    row[attr.name] = id;
                    break;
                case AttributeTypes.String:
                    row[attr.name] = "Str" + id;
                    break;
                case AttributeTypes.Float:
                    row[attr.name] = 1000.1 + id;
                    break;
                case AttributeTypes.Integer:
                    row[attr.name] = 100 + id;
                    break;
                case AttributeTypes.Boolean:
                    row[attr.name] = true;
                    break;
                case AttributeTypes.Date:
                    row[attr.name] = new Date(id + (+ new Date("Fri, 01 Jan 2010 00:00:00 GMT")));
                    break;
                case AttributeTypes.JSON:
                    row[attr.name] = { test: id };
                    break;
            }
        });
        this.ids[modelName]++;
        return Object.assign({}, row, defaults);
    }
    protected getAttributes(model: ModelConfig) {
        const attrs: any = {};
        model.attributes.map((attr) => {
            attrs[attr.name] = {
                type: attr.type,
                required: !!attr.required,
                primaryKey: !!attr.primaryKey,
                unique: false,
            };
            if (attr.type === "model") {
                delete attrs[attr.name].type;
                attrs[attr.name].model = (attr as any).model;
            }
            if (attr.type === "collection") {
                delete attrs[attr.name].type;
                attrs[attr.name].collection = (attr as any).model;
            }
        });
        return attrs;
    }
}

export default Tester;
