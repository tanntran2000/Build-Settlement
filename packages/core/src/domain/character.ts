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

export function createNamedCharacter(params: Partial<NamedCharacter> & { id: string; name: string }): NamedCharacter {
  return {
    id: params.id,
    name: params.name,
    gender: params.gender ?? "female",
    age: params.age ?? 22,
    occupation: params.occupation ?? "unassigned",
    socialClass: params.socialClass ?? "common",
    legalStatus: params.legalStatus ?? "citizen",
    needs: params.needs ?? {
      safety: 70,
      nutrition: 80,
      autonomy: 60,
      recognition: 50,
      intimacy: 40,
      purpose: 50,
    },
    emotions: params.emotions ?? {
      joy: 50,
      fear: 10,
      anger: 0,
      sadness: 10,
      shame: 0,
      jealousy: 0,
      hope: 70,
      stress: 20,
    },
    relationshipToPlayer: params.relationshipToPlayer ?? createDefaultRelationship(),
    memories: params.memories ?? [],
    skills: params.skills ?? {
      management: 30,
      technical: 30,
      medical: 20,
      combat: 20,
      negotiation: 30,
    },
    health: params.health ?? 100,
  };
}
