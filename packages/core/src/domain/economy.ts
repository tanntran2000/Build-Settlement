import { ResourceInventory } from "./resource.js";
import { Effect } from "../command/effect.js";

export interface ProductionReport {
  day: number;
  consumption: Partial<ResourceInventory>;
  production: Partial<ResourceInventory>;
  netDeltas: Effect[];
  deficit?: Partial<ResourceInventory>;
}
