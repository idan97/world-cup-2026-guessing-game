export interface FormData {
  id: string;
  nickname: string;
  isFinal: boolean;
}

export interface MatchPick {
  matchId: number;
  predScoreA: number;
  predScoreB: number;
  predOutcome: 'W' | 'D' | 'L';
}

export interface AdvancePick {
  stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
  teamId: string;
}
