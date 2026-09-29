export interface Memory {
  id: string;
  sourceCharacterId: string;
  targetCharacterId?: string;
  title: string;
  description: string;
  importance: number; // 1-100
  timestamp: number; // Day tick
  decayRate: number; // Tốc độ phai mờ theo thời gian
  tags: string[];
}
