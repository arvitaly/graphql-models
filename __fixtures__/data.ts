import Adapter from "./../Adapter";
import ArgumentTypes from "./../ArgumentTypes";
import Model from "./../Model";
import Publisher from "./../Publisher";
import { Callbacks, FindCriteria, ModelID } from "./../typings";
const animalsName = "animals";
const usersName = "users";
const postsName = "posts";
export const data: { [index: string]: any[] } = {
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
export function createAnimal(row?: any) {
    const newId: number = data[animalsName][data[animalsName].length - 1].id + 1;
    return Object.assign({
        id: newId,
        name: "Name" + newId,
        age: 1000 + newId,
        Weight: 1000.1 + newId,
        birthday: new Date(+new Date("2100/11/11") + newId),
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
    public findOne(modelId, id: number) {
        const result = Object.assign({}, data[modelId.toLowerCase() + "s"].find((a) => modelId === "user" ?
            "" + a.key === "" + id
            : "" + a.id === "" + id));
        return result;
    }
    public populate(modelId, source, attr) {
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
        const oldRow = this.findOne(modelId, id);
        Object.assign(oldRow, updated);
        return oldRow;
    }
    public findMany(modelId, findCriteria: FindCriteria) {
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
        return result;
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
