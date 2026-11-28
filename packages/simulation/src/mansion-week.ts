import type { MansionTerms, MansionWeekReport, WorldNpc } from '@haven/core';

// This receipt is local to one dispatch and never enters the city or save.
export interface MansionWeekCharge {
  terms: MansionTerms;
  paid?: boolean;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function runMansionWeek(npcs: readonly WorldNpc[], { terms, paid }: MansionWeekCharge): Readonly<MansionWeekReport> {
  if (paid === undefined) throw Error('Mansion upkeep was not resolved.');
  if (paid) for (const npc of npcs) {
    const effects = npc.household.room === null ? undefined : terms.effectsByRoom.get(npc.household.room);
    if (effects?.npcStress) npc.life.stress = clamp(npc.life.stress + effects.npcStress);
    if (effects?.npcAffection) {
      const relationship = npc.character.relationshipToPlayer;
      relationship.affection = clamp(relationship.affection + effects.npcAffection);
    }
  }
  return Object.freeze({
    comfortSupply: paid ? terms.paidComfort : terms.plainComfort,
    comfortNeed: terms.comfortNeed,
    upkeepMilli: terms.upkeepMilli,
    upkeepPaid: paid,
    authority: 0,
  });
}
