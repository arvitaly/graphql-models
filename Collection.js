"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
class Collection {
    constructor(modelConfigs, opts) {
        this.modelConfigs = modelConfigs;
        this.models = [];
        this.models = modelConfigs.map((config) => {
            return new Model_1.default(config, this, opts);
        });
    }
    get(id) {
        const model = this.models.find((m) => m.id === id);
        if (!model) {
            throw new Error("Not found model with id " + id);
        }
        return model;
    }
    map(cb) {
        return this.models.map(cb);
    }
}
exports.default = Collection;
//# sourceMappingURL=Collection.js.map