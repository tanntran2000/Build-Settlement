export type ResourceType =
  | "food"
  | "clean_water"
  | "fuel"
  | "medicine"
  | "building_materials"
  | "metal"
  | "tools"
  | "weapons"
  | "currency";

export type ResourceInventory = Record<ResourceType, number>;

export function createDefaultInventory(): ResourceInventory {
  return {
    food: 100,
    clean_water: 100,
    fuel: 50,
    medicine: 20,
    building_materials: 150,
    metal: 50,
    tools: 25,
    weapons: 10,
    currency: 500,
  };
}
