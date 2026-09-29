export interface Relationship8D {
  /** Mức độ tin cậy vào lời nói và hành động (0-100) */
  trust: number;
  /** Tình cảm yêu mến, gắn bó tinh thần (0-100) */
  affection: number;
  /** Sức hút thể xác / tình dục (0-100) */
  attraction: number;
  /** Sự tôn trọng về năng lực, vị thế (0-100) */
  respect: number;
  /** Nỗi sợ hãi đối với quyền lực, trừng phạt (0-100) */
  fear: number;
  /** Sự oán hận, bất mãn ngầm (0-100) */
  resentment: number;
  /** Mức độ phụ thuộc kinh tế / tâm lý (0-100) */
  dependency: number;
  /** Mức độ quen thuộc, thời gian tiếp xúc (0-100) */
  familiarity: number;
}

export function createDefaultRelationship(): Relationship8D {
  return {
    trust: 30,
    affection: 20,
    attraction: 10,
    respect: 30,
    fear: 10,
    resentment: 0,
    dependency: 20,
    familiarity: 10,
  };
}
