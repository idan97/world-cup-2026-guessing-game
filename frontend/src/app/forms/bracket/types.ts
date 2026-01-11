// Tournament form types

export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F' | 'THIRD';

export interface Team {
  id: string;
  fifaCode: string;
  name: string;
  nameHebrew?: string;
  groupLetter?: string;
  groupPosition?: number;
}

export interface GroupStanding {
  position: number;
  team: Team | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface GroupData {
  letter: string;
  standings: GroupStanding[];
  matches: MatchData[];
}

export interface MatchData {
  id: string;
  matchNumber: number;
  stage: Stage;
  team1Code: string;
  team2Code: string;
  team1Name?: string;
  team2Name?: string;
  team1?: Team;
  team2?: Team;
  team1Score?: number | null;
  team2Score?: number | null;
  isFinished: boolean;
  scheduledAt: string;
  venue?: string;
}

export interface MatchPrediction {
  matchId: string;
  predScoreA: number;
  predScoreB: number;
}

export interface AdvancePrediction {
  stage: Stage;
  teamId: string;
  team?: Team;
}

export interface UserPredictions {
  matchPredictions: MatchPrediction[];
  advancePredictions: AdvancePrediction[];
  topScorer?: string;
}

// Knockout round slot mapping
export interface KnockoutSlot {
  id: string;
  stage: Stage;
  position: number;
  team1From?: string; // e.g., "1A" or "W49"
  team2From?: string;
  matchNumber: number;
}

// Match display data combining real match + user prediction
export interface MatchDisplay {
  match: MatchData;
  prediction?: MatchPrediction;
  team1?: Team;
  team2?: Team;
}

// Group display data
export interface GroupDisplay {
  letter: string;
  teams: Team[];
  standings: GroupStanding[];
  matches: MatchDisplay[];
}

// Full bracket state
export interface BracketFormState {
  groups: GroupDisplay[];
  knockoutMatches: {
    r32: MatchDisplay[];
    r16: MatchDisplay[];
    qf: MatchDisplay[];
    sf: MatchDisplay[];
    third: MatchDisplay | null;
    final: MatchDisplay | null;
  };
  predictions: UserPredictions;
  isDirty: boolean;
  isSaving: boolean;
}

// Stage configuration
export const STAGE_CONFIG = {
  R32: { name: 'שלב 32', matches: 16 },
  R16: { name: 'שמינית גמר', matches: 8 },
  QF: { name: 'רבע גמר', matches: 4 },
  SF: { name: 'חצי גמר', matches: 2 },
  THIRD: { name: 'מקום שלישי', matches: 1 },
  F: { name: 'גמר', matches: 1 },
} as const;

// Groups list
export const GROUPS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
] as const;
export type GroupLetter = (typeof GROUPS)[number];
