"use strict";
class GraphQLResolveInfoParser {
    constructor(info) {
        this.info = info;
    }
    getFields() {
        if (!this.fields) {
            this.fields = this.parseAllFields();
        }
        return this.fields;
    }
    getNodeFields() {
        return this.getFields()[0].fields;
    }
    getQueryOneFields() {
        return this.getFields().find((f) => f.name === "viewer").fields[0].fields;
    }
    getQueryConnectionFields() {
        return this.getFieldsForConnection(this.getFields().find((f) => f.name === "viewer").fields[0]);
    }
    getMutationPayloadFields() {
        return this.getFields()[0].fields[0].fields;
    }
    getFieldsForConnection(field) {
        return field.fields.find((f) => f.name === "edges").fields.find((f) => f.name === "node").fields;
    }
    parseAllFields() {
        return this.parseSelectionSetNode(this.info.operation.selectionSet);
    }
    parseSelectionSetNode(node) {
        let fields = [];
        node.selections.map((childNode) => {
            const field = this.parseSelectionNode(childNode);
            if (field.name === null) {
                fields = fields.concat(field.fields);
            }
            else {
                fields.push(field);
            }
        });
        return fields;
    }
    parseFieldNode(node) {
        return {
            name: node.name.value,
            fields: node.selectionSet ? this.parseSelectionSetNode(node.selectionSet) : [],
        };
    }
    parseFragmentSpreadNode(node) {
        return {
            name: null,
            fields: this.parseSelectionSetNode(this.info.fragments[node.name.value].selectionSet),
        };
    }
    parseInlineFragmentNode(node) {
        return {
            name: null,
            fields: this.parseSelectionSetNode(node.selectionSet),
        };
    }
    parseSelectionNode(node) {
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
}
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GraphQLResolveInfoParser;
//# sourceMappingURL=GraphQLResolveInfoParser.js.map