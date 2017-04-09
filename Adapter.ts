import { FindCriteria, ModelID, PopulateFields } from "./typings";
class Adapter {
    public findOne(modelId: string, id: any, populates: PopulateFields) {
        throw new Error("Not implemented findOne");
    }
    public findMany(modelId: string, findCriteria: FindCriteria, populates: PopulateFields): any[] | Promise<any[]> {
        throw new Error("Not implemented findMany");
    }
    public hasNextPage(modelId: string, findCriteria: FindCriteria): boolean | Promise<boolean> {
        throw new Error("Not implemented hasNextPage");
    }
    public hasPreviousPage(modelId: string, findCriteria: FindCriteria): boolean | Promise<boolean> {
        throw new Error("Not implemented hasPreviousPage");
    }
    public createOne(modelId: ModelID, created: any) {
        throw new Error("Not implemented createOne");
    }
    public findOrCreateOne(modelId: ModelID, created: any) {
        throw new Error("Not implemented findOrCreateOne");
    }
    public updateOne(modelId: ModelID, id: any, updated: any) {
        throw new Error("Not implemented updateOne");
    }
}
export default Adapter;
