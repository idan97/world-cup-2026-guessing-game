/* ─── enums ─────────────────────────────────────────────────── */
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';

/* ─── reference tables ──────────────────────────────────────── */
export interface Team {
  id: string; // 'FRA'
  name: string; // 'France'
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
}

/* ─── auth & membership ─────────────────────────────────────── */
export interface User {
  id: string; // UUID
  email: string;
  displayName: string;
  colboNumber: string; // internal budget code
  isApproved: boolean;
  role: 'USER' | 'ADMIN';
  requestedAt: Date | null;
  approvedAt: Date | null;
}

export interface FormMember {
  formId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR'; // no VIEWER
}

/* ─── prediction containers ─────────────────────────────────── */
export interface Form {
  id: string;
  nickname: string; // e.g. "Idan #2"
  submittedAt: Date | null;
  isFinal: boolean; // true when locked
  totalPoints: number; // running tally
}

/* ─── static schedule ───────────────────────────────────────── */
export interface Match {
  id: number; // 1-64
  stage: Stage;
  slot: string; // 'R16-A', 'QF-2' …
  kickoff: Date;
  teamAId: string | null; // filled when known
  teamBId: string | null;
  scoreA: number | null; // 90-min scores
  scoreB: number | null;
  winnerTeamId: string | null;
}

/* ─── user picks ─────────────────────────────────────────────── */
export interface MatchPick {
  formId: string;
  matchId: number; // slot, not "real" teams
  predScoreA: number;
  predScoreB: number;
  predOutcome: Outcome; // W / D / L
}

export interface AdvancePick {
  formId: string;
  stage: Exclude<Stage, 'GROUP'>; // R32 … F
  teamId: string; // e.g. 'FRA'
}

export interface TopScorerPick {
  formId: string;
  playerName: string;
}

/* ─── audit trail ────────────────────────────────────────────── */
export interface ScoringRun {
  id: number;
  formId: string;
  runAt: Date;
  delta: number; // +15 pts, −3 pts, etc.
  details: {
    matchId?: number; // if from one match
    stage?: Stage; // if stage bonus
    note?: string; // manual override
  };
}
