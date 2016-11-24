"use strict";
const Model_1 = require("./Model");
class Generator {
    constructor(modelConfigs) {
        this.modelConfigs = modelConfigs;
        this.models = [];
        this.models = modelConfigs.map((config) => {
            return new Model_1.default(config, this);
        });
    }
    get(id) {
        const model = this.models.find(m => m.id === id);
        if (!model) {
            throw new Error("Not found model with id " + id);
        }
        return model;
    }
    map(cb) {
        return this.models.map(cb);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Generator;
