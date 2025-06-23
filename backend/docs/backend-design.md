# World-Cup Prediction Platform — Design Doc

Node 20 · Express 5 · TypeScript · PostgreSQL 15 · Clerk Auth

---

## 1 · High-Level Goals

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

---

## 2 · Tech Stack

| Layer             | Choice                                           | Why                             |
| ----------------- | ------------------------------------------------ | ------------------------------- |
| Runtime           | Node 20 + Express 5                              | Lightweight, familiar           |
| Language          | TypeScript                                       | Compile-time safety             |
| Database          | PostgreSQL 15 + Prisma                           | Relational fit, easy migrations |
| Auth              | Clerk                                            | Multi-provider auth service     |
| Logging / Metrics | pino + express-prom-bundle                       | Lightweight observability       |
| CI / CD           | GitHub Actions → Docker → Render / Railway / Fly | One-click deploy                |

Unit tests are intentionally omitted.

---

## 3 · Data Model (TypeScript)

### Enums

```typescript
export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export type Outcome = 'W' | 'D' | 'L';
```

### Reference

```typescript
export interface Team {
  id: string; // 'FRA'
  name: string; // 'France'
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
}
```

### Users

```typescript
export interface User {
  id: string; // Clerk userId
  email: string;
  displayName: string;
  createdAt: Date;
}
```

### Leagues

```typescript
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
```

### Optional Allow-List

```typescript
/* optional allow-list (no e-mails sent) */
export interface LeagueAllowEmail {
  leagueId: string;
  email: string;
  role: 'ADMIN' | 'PLAYER';
  addedAt: Date;
}
```

### League Announcements

```typescript
export interface LeagueMessage {
  id: string;
  leagueId: string;
  authorId: string; // must be ADMIN
  title: string;
  body: string; // markdown
  pinned: boolean;
  createdAt: Date;
}
```

### Forms

```typescript
/* one form per user */
export interface Form {
  id: string;
  ownerId: string; // User.id
  nickname: string;
  submittedAt: Date | null;
  isFinal: boolean;
  totalPoints: number;
}
```

### Schedule

```typescript
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
```

### Picks

```typescript
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
```

### Audit

```typescript
export interface ScoringRun {
  id: number;
  formId: string;
  runAt: Date;
  delta: number; // points change
  details: { matchId?: number; stage?: Stage; note?: string };
}
```

### Key Indexes & Constraints

```sql
-- one global form per user
CREATE UNIQUE INDEX one_form_per_user ON forms(owner_id);

-- fast join-code lookup
CREATE UNIQUE INDEX league_code ON league(join_code);

-- unique email per user
CREATE UNIQUE INDEX user_email ON users(email);

-- member lookup
CREATE INDEX member_lg ON league_member(league_id);

-- allow-list lookup
CREATE INDEX allowed_email ON league_allow_email(league_id, email);

-- leaderboard sort
CREATE INDEX forms_lb ON forms(total_points DESC);

-- scoring helpers
CREATE INDEX match_pick_match ON match_picks(match_id);
CREATE INDEX advance_pick_stage ON advance_picks(stage, team_id);
```

---

## 4 · Scoring Matrix (90-minute basis)

| Stage         | Outcome pts | Exact score pts | Advance bonus |
| ------------- | ----------- | --------------- | ------------- |
| Group         | +1          | +3              | +2            |
| Round of 32   | +3          | +3              | +4            |
| Round of 16   | +5          | +3              | +6            |
| Quarter-final | +7          | +3              | +8            |
| Semi-final    | +9          | +3              | +10           |
| Final         | +11         | +3              | —             |
| Top scorer    | —           | —               | +8            |

Outcome & exact are judged strictly after 90 minutes.
Slot alignment is required.

---

## 5 · REST API (prefix /api/v1)

### Auth

Authentication is handled by Clerk middleware. All protected routes require a valid Clerk session.
No custom auth endpoints needed - Clerk handles sign-in/sign-up flows.

### Leagues

| Method | Path                          | Auth  | Purpose                                 |
| ------ | ----------------------------- | ----- | --------------------------------------- |
| GET    | /leagues                      | JWT   | list my leagues                         |
| POST   | /leagues                      | JWT   | create league (creator becomes ADMIN)   |
| POST   | /leagues/:code/join           | JWT   | join via join-code                      |
| POST   | /leagues/:id/join-code/rotate | ADMIN | regenerate code                         |
| GET    | /leagues/:id/members          | ADMIN | list members                            |
| POST   | /leagues/:id/allow            | ADMIN | add e-mail allow-list `{ email, role }` |
| DELETE | /leagues/:id/members/:uid     | ADMIN | remove member                           |

### League Messages

| Method | Path                       | Auth  | Purpose                          |
| ------ | -------------------------- | ----- | -------------------------------- |
| GET    | /leagues/:id/messages      | JWT   | list messages                    |
| POST   | /leagues/:id/messages      | ADMIN | create `{ title, body, pinned }` |
| PUT    | /leagues/:id/messages/:mid | ADMIN | edit / repin                     |
| DELETE | /leagues/:id/messages/:mid | ADMIN | delete                           |

### Forms & Gameplay

| Method | Path               | Auth  | Purpose                             |
| ------ | ------------------ | ----- | ----------------------------------- |
| GET    | /forms/me          | JWT   | fetch my form                       |
| POST   | /forms             | JWT   | create blank form (409 if exists)   |
| PUT    | /forms/:id/picks   | owner | save picks (if unlocked)            |
| POST   | /forms/:id/submit  | owner | mark final                          |
| GET    | /forms/:id/compare | owner | picks vs results breakdown          |
| POST   | /simulate          | JWT   | what-if leaderboard `{ overrides }` |

### Leaderboards & Fixtures

| Method | Path                     | Purpose                         |
| ------ | ------------------------ | ------------------------------- |
| GET    | /leaderboard/global      | → global board                  |
| GET    | /leagues/:id/leaderboard | → league board (members only)   |
| GET    | /matches/next?formId=... | → upcoming fixtures for my form |

---

## 6 · Jobs & Automation

| Trigger                     | Job                                                                                                                                                                                | Result |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| First login (via Clerk)     | Upsert User row. Add LeagueMember row for general league. Check LeagueAllowEmail rows matching user.email; insert memberships with stored role and delete matched allow-list rows. |        |
| Join-code join              | Insert LeagueMember.                                                                                                                                                               |        |
| 30 min before opening match | lockForms() → isFinal = true.                                                                                                                                                      |        |
| After each match            | processMatch(matchId) → outcome & exact points.                                                                                                                                    |        |
| Stage complete              | processStage(stage) → advance bonus points.                                                                                                                                        |        |
| Nightly 03:00 UTC           | rescoreAll() → rebuild totals for all forms.                                                                                                                                       |        |

---

## 7 · Deployment

### Container Start Command

```bash
prisma migrate deploy && node dist/index.js
```

### Secrets

| Name                              | Purpose             |
| --------------------------------- | ------------------- |
| DATABASE_URL                      | Postgres connection |
| CLERK_SECRET_KEY                  | Clerk backend auth  |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk frontend auth |

Runs fine on a hobby-tier Postgres (≥1 GB).

---

## 8 · Commit Convention

`feat(leagues)  | join-code flow`
`feat(messages) | league announcements`
`feat(auth)     | google oauth`
`fix(scoring)   | outcome rule edge-case`

(Matches "feat(list) | menu layout" style.)

---

## 9 · Hand-Off Blurb

World-Cup Prediction Platform – Google sign-in, one global prediction form, private leagues via join-code, per-league admins & announcements, automatic scoring, and what-if simulation.
Build everything to the schema, routes, and job schedule defined in this Design Doc.
