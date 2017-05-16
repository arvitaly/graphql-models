"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getQueryConnectionFields(fields) {
    return fields.map((field) => {
        const edgesField = field.fields.find((n) => n.name === "edges");
        if (!edgesField) {
            return field;
        }
        else {
            const nodeField = edgesField.fields.find((n) => n.name === "node");
            if (!nodeField) {
                throw new Error("Not found node field");
            }
            const newField = {
                args: field.args,
                isConnection: true,
                isFragment: false,
                isInterface: false,
                isNode: false,
                name: field.name,
                type: field.type,
                typeName: field.typeName,
                fields: nodeField.fields,
                node: field.node,
            };
            return newField;
        }
    });
}
exports.default = getQueryConnectionFields;
