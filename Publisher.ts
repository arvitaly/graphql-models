import Model from "./Model";
import { ModelID } from "./typings";
class Publisher {
    public publishAdd(subscriptionId: any, modelId: ModelID, created) {
        throw new Error("Not implemented publishAdd");
    }
    public publishRemove(subscriptionId: any, modelId: ModelID, created) {
        throw new Error("Not implemented publishRemove");
    }
    public publishUpdate(subscriptionId: any, modelId: ModelID, updated) {
        throw new Error("Not implemented publishUpdate");
    }
}
export default Publisher;
