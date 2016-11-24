"use strict";
const graphql_1 = require("graphql");
const AttributeTypes_1 = require("./AttributeTypes");
class Model {
    constructor(config, collector) {
        this.config = config;
        this.collector = collector;
        this.name = this.config.name || this.config.id.charAt(0).toUpperCase() + this.config.id.substr(1);
        let idAttr;
        this.attributes = this.config.attributes.map((attrConfig) => {
            const attr = {
                name: attrConfig.name,
                type: attrConfig.type,
                required: typeof (attrConfig.required) !== "undefined" ? attrConfig.required : false,
            };
            if (attrConfig.primaryKey === true) {
                this.primaryKeyAttribute = attr;
            }
            if (attrConfig.name.toLowerCase() === "id") {
                idAttr = attr;
            }
            if (!this.primaryKeyAttribute) {
                if (idAttr) {
                    this.primaryKeyAttribute = idAttr;
                }
                else {
                    throw new Error("Not found primary key attribute");
                }
            }
            return attr;
        });
    }
    getPrimaryKey() {
        return this.primaryKeyAttribute;
    }
    getCreationType() {
        if (!this.creationType) {
            this.creationType = this.generateCreationType();
        }
        return this.creationType;
    }
    getBaseType() {
        if (!this.baseType) {
            this.baseType = this.generateBaseType();
        }
        return this.baseType;
    }
    generateCreationType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                graphQLType = this.collector.getModel(attr.modelId).getBaseType();
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                graphQLType = this.collector.getModel(attr.modelId).getBaseType();
                graphQLType = new graphql_1.GraphQLList(graphQLType);
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
                fields[attr.name] = { type: attr.required ? new graphql_1.GraphQLNonNull(graphQLType) : graphQLType };
            }
        });
        return new graphql_1.GraphQLInputObjectType({
            name: this.name + "Creation",
            fields: {},
        });
    }
    generateBaseType() {
        let fields = {};
        this.attributes.map((attr) => {
            let graphQLType;
            if (attr.type === AttributeTypes_1.default.Model) {
                graphQLType = this.collector.getModel(attr.modelId).getBaseType();
            }
            else if (attr.type === AttributeTypes_1.default.Collection) {
                graphQLType = this.collector.getModel(attr.modelId).getBaseType();
                graphQLType = new graphql_1.GraphQLList(graphQLType);
            }
            else {
                graphQLType = scalarTypeToGraphQL(attr.type);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new graphql_1.GraphQLObjectType({
            name: this.name + "Type",
            fields,
        });
    }
}
function scalarTypeToGraphQL(type) {
    let graphQLType;
    switch (type) {
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
        default:
            throw new Error("Unknown scalar type " + type);
    }
    return graphQLType;
}
exports.scalarTypeToGraphQL = scalarTypeToGraphQL;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Model;
