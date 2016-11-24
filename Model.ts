import {
    GraphQLBoolean,
    GraphQLFieldConfigMap,
    GraphQLFloat,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import AttributeTypes from "./AttributeTypes";
import Collector from "./Collector";
import { CollectionAttribute, ModelAttribute, ModelConfig } from "./typings";
class Model {
    protected baseType: GraphQLObjectType;
    protected creationType: GraphQLObjectType;
    constructor(public config: ModelConfig, protected collector: Collector) { }
    public getBaseType() {
        if (!this.baseType) {
            this.baseType = this.generateBaseType();
        }
        return this.baseType;
    }
    protected generateBaseType() {
        let fields: GraphQLFieldConfigMap<any> = {};
        this.config.attributes.map((attr) => {
            let graphQLType;
            switch (attr.type) {
                case AttributeTypes.Date:
                case AttributeTypes.String:
                    graphQLType = GraphQLString;
                    break;
                case AttributeTypes.Float:
                    graphQLType = GraphQLFloat;
                    break;
                case AttributeTypes.Integer:
                    graphQLType = GraphQLInt;
                    break;
                case AttributeTypes.Boolean:
                    graphQLType = GraphQLBoolean;
                    break;
                case AttributeTypes.Model:
                    graphQLType = this.collector.getModel((attr as ModelAttribute).modelId).getBaseType();
                    break;
                case AttributeTypes.Collection:
                    graphQLType = this.collector.getModel((attr as CollectionAttribute).modelId).getBaseType();
                    graphQLType = new GraphQLList(graphQLType);
                    break;
                default:
                    throw new Error("Unknown attribute type " + (attr as any).type + " of model " + this.config.id);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new GraphQLObjectType({
            name: this.config.name || this.config.id.charAt(0).toUpperCase() + this.config.id.substr(1),
            fields,
        });
    };
}
export default Model;
