import { FindCriteria, ModelID } from "./typings";
class Adapter {
    public findOne(modelId: string, id: any) {
        throw new Error("Not implemented findOne");
    }
    public findMany(modelId: string, findCriteria: FindCriteria): any[] | Promise<any[]> {
        throw new Error("Not implemented findMany");
    }
    public hasNextPage(modelId: string, findCriteria: FindCriteria): boolean | Promise<boolean> {
        throw new Error("Not implemented hasNextPage");
    }
    public hasPreviousPage(modelId: string, findCriteria: FindCriteria): boolean | Promise<boolean> {
        throw new Error("Not implemented hasPreviousPage");
    }
    public populateModel(modelId: string, source: any, attr: string): any[] | Promise<any[]> {
        throw new Error("Not implemented populate model");
    }
    public populateCollection(modelId: string, source: any, attr: string): any[] | Promise<any[]> {
        throw new Error("Not implemented populate collection");
    }
    public createOne(modelId: ModelID, created: any) {
        throw new Error("Not implemented createOne");
    }
    public updateOne(modelId: ModelID, id: any, updated: any) {
        throw new Error("Not implemented updateOne");
    }
}
export default Adapter;
