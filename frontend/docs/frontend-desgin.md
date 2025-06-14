World-Cup Prediction Front-End – Design Doc

Stack : Next 14 (App Router) + Tailwind CSS | No Redux / Zustand / fancy libs – just React hooks & SWR.

⸻

1 · Key UI goals

# Goal

1 Magic-link login → cookie session, plus "waiting for approval" screen.
2 One Home dashboard combining: top-10 leaderboard, next fixtures (with my picks), rules accordion, daily digest banner, and CTA buttons for Edit + Simulate.
3 Form Editor – fill entire form before lock (group table + bracket + top-scorer).
4 Compare view – show my choices vs. real results, points per match, stage bonuses.
5 What-if sandbox – tweak future scores locally, call /simulate, show new ranking (not saved).
6 Live Leaderboard page (full ranking, search box).
7 Daily Digest banner pushed from the back end every night, plus archive page.
8 Simple admin pages optional (list pending users, approve).

Traffic ≤ 1 000 forms → no realtime stress; SSE is enough.

⸻

2 · Tech stack

Layer Choice Why
Framework Next 14 (App Router) File-system routing, SWR built-in, Vercel first-class.
Styling Tailwind CSS 3 Utility classes, no extra UI lib to learn.
Data fetch Native fetch + built-in SWR Small API surface, good cache.
Auth HttpOnly cookie wc_session set by backend after /callback.
Real-time Server-Sent Events (SSE) for nightly digest (2 kB/day).
Icons Heroicons (tailwind-compatible SVGs).
Deployment Vercel free tier.
Lint / Format ESLint - Next config, Prettier (optional).

No global state lib; each page holds its own local state.

⸻

3 · Directory layout

/app
/(public)
page.tsx (landing / login)
callback/page.tsx (magic-link handler)
pending/page.tsx ("awaiting approval")
/(private) (all require approved cookie)
layout.tsx (navbar & <DailyDigestBanner/>)
home/page.tsx
forms/[id]/
edit/page.tsx
compare/page.tsx
leaderboard/page.tsx
daily/page.tsx (digest archive)
/middleware.ts (Next edge auth gate)
/components
Header.tsx
DailyDigestBanner.tsx
LeaderboardCard.tsx
NextFixturesCard.tsx
RulesCard.tsx
CTAButtons.tsx
GroupTable.tsx
Bracket.tsx
ScoreChip.tsx
SimulatePanel.tsx
/lib
types.ts (all TS interfaces below)
fetcher.ts (wrapped fetch + cookies)
useSession.ts (JWT decode helper)
useDigest.ts (SSE hook)
constants.ts
/public
logo.svg
favicon.ico

⸻

4 · TypeScript models (copy into lib/types.ts)

/_ ─ Shared enums ─ _/
export type Stage = 'GROUP'|'R32'|'R16'|'QF'|'SF'|'F';
export type Outcome = 'W'|'D'|'L';

/_ ─ Session ─ _/
export interface Session {
userId: string;
nickname: string;
approved: boolean;
colboNumber: string;
tokenExp: number; // unix seconds
}

/_ ─ Dashboard payloads ─ _/
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
export interface DailyDigest {
date: string;
html: string;
}

/_ ─ Form editor ─ _/
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
nickname: string;
groupPicks: GroupPick[];
bracketPicks: BracketPick[];
topScorer: string;
isFinal: boolean;
}

/_ ─ Compare + simulate ─ _/
export interface MatchBreakdown {
matchId: number;
stage: Stage;
slotAligned: boolean;
myScore: [number, number];
realScore: [number|null, number|null];
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

⸻

5 · Routing & navigation

Route Access Purpose
/ public Email input → POST /auth/login. Smart flow: email only for returning users, full registration for new users.
/callback public Reads ?token=, sets cookie, redirects.
/pending cookie but !approved "Admin still needs to approve you."
/home approved Dashboard (see layout below).
/forms/[id]/edit owner/editor and unlocked Group table & bracket form builder.
/forms/[id]/compare owner/editor Picks vs reality + Simulate pane (#simulate anchor).
/leaderboard approved full ranking (infinite scroll).
/daily approved digest archive (list of DailyDigest).

Login Flow Details:
• Initial attempt: User enters email → POST /auth/login { email }
• Returning user: Gets 204 → Magic link sent → Success
• New user: Gets 400 with code "NEW_USER_REGISTRATION_REQUIRED" → Show registration form
• Registration: Submit { email, displayName, colboNumber } → Account created → Magic link sent

Middleware (edge)

import { NextResponse } from 'next/server'
export function middleware(req) {
const cookie = req.cookies.get('wc_session')
const priv = req.nextUrl.pathname.startsWith('/home') || req.nextUrl.pathname.startsWith('/forms') || req.nextUrl.pathname.startsWith('/leaderboard') || req.nextUrl.pathname.startsWith('/daily')
if (!priv) return NextResponse.next()

if (!cookie) return NextResponse.redirect(new URL('/', req.url))
const { approved } = JSON.parse(atob(cookie.value.split('.')[1]))
if (!approved) return NextResponse.redirect(new URL('/pending', req.url))
}

⸻

6 · Dashboard (“Home”) layout

graph LR
subgraph Dashboard
LB[LeaderboardCard]
NF[NextFixturesCard]
RU[RulesCard]
CT[CTAButtons]
end
DailyDigestBanner --> Dashboard

Tailwind grid:

<div className="md:grid md:grid-cols-3 md:gap-4">
  <LeaderboardCard data={lb}/>
  <NextFixturesCard data={games}/>
  <RulesCard />
  <div className="md:col-span-3"><CTAButtons formId={myFormId}/></div>
</div>

    •	LeaderboardCard: top-10 (/leaderboard?limit=10), highlight my form row.
    •	NextFixturesCard: /matches/next?formId=xxx&window=2d.
    •	RulesCard: static MDX inside accordion.
    •	CTAButtons route to /forms/[id]/edit and /forms/[id]/compare#simulate.

⸻

7 · Core components (implementation notes)

Component Key Tailwind classes Brief behaviour
Header bg-slate-800 text-white Links highlight via navLinkActive.
DailyDigestBanner bg-yellow-100 p-3 text-sm Uses useDigest; hide on "✖" (localStorage flag).
GroupTable w-full text-center Outcome radio (W/D/L) + two score inputs.
Bracket grid grid-cols-2 gap-2 Each slot -> <select> of 32 team options.
ScoreChip inline-flex items-center gap-1 rounded-full text-xs Green ✔ / red ✖ + pts badge.
SimulatePanel Panel under compare page; local state; debounce 300 ms POST /simulate.

All forms validate numeric input 0–9, disabled when isFinal.

⸻

8 · Data-fetch utilities

// lib/fetcher.ts
export const fetcher = <T = unknown>(url: string, init: RequestInit = {}) =>
fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
credentials: 'include',
...init
}).then(r => r.ok ? (r.json() as Promise<T>) : Promise.reject(r))

// lib/useSession.ts
export const useSession = (): Session | null => {
const cookie = cookies().get('wc_session')
return cookie ? JSON.parse(atob(cookie.value.split('.')[1])) as Session : null
}

// lib/useDigest.ts
export const useDigest = () => {
const [html, setHtml] = React.useState<string | null>(null)
React.useEffect(() => {
const es = new EventSource(`${process.env.NEXT_PUBLIC_API}/sse/daily`, { withCredentials:true })
es.onmessage = e => setHtml(e.data)
return () => es.close()
}, [])
return html
}

⸻

9 · Backend endpoints consumed

Front-end call Endpoint Notes
Login submit (returning) POST /auth/login body { email } for existing users
Login submit (new user) POST /auth/login body { email, displayName, colboNumber } after 400 response
Callback confirm GET /auth/callback?token=… sets Set-Cookie, returns { jwt, approved, user }
User profile GET /me authenticated user profile
Leaderboard `GET /leaderboard?limit=10	500`
Next fixtures GET /matches/next?formId=xxx&window=2d
Load form draft GET /forms/:id/compare (editor also reads this and strips earned pts ≠ 0)
Save draft PUT /forms/:id/picks
Final submit POST /forms/:id/submit
Simulate POST /simulate body SimulateRequest
Latest digest GET /summaries/latest fallback for banner
Digest SSE /sse/daily emits data:<html>\n\n

Error Response Handling:
• 400 + code "NEW_USER_REGISTRATION_REQUIRED" → Show registration form
• 401/403 → Redirect to login or pending page
• Network errors → Show retry mechanisms

⸻

10 · Deployment 1. npx create-next-app wc-frontend --ts --tailwind --eslint 2. Push to GitHub; import repo in Vercel. 3. Environment variables (Production + Preview)
• NEXT_PUBLIC_API=https://api.pool.example 4. Build command (default) next build; output ./.next. 5. Custom domain predictions.example.com.

Load balancing or edge functions not needed – requests per minute will be negligible.

⸻

11 · Commit conventions

feat(home) | dashboard layout
feat(forms) | bracket dropdowns
feat(simulate) | what-if API integration
fix(leaderboard) | highlight my row
chore(deps) | bump next 14.1

Aligns with user's preferred feat(list) | menu layout format.

⸻

12 · Roadmap order 1. Project bootstrap (Next + Tailwind + ESLint) 2. Implement auth flow (landing, callback, middleware, pending). 3. Build Home page skeleton & SWR hooks. 4. Code Form Editor (GroupTable & Bracket). 5. Add Compare + ScoreChip. 6. Implement SimulatePanel once back end ready. 7. Flesh out Leaderboard page & search. 8. Wire DailyDigestBanner (SSE). 9. Polish styles, a11y, mobile. 10. Ship to Vercel, connect domain.

That's the complete, self-contained front-end design—lean, predictable, and ready for coding.
