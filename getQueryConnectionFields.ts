import { Field } from "graphql-fields-info";
export default function getQueryConnectionFields(fields: Field[]) {
    return fields.map((field) => {
        const edgesField = field.fields.find((n) => n.name === "edges");
        if (!edgesField) {
            return field;
        } else {
            const nodeField = edgesField.fields.find((n) => n.name === "node");
            if (!nodeField) {
                throw new Error("Not found node field");
            }
            const newField: Field = {
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
