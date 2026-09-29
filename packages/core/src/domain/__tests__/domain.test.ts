import { describe, it, expect } from "vitest";
import { createNamedCharacter } from "../character.js";
import { createDefaultInventory } from "../resource.js";
import { advanceTime } from "../../time/clock.js";

describe("Domain Models & Invariants", () => {
  it("creates a valid NamedCharacter with 3 axes and 8D relationship", () => {
    const npc = createNamedCharacter({
      id: "char_01",
      name: "Lan",
      occupation: "technician",
      legalStatus: "citizen",
    });

    expect(npc.name).toBe("Lan");
    expect(npc.occupation).toBe("technician");
    expect(npc.legalStatus).toBe("citizen");
    expect(npc.relationshipToPlayer.trust).toBe(30);
    expect(npc.needs.nutrition).toBe(80);
  });

  it("handles resource inventory defaults", () => {
    const inv = createDefaultInventory();
    expect(inv.food).toBe(100);
    expect(inv.currency).toBe(500);
  });

  it("advances simulation time properly", () => {
    let date = { day: 1, week: 1, year: 1 };
    for (let i = 0; i < 7; i++) {
      date = advanceTime(date);
    }
    expect(date.day).toBe(8);
    expect(date.week).toBe(2);
  });
});
