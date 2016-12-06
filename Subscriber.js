"use strict";
const ArgumentTypes_1 = require("./ArgumentTypes");
class Subscriber {
    constructor(callbacks, publisher) {
        this.callbacks = callbacks;
        this.publisher = publisher;
    }
    subscribeOne(subscriptionId, model, id, opts) {
        this.callbacks.onUpdate(model.id, (updated) => {
            if (updated[model.getPrimaryKeyAttribute().name] === id) {
                this.publisher.publishUpdate(subscriptionId, model, updated);
            }
        });
    }
    subscribeConnection(subscriptionId, model, findCriteria, opts) {
        this.callbacks.onUpdate(model.id, (updated) => {
            if (this.equalRowToFindCriteria(model, updated, findCriteria)) {
                this.publisher.publishUpdate(subscriptionId, model, updated);
            }
        });
        this.callbacks.onCreate(model.id, (created) => {
            if (this.equalRowToFindCriteria(model, created, findCriteria)) {
                this.publisher.publishCreate(subscriptionId, model, created);
            }
        });
    }
    equalRowToFindCriteria(model, row, findCriteria) {
        // if all criteria not false
        return !findCriteria.where.some((arg) => {
            const rowValue = row[arg.attribute];
            switch (arg.type) {
                case ArgumentTypes_1.default.Contains:
                    return rowValue.indexOf(arg.value) === -1;
                case ArgumentTypes_1.default.NotContains:
                    return rowValue.indexOf(arg.value) > -1;
                case ArgumentTypes_1.default.StartsWith:
                    return rowValue.substr(0, arg.value.length) !== arg.value;
                case ArgumentTypes_1.default.NotStartsWith:
                    return rowValue.substr(0, arg.value.length) === arg.value;
                default:
                    throw new Error("Unsupported argument type " + arg.type);
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Subscriber;
//# sourceMappingURL=Subscriber.js.map