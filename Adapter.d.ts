import { FindCriteria, ModelID, PopulateFields } from "./typings";
interface Adapter {
    findOne(modelId: string, id: any, populates: PopulateFields): Promise<any>;
    findMany(modelId: string, findCriteria: FindCriteria, populates: PopulateFields): any[] | Promise<any[]>;
    hasNextPage(modelId: string, findCriteria: FindCriteria): boolean | Promise<boolean>;
    hasPreviousPage(modelId: string, findCriteria: FindCriteria): boolean | Promise<boolean>;
    createOne(modelId: ModelID, created: any): Promise<any>;
    findOrCreateOne(modelId: ModelID, created: any): Promise<any>;
    updateOne(modelId: ModelID, id: any, updated: any): Promise<any>;
}
export default Adapter;
