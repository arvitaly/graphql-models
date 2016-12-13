import Model from "./Model";
import { ModelID, ResolveOpts } from "./typings";
class Publisher {
    public publishAdd(subscriptionId: any, modelId: ModelID, globalId: string, created, context: any) {
        throw new Error("Not implemented publishAdd");
    }
    public publishRemove(subscriptionId: any, modelId: ModelID, globalId: string, created, context: any) {
        throw new Error("Not implemented publishRemove");
    }
    public publishUpdate(subscriptionId: any, modelId: ModelID, globalId: string, updated, context: any) {
        throw new Error("Not implemented publishUpdate");
    }
}
export default Publisher;
