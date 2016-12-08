import {
    FieldNode, FragmentSpreadNode, GraphQLResolveInfo,
    InlineFragmentNode, SelectionNode, SelectionSetNode,
} from "graphql";
export type Field = {
    name: string;
    fields: Fields;
};
export type Fields = Field[];
class GraphQLResolveInfoParser {
    protected fields: Fields;
    constructor(public info: GraphQLResolveInfo) {

    }
    public getFields() {
        if (!this.fields) {
            this.fields = this.parseAllFields();
        }
        return this.fields;
    }
    public getNodeFields() {
        return this.getFields()[0].fields;
    }
    public getQueryOneFields() {
        return this.getFields().find((f) => f.name === "viewer").fields[0].fields;
    }
    public getQueryConnectionFields() {
        return this.getFieldsForConnection(this.getFields().find((f) => f.name === "viewer").fields[0]);
    }
    public getMutationPayloadFields() {
        return this.getFields()[0].fields[0].fields;
    }
    public getFieldsForConnection(field: Field) {
        return field.fields.find((f) => f.name === "edges").fields.find((f) => f.name === "node").fields;
    }
    protected parseAllFields() {
        return this.parseSelectionSetNode(this.info.operation.selectionSet);
    }
    protected parseSelectionSetNode(node: SelectionSetNode): Field[] {
        let fields: Field[] = [];
        node.selections.map((childNode) => {
            const field = this.parseSelectionNode(childNode);
            if (field.name === null) {
                fields = fields.concat(field.fields);
            } else {
                fields.push(field);
            }
        });
        return fields;
    }
    protected parseFieldNode(node: FieldNode): Field {
        return {
            name: node.name.value,
            fields: node.selectionSet ? this.parseSelectionSetNode(node.selectionSet) : [],
        };
    }
    protected parseFragmentSpreadNode(node: FragmentSpreadNode): Field {
        return {
            name: null,
            fields: this.parseSelectionSetNode(this.info.fragments[node.name.value].selectionSet),
        };
    }
    protected parseInlineFragmentNode(node: InlineFragmentNode): Field {
        return {
            name: null,
            fields: this.parseSelectionSetNode(node.selectionSet),
        };
    }
    protected parseSelectionNode(node: SelectionNode): Field {
        switch (node.kind) {
            case "Field":
                return this.parseFieldNode(node);
            case "FragmentSpread":
                return this.parseFragmentSpreadNode(node);
            case "InlineFragment":
                return this.parseInlineFragmentNode(node);
            default:
        }
    }
};
export default GraphQLResolveInfoParser;
