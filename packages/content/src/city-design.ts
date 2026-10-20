// Display-only design preview; these descriptors do not define simulation state or balance.
export const CITY_DESIGN = {
  groups: [
    { label: "Makers", name: "The Makers’ Union", duties: "Production, building and maintenance." },
    { label: "Luminaries", name: "The Luminary Circle", duties: "Research, education, planning and technical standards." },
    { label: "Merchants", name: "The Mercantile League", duties: "Trade and distribution." },
  ],
  groupInfluence: "All three groups contribute to shared Happiness, Security and Corruption through conditions, buildings and future effects. No group owns a single Status; Merchants have no intrinsic corruption.",
  inventory: {
    inputs: ["Wheat", "Gold", "Wood", "Iron"],
    finished: ["Food"],
  },
  requirements: ["Food", "Goods"],
  statuses: ["Happiness", "Security", "Corruption"],
} as const;
