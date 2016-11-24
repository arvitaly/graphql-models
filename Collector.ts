import Model from "./Model";
import { ModelConfig } from "./typings";
class Generator {
    protected models: { [index: string]: Model } = {};
    constructor(protected modelConfigs: ModelConfig[]) {
        modelConfigs.map((config) => {
            this.models[config.id] = new Model(config, this);
        });
    }
    public getModel(id: string) {
        if (!this.models[id]) {
            throw new Error("Not found model with id " + id);
        }
        return this.models[id];
    }
}
export default Generator;
