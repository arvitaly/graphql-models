"use strict";
const graphql_1 = require("graphql");
const AttributeTypes_1 = require("./AttributeTypes");
class Model {
    constructor(config, collector) {
        this.config = config;
        this.collector = collector;
    }
    getBaseType() {
        if (!this.baseType) {
            this.baseType = this.generateBaseType();
        }
        return this.baseType;
    }
    generateBaseType() {
        let fields = {};
        this.config.attributes.map((attr) => {
            let graphQLType;
            switch (attr.type) {
                case AttributeTypes_1.default.Date:
                case AttributeTypes_1.default.String:
                    graphQLType = graphql_1.GraphQLString;
                    break;
                case AttributeTypes_1.default.Float:
                    graphQLType = graphql_1.GraphQLFloat;
                    break;
                case AttributeTypes_1.default.Integer:
                    graphQLType = graphql_1.GraphQLInt;
                    break;
                case AttributeTypes_1.default.Boolean:
                    graphQLType = graphql_1.GraphQLBoolean;
                    break;
                case AttributeTypes_1.default.Model:
                    graphQLType = this.collector.getModel(attr.modelId).getBaseType();
                    break;
                case AttributeTypes_1.default.Collection:
                    graphQLType = this.collector.getModel(attr.modelId).getBaseType();
                    graphQLType = new graphql_1.GraphQLList(graphQLType);
                    break;
                default:
                    throw new Error("Unknown attribute type " + attr.type + " of model " + this.config.id);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new graphql_1.GraphQLObjectType({
            name: this.config.name || this.config.id.charAt(0).toUpperCase() + this.config.id.substr(1),
            fields,
        });
    }
    ;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Model;
