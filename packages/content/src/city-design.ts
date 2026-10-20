// Display-only design preview; these descriptors do not define simulation state or balance.
export const CITY_DESIGN = {
  groups: [
    { label: "Makers", name: "The Makers’ Union", duties: "Production, building and maintenance." },
    { label: "Luminaries", name: "The Luminary Circle", duties: "Research, education, planning and technical standards." },
    { label: "Merchants", name: "The Mercantile League", duties: "Trade and distribution." },
  ],
  inventory: {
    inputs: ["Wheat", "Gold", "Wood", "Iron"],
    finished: ["Food", "Goods"],
  },
  requirements: ["Food", "Goods"],
  statuses: ["Happiness", "Security", "Corruption"],
} as const;
