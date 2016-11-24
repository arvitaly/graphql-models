export default function fail(obj1: { name, getFields }, obj2: { name, getFields }) {
    return `GraphQL objects not equal: 
        Object1:
            name: ${obj1.name},
            fields: ${ JSON.stringify(obj1.getFields())}
        Object2:
            name: ${obj2.name},
            fields: ${JSON.stringify(obj2.getFields())}
    `;
};
