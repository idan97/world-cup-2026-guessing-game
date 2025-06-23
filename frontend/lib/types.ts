/* ─ Shared enums ─ */
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';

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
  leagueId: string;
  leaderboard: SimulatedStanding[];
  myCurrentRank: number;
  mySimulatedRank: number;
  rankChange: number;
}

/* ─ Additional helper types ─ */
export interface Team {
  id: string; // ISO country code (e.g., "FRA", "BRA")
  name: string;
  flag: string; // URL to flag image
  group?: string; // Group letter for group stage
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: string;
}

/* ─ API Response wrappers ─ */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ─ League Types ─ */
export interface League {
  id: string;
  name: string;
  joinCode: string;
  isDefault: boolean;
  memberCount: number;
  createdAt: string;
  role: 'MEMBER' | 'ADMIN';
}

export interface LeagueMembership {
  leagueId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: string;
}

/* API Response Types */
export interface JoinLeagueResponse {
  league: League;
  message: string;
}

export interface SavePicksRequest {
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
}

export interface SavePicksResponse {
  message: string;
  lastSaved: string;
}

export interface SubmitFormRequest {
  nickname: string;
  confirmSubmission: boolean;
}

export interface SubmitFormResponse {
  message: string;
  submittedAt: string;
  isFinal: true;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  hasMore: boolean;
  leagueInfo: {
    id: string;
    name: string;
    memberCount: number;
  };
}

export interface MyLeaderboardPosition {
  rank: number;
  totalPoints: number;
  pointsBehindLeader: number;
  pointsBehindNext: number;
  percentile: number; // 0-100
} 