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
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const __1 = require("./../..");
const collection1_1 = require("./../../__fixtures__/collection1");
class Tester {
    constructor() {
        this.adapter = {
            findOne: jest.fn(),
            findMany: jest.fn(),
            hasNextPage: jest.fn(),
            hasPreviousPage: jest.fn(),
            createOne: jest.fn(),
            findOrCreateOne: jest.fn(),
            updateOne: jest.fn(),
        };
        this.callbacks = {
            onUpdate: jest.fn(),
            onCreate: jest.fn(),
            onDelete: jest.fn(),
        };
        this.toGlobalId = graphql_relay_1.toGlobalId;
        this.ids = {
            animal: 1,
            post: 1,
            user: 1,
        };
        this.data = {
            animal: [],
            post: [],
            user: [],
        };
        this.resolver = new __1.Resolver(this.adapter, this.callbacks, {});
        this.schema = new __1.Schema(this.resolver);
        this.collection = new __1.Collection([collection1_1.animalModel, collection1_1.postModel, collection1_1.userModel], {
            interfaces: [this.schema.getNodeDefinition().nodeInterface],
            resolveFn: this.resolver.resolve.bind(this.resolver),
        });
        this.schema.setCollection(this.collection);
        this.resolver.setCollection(this.collection);
        this.graphqlSchema = this.schema.getGraphQLSchema();
    }
    query(q) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield graphql_1.graphql(this.graphqlSchema, q);
            if (result.errors) {
                result.errors.map((e) => {
                    console.error(e);
                    console.error(e.stack);
                });
                throw new Error("Invalid query");
            }
            return result.data;
        });
    }
    toGraphQL(type, row) {
        const newRow = Object.assign({}, row);
        newRow.id = this.toGlobalId(type, row);
        return newRow;
    }
    generateModel(modelName, defaults = {}) {
        const row = {};
        const attrs = modelName === "animal" ? collection1_1.animalModel.attributes :
            (modelName === "post" ? collection1_1.postModel.attributes : collection1_1.userModel.attributes);
        const id = this.ids[modelName];
        attrs.map((attr) => {
            if (attr.primaryKey) {
                row[attr.name] = id;
                return;
            }
            switch (attr.type) {
                case __1.AttributeTypes.ID:
                    row[attr.name] = id;
                    break;
                case __1.AttributeTypes.String:
                    row[attr.name] = "Str" + id;
                    break;
                case __1.AttributeTypes.Float:
                    row[attr.name] = 1000.1 + id;
                    break;
                case __1.AttributeTypes.Integer:
                    row[attr.name] = 100 + id;
                    break;
                case __1.AttributeTypes.Boolean:
                    row[attr.name] = true;
                    break;
                case __1.AttributeTypes.Date:
                    row[attr.name] = new Date(id + (+new Date("Fri, 01 Jan 2010 00:00:00 GMT")));
                    break;
                case __1.AttributeTypes.JSON:
                    row[attr.name] = { test: id };
                    break;
            }
        });
        this.ids[modelName]++;
        return Object.assign({}, row, defaults);
    }
    getAttributes(model) {
        const attrs = {};
        model.attributes.map((attr) => {
            attrs[attr.name] = {
                type: attr.type,
                required: !!attr.required,
                primaryKey: !!attr.primaryKey,
                unique: false,
            };
            if (attr.type === "model") {
                delete attrs[attr.name].type;
                attrs[attr.name].model = attr.model;
            }
            if (attr.type === "collection") {
                delete attrs[attr.name].type;
                attrs[attr.name].collection = attr.model;
            }
        });
        return attrs;
    }
}
exports.default = Tester;
