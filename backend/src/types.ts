/* enums */
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';

/* reference */
export interface Team {
  id: string; // 'FRA'
  name: string; // 'France'
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
}

/* users */
export interface User {
  id: string; // UUID
  email: string;
  displayName: string;
  createdAt: Date;
}

/* leagues */
export interface League {
  id: string; // 'general' or uuid
  name: string;
  description: string | null;
  joinCode: string; // 8-char, unique
  createdAt: Date;
}

export interface LeagueMember {
  leagueId: string;
  userId: string;
  role: 'ADMIN' | 'PLAYER';
  joinedAt: Date;
}

/* optional allow-list (no e-mails sent) */
export interface LeagueAllowEmail {
  leagueId: string;
  email: string;
  role: 'ADMIN' | 'PLAYER';
  addedAt: Date;
}

/* league announcements */
export interface LeagueMessage {
  id: string;
  leagueId: string;
  authorId: string; // must be ADMIN
  title: string;
  body: string; // markdown
  pinned: boolean;
  createdAt: Date;
}

/* one form per user */
export interface Form {
  id: string;
  ownerId: string; // User.id
  nickname: string;
  submittedAt: Date | null;
  isFinal: boolean;
  totalPoints: number;
}

/* schedule */
export interface Match {
  id: number; // 1 – 64
  stage: Stage;
  slot: string; // 'R16-A'
  kickoff: Date;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number | null; // 90'
  scoreB: number | null;
  winnerTeamId: string | null;
}

/* picks */
export interface MatchPick {
  formId: string;
  matchId: number;
  predScoreA: number;
  predScoreB: number;
  predOutcome: Outcome;
}

export interface AdvancePick {
  formId: string;
  stage: Exclude<Stage, 'GROUP'>;
  teamId: string;
}

export interface TopScorerPick {
  formId: string;
  playerName: string;
}

/* audit */
export interface ScoringRun {
  id: number;
  formId: string;
  runAt: Date;
  delta: number; // points change
  details: { matchId?: number; stage?: Stage; note?: string };
}
