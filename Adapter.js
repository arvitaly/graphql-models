"use strict";
class Adapter {
    findOne(modelId, id) {
        throw new Error("Not implemented");
    }
    findMany(modelId, findCriteria) {
        throw new Error("Not implemented");
    }
    hasNextPage(modelId, findCriteria) {
        throw new Error("Not implemented");
    }
    hasPreviousPage(modelId, findCriteria) {
        throw new Error("Not implemented");
    }
    populate(modelId, attr) {
        throw new Error("Not implemented");
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Adapter;
//# sourceMappingURL=Adapter.js.map