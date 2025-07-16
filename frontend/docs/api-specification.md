# API Specification

## Overview

This document outlines all API endpoints that the frontend will consume, with authentication handled via Clerk JWT tokens and league-aware functionality.

## Base Configuration

```typescript
// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API; // http://localhost:3001 (dev) or https://api.worldcup2026.example.com (prod)
```

## Authentication

All API calls require Clerk JWT token authentication:

```typescript
// Server-side (in API routes or middleware)
import { auth } from '@clerk/nextjs';

const { getToken } = auth();
const token = await getToken();

// Client-side (in components)
import { useAuth } from '@clerk/nextjs';

const { getToken } = useAuth();
const token = await getToken();
```

### Request Headers

```typescript
{
  'Authorization': `Bearer ${clerkJwtToken}`,
  'Content-Type': 'application/json'
}
```

## Error Responses

All endpoints follow consistent error response format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Invalid or missing authentication
- `FORBIDDEN` (403) - User doesn't have access to resource
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `LEAGUE_NOT_FOUND` (404) - League doesn't exist
- `FORM_LOCKED` (409) - Form submission period has ended
- `ALREADY_MEMBER` (409) - User already in league

## League Endpoints

### GET /leagues

Get all leagues the current user is a member of.

**Response:**

```typescript
interface League {
  id: string;
  name: string;
  joinCode: string;
  isDefault: boolean;
  memberCount: number;
  createdAt: string;
  role: 'MEMBER' | 'ADMIN';
}

type Response = League[];
```

**Example:**

```json
[
  {
    "id": "general",
    "name": "General League",
    "joinCode": "ABC123",
    "isDefault": true,
    "memberCount": 1247,
    "createdAt": "2026-01-01T00:00:00Z",
    "role": "MEMBER"
  },
  {
    "id": "friends-league",
    "name": "Friends & Family",
    "joinCode": "DEF456",
    "isDefault": false,
    "memberCount": 12,
    "createdAt": "2026-01-15T10:30:00Z",
    "role": "ADMIN"
  }
]
```

### POST /leagues/{joinCode}/join

Join a league using a join code.

**Parameters:**

- `joinCode` (path) - 6-character league join code

**Response:**

```typescript
interface JoinLeagueResponse {
  league: League;
  message: string;
}
```

**Example:**

```json
{
  "league": {
    "id": "xyz789",
    "name": "Office Pool",
    "joinCode": "XYZ789",
    "isDefault": false,
    "memberCount": 25,
    "createdAt": "2026-02-01T09:00:00Z",
    "role": "MEMBER"
  },
  "message": "Successfully joined Office Pool"
}
```

## Leaderboard Endpoints

### GET /leagues/{leagueId}/leaderboard

Get the leaderboard for a specific league.

**Parameters:**

- `leagueId` (path) - League identifier
- `limit` (query, optional) - Number of entries to return (default: 100, max: 1000)
- `offset` (query, optional) - Number of entries to skip (default: 0)
- `search` (query, optional) - Filter by nickname (case-insensitive)

**Response:**

```typescript
interface LeaderboardEntry {
  rank: number;
  formId: string;
  userId: string;
  nickname: string;
  totalPoints: number;
  lastUpdated: string;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  hasMore: boolean;
  leagueInfo: {
    id: string;
    name: string;
    memberCount: number;
  };
}
```

**Example:**

```json
{
  "entries": [
    {
      "rank": 1,
      "formId": "form-123",
      "userId": "user_2abc123def",
      "nickname": "PredictionMaster",
      "totalPoints": 127,
      "lastUpdated": "2026-06-15T14:30:00Z"
    },
    {
      "rank": 2,
      "formId": "form-456",
      "userId": "user_2def456ghi",
      "nickname": "FootballFan92",
      "totalPoints": 124,
      "lastUpdated": "2026-06-15T14:25:00Z"
    }
  ],
  "total": 1247,
  "hasMore": true,
  "leagueInfo": {
    "id": "general",
    "name": "General League",
    "memberCount": 1247
  }
}
```

### GET /leagues/{leagueId}/leaderboard/me

Get current user's position in the leaderboard.

**Parameters:**

- `leagueId` (path) - League identifier

**Response:**

```typescript
interface MyLeaderboardPosition {
  rank: number;
  totalPoints: number;
  pointsBehindLeader: number;
  pointsBehindNext: number;
  percentile: number; // 0-100
}
```

**Example:**

```json
{
  "rank": 45,
  "totalPoints": 89,
  "pointsBehindLeader": 38,
  "pointsBehindNext": 2,
  "percentile": 95.6
}
```

## Forms Endpoints

### GET /leagues/{leagueId}/forms/me

Get current user's form for the specified league.

**Parameters:**

- `leagueId` (path) - League identifier

**Response:**

```typescript
interface FormDraft {
  id: string;
  leagueId: string;
  nickname: string;
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
  isFinal: boolean;
  isLocked: boolean;
  lastSaved: string;
  submittedAt?: string;
}
```

### PUT /leagues/{leagueId}/forms/me/picks

Save draft picks for the current user in the specified league.

**Parameters:**

- `leagueId` (path) - League identifier

**Request Body:**

```typescript
interface SavePicksRequest {
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
}
```

**Response:**

```typescript
interface SavePicksResponse {
  message: string;
  lastSaved: string;
  isDirty: false;
}
```

### POST /leagues/{leagueId}/forms/me/submit

Submit final form for the current user in the specified league.

**Parameters:**

- `leagueId` (path) - League identifier

**Request Body:**

```typescript
interface SubmitFormRequest {
  nickname: string;
  confirmSubmission: boolean;
}
```

**Response:**

```typescript
interface SubmitFormResponse {
  message: string;
  submittedAt: string;
  isFinal: true;
}
```

## Comparison Endpoints

### GET /leagues/{leagueId}/forms/me/compare

Get comparison data showing user's predictions vs actual results.

**Parameters:**

- `leagueId` (path) - League identifier

**Response:**

```typescript
interface CompareResponse {
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
```

## Simulation Endpoints

### POST /leagues/{leagueId}/simulate

Run a what-if simulation with modified future match results.

**Parameters:**

- `leagueId` (path) - League identifier

**Request Body:**

```typescript
interface SimulateRequest {
  leagueId: string;
  overrides: Record<
    number,
    { scoreA: number; scoreB: number; winnerTeamId: string }
  >;
}
```

**Response:**

```typescript
interface SimulateResponse {
  leagueId: string;
  leaderboard: SimulatedStanding[];
  myCurrentRank: number;
  mySimulatedRank: number;
  rankChange: number;
}
```

## Matches Endpoints

### GET /matches/next

Get upcoming matches with user's predictions.

**Parameters:**

- `userId` (query) - User identifier
- `window` (query, optional) - Time window (e.g., "2d", "1w") (default: "7d")

**Response:**

```typescript
interface NextMatch {
  matchId: number;
  kickoff: string; // ISO datetime
  stage: Stage;
  teams: [string, string];
  myPick?: { scoreA: number; scoreB: number };
  locked: boolean;
}

type Response = NextMatch[];
```

## Messages/Digest Endpoints

### GET /leagues/{leagueId}/messages

Get messages/summaries for a league.

**Parameters:**

- `leagueId` (path) - League identifier
- `type` (query, optional) - Message type filter ("digest", "announcement")
- `limit` (query, optional) - Number of messages (default: 50)
- `before` (query, optional) - Cursor for pagination

**Response:**

```typescript
interface Message {
  id: string;
  type: 'digest' | 'announcement';
  title: string;
  content: string; // HTML content
  createdAt: string;
  author?: {
    id: string;
    name: string;
  };
}

interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}
```

### GET /leagues/{leagueId}/messages/latest

Get the latest digest message for banner display.

**Parameters:**

- `leagueId` (path) - League identifier
- `type` (query, optional) - Message type (default: "digest")

**Response:**

```typescript
interface LatestMessage {
  id: string;
  content: string; // HTML content
  createdAt: string;
}
```

## Static Data Endpoints

### GET /teams

Get all team data.

**Response:**

```typescript
interface Team {
  id: string; // ISO country code (e.g., "FRA", "BRA")
  name: string;
  flag: string; // URL to flag image
  group?: string; // Group letter for group stage
}

type Response = Team[];
```

### GET /players

Get all player data for top scorer selections.

**Response:**

```typescript
interface Player {
  id: string;
  name: string;
  teamId: string;
  position: string;
}

type Response = Player[];
```

## Health Check

### GET /health

API health check endpoint.

**Response:**

```typescript
interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version?: string;
  database?: 'connected' | 'disconnected';
  redis?: 'connected' | 'disconnected';
}
```

## Rate Limiting

All endpoints are rate limited:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour
- **Form submissions**: 10 submissions per minute

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## Caching Strategy

### Client-side Caching (SWR)

```typescript
// Leaderboard - refresh every 30 seconds
useSWR('/leagues/general/leaderboard', fetcher, {
  refreshInterval: 30000,
});

// Forms - no auto-refresh, revalidate on focus
useSWR('/leagues/general/forms/me', fetcher, {
  revalidateOnFocus: true,
});

// Static data - cache for 1 hour
useSWR('/teams', fetcher, {
  refreshInterval: 3600000,
});
```

### Server-side Caching

- **Leaderboards**: Cache for 30 seconds
- **Static data**: Cache for 1 hour
- **User forms**: No caching (always fresh)
- **Match data**: Cache for 5 minutes

## WebSocket Events (Future)

For real-time updates (not in MVP but planned):

```typescript
// Events the client can subscribe to
interface WebSocketEvents {
  'leaderboard:updated': { leagueId: string; entries: LeaderboardEntry[] };
  'match:completed': { matchId: number; result: MatchResult };
  'digest:published': { leagueId: string; message: Message };
}
```

## Implementation Notes

### Frontend Integration

```typescript
// lib/api.ts - Central API client
import { auth } from '@clerk/nextjs';

export class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API;

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { getToken } = auth();
    const token = await getToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }

    return response.json();
  }

  // League methods
  async getLeagues() {
    return this.request<League[]>('/leagues');
  }

  async getLeaderboard(leagueId: string, params?: LeaderboardParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<LeaderboardResponse>(
      `/leagues/${leagueId}/leaderboard?${query}`
    );
  }

  async joinLeague(joinCode: string) {
    return this.request<JoinLeagueResponse>(`/leagues/${joinCode}/join`, {
      method: 'POST',
    });
  }

  // Form methods
  async getMyForm(leagueId: string) {
    return this.request<FormDraft>(`/leagues/${leagueId}/forms/me`);
  }

  async saveForm(leagueId: string, data: SavePicksRequest) {
    return this.request<SavePicksResponse>(
      `/leagues/${leagueId}/forms/me/picks`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // ... other methods
}

export const api = new ApiClient();
```

### Error Handling

```typescript
class ApiError extends Error {
  constructor(public status: number, public response: ErrorResponse) {
    super(response.error.message);
    this.name = 'ApiError';
  }
}

// Usage in components
try {
  await api.getLeaderboard('general');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      // Handle league not found
    } else if (error.status === 403) {
      // Handle access denied
    }
  }
}
```
