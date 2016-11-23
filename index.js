"use strict";
const graphql_1 = require("graphql");
const AttributeTypes_1 = require("./AttributeTypes");
exports.AttributeTypes = AttributeTypes_1.default;
class Collector {
    constructor(models) {
        this.models = models;
        this.types = {};
    }
    getType(id) {
        if (!this.types[id]) {
            this.types[id] = this.generateType(id);
        }
        return this.types[id];
    }
    generateType(id) {
        const model = this.getModel(id);
        let fields = {};
        model.attributes.map((attr) => {
            let graphQLType;
            switch (attr.type) {
                case exports.AttributeTypes.Date:
                case exports.AttributeTypes.String:
                    graphQLType = graphql_1.GraphQLString;
                    break;
                case exports.AttributeTypes.Float:
                    graphQLType = graphql_1.GraphQLFloat;
                    break;
                case exports.AttributeTypes.Integer:
                    graphQLType = graphql_1.GraphQLInt;
                    break;
                case exports.AttributeTypes.Boolean:
                    graphQLType = graphql_1.GraphQLBoolean;
                    break;
                case exports.AttributeTypes.Model:
                    graphQLType = this.getType(attr.modelId);
                    break;
                case exports.AttributeTypes.Collection:
                    graphQLType = this.getType(attr.modelId);
                    graphQLType = new graphql_1.GraphQLList(graphQLType);
                    break;
                default:
                    throw new Error("Unknown attribute type " + attr.type + " of model " + id);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new graphql_1.GraphQLObjectType({
            name: model.name || model.id,
            fields,
        });
    }
    ;
    getModel(id) {
        const models = this.models.filter((model) => model.id === id);
        if (models.length === 0) {
            throw new Error("Unknown model " + id);
        }
        return models[0];
    }
    getTypes() {
        this.models.map((model) => this.getType(model.id));
        return this.types;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (models) => {
    let types = {};
    const collector = new Collector(models);
    return collector.getTypes();
};
