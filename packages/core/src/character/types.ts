import type { NamedCharacter } from '../domain/character.js';
import type { NpcWorldSessionState } from '../world/npc.js';

export type Pronouns = 'she' | 'he' | 'they';
export type Disclosure = 'known' | 'unknown';
// The current name stays `character.name`; birthplace, origin and current location are separate fields.
export interface CharacterIdentity {
  birthName: string | null; label: string | null; pronouns: Pronouns;
  birthplaceId: string; origin: { regionId: string; upbringing: string }; currentLocationId: string;
  biography: string | null;
}
// intimacyKnowledge exists only when age >= 18.
export interface CharacterTraitAxes { attractiveness: number; learningAptitude: number; warmth: number; intimacyKnowledge?: number }
export interface CharacterAppearance {
  presentation: 'feminine' | 'masculine' | 'androgynous'; skinTone: string; eyeColor: string;
  hair: { color: string; length: string; texture: string; style: string };
  face: { shape: string; features: string[] }; build: string; heightCm: number; weightKg: number;
  measurements?: { chestCm: number; waistCm: number; hipsCm: number; disclosure: Disclosure };
  outfit: string; // outfit id or 'role_default'
}
export interface PrivateAdultMetadata { intimateHistory: { value: 'none' | 'some'; disclosure: Disclosure } }
// `private` exists only when age >= 18.
export interface CharacterProfile { id: string; identity: CharacterIdentity; traits: CharacterTraitAxes; appearance: CharacterAppearance; private?: PrivateAdultMetadata }
export interface PlayerCharacter { character: NamedCharacter; profile: CharacterProfile }
export interface CharacterLifeSessionState extends NpcWorldSessionState { player: PlayerCharacter; profiles: CharacterProfile[] }
