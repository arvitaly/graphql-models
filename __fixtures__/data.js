"use strict";
const Adapter_1 = require("./../Adapter");
const ArgumentTypes_1 = require("./../ArgumentTypes");
const Publisher_1 = require("./../Publisher");
const animalsName = "animals";
const usersName = "users";
const postsName = "posts";
exports.data = {
    animals: [{
            id: 1,
            name: "Rex",
            age: 6,
            Weight: 10.1,
            birthday: new Date("Wed, 10 Nov 2010 17:00:00 GMT"),
            isCat: false,
        }, {
            id: 2,
            name: "Felix",
            age: 3,
            Weight: 13.1,
            birthday: new Date("Thu, 28 Feb 2013 17:00:00 GMT"),
            isCat: false,
        }, {
            id: 3,
            name: "Jeck",
            age: 8,
            Weight: 2.1,
            birthday: new Date("Mon, 05 May 2008 17:00:00 GMT"),
            isCat: false,
        }, {
            id: 4,
            name: "Morph",
            age: 7,
            Weight: 12.1,
            birthday: new Date("Fri, 11 Dec 2009 17:00:00 GMT"),
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
function createAnimal(row) {
    const newId = exports.data[animalsName][exports.data[animalsName].length - 1].id + 1;
    return Object.assign({
        id: newId,
        name: "Name" + newId,
        age: 1000 + newId,
        Weight: 1000.1 + newId,
        birthday: new Date(+new Date("Wed, 10 Nov 2100 17:00:00 GMT") + newId),
        isCat: newId % 2 === 0,
    }, row);
}
exports.createAnimal = createAnimal;
function createUser(row) {
    const newId = exports.data[usersName][exports.data[usersName].length - 1].key + 1.17;
    return Object.assign({
        key: newId,
        name: "UserName" + newId,
    }, row);
}
exports.createUser = createUser;
function createPost(row) {
    const newId = exports.data[postsName][exports.data[postsName].length - 1].id + 1;
    return Object.assign({
        id: newId,
    }, row);
}
exports.createPost = createPost;
const subscribers = [];
// tslint:disable max-classes-per-file
class DataAdapter extends Adapter_1.default {
    create(modelId, row) {
        const newRow = Object.assign({}, row);
        switch (modelId) {
            case "animal":
                exports.data[modelId.toLowerCase() + "s"].push(createAnimal(row));
                break;
            case "user":
                exports.data[modelId.toLowerCase() + "s"].push(createUser(row));
                break;
            case "post":
                exports.data[modelId.toLowerCase() + "s"].push(createPost(row));
                break;
            default:
                exports.data[modelId.toLowerCase() + "s"].push(newRow);
        }
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
        const result = Object.assign({}, exports.data[modelId.toLowerCase() + "s"].find((a) => modelId === "user" ?
            "" + a.key === "" + id
            : "" + a.id === "" + id));
        return result;
    }
    populate(modelId, source, attr) {
        if (modelId === "post" && attr === "animals") {
            return source.animals.map((id) => {
                return this.findOne("animal", id);
            });
        }
        if (modelId === "user" && attr === "pets") {
            return source.pets.map((id) => {
                return this.findOne("animal", id);
            });
        }
    }
    createOne(modelId, row) {
        switch (modelId) {
            case "animal":
                const newRow = createAnimal(row);
                exports.data[modelId.toLowerCase() + "s"].push(newRow);
                return newRow;
            case "user":
                const newUserRow = createUser(row);
                exports.data[modelId.toLowerCase() + "s"].push(newUserRow);
                return newUserRow;
            case "post":
                const newPostRow = createPost(row);
                exports.data[modelId.toLowerCase() + "s"].push(newPostRow);
                return newPostRow;
            default:
        }
    }
    updateOne(modelId, id, updated) {
        const oldRow = exports.data[modelId.toLowerCase() + "s"].find((a) => modelId === "user" ?
            "" + a.key === "" + id
            : "" + a.id === "" + id);
        Object.assign(oldRow, updated);
        return oldRow;
    }
    findMany(modelId, findCriteria) {
        let result = exports.data[modelId.toLowerCase() + "s"].map((row) => Object.assign({}, row));
        if (findCriteria && findCriteria.where) {
            findCriteria.where.map((arg) => {
                switch (arg.type) {
                    case ArgumentTypes_1.default.Contains:
                        result = result.filter((row) => {
                            return row[arg.attribute.name].indexOf(arg.value) > -1;
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