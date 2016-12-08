import Adapter from "./../Adapter";
import ArgumentTypes from "./../ArgumentTypes";
import Model from "./../Model";
import Publisher from "./../Publisher";
import { Callbacks, FindCriteria, ModelID, PopulateFields } from "./../typings";
const animalsName = "animals";
const usersName = "users";
const postsName = "posts";
export const data: { [index: string]: any[] } = {
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
export function createAnimal(row?: any) {
    const newId: number = data[animalsName][data[animalsName].length - 1].id + 1;
    return Object.assign({
        id: newId,
        name: "Name" + newId,
        age: 1000 + newId,
        Weight: 1000.1 + newId,
        birthday: new Date(+new Date("Wed, 10 Nov 2100 17:00:00 GMT") + newId),
        isCat: newId % 2 === 0,
    }, row);
}
export function createUser(row?: any) {
    const newId: number = data[usersName][data[usersName].length - 1].key + 1.17;
    return Object.assign({
        key: newId,
        name: "UserName" + newId,
    }, row);
}
export function createPost(row?: any) {
    const newId: number = data[postsName][data[postsName].length - 1].id + 1;
    return Object.assign({
        id: newId,
    }, row);
}
const subscribers: Array<{
    type: "update" | "create" | "delete";
    model: string;
    callback: (row) => any;
}> = [];
// tslint:disable max-classes-per-file
export class DataAdapter extends Adapter {
    public create(modelId, row) {
        const newRow = Object.assign({}, row);
        switch (modelId) {
            case "animal":
                data[modelId.toLowerCase() + "s"].push(createAnimal(row));
                break;
            case "user":
                data[modelId.toLowerCase() + "s"].push(createUser(row));
                break;
            case "post":
                data[modelId.toLowerCase() + "s"].push(createPost(row));
                break;
            default:
                data[modelId.toLowerCase() + "s"].push(newRow);
        }
        subscribers.filter((s) => {
            return s.type === "create" && s.model === modelId;
        }).map((s) => s.callback(newRow));
    }
    public update(modelId, id: number, row) {
        let oldRow = data[modelId.toLowerCase() + "s"].find((r) => r.id === id);
        Object.assign(oldRow, row);
        subscribers.filter((s) => {
            return s.type === "update" && s.model === modelId;
        }).map((s) => s.callback(oldRow));
    }
    public findOne(modelId, id: number, populates: PopulateFields) {
        const result = Object.assign({}, data[modelId.toLowerCase() + "s"].find((a) => modelId === "user" ?
            "" + a.key === "" + id
            : "" + a.id === "" + id));
        if (modelId === "post") {
            const ownerPopulate = populates.find((p) => p.attribute.name === "owner");
            if (ownerPopulate) {
                result.owner = this.findOne("user", result.owner, ownerPopulate.fields);
            } else {
                delete result.owner;
            }
            const animalsPopulate = populates.find((p) => p.attribute.name === "animals");
            if (animalsPopulate) {
                result.animals = result.animals.map((animalId) => {
                    return this.findOne("animal", animalId, animalsPopulate.fields);
                });
            } else {
                delete result.animals;
            }
        }
        if (modelId === "user") {
            const petsPopulate = populates.find((p) => p.attribute.name === "pets");
            if (petsPopulate) {
                result.pets = result.pets.map((petId) => {
                    return this.findOne("animal", petId, petsPopulate.fields);
                });
            } else {
                delete result.pets;
            }
        }
        return result;
    }
    public createOne(modelId, row: any) {
        switch (modelId) {
            case "animal":
                const newRow = createAnimal(row);
                data[modelId.toLowerCase() + "s"].push(newRow);
                return newRow;
            case "user":
                const newUserRow = createUser(row);
                data[modelId.toLowerCase() + "s"].push(newUserRow);
                return newUserRow;
            case "post":
                const newPostRow = createPost(row);
                data[modelId.toLowerCase() + "s"].push(newPostRow);
                return newPostRow;
            default:
        }
    }
    public updateOne(modelId: ModelID, id: any, updated: any) {
        const oldRow = data[modelId.toLowerCase() + "s"].find((a) => modelId === "user" ?
            "" + a.key === "" + id
            : "" + a.id === "" + id);
        Object.assign(oldRow, updated);
        return oldRow;
    }
    public findMany(modelId, findCriteria: FindCriteria, populates: PopulateFields) {
        let result = data[modelId.toLowerCase() + "s"].map((row) => Object.assign({}, row));
        if (findCriteria && findCriteria.where) {
            findCriteria.where.map((arg) => {
                switch (arg.type) {
                    case ArgumentTypes.Contains:
                        result = result.filter((row) => {
                            return row[arg.attribute.name].indexOf(arg.value) > -1;
                        });
                        break;
                    default:
                        throw new Error("Unknown argument type " + arg.type);
                }
            });
        }
        return result.map((row) => {
            return this.findOne(modelId, modelId === "user" ? row.key : row.id, populates);
        });
    }
    public hasNextPage(modelId, findCriteria: FindCriteria) {
        return true;
    }
    public hasPreviousPage(modelId, findCriteria: FindCriteria) {
        return true;
    }
}
export const callbacks: Callbacks = {
    onUpdate: (modelId: string, cb: (updated) => any) => {
        subscribers.push({
            type: "update",
            model: modelId,
            callback: cb,
        });
    },
    onCreate: (modelId: string, cb: (updated) => any) => {
        subscribers.push({
            type: "create",
            model: modelId,
            callback: cb,
        });
    },
    onDelete: (modelId: string, cb: (updated) => any) => {
        subscribers.push({
            type: "delete",
            model: modelId,
            callback: cb,
        });
    },
};
class DataPublisher extends Publisher { }
export const publisher = new DataPublisher();
