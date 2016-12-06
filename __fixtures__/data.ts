import Adapter from "./../Adapter";
import ArgumentTypes from "./../ArgumentTypes";
import Model from "./../Model";
import Publisher from "./../Publisher";
import { Callbacks, FindCriteria, ModelID } from "./../typings";
const animalsName = "animals";
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
export function createAnimal() {
    const newId: number = data[animalsName][data[animalsName].length - 1].id + 1;
    return {
        id: newId,
        name: "Name" + newId,
        age: 1000 + newId,
        Weight: 1000.1 + newId,
        birthday: new Date(+new Date("2100/11/11") + newId),
        isCat: newId % 2 === 0,
    };
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
        data[modelId.toLowerCase() + "s"].push(newRow);
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
        return Object.assign({}, data[modelId.toLowerCase() + "s"].find((a) => "" + a.id === "" + id));
    }
    public findMany(modelId, findCriteria: FindCriteria) {
        let result = data[modelId.toLowerCase() + "s"].map((row) => Object.assign({}, row));
        if (findCriteria && findCriteria.where) {
            findCriteria.where.map((arg) => {
                switch (arg.type) {
                    case ArgumentTypes.Contains:
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
