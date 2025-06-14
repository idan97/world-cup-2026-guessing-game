World-Cup Prediction Server – Design Doc

(Express + TypeScript, ≤ 1 000 forms)

⸻

1 · Goals

# Requirement

1 Collect one-shot predictions (all group games, full bracket, top scorer).
2 Freeze all forms 30 min before the opening match.
3 Auto-score after every official result, keep a live leaderboard.
4 Let users review their picks vs. reality and run what-if simulations that do not alter the real leaderboard.
5 Closed community: each signup is approved by an admin; users identified by their colboNumber (internal budget code).
6 A form may have several editors but one owner.
7 Audit trail for every points change.
8 Everything must run comfortably on a hobby-tier Postgres + one small Node instance.

⸻

2 · Tech stack

Layer Choice Why
Runtime Node 20 + Express 5 Minimal and familiar
Language TypeScript Compile-time safety
DB PostgreSQL + Prisma ORM Relational fit, migrations, type safety
Auth Password-less magic link (JWT) No password storage
Mailing Nodemailer → SMTP / Postmark Approval + notifications
Cache / Jobs Redis (optional) Leaderboard cache, cron locks
Tests Vitest + Supertest Fast TS-native
CI/CD GitHub Actions → Docker → Render/Railway/Fly One-click Postgres
Logs/metrics pino + express-prom-bundle Simple observability

⸻

3 · Data model (TypeScript types)

/_ ─── enums ─────────────────────────────────────────────────── _/
export type Stage = 'GROUP'|'R32'|'R16'|'QF'|'SF'|'F';
export type Outcome = 'W' | 'D' | 'L';

/_ ─── reference tables ──────────────────────────────────────── _/
export interface Team {
id: string; // 'FRA'
name: string; // 'France'
group: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H';
}

/_ ─── auth & membership ─────────────────────────────────────── _/
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

/_ ─── prediction containers ─────────────────────────────────── _/
export interface Form {
id: string;
nickname: string; // e.g. "Idan #2"
submittedAt: Date | null;
isFinal: boolean; // true when locked
totalPoints: number; // running tally
}

/_ ─── static schedule ───────────────────────────────────────── _/
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

/_ ─── user picks ─────────────────────────────────────────────── _/
export interface MatchPick {
formId: string;
matchId: number; // slot, not "real" teams
predScoreA: number;
predScoreB: number;
predOutcome: Outcome; // W / D / L
}

export interface AdvancePick {
formId: string;
stage: Exclude<Stage,'GROUP'>; // R32 … F
teamId: string; // e.g. 'FRA'
}

export interface TopScorerPick {
formId: string;
playerName: string;
}

/_ ─── audit trail ────────────────────────────────────────────── _/
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

Index highlights

-- speed up scoring & stage checks
CREATE INDEX ON match_picks(matchId);
CREATE INDEX ON advance_picks(stage, teamId);
-- fast leaderboard
CREATE INDEX ON forms(totalPoints DESC);

Rows at full capacity (1 000 forms):
• match_picks ≈ 64 000
• advance_picks ≈ 15 000
• Others ≪ 10 000
Well within hobby-tier limits.

⸻

4 · Scoring rules (World Cup)

Stage Outcome Exact score Advance bonus
Group match 1 pt +3 pts 2 pts (team reaches R32)
Round of 32 3 pts +3 pts 4 pts
Round of 16 5 pts +3 pts 6 pts
Quarter-final 7 pts +3 pts 8 pts
Semi-final 9 pts +3 pts 10 pts
Final 11 pts +3 pts —
Top-scorer pick — — 8 pts

Outcome / exact-score judged on 90 minutes only.
Slot alignment required—same fixture position as the real bracket.

⸻

5 · API surface (v1, JSON)

Method Path Body (⇢ key fields) Response (⇢ key fields) Notes
POST /auth/login { email } OR { email, displayName, colboNumber } 204 OR 400 with NEW_USER_REGISTRATION_REQUIRED Returning users: email only. New users: all fields required
GET /auth/callback — { jwt, approved, user } JWT holds userId, isApproved. Returns user profile
GET /me — user profile authenticated user info
GET /me/forms — array list user forms
POST /forms { nickname } { formId } create empty sheet
PUT /forms/:id/picks { matchPicks, advancePicks, topScorer } 204 allowed until isFinal=true
POST /forms/:id/submit — 204 mark ready (still editable pre-lock)
GET /forms/:id/compare — CompareResponse full per-match breakdown
POST /simulate { overrides } { leaderboard[] } returns simulated ranking of all forms
GET /leaderboard — top-N official standings
Admin /admin/users/pending (GET), /admin/users/:id/approve (POST) — — approve sign-ups
Admin /admin/matches (GET/POST) schedule / results — import or update
Admin /admin/rescore (POST) — 202 force full recompute

All user-facing routes are guarded by requireApproved middleware.

Login Flow Details:
• Returning users: POST /auth/login with { email } only
• New users: First attempt with email only returns 400 + code "NEW_USER_REGISTRATION_REQUIRED"  
• New users: Second attempt with { email, displayName, colboNumber } creates account + sends approval notifications

⸻

6 · Workflows & background jobs

When Job Action
T-30 min before first kickoff lockForms UPDATE forms SET isFinal=true
Final whistle of each match processMatch(id) add outcome/exact pts; log ScoringRun; bump totals
Stage completed processStage(stage) add advance points
After final processTopScorer() add golden-boot bonus
Nightly 03:00 UTC rescoreAll() recompute every form for safety
Signup event notifyAdmins() e-mail "Approve idan@example.com"

⸻

7 · Admin-approval e-mail flow 1. User verifies their e-mail (magic link). 2. isApproved=false → middleware blocks main app. 3. System e-mails all admins with an Approve link:

GET /admin/users/<id>/approve?token=…

    4.	On click → sets isApproved=true, sends confirmation to user.

(Nodemailer with an SMTP credential or Postmark template.)

⸻

8 · Deployment outline

graph LR
GitHub -->|push main| GH[GitHub Actions]
GH -->|docker build / test| Reg[(Container Registry)]
Reg --> Render
subgraph Render
direction TB
API[(Express container)]
PG[(Postgres 1 GB)]
REDIS[(Redis optional)]
end

    •	Release CMD: prisma migrate deploy && node dist/index.js
    •	Secrets: DATABASE_URL, JWT_SECRET, SMTP_*.
    •	One read replica or Redis cache can front /leaderboard.

⸻

9 · Commit message pattern

feat(api) | add compare & simulate endpoints
feat(db) | add FormMember, colboNumber
fix(score)| stage-alignment bug

(Follows user's feat(list) | menu layout style.)

⸻

Ready-made share blurb

"We're building a private World-Cup pool in Node/Express.
DB schema, API routes, scoring math, approval flow and deployment plan are in Design Doc v1 (link).
Please review the TypeScript interfaces and REST contract; scoring logic lives in @wc-predictor/scoring and is reused by both server and React client."

⸻
