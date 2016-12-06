"use strict";
const Adapter_1 = require("./../Adapter");
const ArgumentTypes_1 = require("./../ArgumentTypes");
const Publisher_1 = require("./../Publisher");
const animalsName = "animals";
exports.data = {
    animals: [{
            id: 1,
            name: "Rex",
            age: 6,
            Weight: 10.1,
            birthday: new Date("2010/11/11"),
            isCat: false,
        }, {
            id: 2,
            name: "Felix",
            age: 3,
            Weight: 13.1,
            birthday: new Date("2013/3/1"),
            isCat: false,
        }, {
            id: 3,
            name: "Jeck",
            age: 8,
            Weight: 2.1,
            birthday: new Date("2008/5/6"),
            isCat: false,
        }, {
            id: 4,
            name: "Morph",
            age: 7,
            Weight: 12.1,
            birthday: new Date("2009/12/12"),
            isCat: false,
        }],
    posts: [{
            id: 1,
            owner: 1.5,
            animals: [1, 2, 3],
        }],
    users: [{
            key: 1.5,
            name: "John",
            pets: [2, 3, 4],
        }],
};
function createAnimal() {
    const newId = exports.data[animalsName][exports.data[animalsName].length - 1].id + 1;
    return {
        id: newId,
        name: "Name" + newId,
        age: 1000 + newId,
        Weight: 1000.1 + newId,
        birthday: new Date(+new Date("2100/11/11") + newId),
        isCat: newId % 2 === 0,
    };
}
exports.createAnimal = createAnimal;
const subscribers = [];
// tslint:disable max-classes-per-file
class DataAdapter extends Adapter_1.default {
    create(modelId, row) {
        const newRow = Object.assign({}, row);
        exports.data[modelId.toLowerCase() + "s"].push(newRow);
        subscribers.filter((s) => {
            return s.type === "create" && s.model === modelId;
        }).map((s) => s.callback(newRow));
    }
    update(modelId, id, row) {
        let oldRow = exports.data[modelId.toLowerCase() + "s"].find((r) => r.id === id);
        Object.assign(oldRow, row);
        subscribers.filter((s) => {
            return s.type === "update" && s.model === modelId;
        }).map((s) => s.callback(oldRow));
    }
    findOne(modelId, id) {
        return Object.assign({}, exports.data[modelId.toLowerCase() + "s"].find((a) => "" + a.id === "" + id));
    }
    findMany(modelId, findCriteria) {
        let result = exports.data[modelId.toLowerCase() + "s"].map((row) => Object.assign({}, row));
        if (findCriteria && findCriteria.where) {
            findCriteria.where.map((arg) => {
                switch (arg.type) {
                    case ArgumentTypes_1.default.Contains:
                        result = result.filter((row) => {
                            return row[arg.attribute].indexOf(arg.value) > -1;
                        });
                        break;
                    default:
                        throw new Error("Unknown argument type " + arg.type);
                }
            });
        }
        return result;
    }
    hasNextPage(modelId, findCriteria) {
        return true;
    }
    hasPreviousPage(modelId, findCriteria) {
        return true;
    }
}
exports.DataAdapter = DataAdapter;
exports.callbacks = {
    onUpdate: (modelId, cb) => {
        subscribers.push({
            type: "update",
            model: modelId,
            callback: cb,
        });
    },
    onCreate: (modelId, cb) => {
        subscribers.push({
            type: "create",
            model: modelId,
            callback: cb,
        });
    },
    onDelete: (modelId, cb) => {
        subscribers.push({
            type: "delete",
            model: modelId,
            callback: cb,
        });
    },
};
class DataPublisher extends Publisher_1.default {
}
exports.publisher = new DataPublisher();
//# sourceMappingURL=data.js.map