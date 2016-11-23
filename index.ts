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
import { Attribute, AttributeType, CollectionAttribute, GraphQLTypes, Model, ModelAttribute } from "./typings";
class Collector {
    protected types: { [typeName: string]: GraphQLObjectType } = {};
    constructor(protected models: Model[]) { }
    public getType(id: string): GraphQLObjectType {
        if (!this.types[id]) {
            this.types[id] = this.generateType(id);
        }
        return this.types[id];
    }
    public generateType(id: string) {
        const model = this.getModel(id);
        let fields: GraphQLFieldConfigMap<any> = {};
        model.attributes.map((attr) => {
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
                    graphQLType = this.getType((attr as ModelAttribute).modelId);
                    break;
                case AttributeTypes.Collection:
                    graphQLType = this.getType((attr as CollectionAttribute).modelId);
                    graphQLType = new GraphQLList(graphQLType);
                    break;
                default:
                    throw new Error("Unknown attribute type " + (attr as any).type + " of model " + id);
            }
            fields[attr.name] = { type: graphQLType };
        });
        return new GraphQLObjectType({
            name: model.name || model.id,
            fields,
        });
    };
    public getModel(id: string): Model {
        const models = this.models.filter((model) => model.id === id);
        if (models.length === 0) {
            throw new Error("Unknown model " + id);
        }
        return models[0];
    }
    public getTypes() {
        this.models.map((model) => this.getType(model.id));
        return this.types;
    }
}
export default (models: Model[]): GraphQLTypes => {
    let types: GraphQLTypes = {};
    const collector = new Collector(models);
    return collector.getTypes();
};
