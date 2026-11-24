import { SOCIAL_RESOURCE_SCALE } from '../social/profile.js';
import { NPC_GENERATOR_CATALOG, type AcquisitionSource } from './npc-generator.js';
import type { WorldNpc } from './npc.js';

const { price } = NPC_GENERATOR_CATALOG;
const BASIS_POINTS = 10_000;

export function npcValueMilli(npc: WorldNpc, source: AcquisitionSource, lot: boolean): number {
  const baseMilli = price.baseMilli[lot ? 'lot' : source];
  const skills = Object.values(npc.character.skills).reduce((total, value) => total + value, 0);
  const levels = Object.values(npc.life.sexExp).reduce((total, value) => total + price.levelValue[value.level], 0);
  const factorBps = BASIS_POINTS + skills * price.skillPointBps + npc.life.beauty * price.beautyPointBps + levels * price.sexExpLevelBps;
  const valueMilli = baseMilli * factorBps * price.conditionFactor / BASIS_POINTS;
  return Math.round(valueMilli / SOCIAL_RESOURCE_SCALE) * SOCIAL_RESOURCE_SCALE;
}

export function npcSellMilli(npc: WorldNpc): number {
  const value = npcValueMilli(npc, npc.household.source, npc.character.id.endsWith('_lot'));
  return Math.round(value * price.sellShare);
}
