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
    public populate(modelId: string, source: any, attr: string): any[] | Promise<any[]> {
        throw new Error("Not implemented populate");
    }
    public createOne(modelId: ModelID, created: any) {
        throw new Error("Not implemented createOne");
    }
}
export default Adapter;
