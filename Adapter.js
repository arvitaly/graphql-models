"use strict";
class Adapter {
    findOne(modelId, id, populates) {
        throw new Error("Not implemented findOne");
    }
    findMany(modelId, findCriteria, populates) {
        throw new Error("Not implemented findMany");
    }
    hasNextPage(modelId, findCriteria) {
        throw new Error("Not implemented hasNextPage");
    }
    hasPreviousPage(modelId, findCriteria) {
        throw new Error("Not implemented hasPreviousPage");
    }
    createOne(modelId, created) {
        throw new Error("Not implemented createOne");
    }
    updateOne(modelId, id, updated) {
        throw new Error("Not implemented updateOne");
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Adapter;
//# sourceMappingURL=Adapter.js.map