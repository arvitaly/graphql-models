"use strict";
class Adapter {
    findOne(modelId, id) {
        throw new Error("Not implemented findOne");
    }
    findMany(modelId, findCriteria) {
        throw new Error("Not implemented findMany");
    }
    hasNextPage(modelId, findCriteria) {
        throw new Error("Not implemented hasNextPage");
    }
    hasPreviousPage(modelId, findCriteria) {
        throw new Error("Not implemented hasPreviousPage");
    }
    populate(modelId, attr) {
        throw new Error("Not implemented populate");
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Adapter;
//# sourceMappingURL=Adapter.js.map