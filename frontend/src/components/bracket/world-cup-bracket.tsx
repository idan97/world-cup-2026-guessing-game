"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal } from "lucide-react"
import type { Team, Match, Round, BracketState, WorldCupBracketProps } from "./types"

const ROUND_CONFIGS = {
  round32: { name: "Round of 32", matches: 16, teamsPerMatch: 2 },
  round16: { name: "Round of 16", matches: 8, teamsPerMatch: 2 },
  quarterfinals: { name: "Quarterfinals", matches: 4, teamsPerMatch: 2 },
  semifinals: { name: "Semifinals", matches: 2, teamsPerMatch: 2 },
  thirdPlace: { name: "Third Place", matches: 1, teamsPerMatch: 2 },
  final: { name: "Final", matches: 1, teamsPerMatch: 2 },
}

const DEFAULT_TEAMS: Team[] = Array.from({ length: 32 }, (_, i) => ({
  id: `team-${i + 1}`,
  name: `Team ${i + 1}`,
}))

export default function WorldCupBracket({
  initialTeams = DEFAULT_TEAMS,
  onChange,
  className = "",
}: WorldCupBracketProps) {
  const [bracketState, setBracketState] = useState<BracketState>(() => {
    const matches: Record<string, Match> = {}

    // Initialize Round of 32
    for (let i = 0; i < 16; i++) {
      const matchId = `round32-${i}`
      matches[matchId] = {
        id: matchId,
        team1: initialTeams[i * 2] || null,
        team2: initialTeams[i * 2 + 1] || null,
        score1: 0,
        score2: 0,
        winner: null,
        round: "round32",
        position: i,
      }
    }

    // Initialize other rounds with empty matches
    const rounds: Round[] = ["round16", "quarterfinals", "semifinals", "thirdPlace", "final"]
    rounds.forEach((round) => {
      const matchCount = ROUND_CONFIGS[round].matches
      for (let i = 0; i < matchCount; i++) {
        const matchId = `${round}-${i}`
        matches[matchId] = {
          id: matchId,
          team1: null,
          team2: null,
          score1: 0,
          score2: 0,
          winner: null,
          round,
          position: i,
        }
      }
    })

    return { matches, teams: initialTeams }
  })

  const updateMatch = useCallback((matchId: string, updates: Partial<Match>) => {
    setBracketState((prev) => {
      const newState = {
        ...prev,
        matches: {
          ...prev.matches,
          [matchId]: { ...prev.matches[matchId], ...updates },
        },
      }

      const match = newState.matches[matchId]

      // Determine winner based on scores or manual selection
      let winner: Team | null = null
      if (match.score1 > match.score2) {
        winner = match.team1
      } else if (match.score2 > match.score1) {
        winner = match.team2
      } else if (updates.winner) {
        winner = updates.winner
      }

      newState.matches[matchId].winner = winner

      // Advance winner to next round
      if (winner && match.round !== "final" && match.round !== "thirdPlace") {
        advanceWinner(newState, match, winner)
      }

      // Handle semifinals losers for third place
      if (match.round === "semifinals" && winner) {
        const loser = winner === match.team1 ? match.team2 : match.team1
        if (loser) {
          advanceToThirdPlace(newState, match.position, loser)
        }
      }

      return newState
    })
  }, [])

  const advanceWinner = (state: BracketState, match: Match, winner: Team) => {
    const nextRoundMap: Record<Round, Round> = {
      round32: "round16",
      round16: "quarterfinals",
      quarterfinals: "semifinals",
      semifinals: "final",
      thirdPlace: "final",
      final: "final",
    }

    const nextRound = nextRoundMap[match.round]
    if (nextRound === "final" && match.round === "thirdPlace") return

    const nextMatchPosition = Math.floor(match.position / 2)
    const nextMatchId = `${nextRound}-${nextMatchPosition}`
    const nextMatch = state.matches[nextMatchId]

    if (nextMatch) {
      const isFirstSlot = match.position % 2 === 0
      if (isFirstSlot) {
        nextMatch.team1 = winner
      } else {
        nextMatch.team2 = winner
      }
      nextMatch.score1 = 0
      nextMatch.score2 = 0
      nextMatch.winner = null
    }
  }

  const advanceToThirdPlace = (state: BracketState, semifinalPosition: number, loser: Team) => {
    const thirdPlaceMatch = state.matches["thirdPlace-0"]
    if (thirdPlaceMatch) {
      if (semifinalPosition === 0) {
        thirdPlaceMatch.team1 = loser
      } else {
        thirdPlaceMatch.team2 = loser
      }
      thirdPlaceMatch.score1 = 0
      thirdPlaceMatch.score2 = 0
      thirdPlaceMatch.winner = null
    }
  }

  useEffect(() => {
    onChange?.(bracketState)
  }, [bracketState, onChange])

  const renderMatch = (match: Match) => {
    const isTied = match.score1 === match.score2 && (match.score1 > 0 || match.score2 > 0)
    const hasTeams = match.team1 && match.team2

    return (
      <Card
        key={match.id}
        className="w-full min-w-[280px] bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200"
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Team 1 */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium text-blue-900">{match.team1?.name || "TBD"}</Label>
              </div>
              <Input
                type="number"
                min="0"
                value={match.score1}
                onChange={(e) => updateMatch(match.id, { score1: Number.parseInt(e.target.value) || 0 })}
                className="w-16 h-8 text-center border-blue-300"
                disabled={!hasTeams}
              />
            </div>

            {/* Team 2 */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium text-blue-900">{match.team2?.name || "TBD"}</Label>
              </div>
              <Input
                type="number"
                min="0"
                value={match.score2}
                onChange={(e) => updateMatch(match.id, { score2: Number.parseInt(e.target.value) || 0 })}
                className="w-16 h-8 text-center border-blue-300"
                disabled={!hasTeams}
              />
            </div>

            {/* Tie breaker */}
            {isTied && hasTeams && (
              <div className="pt-2 border-t border-blue-200">
                <Label className="text-xs text-blue-700 mb-2 block">Select Winner:</Label>
                <RadioGroup
                  value={match.winner?.id || ""}
                  onValueChange={(value) => {
                    const winner = value === match.team1?.id ? match.team1 : match.team2
                    updateMatch(match.id, { winner })
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value={match.team1?.id || ""} id={`${match.id}-team1`} />
                    <Label htmlFor={`${match.id}-team1`} className="text-xs">
                      {match.team1?.name}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value={match.team2?.id || ""} id={`${match.id}-team2`} />
                    <Label htmlFor={`${match.id}-team2`} className="text-xs">
                      {match.team2?.name}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Winner indicator */}
            {match.winner && (
              <div className="pt-2 border-t border-blue-200">
                <Badge variant="default" className="bg-green-600 text-white">
                  Winner: {match.winner.name}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderRound = (round: Round) => {
    const config = ROUND_CONFIGS[round]
    const roundMatches = Object.values(bracketState.matches)
      .filter((match) => match.round === round)
      .sort((a, b) => a.position - b.position)

    const getIcon = () => {
      if (round === "final") return <Trophy className="w-5 h-5 text-yellow-600" />
      if (round === "thirdPlace") return <Medal className="w-5 h-5 text-orange-600" />
      return null
    }

    return (
      <div key={round} className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {getIcon()}
          <h3 className="text-lg font-bold text-blue-900 text-center">{config.name}</h3>
          {getIcon()}
        </div>
        <div className="flex flex-col gap-4">{roundMatches.map(renderMatch)}</div>
      </div>
    )
  }

  return (
    <div className={`w-full bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-lg ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">FIFA World Cup 2026 - Knockout Stage</h1>
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <p className="text-blue-700">Road to Glory</p>
          <Trophy className="w-6 h-6 text-yellow-600" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-8 min-w-max pb-4">
          {(["round32", "round16", "quarterfinals", "semifinals"] as Round[]).map(renderRound)}
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-8 pt-8 border-t-2 border-blue-300">
        {renderRound("thirdPlace")}
        {renderRound("final")}
      </div>
    </div>
  )
}
