import { Relationship8D, createDefaultRelationship } from "./relationship.js";
import { Memory } from "./memory.js";

/** Trục 1: Nghề nghiệp thực tế */
export type Occupation =
  | "unassigned"
  | "worker"
  | "technician"
  | "doctor"
  | "farmer"
  | "security"
  | "manager"
  | "trader"
  | "advisor"
  | "governor";

/** Trục 2: Tầng lớp xã hội */
export type SocialClass =
  | "lower"
  | "common"
  | "skilled"
  | "administrative"
  | "elite";

/** Trục 3: Địa vị pháp lý (Nô lệ hóa là địa vị pháp lý, không phải nghề) */
export type LegalStatus =
  | "citizen"
  | "free_resident"
  | "contract_bound"
  | "enslaved"
  | "prisoner"
  | "outsider";

export interface CharacterNeeds {
  safety: number; // An toàn (0-100)
  nutrition: number; // Ăn uống (0-100)
  autonomy: number; // Quyền tự chủ (0-100)
  recognition: number; // Được công nhận (0-100)
  intimacy: number; // Nhu cầu thân mật (0-100)
  purpose: number; // Mục tiêu sống (0-100)
}

export interface CharacterEmotions {
  joy: number;
  fear: number;
  anger: number;
  sadness: number;
  shame: number;
  jealousy: number;
  hope: number;
  stress: number;
}

export interface NamedCharacter {
  id: string;
  name: string;
  gender: "female" | "male" | "other";
  age: number;
  
  // 3 Trục thân phận
  occupation: Occupation;
  socialClass: SocialClass;
  legalStatus: LegalStatus;
  
  // Tâm lý & Quan hệ
  needs: CharacterNeeds;
  emotions: CharacterEmotions;
  relationshipToPlayer: Relationship8D;
  memories: Memory[];
  
  // Năng lực & Chỉ số
  skills: {
    management: number;
    technical: number;
    medical: number;
    combat: number;
    negotiation: number;
  };
  health: number; // 0-100
}

function checkRange(val: number, name: string): void {
  if (!Number.isFinite(val) || val < 0 || val > 100) {
    throw new Error(`Character ${name} must be a finite number in [0, 100], received: ${val}`);
  }
}

export function createNamedCharacter(params: Partial<NamedCharacter> & { id: string; name: string }): NamedCharacter {
  if (!params.id || typeof params.id !== "string" || params.id.trim() === "") {
    throw new Error("Character ID must be a non-empty string");
  }
  if (!params.name || typeof params.name !== "string" || params.name.trim() === "") {
    throw new Error("Character name must be a non-empty string");
  }
  const age = params.age ?? 22;
  if (!Number.isInteger(age) || age < 0) {
    throw new Error(`Character age must be a non-negative integer, received: ${age}`);
  }
  const health = params.health ?? 100;
  checkRange(health, "health");

  const defaultNeeds: CharacterNeeds = {
    safety: 70,
    nutrition: 80,
    autonomy: 60,
    recognition: 50,
    intimacy: 40,
    purpose: 50,
  };
  const needs: CharacterNeeds = params.needs ? { ...params.needs } : defaultNeeds;
  for (const [k, v] of Object.entries(needs)) {
    checkRange(v, `needs.${k}`);
  }

  const defaultEmotions: CharacterEmotions = {
    joy: 50,
    fear: 10,
    anger: 0,
    sadness: 10,
    shame: 0,
    jealousy: 0,
    hope: 70,
    stress: 20,
  };
  const emotions: CharacterEmotions = params.emotions ? { ...params.emotions } : defaultEmotions;
  for (const [k, v] of Object.entries(emotions)) {
    checkRange(v, `emotions.${k}`);
  }

  const defaultSkills = {
    management: 30,
    technical: 30,
    medical: 20,
    combat: 20,
    negotiation: 30,
  };
  const skills = params.skills ? { ...params.skills } : defaultSkills;
  for (const [k, v] of Object.entries(skills)) {
    checkRange(v, `skills.${k}`);
  }

  const relInput = params.relationshipToPlayer ?? createDefaultRelationship();
  const relationshipToPlayer: Relationship8D = { ...relInput };
  for (const [k, v] of Object.entries(relationshipToPlayer)) {
    checkRange(v, `relationshipToPlayer.${k}`);
  }

  const memories = params.memories
    ? params.memories.map(m => ({ ...m, tags: [...(m.tags || [])] }))
    : [];


  return {
    id: params.id.trim(),
    name: params.name.trim(),
    gender: params.gender ?? "female",
    age,
    occupation: params.occupation ?? "unassigned",
    socialClass: params.socialClass ?? "common",
    legalStatus: params.legalStatus ?? "citizen",
    needs,
    emotions,
    relationshipToPlayer,
    memories,
    skills,
    health,
  };
}

