# World Cup 2026 Prediction Platform — Complete Backend Design

**Version:** 2.0  
**Last Updated:** November 1, 2025  
**Stack:** Node 20 · Express 5 · TypeScript · PostgreSQL 15 · Prisma · Clerk Auth

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Data Model](#4-data-model)
5. [Scoring System](#5-scoring-system)
6. [REST API](#6-rest-api)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Background Jobs & Automation](#8-background-jobs--automation)
9. [Deployment](#9-deployment)
10. [Implementation Status](#10-implementation-status)
11. [Development Workflow](#11-development-workflow)

---

## 1. Overview & Goals

### High-Level Goals

| #   | Goal                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Users authenticate via Clerk (supports Google, GitHub, email/password, etc.).                                                              |
| 2   | Each user automatically joins public "General" league on first login.                                                                      |
| 3   | Users create or join private leagues via an 8-character join-code.                                                                         |
| 4   | Every league has its own admins who can add / remove members, rotate the join-code, and post announcements.                                |
| 5   | One global prediction form per user (group stage, full bracket, top scorer); the same form applies to every league the user belongs to.    |
| 6   | Forms freeze 30 minutes before the tournament's opening kick-off.                                                                          |
| 7   | Server auto-scores after each official result and maintains (a) per-league leaderboards (visible to members) and (b) a global leaderboard. |
| 8   | League admins can post messages / summaries (Markdown, optional "pinned" flag).                                                            |
| 9   | Audit trail for every points change; system runs comfortably on a hobby-tier Postgres plus one small Node container.                       |

### Key Features

- **Multi-League Support**: Users can participate in multiple leagues with a single prediction form
- **Flexible Predictions**: Match outcomes, bracket advancement, and top scorer picks
- **Real-Time Scoring**: Automatic point calculation after each match result
- **Admin Controls**: League-level administration with member management and announcements
- **Audit Trail**: Complete history of all scoring changes for transparency
- **What-If Simulation**: Users can simulate different outcomes without affecting real data

---

## 2. Tech Stack

| Layer             | Choice                                   | Why                             |
| ----------------- | ---------------------------------------- | ------------------------------- |
| Runtime           | Node 20 + Express 5                      | Lightweight, familiar           |
| Language          | TypeScript                               | Compile-time safety             |
| Database          | PostgreSQL 15 + Prisma                   | Relational fit, easy migrations |
| Auth              | Clerk                                    | Multi-provider auth service     |
| Logging / Metrics | pino + express-prom-bundle               | Lightweight observability       |
| Cache (Optional)  | Redis                                    | Leaderboard caching             |
| CI / CD           | GitHub Actions → Docker → Cloud Platform | One-click deploy                |

### Dependencies

```json
{
  "express": "^5.0.0",
  "prisma": "^5.x",
  "@prisma/client": "^5.x",
  "@clerk/express": "^1.x",
  "pino": "^8.x",
  "express-prom-bundle": "^7.x",
  "zod": "^3.x"
}
```

---

## 3. Architecture

### Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── index.ts               # Server entry point
│   ├── config.ts              # Environment configuration
│   ├── db.ts                  # Prisma client instance
│   ├── logger.ts              # Pino logger setup
│   ├── types.ts               # Shared TypeScript types
│   │
│   ├── controllers/           # Request handlers
│   │   ├── BaseController.ts
│   │   ├── HealthController.ts
│   │   ├── FormController.ts
│   │   ├── LeagueController.ts
│   │   └── AdminController.ts
│   │
│   ├── models/                # Business logic & data access
│   │   ├── User.ts
│   │   ├── League.ts
│   │   ├── Form.ts
│   │   └── Match.ts
│   │
│   ├── routes/                # Route definitions
│   │   ├── index.ts
│   │   ├── health.ts
│   │   ├── forms.ts
│   │   ├── leagues.ts
│   │   └── admin.ts
│   │
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.ts            # Clerk authentication
│   │   ├── admin.ts           # Admin authorization
│   │   ├── league.ts          # League membership checks
│   │   ├── form.ts            # Form ownership checks
│   │   ├── errorHandler.ts
│   │   ├── logging.ts
│   │   └── notFound.ts
│   │
│   └── types/
│       └── express.d.ts       # Express type extensions
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── migrations/            # Migration history
│
├── docs/                      # Documentation
├── docker-compose.yml         # Local development setup
├── tsconfig.json
└── package.json
```

### Request Flow

```
Client Request
    ↓
Express Middleware Stack
    ├── Logging (request ID, timing)
    ├── Clerk Auth (JWT validation)
    ├── Authorization (admin, league member, form owner)
    └── Validation (request body/params)
    ↓
Controller (route handler)
    ↓
Model (business logic)
    ↓
Prisma (database access)
    ↓
Response (JSON)
```

---

## 4. Data Model

### Entity Relationship Diagram

```
User ──┬─ 1:1 ──→ Form ──┬─ 1:N ──→ MatchPick
       │                  ├─ 1:N ──→ AdvancePick
       │                  ├─ 1:1 ──→ TopScorerPick
       │                  └─ 1:N ──→ ScoringRun
       │
       └─ N:M ──→ League ──┬─ 1:N ──→ LeagueMessage
                           └─ 1:N ──→ LeagueAllowEmail

Match ──┬─ N:1 ──→ Team (teamA)
        ├─ N:1 ──→ Team (teamB)
        ├─ N:1 ──→ Team (winner)
        └─ 1:N ──→ MatchPick
```

### Core Entities

#### Enums

```typescript
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';
export type LeagueRole = 'ADMIN' | 'PLAYER';
export type TeamGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
```

#### User

```typescript
interface User {
  id: string;              // Clerk userId (CUID)
  email: string;           // Unique
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Has one `Form`
- Member of many `League`s via `LeagueMember`
- Author of many `LeagueMessage`s

#### League

```typescript
interface League {
  id: string;              // CUID
  name: string;
  description: string | null;
  joinCode: string;        // 8-char, unique
  createdAt: Date;
}
```

**Relationships:**
- Has many `LeagueMember`s
- Has many `LeagueAllowEmail`s
- Has many `LeagueMessage`s

**Special Cases:**
- "General" league: `id = 'general'`, auto-join for all users

#### LeagueMember

```typescript
interface LeagueMember {
  leagueId: string;
  userId: string;
  role: LeagueRole;        // 'ADMIN' | 'PLAYER'
  joinedAt: Date;
}
```

**Composite Primary Key:** `[leagueId, userId]`

#### LeagueAllowEmail

Pre-approved email addresses for league access.

```typescript
interface LeagueAllowEmail {
  id: number;
  leagueId: string;
  email: string;
  role: LeagueRole;
  addedAt: Date;
}
```

**Unique Constraint:** `[leagueId, email]`

**Behavior:** On user first login, if their email matches an allow-list entry, they're automatically added to that league with the specified role, and the allow-list entry is deleted.

#### LeagueMessage

Admin announcements within a league.

```typescript
interface LeagueMessage {
  id: string;              // CUID
  leagueId: string;
  authorId: string;        // Must be ADMIN
  title: string;
  body: string;            // Markdown
  pinned: boolean;
  createdAt: Date;
}
```

#### Team

Reference data for World Cup teams.

```typescript
interface Team {
  id: string;              // 'FRA', 'BRA', etc.
  name: string;            // 'France', 'Brazil', etc.
  group: TeamGroup;        // 'A' through 'L' (2026: 12 groups)
}
```

#### Match

Tournament schedule and results.

```typescript
interface Match {
  id: number;              // 1-104 (2026 expanded format)
  stage: Stage;
  slot: string;            // 'R16-A', 'QF-2', etc.
  kickoff: Date;
  teamAId: string | null;  // Filled when known
  teamBId: string | null;
  scoreA: number | null;   // 90-minute score
  scoreB: number | null;
  winnerTeamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Points:**
- Scores are always 90-minute results (no extra time/penalties)
- `winnerTeamId` is set after match completion
- Slot-based system allows predictions before teams are determined

#### Form

One prediction form per user, shared across all leagues.

```typescript
interface Form {
  id: string;              // CUID
  ownerId: string;         // User.id (unique)
  nickname: string;        // Display name for leaderboards
  submittedAt: Date | null;
  isFinal: boolean;        // Locked 30 min before tournament
  totalPoints: number;     // Running total
  createdAt: Date;
  updatedAt: Date;
}
```

**Unique Constraint:** One form per user (`ownerId`)

#### MatchPick

Predictions for individual matches.

```typescript
interface MatchPick {
  formId: string;
  matchId: number;
  predScoreA: number;
  predScoreB: number;
  predOutcome: Outcome;    // 'W' | 'D' | 'L'
}
```

**Composite Primary Key:** `[formId, matchId]`

#### AdvancePick

Predictions for which teams advance to each knockout stage.

```typescript
interface AdvancePick {
  formId: string;
  stage: Stage;            // R32, R16, QF, SF, F (not GROUP)
  teamId: string;
}
```

**Composite Primary Key:** `[formId, stage, teamId]`

**Example:** User predicts France and Brazil will reach the Final.

#### TopScorerPick

Prediction for tournament top scorer.

```typescript
interface TopScorerPick {
  formId: string;          // Primary key
  playerName: string;
}
```

**One per form**

#### ScoringRun

Audit trail for all point changes.

```typescript
interface ScoringRun {
  id: number;
  formId: string;
  runAt: Date;
  delta: number;           // Points change (+15, -3, etc.)
  details: Json;           // { matchId?, stage?, note? }
}
```

**Purpose:** Complete transparency and debugging for scoring logic.

### Database Indexes

```sql
-- Performance-critical indexes
CREATE UNIQUE INDEX one_form_per_user ON forms(owner_id);
CREATE UNIQUE INDEX league_code ON leagues(join_code);
CREATE UNIQUE INDEX user_email ON users(email);
CREATE INDEX member_lg ON league_members(league_id);
CREATE INDEX allowed_email ON league_allow_emails(league_id, email);
CREATE INDEX forms_lb ON forms(total_points DESC);
CREATE INDEX match_pick_match ON match_picks(match_id);
CREATE INDEX advance_pick_stage ON advance_picks(stage, team_id);
```

---

## 5. Scoring System

### Scoring Matrix

Points are awarded based on 90-minute results only (no extra time/penalties).

| Stage         | Outcome Points | Exact Score | Advance Bonus | Total Possible |
| ------------- | -------------- | ----------- | ------------- | -------------- |
| Group         | +1             | +3          | +2            | 6              |
| Round of 32   | +3             | +3          | +2            | 8              |
| Round of 16   | +3             | +3          | +4            | 10             |
| Quarter-final | +5             | +3          | +6            | 14             |
| Semi-final    | +7             | +3          | +8            | 18             |
| Final         | +9             | +3          | —             | 12             |
| Top Scorer    | —              | —           | +8            | 8              |

### Scoring Rules

#### 1. Outcome Points

Awarded if the predicted outcome (W/D/L) matches the actual 90-minute result.

**Example:**
- Prediction: France 2-1 Brazil (W)
- Actual: France 3-2 Brazil (W)
- **Award:** Outcome points ✓

#### 2. Exact Score Points

Awarded if both scores match exactly (90-minute).

**Example:**
- Prediction: France 2-1 Brazil
- Actual: France 2-1 Brazil
- **Award:** Outcome points ✓ + Exact score points ✓

#### 3. Advance Bonus

Awarded if a team the user predicted to reach a stage actually reaches it.

**Example:**
- User predicted France to reach Final
- France reaches Final
- **Award:** Semi-final advance bonus (+8 points)

**Important:** Slot alignment required. If user predicted "Winner of QF-1" to reach Final, but that team loses QF-1, no points awarded even if the team was correct.

#### 4. Top Scorer Bonus

Awarded if the predicted player name matches the official tournament top scorer.

**Award:** +8 points

### Scoring Triggers

| Event                  | Action                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| Match result finalized | `processMatch(matchId)` — Award outcome + exact score points                            |
| Stage completed        | `processStage(stage)` — Award advance bonus for teams that reached this stage           |
| Tournament ends        | Award top scorer bonus                                                                  |
| Nightly 03:00 UTC      | `rescoreAll()` — Rebuild all form totals from scratch (data integrity check)            |

### Audit Trail

Every scoring operation creates a `ScoringRun` record:

```typescript
{
  formId: "ckx123...",
  runAt: "2026-06-15T14:30:00Z",
  delta: +15,
  details: {
    matchId: 42,
    stage: "R16",
    note: "Outcome + exact score + advance bonus"
  }
}
```

**Benefits:**
- Complete transparency
- Easy debugging
- Historical analysis
- Dispute resolution

---

## 6. REST API

### Base URL

```
/api/v1
```

### Authentication

All protected routes require Clerk JWT in the `Authorization` header:

```
Authorization: Bearer <clerk_jwt_token>
```

Clerk middleware validates the token and attaches `req.auth.userId` to the request.

---

### Health & Status

#### `GET /health`

**Public**

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-15T14:30:00Z",
  "uptime": 3600
}
```

---

### Forms & Predictions

#### `GET /forms/me`

**Auth:** JWT (user)

Fetch the authenticated user's form.

**Response:**
```json
{
  "id": "ckx123...",
  "ownerId": "user_abc",
  "nickname": "Idan #2",
  "submittedAt": "2026-06-10T12:00:00Z",
  "isFinal": false,
  "totalPoints": 42,
  "matchPicks": [...],
  "advancePicks": [...],
  "topScorerPick": { "playerName": "Kylian Mbappé" }
}
```

#### `POST /forms`

**Auth:** JWT (user)

Create a new form. Returns 409 if form already exists.

**Request:**
```json
{
  "nickname": "Idan #2"
}
```

**Response:** 201 with form object

#### `PUT /forms/:id/picks`

**Auth:** JWT (form owner)

Save predictions. Blocked if `isFinal = true`.

**Request:**
```json
{
  "matchPicks": [
    { "matchId": 1, "predScoreA": 2, "predScoreB": 1, "predOutcome": "W" }
  ],
  "advancePicks": [
    { "stage": "F", "teamId": "FRA" }
  ],
  "topScorerPick": { "playerName": "Kylian Mbappé" }
}
```

**Response:** 200 with updated form

#### `POST /forms/:id/submit`

**Auth:** JWT (form owner)

Mark form as submitted (sets `submittedAt`). Does not lock form — that happens 30 minutes before tournament starts.

**Response:** 200 with updated form

#### `GET /forms/:id/compare`

**Auth:** JWT (form owner)

Compare predictions vs actual results with point breakdown.

**Response:**
```json
{
  "totalPoints": 42,
  "breakdown": [
    {
      "matchId": 1,
      "prediction": { "scoreA": 2, "scoreB": 1 },
      "actual": { "scoreA": 2, "scoreB": 1 },
      "points": { "outcome": 1, "exact": 3 }
    }
  ]
}
```

---

### Leagues

#### `GET /leagues`

**Auth:** JWT (user)

List all leagues the user is a member of.

**Response:**
```json
[
  {
    "id": "general",
    "name": "General",
    "description": "Public league for all users",
    "role": "PLAYER",
    "memberCount": 1234
  }
]
```

#### `POST /leagues`

**Auth:** JWT (user)

Create a new league. Creator becomes ADMIN.

**Request:**
```json
{
  "name": "Friends League",
  "description": "Just us!"
}
```

**Response:** 201 with league object (includes `joinCode`)

#### `POST /leagues/:code/join`

**Auth:** JWT (user)

Join a league via join code.

**Response:** 200 with league object

#### `GET /leagues/:id`

**Auth:** JWT (league member)

Get league details.

**Response:**
```json
{
  "id": "ckx456...",
  "name": "Friends League",
  "description": "Just us!",
  "joinCode": "ABC12345",
  "memberCount": 8,
  "createdAt": "2026-05-01T10:00:00Z"
}
```

#### `POST /leagues/:id/join-code/rotate`

**Auth:** JWT (league ADMIN)

Generate a new join code.

**Response:** 200 with new `joinCode`

#### `GET /leagues/:id/members`

**Auth:** JWT (league ADMIN)

List all league members.

**Response:**
```json
[
  {
    "userId": "user_abc",
    "displayName": "Idan",
    "email": "idan@example.com",
    "role": "ADMIN",
    "joinedAt": "2026-05-01T10:00:00Z"
  }
]
```

#### `POST /leagues/:id/allow`

**Auth:** JWT (league ADMIN)

Pre-approve an email address for league access.

**Request:**
```json
{
  "email": "friend@example.com",
  "role": "PLAYER"
}
```

**Response:** 201

**Behavior:** When a user with this email signs up, they're automatically added to the league.

#### `DELETE /leagues/:id/members/:userId`

**Auth:** JWT (league ADMIN)

Remove a member from the league.

**Response:** 204

---

### League Messages

#### `GET /leagues/:id/messages`

**Auth:** JWT (league member)

List all messages in a league.

**Response:**
```json
[
  {
    "id": "ckx789...",
    "title": "Welcome!",
    "body": "# Hello\n\nWelcome to our league!",
    "pinned": true,
    "authorId": "user_abc",
    "authorName": "Idan",
    "createdAt": "2026-05-01T10:00:00Z"
  }
]
```

#### `POST /leagues/:id/messages`

**Auth:** JWT (league ADMIN)

Create a new message.

**Request:**
```json
{
  "title": "Welcome!",
  "body": "# Hello\n\nWelcome to our league!",
  "pinned": true
}
```

**Response:** 201 with message object

#### `PUT /leagues/:id/messages/:messageId`

**Auth:** JWT (league ADMIN)

Update a message.

**Request:**
```json
{
  "title": "Updated Title",
  "body": "Updated body",
  "pinned": false
}
```

**Response:** 200 with updated message

#### `DELETE /leagues/:id/messages/:messageId`

**Auth:** JWT (league ADMIN)

Delete a message.

**Response:** 204

---

### Leaderboards

#### `GET /leaderboard/global`

**Public**

Global leaderboard across all users.

**Query Params:**
- `limit` (default: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_abc",
      "nickname": "Idan #2",
      "totalPoints": 150
    }
  ],
  "total": 1234
}
```

**Caching:** Redis (TTL: 5 minutes)

#### `GET /leagues/:id/leaderboard`

**Auth:** JWT (league member)

League-specific leaderboard.

**Query Params:**
- `limit` (default: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_abc",
      "nickname": "Idan #2",
      "totalPoints": 150
    }
  ],
  "total": 8
}
```

**Caching:** Redis (TTL: 5 minutes)

---

### Fixtures

#### `GET /matches/next`

**Public**

Get upcoming matches.

**Query Params:**
- `formId` (optional): Include user's predictions
- `limit` (default: 10)

**Response:**
```json
[
  {
    "id": 1,
    "stage": "GROUP",
    "slot": "A1",
    "kickoff": "2026-06-11T18:00:00Z",
    "teamA": { "id": "FRA", "name": "France" },
    "teamB": { "id": "BRA", "name": "Brazil" },
    "userPick": {
      "predScoreA": 2,
      "predScoreB": 1
    }
  }
]
```

---

### Simulation

#### `POST /simulate`

**Auth:** JWT (user)

Run a what-if simulation with custom match results.

**Request:**
```json
{
  "overrides": [
    { "matchId": 1, "scoreA": 2, "scoreB": 1 },
    { "matchId": 2, "scoreA": 0, "scoreB": 0 }
  ],
  "leagueId": "ckx456..." // optional
}
```

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_abc",
      "nickname": "Idan #2",
      "totalPoints": 165,
      "delta": +15
    }
  ]
}
```

**Note:** Does not modify database. All calculations in-memory.

---

### Admin Endpoints

#### `GET /admin/matches`

**Auth:** JWT (global admin)

List all matches.

**Response:**
```json
[
  {
    "id": 1,
    "stage": "GROUP",
    "slot": "A1",
    "kickoff": "2026-06-11T18:00:00Z",
    "teamAId": "FRA",
    "teamBId": "BRA",
    "scoreA": null,
    "scoreB": null,
    "winnerTeamId": null
  }
]
```

#### `POST /admin/matches`

**Auth:** JWT (global admin)

Import or update match schedule/results.

**Request:**
```json
[
  {
    "id": 1,
    "stage": "GROUP",
    "slot": "A1",
    "kickoff": "2026-06-11T18:00:00Z",
    "teamAId": "FRA",
    "teamBId": "BRA",
    "scoreA": 2,
    "scoreB": 1,
    "winnerTeamId": "FRA"
  }
]
```

**Response:** 200 with updated matches

**Behavior:** Triggers `processMatch()` for any match with new results.

#### `POST /admin/rescore`

**Auth:** JWT (global admin)

Trigger full rescore of all forms.

**Response:** 202 (accepted)

**Behavior:** Runs `rescoreAll()` in background. Rebuilds all form totals from scratch.

---

## 7. Authentication & Authorization

### Clerk Integration

**Setup:**
```typescript
import { clerkMiddleware, requireAuth } from '@clerk/express';

app.use(clerkMiddleware());

// Protected route
app.get('/api/v1/forms/me', requireAuth(), FormController.getMyForm);
```

**User Context:**
```typescript
// In controllers
const userId = req.auth.userId;
```

### Authorization Layers

#### 1. User Authentication

All protected routes require valid Clerk JWT.

```typescript
// middleware/auth.ts
export const requireAuth = () => {
  return (req, res, next) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
};
```

#### 2. League Membership

```typescript
// middleware/league.ts
export const requireLeagueMember = async (req, res, next) => {
  const { leagueId } = req.params;
  const userId = req.auth.userId;
  
  const member = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } }
  });
  
  if (!member) {
    return res.status(403).json({ error: 'Not a league member' });
  }
  
  req.leagueMember = member;
  next();
};
```

#### 3. League Admin

```typescript
// middleware/admin.ts
export const requireLeagueAdmin = async (req, res, next) => {
  const { leagueId } = req.params;
  const userId = req.auth.userId;
  
  const member = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } }
  });
  
  if (!member || member.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  req.leagueMember = member;
  next();
};
```

#### 4. Form Ownership

```typescript
// middleware/form.ts
export const requireFormOwner = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.auth.userId;
  
  const form = await db.form.findUnique({
    where: { id }
  });
  
  if (!form || form.ownerId !== userId) {
    return res.status(403).json({ error: 'Not form owner' });
  }
  
  if (form.isFinal) {
    return res.status(403).json({ error: 'Form is locked' });
  }
  
  req.form = form;
  next();
};
```

### Global Admin

Global admin status is determined by environment variable:

```typescript
// config.ts
export const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

// middleware/admin.ts
export const requireGlobalAdmin = (req, res, next) => {
  const userId = req.auth.userId;
  
  if (!ADMIN_USER_IDS.includes(userId)) {
    return res.status(403).json({ error: 'Global admin access required' });
  }
  
  next();
};
```

---

## 8. Background Jobs & Automation

### Job Schedule

| Trigger                     | Job                | Description                                                                                                                                                                        |
| --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First login (via Clerk)     | `onUserFirstLogin` | 1. Upsert User row<br>2. Add to "General" league<br>3. Check LeagueAllowEmail for user's email<br>4. Auto-join matching leagues<br>5. Delete processed allow-list entries         |
| Join-code join              | `joinLeague`       | Insert LeagueMember row                                                                                                                                                            |
| 30 min before opening match | `lockForms`        | Set `isFinal = true` on all forms                                                                                                                                                  |
| After each match            | `processMatch`     | 1. Award outcome points<br>2. Award exact score points<br>3. Create ScoringRun records<br>4. Update form.totalPoints                                                               |
| Stage complete              | `processStage`     | 1. Award advance bonus for teams that reached stage<br>2. Create ScoringRun records<br>3. Update form.totalPoints                                                                  |
| Tournament ends             | `processTopScorer` | Award top scorer bonus                                                                                                                                                             |
| Nightly 03:00 UTC           | `rescoreAll`       | Rebuild all form totals from scratch (data integrity check)                                                                                                                        |

### Implementation

#### Option 1: Cron Jobs (Simple)

```typescript
import cron from 'node-cron';

// Nightly rescore at 03:00 UTC
cron.schedule('0 3 * * *', async () => {
  logger.info('Running nightly rescore');
  await rescoreAll();
});
```

#### Option 2: Bull Queue (Production)

```typescript
import Queue from 'bull';

const scoringQueue = new Queue('scoring', process.env.REDIS_URL);

scoringQueue.process('processMatch', async (job) => {
  const { matchId } = job.data;
  await processMatch(matchId);
});

// Trigger after match result update
await scoringQueue.add('processMatch', { matchId: 42 });
```

### Job Functions

#### `onUserFirstLogin(userId: string, email: string)`

```typescript
export async function onUserFirstLogin(userId: string, email: string) {
  await db.$transaction(async (tx) => {
    // 1. Upsert user
    await tx.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email, displayName: email.split('@')[0] }
    });
    
    // 2. Add to General league
    await tx.leagueMember.upsert({
      where: { leagueId_userId: { leagueId: 'general', userId } },
      update: {},
      create: { leagueId: 'general', userId, role: 'PLAYER' }
    });
    
    // 3. Check allow-list
    const allowedLeagues = await tx.leagueAllowEmail.findMany({
      where: { email }
    });
    
    // 4. Auto-join
    for (const entry of allowedLeagues) {
      await tx.leagueMember.create({
        data: {
          leagueId: entry.leagueId,
          userId,
          role: entry.role
        }
      });
    }
    
    // 5. Clean up allow-list
    await tx.leagueAllowEmail.deleteMany({
      where: { email }
    });
  });
}
```

#### `lockForms()`

```typescript
export async function lockForms() {
  const result = await db.form.updateMany({
    where: { isFinal: false },
    data: { isFinal: true }
  });
  
  logger.info(`Locked ${result.count} forms`);
}
```

#### `processMatch(matchId: number)`

```typescript
export async function processMatch(matchId: number) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { matchPicks: { include: { form: true } } }
  });
  
  if (!match.scoreA || !match.scoreB) {
    throw new Error('Match not finalized');
  }
  
  const actualOutcome = getOutcome(match.scoreA, match.scoreB);
  const stagePoints = SCORING_MATRIX[match.stage];
  
  for (const pick of match.matchPicks) {
    let delta = 0;
    const details: any = { matchId };
    
    // Outcome points
    if (pick.predOutcome === actualOutcome) {
      delta += stagePoints.outcome;
      details.outcome = true;
    }
    
    // Exact score points
    if (pick.predScoreA === match.scoreA && pick.predScoreB === match.scoreB) {
      delta += stagePoints.exact;
      details.exact = true;
    }
    
    if (delta > 0) {
      await db.$transaction([
        db.scoringRun.create({
          data: {
            formId: pick.formId,
            delta,
            details
          }
        }),
        db.form.update({
          where: { id: pick.formId },
          data: { totalPoints: { increment: delta } }
        })
      ]);
    }
  }
}
```

#### `processStage(stage: Stage)`

```typescript
export async function processStage(stage: Stage) {
  // Get all teams that reached this stage
  const teamsInStage = await db.match.findMany({
    where: { stage },
    select: { teamAId: true, teamBId: true }
  });
  
  const teamIds = new Set([
    ...teamsInStage.map(m => m.teamAId),
    ...teamsInStage.map(m => m.teamBId)
  ].filter(Boolean));
  
  // Find all advance picks for this stage
  const picks = await db.advancePick.findMany({
    where: {
      stage,
      teamId: { in: Array.from(teamIds) }
    },
    include: { form: true }
  });
  
  const stagePoints = SCORING_MATRIX[stage];
  
  for (const pick of picks) {
    const delta = stagePoints.advance;
    
    await db.$transaction([
      db.scoringRun.create({
        data: {
          formId: pick.formId,
          delta,
          details: { stage, teamId: pick.teamId }
        }
      }),
      db.form.update({
        where: { id: pick.formId },
        data: { totalPoints: { increment: delta } }
      })
    ]);
  }
}
```

#### `rescoreAll()`

```typescript
export async function rescoreAll() {
  const forms = await db.form.findMany({
    include: {
      matchPicks: { include: { match: true } },
      advancePicks: true,
      topScorerPicks: true
    }
  });
  
  for (const form of forms) {
    let total = 0;
    
    // Recalculate match points
    for (const pick of form.matchPicks) {
      if (pick.match.scoreA !== null && pick.match.scoreB !== null) {
        const actualOutcome = getOutcome(pick.match.scoreA, pick.match.scoreB);
        const stagePoints = SCORING_MATRIX[pick.match.stage];
        
        if (pick.predOutcome === actualOutcome) {
          total += stagePoints.outcome;
        }
        
        if (pick.predScoreA === pick.match.scoreA && pick.predScoreB === pick.match.scoreB) {
          total += stagePoints.exact;
        }
      }
    }
    
    // Recalculate advance points
    // ... (similar logic)
    
    // Update form total
    await db.form.update({
      where: { id: form.id },
      data: { totalPoints: total }
    });
  }
  
  logger.info(`Rescored ${forms.length} forms`);
}
```

---

## 9. Deployment

### Environment Variables

| Variable                              | Description                        | Required |
| ------------------------------------- | ---------------------------------- | -------- |
| `DATABASE_URL`                        | PostgreSQL connection string       | Yes      |
| `CLERK_SECRET_KEY`                    | Clerk backend auth key             | Yes      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Clerk frontend publishable key     | Yes      |
| `ADMIN_USER_IDS`                      | Comma-separated list of admin IDs  | No       |
| `REDIS_URL`                           | Redis connection string (optional) | No       |
| `PORT`                                | Server port (default: 3000)        | No       |
| `NODE_ENV`                            | Environment (production/dev)       | No       |

### Docker Setup

#### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: worldcup
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/worldcup
      REDIS_URL: redis://redis:6379
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Deployment Platforms

#### Render

```yaml
# render.yaml
services:
  - type: web
    name: worldcup-backend
    env: node
    buildCommand: npm install && npm run build && npx prisma generate
    startCommand: npx prisma migrate deploy && node dist/index.js
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: worldcup-db
          property: connectionString
      - key: CLERK_SECRET_KEY
        sync: false
      - key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        sync: false

databases:
  - name: worldcup-db
    databaseName: worldcup
    plan: starter
```

#### Railway

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### CI/CD

#### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Generate Prisma client
        run: npx prisma generate
```

---

## 10. Implementation Status

### ✅ Completed

- [x] **Database Schema** (Prisma)
  - All tables defined
  - Migrations created
  - Seed data for teams and matches
  
- [x] **Authentication** (Clerk)
  - Middleware integration
  - User context in requests
  
- [x] **User Management**
  - User model
  - Auto-join General league on first login
  
- [x] **League System**
  - Create/join leagues
  - Join code generation
  - Member management
  - Admin controls
  - Allow-list functionality
  
- [x] **League Messages**
  - CRUD operations
  - Markdown support
  - Pinned messages
  
- [x] **Forms & Predictions**
  - Form creation
  - Match picks
  - Advance picks
  - Top scorer picks
  - Form submission
  - Form locking
  
- [x] **Admin Endpoints**
  - Match management
  - Bulk match import

### 🚧 In Progress

- [ ] **Scoring Engine** (Mission 09)
  - Scoring logic implementation
  - Audit trail (ScoringRun)
  - Point calculation
  
- [ ] **Leaderboards** (Mission 10)
  - Global leaderboard
  - League leaderboards
  - Redis caching

### 📋 Planned

- [ ] **What-If Simulation** (Mission 11)
  - Simulation endpoint
  - In-memory calculations
  
- [ ] **Background Jobs** (Mission 13)
  - Form locking scheduler
  - Match processing
  - Stage processing
  - Nightly rescore
  
- [ ] **Deployment** (Mission 14)
  - Production Docker setup
  - CI/CD pipeline
  - Monitoring & logging

---

## 11. Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start database
npm run docker:up

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

### Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

### Commit Convention

```
feat(leagues)  | join-code flow
feat(messages) | league announcements
feat(auth)     | clerk integration
feat(scoring)  | match processing
fix(scoring)   | outcome rule edge-case
docs(api)      | update endpoint specs
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier with 2-space indentation
- **Imports**: Absolute paths preferred
- **Error Handling**: Try-catch in controllers, throw in models

### Testing Strategy

**Note:** Unit tests intentionally omitted for MVP. Focus on:
- Manual testing via Postman/Insomnia
- Integration testing in staging environment
- Monitoring & logging in production

---

## Appendix

### Scoring Matrix Reference

```typescript
export const SCORING_MATRIX = {
  GROUP: { outcome: 1, exact: 3, advance: 2 },
  R32:   { outcome: 3, exact: 3, advance: 4 },
  R16:   { outcome: 5, exact: 3, advance: 6 },
  QF:    { outcome: 7, exact: 3, advance: 8 },
  SF:    { outcome: 9, exact: 3, advance: 10 },
  F:     { outcome: 11, exact: 3, advance: 0 }
} as const;

export const TOP_SCORER_BONUS = 8;
```

### Helper Functions

```typescript
export function getOutcome(scoreA: number, scoreB: number): Outcome {
  if (scoreA > scoreB) return 'W';
  if (scoreA < scoreB) return 'L';
  return 'D';
}

export function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
```

### Database Queries

```typescript
// Get league leaderboard
export async function getLeagueLeaderboard(leagueId: string, limit = 100) {
  return db.$queryRaw`
    SELECT 
      f.id,
      f.nickname,
      f.total_points,
      u.display_name,
      ROW_NUMBER() OVER (ORDER BY f.total_points DESC) as rank
    FROM forms f
    JOIN users u ON f.owner_id = u.id
    JOIN league_members lm ON u.id = lm.user_id
    WHERE lm.league_id = ${leagueId}
    ORDER BY f.total_points DESC
    LIMIT ${limit}
  `;
}
```

---

## Hand-Off Summary

**World Cup 2026 Prediction Platform** — A complete backend system for tournament predictions with:

- ✅ Multi-provider authentication (Clerk)
- ✅ One global form per user, shared across leagues
- ✅ Private leagues with join codes and admin controls
- ✅ League announcements with Markdown support
- 🚧 Automatic scoring with complete audit trail
- 📋 Global and per-league leaderboards
- 📋 What-if simulation for exploring scenarios
- 📋 Background jobs for automation

**Current Status:** Core functionality complete. Scoring engine and leaderboards in progress.

**Next Steps:** Complete Mission 09 (Scoring), Mission 10 (Leaderboards), Mission 11 (Simulation), Mission 13 (Background Jobs), Mission 14 (Deployment).

---

**Document Version:** 2.0  
**Last Updated:** November 1, 2025  
**Maintained By:** Development Team

