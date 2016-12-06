import { FindCriteria } from "./typings";
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
    public populate(modelId: string, attr: string): any[] | Promise<any[]> {
        throw new Error("Not implemented populate");
    }
}
export default Adapter;
