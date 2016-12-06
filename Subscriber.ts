import ArgumentTypes from "./ArgumentTypes";
import Model from "./Model";
import Publisher from "./Publisher";
import { Callbacks, FindCriteria, ResolveOpts } from "./typings";
class Subscriber {
    constructor(protected callbacks: Callbacks, public publisher: Publisher) {

    }
    public subscribeOne(subscriptionId: string, model: Model, id: any, opts: ResolveOpts) {
        this.callbacks.onUpdate(model.id, (updated) => {
            if (updated[model.getPrimaryKeyAttribute().name] === id) {
                this.publisher.publishUpdate(subscriptionId, model, updated);
            }
        });
    }
    public subscribeConnection(subscriptionId: string, model: Model, findCriteria: FindCriteria, opts: ResolveOpts) {
        this.callbacks.onUpdate(model.id, (updated) => {
            if (this.equalRowToFindCriteria(model, updated, findCriteria)) {
                this.publisher.publishUpdate(subscriptionId, model, updated);
            }
        });
        this.callbacks.onCreate(model.id, (created) => {
            if (this.equalRowToFindCriteria(model, created, findCriteria)) {
                this.publisher.publishCreate(subscriptionId, model, created);
            }
        })
    }
    protected equalRowToFindCriteria(model: Model, row: any, findCriteria: FindCriteria) {
        // if all criteria not false
        return !findCriteria.where.some((arg) => {
            const rowValue = row[arg.attribute];
            switch (arg.type) {
                case ArgumentTypes.Contains:
                    return rowValue.indexOf(arg.value) === -1;
                case ArgumentTypes.NotContains:
                    return rowValue.indexOf(arg.value) > -1;
                case ArgumentTypes.StartsWith:
                    return (rowValue as string).substr(0, arg.value.length) !== arg.value;
                case ArgumentTypes.NotStartsWith:
                    return (rowValue as string).substr(0, arg.value.length) === arg.value;
                default:
                    throw new Error("Unsupported argument type " + arg.type);
            }
        });
    }
}
export default Subscriber;
