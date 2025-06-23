# Task 02: TypeScript Types & Utility Functions

## Objective

Create all TypeScript interfaces and utility functions for data fetching, Clerk authentication integration, and constants.

## Requirements

- [ ] Implement all TypeScript interfaces from design doc
- [ ] Create fetcher utility with Clerk authentication
- [ ] Build Clerk authentication utilities
- [ ] Add constants file with enums and static data

## Files to Create

### lib/types.ts

```typescript
// All interfaces from section 4 of design doc:
// - Stage, Outcome, ClerkUser, LeaderboardEntry, NextMatch, DailyDigest
// - GroupPick, BracketPick, FormDraft
// - MatchBreakdown, CompareResponse, SimulateRequest, SimulateResponse
// - League and user management types

export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';

/* session - handled by Clerk */
export interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
}

/* dashboard */
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

export interface DailySummary {
  id: string;
  date: string;
  html: string;
}

/* forms */
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
  leagueId: string;
  nickname: string;
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
  isFinal: boolean;
}

/* leagues */
export interface League {
  id: string;
  name: string;
  joinCode: string;
  isDefault: boolean;
  memberCount: number;
  createdAt: string;
}

export interface LeagueMembership {
  leagueId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: string;
}

/* compare & simulate */
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
  leagueId: string;
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
  leagueId: string;
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
}
```

### lib/fetcher.ts

```typescript
import { auth } from '@clerk/nextjs';

// Wrapped fetch with Clerk authentication
export const fetcher = async <T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<T> => {
  const { getToken } = auth();
  const token = await getToken();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Client-side fetcher for SWR
export const clientFetcher = async <T = unknown>(url: string): Promise<T> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
```

### lib/useClerkAuth.ts

```typescript
import { useUser } from '@clerk/nextjs';

// Clerk authentication hook wrapper
export const useClerkAuth = () => {
  const { user, isSignedIn, isLoaded } = useUser();

  return {
    user,
    isSignedIn,
    isLoaded,
    userId: user?.id,
    email: user?.emailAddresses[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
  };
};
```

### lib/useLeague.ts

```typescript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// League context management
export const useLeague = () => {
  const searchParams = useSearchParams();
  const [leagueId, setLeagueId] = useState<string>('general');

  useEffect(() => {
    const urlLeagueId = searchParams.get('league');
    if (urlLeagueId) {
      setLeagueId(urlLeagueId);
    } else {
      // Load from localStorage as fallback
      const savedLeagueId = localStorage.getItem('selectedLeague');
      if (savedLeagueId) {
        setLeagueId(savedLeagueId);
      }
    }
  }, [searchParams]);

  const setLeague = (id: string) => {
    setLeagueId(id);
    localStorage.setItem('selectedLeague', id);
  };

  return {
    leagueId,
    setLeagueId: setLeague,
  };
};
```

### lib/constants.ts

```typescript
// Static data: team lists, stage names, scoring rules, etc.
export const STAGES = {
  GROUP: 'Group Stage',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
  SF: 'Semi Finals',
  F: 'Final',
} as const;

export const OUTCOMES = {
  W: 'Win',
  D: 'Draw',
  L: 'Loss',
} as const;

export const SCORING_RULES = {
  EXACT_SCORE: 3,
  CORRECT_OUTCOME: 1,
  ADVANCEMENT_BONUS: 2,
  TOP_SCORER: 5,
} as const;

// Team data, player lists, etc.
export const TEAMS = {
  // Team codes and names
} as const;
```

## Implementation Details

- Use proper TypeScript strict mode
- Handle authentication edge cases (signed out, loading states)
- Implement proper error handling for all utilities
- Export all types for component usage
- Use Clerk's built-in session management

## Testing

- [ ] Type checking passes
- [ ] Fetcher handles authentication correctly
- [ ] Clerk authentication wrapper works with valid/invalid sessions
- [ ] League switching persists correctly

## Dependencies

- Depends on: Task 01 (Project Setup with Clerk)
- Blocks: All component tasks

## Estimated Time

4-6 hours

## Priority

High - Required for all data operations and authentication
