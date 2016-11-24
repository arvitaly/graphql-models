"use strict";
const Model_1 = require("./Model");
class Generator {
    constructor(modelConfigs) {
        this.modelConfigs = modelConfigs;
        this.models = {};
        modelConfigs.map((config) => {
            this.models[config.id] = new Model_1.default(config, this);
        });
    }
    getModel(id) {
        if (!this.models[id]) {
            throw new Error("Not found model with id " + id);
        }
        return this.models[id];
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Generator;
