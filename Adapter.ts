import { FindCriteria } from "./typings";
class Adapter {
    public findOne(modelId: string, id: any) {
        throw new Error("Not implemented");
    }
    public findMany(modelId: string, findCriteria: FindCriteria): any[] {
        throw new Error("Not implemented");
    }
    public hasNextPage(modelId: string, findCriteria: FindCriteria): boolean {
        throw new Error("Not implemented");
    }
    public hasPreviousPage(modelId: string, findCriteria: FindCriteria): boolean {
        throw new Error("Not implemented");
    }
    public populate(modelId: string, attr: string): any[] {
        throw new Error("Not implemented");
    }
}
export default Adapter;
