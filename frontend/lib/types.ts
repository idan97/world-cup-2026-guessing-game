/* ─ Shared enums ─ */
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';

/* ─ Authentication & Session ─ */
export interface Session {
  userId: string;
  nickname: string;
  approved: boolean;
  colboNumber: string;
  tokenExp: number; // unix seconds
}

export interface LoginRequest {
  email: string;
  displayName?: string;
  colboNumber?: string;
}

export interface AuthCallbackResponse {
  jwt: string;
  approved: boolean;
  user: {
    id: string;
    email: string;
    displayName: string;
    colboNumber: string;
    role: 'USER' | 'ADMIN';
    isApproved: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  colboNumber: string;
  role: 'USER' | 'ADMIN';
  isApproved: boolean;
  requestedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
}

/* ─ Dashboard payloads ─ */
export interface LeaderboardEntry {
  rank: number;
  formId: string;
  nickname: string;
  totalPoints: number;
}

export interface NextMatch {
  matchId: number;
  kickoff: string; // ISO
  stage: Stage;
  teams: [string, string];
  myPick?: { scoreA: number; scoreB: number };
  locked: boolean;
}

export interface DailyDigest {
  date: string;
  html: string;
}

/* ─ Form editor ─ */
export interface GroupPick {
  matchId: number;
  scoreA: number;
  scoreB: number;
  outcome: Outcome;
}

export interface BracketPick {
  slot: string; // 'R32-A', 'QF-2', …
  teamId: string; // 'FRA'
}

export interface FormDraft {
  id: string;
  nickname: string;
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
  isFinal: boolean;
}

/* ─ Compare + simulate ─ */
export interface MatchBreakdown {
  matchId: number;
  stage: Stage;
  slotAligned: boolean;
  myScore: [number, number];
  realScore: [number | null, number | null];
  pointsEarned: number;
}

export interface CompareResponse {
  formId: string;
  totalPoints: number;
  rank: number;
  matches: MatchBreakdown[];
  advance: {
    stage: Exclude<Stage, 'GROUP'>;
    myTeams: string[];
    realTeams: string[];
    pointsEarned: number;
  }[];
  topScorer: {
    pick: string;
    real: string[] | null;
    pointsEarned: number;
  };
}

export interface SimulateRequest {
  overrides: Record<
    number,
    { scoreA: number; scoreB: number; winnerTeamId: string }
  >;
}

export interface SimulatedStanding {
  rank: number;
  formId: string;
  nickname: string;
  simulatedPoints: number;
  deltaVsOfficial: number;
}

export interface SimulateResponse {
  leaderboard: SimulatedStanding[];
}

/* ─ Additional helper types ─ */
export interface Team {
  id: string;
  name: string;
  flag: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
}

/* ─ API Response wrappers ─ */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
} 