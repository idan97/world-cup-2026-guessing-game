# Mission 08 – Picks Endpoints

**Goal:**
Implement endpoints and DB tables for match picks, advance picks, and top scorer picks.

## Checklist

- [ ] Add `match_picks`, `advance_picks`, `top_scorer_picks` tables to Prisma schema and migrate
- [ ] Implement `PUT /forms/:id/picks` (save picks)
- [ ] Implement `POST /forms/:id/submit` (mark form as ready)
- [ ] Add validation for picks (by stage, slot, etc.)

## Acceptance Criteria

- Users can save and submit picks
- Picks are validated and stored in DB

**Design doc reference:** Section 3 (Data model), Section 5 (API surface)
