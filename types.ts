export enum BristolType {
  Type1 = 1,
  Type2 = 2,
  Type3 = 3,
  Type4 = 4,
  Type5 = 5,
  Type6 = 6,
  Type7 = 7,
}

export enum PoopSize {
  Small = 'SMALL',
  Medium = 'MEDIUM',
  Large = 'LARGE',
  Massive = 'MASSIVE',
}

export interface PoopLog {
  id: string;
  timestamp: number; // Unix timestamp
  type: BristolType;
  notes: string;
  durationMinutes?: number;
  aiCommentary?: string;
  
  // New Fields
  painLevel?: number; // 0-10
  wipes?: number;
  isClog?: boolean;
  size?: PoopSize;
  hasBlood?: boolean;
  xpGained?: number;
  weight?: number; // in grams
}

export interface DailyStat {
  date: string;
  count: number;
  avgType: number;
}

export interface User {
  id: string; // Unique ID for social features
  username: string;
  email: string;
  avatar?: string;
  xp?: number;
  level?: number;
  prestige?: number;
  isAiEnabled?: boolean;
  friends?: string[]; // List of Friend IDs
}

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface FriendLog extends PoopLog {
  username: string;
  userAvatar?: string;
  reactions: Reaction[];
}

export interface FriendProfile {
  id: string;
  username: string;
  avatar?: string;
  level: number;
}