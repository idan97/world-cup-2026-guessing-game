export interface Team {
  id: string
  name: string
  country?: string
  flag?: string
}

export interface Match {
  id: string
  team1: Team | null
  team2: Team | null
  score1: number
  score2: number
  winner: Team | null
  round: Round
  position: number
  side: BracketSide
}

export type Round = "round32" | "round16" | "quarterfinals" | "semifinals" | "final" | "thirdPlace"

export type BracketSide = "left" | "right" | "center"

export interface BracketData {
  matches: Record<string, Match>
  teams: Team[]
  champion: Team | null
  thirdPlaceWinner: Team | null
}

export interface WorldCupBracketProps {
  initialBracketData?: BracketData
  onChange?: (bracketData: BracketData) => void
  className?: string
}

export interface RoundInfo {
  name: string
  displayName: string
  matchCount: number
  teamsPerSide: number
}

export interface BracketState {
  matches: Record<string, Match>
  teams: Team[]
  champion?: Team | null
  thirdPlace?: Team | null
}

export interface MirroredBracketProps {
  initialTeams?: Team[]
  onChange?: (bracketState: BracketState) => void
  className?: string
}

export interface RoundConfig {
  name: string
  matches: number
  displayName: string
}
