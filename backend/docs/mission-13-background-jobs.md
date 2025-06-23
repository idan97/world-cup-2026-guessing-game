# Mission 13 – Background Jobs

**Goal:**
Implement background jobs and triggers for key automation tasks like scoring, form locking, and user onboarding.

## Checklist

- [ ] **First Login:**
  - [ ] Create a trigger that, on a user's first login, automatically adds them to the "General" league.
  - [ ] The trigger should also check the `LeagueAllowEmail` table and automatically add the user to any leagues they've been pre-invited to.
- [ ] **Form Locking:**
  - [ ] Implement a job to run 30 minutes before the first match's kickoff that sets `isFinal = true` on all submitted forms.
- [ ] **Scoring:**
  - [ ] Implement a job to run after each match concludes to process `MatchPick` points (`processMatch`).
  - [ ] Implement a job to run after each stage completes to process `AdvancePick` points (`processStage`).
- [ ] **Maintenance:**
  - [ ] Implement a nightly job to rescore all forms to ensure data consistency (`rescoreAll`).

## Acceptance Criteria

- [ ] All jobs run reliably and perform their actions as described.
- [ ] New users are seamlessly integrated into their respective leagues upon login.
- [ ] Scoring and form locking are fully automated based on the tournament timeline.

**Design doc reference:** Section 6 · Jobs & Automation
