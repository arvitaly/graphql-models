import Model from "./Model";
import { ModelConfig } from "./typings";
class Generator {
    protected models: Model[] = [];
    constructor(protected modelConfigs: ModelConfig[]) {
        this.models = modelConfigs.map((config) => {
            return new Model(config, this);
        });
    }
    public get(id: string) {
        const model = this.models.find((m) => m.id === id);
        if (!model) {
            throw new Error("Not found model with id " + id);
        }
        return model;
    }
    public map(cb: (model: Model, index: Number) => any) {
        return this.models.map(cb);
    }
}
export default Generator;
