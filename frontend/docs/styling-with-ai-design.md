🎨 AI-generation cheatsheet (v0.dev)

Clear colour palette · flat Tailwind · no fancy gradients

---

## Home (`/home`)

- **DashboardLayout.ai.tsx** → re-export as HomePage
  - Prompt: Responsive 3-column dashboard. Card 1: 'Leaderboard' table 10 rows (rank # , name, pts). Card 2: 'Next fixtures' list with kickoff time chips. Card 3: accordion titled 'Rules'. Below grid, full-width strip with 2 primary buttons 'Edit form' 'Simulate'. Flat Tailwind, light theme, white cards, slate-800 headings.
- **LeaderboardCard.ai.tsx**
  - Prompt: Simple white table, clear borders, three columns Rank, Name, Points.
- **NextFixturesCard.ai.tsx**
  - Prompt: Vertical list of soccer fixtures: flag circle, team names, 'v', kickoff time badge. Use flex, gap-2, text-sm.
- **RulesAccordion.ai.tsx**
  - Prompt: Accordion with three items, header bold slate-700, body small text, Tailwind only.
- **CTAStrip.ai.tsx**
  - Prompt: Full-width bar, light-slate background, centered buttons 'Edit my form' and 'Simulate what-if', emerald-600 hover emerald-700.

---

## Form Editor (`/forms/[id]/edit`)

- **GroupTable.ai.tsx**
  - Prompt: Editable football group table: rows show flag, team names, two number inputs (score A/B, w-20), outcome radio W / D / L. Zebra rows slate-50.
- **BracketPicker.ai.tsx**
  - Prompt: Grid of select boxes labelled R32-A … Final. Each select shows team flags dropdown. Simple, border, rounded.
- **TopScorerInput.ai.tsx**
  - Prompt: Text input with label 'Top scorer'. Full width, shadow-sm.

---

## Compare (`/forms/[id]/compare`)

- **CompareAccordion.ai.tsx**
  - Prompt: Accordion per stage. Row: ✔ or ✖ icon (green/red), match teams, result '2-1', points badge blue. Compact.
- **SimulatePanel.ai.tsx**
  - Prompt: Sidebar card titled 'What-if simulator'. List future fixtures with number inputs, primary button 'Re-calculate', result text 'You'd be 3rd (+5)'. Clean.
- **ScoreChip.ai.tsx**
  - Prompt: Tiny pill badge green for correct, red for wrong, shows +pts number.

---

## Leaderboard (`/leaderboard`)

- **LeaderboardTable.ai.tsx**
  - Prompt: Full leaderboard table (sticky header), rank, nickname, pts, striped rows, search input above.

---

## Daily Archive (`/daily`)

- **DigestArchive.ai.tsx**
  - Prompt: Vertical timeline of daily summaries. Date badge, lightly bordered card with HTML snippet placeholder.

---

## Auth Flow (`/`, `/callback`, `/pending`)

- **LoginPage.ai.tsx**
  - Prompt: Landing page with centered email input form. On submit: if existing user, show "Magic link sent"; if new user (400 error), show registration form below with displayName and colboNumber inputs. Clean white card, emerald submit button, error states.
- **RegistrationForm.ai.tsx**
  - Prompt: Form with email (pre-filled, disabled), displayName and colboNumber text inputs, submit button. Appears below email form for new users. Clear validation states.
- **CallbackHandler.ai.tsx**
  - Prompt: Loading spinner centered page "Verifying your login link...", then redirect logic.
- **AwaitApprovalCard.ai.tsx**
  - Prompt: Centered card ✓ icon, text 'Thanks! An admin must approve you.' simple button 'Sign out'.

---

**Tip:** After export, save original TSX under `/ai-generated`, then create thin wrapper in `/components` to inject props and strip placeholder data.
