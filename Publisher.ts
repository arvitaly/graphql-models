import Model from "./Model";
import { ModelID } from "./typings";
class Publisher {
    public publishCreate(subscriptionId: any, modelId: ModelID, created) {
        throw new Error("Not implemented publishUpdateOne");
    }
    public publishUpdate(subscriptionId: any, modelId: ModelID, updated) {
        throw new Error("Not implemented publishUpdateOne");
    }
}
export default Publisher;
