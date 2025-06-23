# World-Cup Prediction **Front-End** — Design Doc

_Next 14 (App Router) · Tailwind CSS · native fetch + SWR · no global-state library_

---

## 1 · UI Goals

| #     | Goal                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Clerk authentication** → seamless auth with session management.                                                                                                      |
| **2** | **Home dashboard** – top-10 leaderboard · next fixtures (with my picks) · rules accordion · CTA buttons **Edit** and **Simulate** · league switcher & join-code modal. |
| **3** | **Form Editor** – fill the **single global form** until global lock.                                                                                                   |
| **4** | **Compare** – see picks vs. real results, per-match points & stage bonuses.                                                                                            |
| **5** | **What-if sandbox** – tweak future scores locally → `/simulate`, show new ranking (not persisted).                                                                     |
| **6** | **Leaderboards** – global board & league-scoped board (search + paging).                                                                                               |
| **7** | **Summaries** page – list all daily summaries of the active league (latest first).                                                                                     |
| **8** | **Admin pages** (role = ADMIN) – member list, join-code rotation, announcement CRUD.                                                                                   |

---

## 2 · Tech Stack

| Layer         | Choice                                | Why                                       |
| ------------- | ------------------------------------- | ----------------------------------------- |
| Framework     | **Next 14 (App Router)**              | File routing, built-in SWR, Vercel native |
| Styling       | **Tailwind CSS 3**                    | Utility classes, no UI library to learn   |
| Data fetch    | native **fetch** + **SWR**            | Minimal API surface                       |
| Auth          | **Clerk** authentication              | Complete auth solution with session mgmt  |
| Icons         | **Heroicons** SVG                     | Consistent styling                        |
| Deploy        | **Vercel** free tier                  | Zero server config                        |
| Lint / Format | Next ESLint config, Prettier optional |

No Redux, Zustand, Recoil – local React state per page is enough.

---

## 3 · Directory Layout

/app
/(public)
page.tsx → Landing page with Clerk modal authentication
/(private) → Clerk auth gated
layout.tsx →  
home/page.tsx
forms/
edit/page.tsx
compare/page.tsx
leaderboard/page.tsx
summaries/page.tsx
admin/
members/page.tsx
messages/page.tsx
/middleware.ts → Clerk auth middleware
/components
Header.tsx LeagueSwitcher.tsx JoinCodeModal.tsx
LeaderboardCard.tsx NextFixturesCard.tsx RulesCard.tsx
CTAButtons.tsx GroupTable.tsx Bracket.tsx
ScoreChip.tsx SimulatePanel.tsx SummaryCard.tsx
/lib
types.ts fetcher.ts useSession.ts useLeague.ts
/public
logo.svg favicon.ico

---

## 4 · TypeScript Models (`lib/types.ts`)

```ts
export type Stage = 'GROUP'|'R32'|'R16'|'QF'|'SF'|'F';
export type Outcome = 'W'|'D'|'L';

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
  kickoff: string;         // ISO
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

/* form editor */
export interface GroupPick {
  matchId: number;
  scoreA: number;
  scoreB: number;
  outcome: Outcome;
}
export interface BracketPick {
  slot: string;            // 'R32-A', 'QF-2', …
  teamId: string;          // 'FRA'
}
export interface FormDraft {
  id: string;
  nickname: string;
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
  isFinal: boolean;
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
  totalPoints: number;
  rank: number;
  matches: MatchBreakdown[];
  advance: {
    stage: Exclude<Stage,'GROUP'>;
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
  overrides: Record<number, { scoreA: number; scoreB: number; winnerTeamId: string }>;
}
export interface SimulatedStanding {
  rank: number;
  formId: string;
  nickname: string;
  simulatedPoints: number;
  deltaVsOfficial: number;
}
export interface SimulateResponse {
  leaderboard: SimulatedStanding[];
}


---

5 · Auth Middleware (Clerk)

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPrivateRoute = createRouteMatcher([
  '/home(.*)',
  '/forms(.*)',
  '/leaderboard(.*)',
  '/summaries(.*)',
  '/admin(.*)'
])

export default clerkMiddleware((auth, req) => {
  if (isPrivateRoute(req)) auth().protect()
})


---

6 · Home Dashboard Layout

<div className="md:grid md:grid-cols-3 md:gap-4">
  <LeaderboardCard data={lb}/>
  <NextFixturesCard data={fixtures}/>
  <RulesCard />
  <div className="md:col-span-3">
    <CTAButtons formId={form.id}/>
  </div>
</div>

LeagueSwitcher (in Header) chooses active league, stored in URL param or React context.

---

7 · Core Components (class hints)

Component	Key Tailwind classes	Note
Header	bg-slate-800 text-white	Logo, nav, LeagueSwitcher
LeagueSwitcher	select bg-slate-700 text-white	Lists my leagues
JoinCodeModal	fixed inset-0 flex items-center justify-center	Input + POST /leagues/:code/join
GroupTable	table-auto w-full text-center	48 score inputs
Bracket	grid grid-cols-2 gap-2	Select per slot
ScoreChip	inline-flex items-center gap-1 rounded-full text-xs	✔ green / ✖ red
SimulatePanel	shadow rounded-xl p-4	Debounced call to /simulate
SummaryCard	bg-white shadow rounded-xl p-4 prose	Render dangerouslySetInnerHTML


---

8 · Utilities

// lib/fetcher.ts
export const fetcher = <T>(url: string, init: RequestInit = {}) =>
  fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
      ...init.headers,
    },
    ...init,
  }).then(r => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r)))

// lib/useClerkAuth.ts
export const useClerkAuth = () => {
  const { user, isSignedIn, isLoaded } = useUser()
  return { user, isSignedIn, isLoaded }
}

// lib/useLeague.ts
export const useLeague = () => {
  const [id, set] = React.useState<string>('general')
  // read from query param or localStorage…
  return { leagueId: id, setLeagueId: set }
}


---

9 · Back-End Endpoints Consumed

Purpose	HTTP request
Auth handled by Clerk	N/A - Clerk handles auth
List leagues	GET /leagues
Join league	POST /leagues/:code/join
Rotate code	POST /leagues/:id/join-code/rotate
Member list	GET /leagues/:id/members
Allow-list email	POST /leagues/:id/allow
Messages list / CRUD	/leagues/:id/messages
Fetch my form	GET /forms/me
Save picks	PUT /forms/:id/picks
Submit final	POST /forms/:id/submit
Compare view	GET /forms/:id/compare
Simulate	POST /simulate
Leaderboards	/leaderboard/global, /leagues/:id/leaderboard
Next fixtures	GET /matches/next?formId=...
Summaries page	GET /leagues/:id/messages?type=digest


---

10 · Deployment (Vercel)
	1.	npx create-next-app wc-frontend --ts --tailwind --eslint
	2.	Push to GitHub → import into Vercel.
	3.	ENV var: NEXT_PUBLIC_API=https://api.pool.example.
	4.	Build = next build (default).
	5.	Custom domain predictions.example.com.

---

11 · Commit Convention

feat(home)      | dashboard layout
feat(forms)     | global form editor
feat(simulate)  | what-if panel
feat(summaries) | league digest list
fix(leaderboard)| highlight active row

Matches "feat(list) | menu layout" pattern.

---

12 · Implementation Roadmap
	1.	Bootstrap project (Next + Tailwind).
	2.	Clerk authentication setup & middleware.
	3.	Build Home Dashboard skeleton & SWR hooks.
	4.	Implement LeagueSwitcher & JoinCodeModal.
	5.	Create Form Editor (GroupTable, Bracket).
	6.	Build Compare page + ScoreChip.
	7.	Add SimulatePanel (once /simulate ready).
	8.	Implement Leaderboards (global + per-league).
	9.	Add Summaries page (fetch on load).
	10.	Build Admin member list & messages.
	11.	Polish mobile / dark-mode / a11y.
	12.	Deploy to Vercel & connect domain.

---

Single source of truth – follow this v2 front-end design to align with the updated back-end spec (Clerk authentication, one global form, join-codes, fetch-on-demand summaries, no SSE).

```
