import Adapter from "./../Adapter";
export const data = {
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
// tslint:disable max-classes-per-file
export class DataAdapter extends Adapter {
    public findOne(modelId, id: number) {
        return data[modelId.toLowerCase() + "s"].find((a) => a.id === id);
    }
}
