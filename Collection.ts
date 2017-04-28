import Model from "./Model";
import { ModelConfig, ModelOptions } from "./typings";
class Collection {
    protected models: Model[] = [];
    constructor(protected modelConfigs: ModelConfig[], opts?: ModelOptions) {
        this.models = modelConfigs.map((config) => {
            return new Model(config, this, opts);
        });
    }
    public get(id: string) {
        const model = this.models.find((m) => m.id === id);
        if (!model) {
            throw new Error("Not found model with id " + id);
        }
        return model;
    }
    public map(cb: (model: Model, index: number) => any) {
        return this.models.map(cb);
    }
}
export default Collection;
