# Backend Architecture Summary

**Last Updated:** January 2026  
**Stack:** Express.js + TypeScript + Prisma + PostgreSQL + Clerk Auth

---

## 📡 API Endpoints

### Health Check

| Method | Path           | Auth | Description           |
| ------ | -------------- | ---- | --------------------- |
| `GET`  | `/api/healthz` | ❌   | Health check endpoint |

### Matches (Public)

| Method | Path                        | Auth | Description                                       |
| ------ | --------------------------- | ---- | ------------------------------------------------- |
| `GET`  | `/api/matches`              | ❌   | Get all matches (optional `?stage=GROUP`)         |
| `GET`  | `/api/matches/next`         | ❌   | Get next upcoming matches                         |
| `GET`  | `/api/matches/stage/:stage` | ❌   | Get matches by stage (GROUP, R32, R16, QF, SF, F) |
| `GET`  | `/api/matches/:id`          | ❌   | Get single match by ID                            |

### Standings (Public)

| Method | Path                                  | Auth | Description                                     |
| ------ | ------------------------------------- | ---- | ----------------------------------------------- |
| `GET`  | `/api/standings`                      | ❌   | Get all standings (optional `?group=A&group=B`) |
| `GET`  | `/api/standings/:groupLetter`         | ❌   | Get standings for specific group (A-L)          |
| `GET`  | `/api/standings/third-place/rankings` | ❌   | Get third place rankings                        |

### Leagues

| Method   | Path                                | Auth            | Description               |
| -------- | ----------------------------------- | --------------- | ------------------------- |
| `GET`    | `/api/leagues`                      | ✅ User         | Get user's leagues        |
| `POST`   | `/api/leagues`                      | ✅ User         | Create new league         |
| `POST`   | `/api/leagues/:code/join`           | ✅ User         | Join league by code       |
| `GET`    | `/api/leagues/:id/leaderboard`      | ✅ Member       | Get league leaderboard    |
| `GET`    | `/api/leagues/:id/messages`         | ✅ Member       | Get league messages       |
| `POST`   | `/api/leagues/:id/messages`         | ✅ League Admin | Create league message     |
| `GET`    | `/api/leagues/:id/members`          | ✅ League Admin | Get league members        |
| `DELETE` | `/api/leagues/:id/members/:uid`     | ✅ League Admin | Remove member from league |
| `POST`   | `/api/leagues/:id/join-code/rotate` | ✅ League Admin | Rotate join code          |
| `POST`   | `/api/leagues/:id/allow`            | ✅ League Admin | Add email to allow list   |

### Forms (Prediction Forms)

| Method   | Path                        | Auth     | Description                                 |
| -------- | --------------------------- | -------- | ------------------------------------------- |
| `GET`    | `/api/forms/me`             | ✅ User  | Get user's form                             |
| `POST`   | `/api/forms`                | ✅ User  | Create new form                             |
| `GET`    | `/api/forms/:id`            | ✅ Owner | Get form by ID                              |
| `GET`    | `/api/forms/:id/with-picks` | ✅ Owner | Get form with all picks                     |
| `PUT`    | `/api/forms/:id`            | ✅ Owner | Update form (nickname, etc.)                |
| `PUT`    | `/api/forms/:id/picks`      | ✅ Owner | Save all picks (match, advance, top scorer) |
| `POST`   | `/api/forms/:id/submit`     | ✅ Owner | Mark form as submitted/final                |
| `DELETE` | `/api/forms/:id`            | ✅ Owner | Delete form                                 |

### ~~Predictions~~ (Removed - Merged into Forms)

**Note:** The `/api/predictions/*` endpoints have been removed. All prediction functionality is now handled through `/api/forms/:id/picks`.

### Simulation

| Method | Path                                       | Auth    | Description                               |
| ------ | ------------------------------------------ | ------- | ----------------------------------------- |
| `GET`  | `/api/simulate/my`                         | ✅ User | Get user's saved simulation               |
| `PUT`  | `/api/simulate/my`                         | ✅ User | Save user's simulation                    |
| `POST` | `/api/simulate/calculate`                  | ✅ User | Calculate general simulation              |
| `POST` | `/api/simulate/league/:id/calculate`       | ✅ User | Calculate simulation for specific league  |
| `GET`  | `/api/simulate/league/:id/all-predictions` | ✅ User | Get all predictions for league simulation |

### Admin

| Method | Path                               | Auth     | Description                                      |
| ------ | ---------------------------------- | -------- | ------------------------------------------------ |
| `GET`  | `/api/admin/matches`               | ✅ Admin | Get all matches (with filters)                   |
| `GET`  | `/api/admin/matches/:id`           | ✅ Admin | Get specific match                               |
| `POST` | `/api/admin/matches`               | ✅ Admin | Create/import matches (bulk)                     |
| `PUT`  | `/api/admin/matches/:id`           | ✅ Admin | Update match details                             |
| `POST` | `/api/admin/matches/:id/result`    | ✅ Admin | Record match result (triggers cascading updates) |
| `GET`  | `/api/admin/tournament/settings`   | ✅ Admin | Get tournament settings                          |
| `PUT`  | `/api/admin/tournament/top-scorer` | ✅ Admin | Update actual top scorer                         |

---

## 🗄️ Data Models & Relations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TOURNAMENT DATA                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐        ┌──────────────────┐        ┌────────────────────┐     │
│  │  Team   │───────▶│  GroupStanding   │        │ ThirdPlaceRanking  │     │
│  │  (48)   │        │      (48)        │        │       (12)         │     │
│  └────┬────┘        └──────────────────┘        └────────────────────┘     │
│       │                                                                     │
│       │ team1Id, team2Id, winnerId                                          │
│       ▼                                                                     │
│  ┌─────────┐                                                                │
│  │  Match  │◀────────────────────────────────────────────────────────┐     │
│  │  (104)  │                                                          │     │
│  └─────────┘                                                          │     │
│                                                                       │     │
└───────────────────────────────────────────────────────────────────────┼─────┘
                                                                        │
┌───────────────────────────────────────────────────────────────────────┼─────┐
│                           USER & LEAGUES                              │     │
├───────────────────────────────────────────────────────────────────────┼─────┤
│                                                                       │     │
│  ┌─────────┐        ┌──────────────────┐        ┌────────────────┐   │     │
│  │  User   │───────▶│  LeagueMember    │◀───────│    League      │   │     │
│  │         │        │  (role: ADMIN    │        │                │   │     │
│  │         │        │   or PLAYER)     │        │                │   │     │
│  └────┬────┘        └──────────────────┘        └───────┬────────┘   │     │
│       │                                                  │           │     │
│       │                                         ┌────────┴───────┐   │     │
│       │                                         ▼                ▼   │     │
│       │                              ┌─────────────────┐ ┌────────────┐   │
│       │                              │ LeagueMessage   │ │LeagueAllow │   │
│       │                              │                 │ │   Email    │   │
│       │                              └─────────────────┘ └────────────┘   │
│       │                                                                   │
└───────┼───────────────────────────────────────────────────────────────────┘
        │
┌───────┼───────────────────────────────────────────────────────────────────┐
│       │                      PREDICTIONS                                   │
├───────┼───────────────────────────────────────────────────────────────────┤
│       │                                                                    │
│       ▼                                                                    │
│  ┌─────────┐                                                               │
│  │  Form   │──────────────────┬─────────────────────────────────────┐    │
│  │  (1:1)  │                  │                                     │    │
│  └─────────┘                  ▼                                     ▼    │
│                         ┌───────────┐                         ┌─────────┐ │
│                         │ MatchPick  │                         │TopScorer│ │
│                         │  (0-104)  │   ▲                     │  Pick   │ │
│                         └───────────┘   │                     └─────────┘ │
│                               │         │                                  │
│                               ▼         │                                  │
│                           Match ────────┘                                  │
│                                                                            │
│  Note: AdvancePick removed - advancement derived from MatchPick winners   │
│  ┌────────────┐                                                            │
│  │ ScoringRun │◀──── Form (tracks point changes)                          │
│  └────────────┘                                                            │
│                                                                            │
│  ┌────────────┐                                                            │
│  │ Simulation │ (userId unique, stores JSON results)                       │
│  └────────────┘                                                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                          TOURNAMENT SETTINGS                               │
├────────────────────────────────────────────────────────────────────────────┤
│  TournamentSettings (singleton) - stores actualTopScorer                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships

| From        | To            | Type | Description                           |
| ----------- | ------------- | ---- | ------------------------------------- |
| User        | Form          | 1:1  | Each user has one prediction form     |
| User        | LeagueMember  | 1:N  | User can be in multiple leagues       |
| League      | LeagueMember  | 1:N  | League has many members               |
| Form        | MatchPick     | 1:N  | Form contains many match predictions  |
| Form        | AdvancePick   | 1:N  | Form contains advancement predictions |
| Form        | TopScorerPick | 1:1  | Form has one top scorer prediction    |
| Match       | Team          | N:1  | Match references team1, team2, winner |
| Team        | GroupStanding | 1:1  | Team has one standing in its group    |
| MatchPick   | Match         | N:1  | Picks reference matches               |
| AdvancePick | Team          | N:1  | Picks reference teams                 |

---

## 🔄 Data Flow: Match Result Update

```
Admin records result → POST /api/admin/matches/:id/result
        │
        ▼
    MatchResultService.updateMatchResult()
        │
        ├── Update Match (score, winner, isFinished)
        │
        ├── [If GROUP stage]
        │       │
        │       ├── Update GroupStandings (points, GD, GF, GA)
        │       ├── Re-sort group by: Points → GD → GF
        │       │
        │       └── [If all groups finished]
        │               ├── Rank top 8 third-place teams
        │               └── Assign teams to R32 matches (lookup table)
        │
        └── [If KNOCKOUT stage]
                └── Assign winner to next round match
```

---

## 💡 Improvement Suggestions

### 1. **Code Organization**

| Issue                                | Suggestion                                                                                | Priority  |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | --------- |
| Predictions API duplicates Forms API | Consider removing `/api/predictions/*` routes and consolidating in `/api/forms/:id/picks` | 🟡 Medium |
| No API versioning                    | Add `/api/v1/` prefix for future compatibility                                            | 🟢 Low    |
| Controllers are large                | Split AdminController into MatchAdminController + TournamentAdminController               | 🟡 Medium |

### 2. **Missing Features**

| Feature               | Description                                        | Priority  |
| --------------------- | -------------------------------------------------- | --------- |
| **WebSocket/SSE**     | Real-time updates for live match results           | 🔴 High   |
| **Automated Tests**   | Unit tests for services, integration tests for API | 🔴 High   |
| **Rate Limiting**     | Prevent API abuse                                  | 🟡 Medium |
| **Caching**           | Redis cache for standings/leaderboards             | 🟡 Medium |
| **API Documentation** | Swagger/OpenAPI spec                               | 🟢 Low    |
| **Pagination**        | Add pagination to list endpoints                   | 🟡 Medium |

### 3. **Database Optimizations**

| Issue                | Suggestion                                          |
| -------------------- | --------------------------------------------------- |
| N+1 queries possible | Add `include` relations to Prisma queries in models |
| No soft delete       | Consider adding `deletedAt` for audit trail         |
| Missing indexes      | Add index on `Form.ownerId` for leaderboard queries |

### 4. **Security Enhancements**

| Area             | Current              | Suggested                            |
| ---------------- | -------------------- | ------------------------------------ |
| Admin check      | DB query per request | Cache admin status in JWT claims     |
| Input validation | Zod in controllers   | Add global validation middleware     |
| Rate limiting    | None                 | Add `express-rate-limit` per IP/user |
| CORS             | Multiple origins     | Stricter production config           |

### 5. **Architecture Simplifications**

```
Current:
  Controller → Model → Prisma
  Controller → Service → Prisma (for complex logic)

Suggested:
  Controller → Service → Repository → Prisma

Benefits:
  - Single pattern everywhere
  - Easier to test (mock repositories)
  - Better separation of concerns
```

### 6. **Specific Refactoring Ideas**

1. **Create a shared `pickUndefined` utility:**

   ```typescript
   // utils/object.ts
   export const omitUndefined = <T extends object>(obj: T): Partial<T> =>
     Object.fromEntries(
       Object.entries(obj).filter(([, v]) => v !== undefined),
     ) as Partial<T>;
   ```

2. **Move validation schemas to dedicated files:**

   ```
   src/
   └── validators/
       ├── match.ts
       ├── form.ts
       └── league.ts
   ```

3. **Create a transaction wrapper service:**
   ```typescript
   // services/TransactionService.ts
   export const withTransaction = async <T>(
     fn: (tx: PrismaTransaction) => Promise<T>,
   ): Promise<T> => prisma.$transaction(fn);
   ```

### 7. **Performance Considerations**

| Area                    | Issue                         | Solution                           |
| ----------------------- | ----------------------------- | ---------------------------------- |
| Leaderboard calculation | Recalculated on every request | Pre-compute on match result update |
| Third-place ranking     | 12 DB updates sequential      | Batch with `updateMany`            |
| Form with picks         | Multiple queries              | Use Prisma `include` deeply        |

---

## 📊 Current Stats

| Entity  | Count                          |
| ------- | ------------------------------ |
| Teams   | 48                             |
| Groups  | 12 (A-L)                       |
| Matches | 104 (48 group + 56 knockout)   |
| Stages  | 6 (GROUP, R32, R16, QF, SF, F) |

---

## 🔧 Development Commands

```bash
# Start development server
npm run start:dev

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed initial data
npm run db:studio      # Open Prisma Studio

# Build & lint
npm run build          # TypeScript compile
npm run lint           # ESLint check
npm run format         # Prettier format
```

---

## 📁 Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seeding script
│   └── migrations/        # Migration files
├── src/
│   ├── app.ts             # Express app setup
│   ├── index.ts           # Entry point
│   ├── config.ts          # Environment config
│   ├── db.ts              # Prisma client singleton
│   ├── logger.ts          # Pino logger
│   ├── controllers/       # Request handlers
│   ├── models/            # Prisma model wrappers
│   ├── services/          # Business logic
│   ├── middlewares/       # Auth, validation, error handling
│   ├── routes/            # Route definitions
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
└── docs/                  # Documentation
```
