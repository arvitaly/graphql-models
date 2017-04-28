import Model from "./Model";
import { ModelID, ResolveOpts } from "./typings";
interface Publisher {
    publishAdd(subscriptionId: any, modelId: ModelID, globalId: string, created, context: any): void;
    publishRemove(subscriptionId: any, modelId: ModelID, globalId: string, created, context: any): void;
    publishUpdate(subscriptionId: any, modelId: ModelID, globalId: string, updated, context: any): void;
}
export default Publisher;
