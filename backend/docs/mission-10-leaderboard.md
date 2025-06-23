# Mission 10 – Leaderboard Endpoints & Caching

**Goal:**
Implement endpoints for the global and per-league leaderboards, adding Redis caching for performance.

## Checklist

- [ ] Implement `GET /leaderboard/global` for the public, global leaderboard.
- [ ] Implement `GET /leagues/:id/leaderboard` for league-specific leaderboards.
- [ ] Add middleware to the league leaderboard route to ensure only league members can view it.
- [ ] Add Redis caching for both leaderboard endpoints to reduce database load.

## Acceptance Criteria

- [ ] The global leaderboard endpoint returns the top-N standings across all users.
- [ ] The league-specific leaderboard is accessible only to its members.
- [ ] Caching is implemented and can be toggled off in development for testing.

**Design doc reference:** Section 5 (REST API), Section 2 (Tech Stack)
