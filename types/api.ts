// API Request/Response Types

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  player?: {
    id: string;
    username: string;
  };
  message?: string;
}

export interface ArenaResponse {
  id: string;
  name: string;
  difficulty: number;
  description: string | null;
  isUnlocked: boolean;
  personalBest: number | null;
  worldRecord: number | null;
}

export interface CompleteRunRequest {
  arenaId: string;
  timeMs: number;
}

export interface CompleteRunResponse {
  success: boolean;
  run: {
    id: string;
    timeMs: number;
    rank: number;
  };
  isNewRecord: boolean;
  previousRecord: number | null;
  personalBest: number;
  isWorldRecord: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  timeMs: number;
  completedAt: string;
  isCurrentPlayer: boolean;
}

export interface PlayerStats {
  totalRuns: number;
  bestTimes: {
    arenaId: string;
    arenaName: string;
    bestTime: number | null;
  }[];
  completedArenas: number;
}
