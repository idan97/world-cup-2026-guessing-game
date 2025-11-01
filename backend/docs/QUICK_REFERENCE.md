# Backend Quick Reference

Quick reference guide for common tasks and patterns in the World Cup 2026 backend.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Common Commands](#common-commands)
- [API Patterns](#api-patterns)
- [Database Queries](#database-queries)
- [Middleware Usage](#middleware-usage)
- [Error Handling](#error-handling)
- [Testing Endpoints](#testing-endpoints)

---

## Getting Started

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
npm run docker:up

# 3. Run migrations
npm run db:migrate

# 4. Seed database
npm run db:seed

# 5. Generate Prisma client
npm run db:generate

# 6. Start dev server
npm run dev
```

### Environment Variables

Create `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worldcup"
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
ADMIN_USER_IDS="user_abc,user_xyz"
PORT=3000
NODE_ENV=development
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm run start            # Start production server

# Database
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database (⚠️ deletes all data)
npm run db:seed          # Seed teams and matches
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:generate      # Generate Prisma client

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Docker
npm run docker:up        # Start PostgreSQL
npm run docker:down      # Stop PostgreSQL
```

---

## API Patterns

### Creating a New Endpoint

#### 1. Define Route

```typescript
// src/routes/example.ts
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { ExampleController } from '../controllers/ExampleController';

const router = Router();

router.get('/examples', requireAuth(), ExampleController.list);
router.post('/examples', requireAuth(), ExampleController.create);
router.get('/examples/:id', requireAuth(), ExampleController.get);
router.put('/examples/:id', requireAuth(), ExampleController.update);
router.delete('/examples/:id', requireAuth(), ExampleController.delete);

export default router;
```

#### 2. Create Controller

```typescript
// src/controllers/ExampleController.ts
import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ExampleModel } from '../models/Example';

export class ExampleController extends BaseController {
  static async list(req: Request, res: Response) {
    try {
      const userId = req.auth.userId;
      const examples = await ExampleModel.findByUser(userId);
      res.json(examples);
    } catch (error) {
      BaseController.handleError(res, error);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userId = req.auth.userId;
      const data = req.body;
      const example = await ExampleModel.create(userId, data);
      res.status(201).json(example);
    } catch (error) {
      BaseController.handleError(res, error);
    }
  }
}
```

#### 3. Create Model

```typescript
// src/models/Example.ts
import { db } from '../db';

export class ExampleModel {
  static async findByUser(userId: string) {
    return db.example.findMany({
      where: { userId }
    });
  }

  static async create(userId: string, data: any) {
    return db.example.create({
      data: {
        ...data,
        userId
      }
    });
  }
}
```

#### 4. Register Route

```typescript
// src/routes/index.ts
import exampleRoutes from './example';

router.use('/examples', exampleRoutes);
```

---

## Database Queries

### Basic CRUD

```typescript
// Find one
const user = await db.user.findUnique({
  where: { id: userId }
});

// Find many
const leagues = await db.league.findMany({
  where: { name: { contains: 'Friends' } },
  orderBy: { createdAt: 'desc' },
  take: 10
});

// Create
const form = await db.form.create({
  data: {
    ownerId: userId,
    nickname: 'My Form'
  }
});

// Update
await db.form.update({
  where: { id: formId },
  data: { totalPoints: { increment: 10 } }
});

// Delete
await db.leagueMember.delete({
  where: {
    leagueId_userId: { leagueId, userId }
  }
});
```

### Relations

```typescript
// Include relations
const form = await db.form.findUnique({
  where: { id: formId },
  include: {
    owner: true,
    matchPicks: {
      include: { match: true }
    },
    advancePicks: {
      include: { team: true }
    }
  }
});

// Nested create
const league = await db.league.create({
  data: {
    name: 'My League',
    joinCode: generateJoinCode(),
    members: {
      create: {
        userId,
        role: 'ADMIN'
      }
    }
  }
});
```

### Transactions

```typescript
await db.$transaction(async (tx) => {
  // Create scoring run
  await tx.scoringRun.create({
    data: {
      formId,
      delta: points,
      details: { matchId }
    }
  });
  
  // Update form total
  await tx.form.update({
    where: { id: formId },
    data: { totalPoints: { increment: points } }
  });
});
```

### Raw SQL

```typescript
const leaderboard = await db.$queryRaw`
  SELECT 
    f.id,
    f.nickname,
    f.total_points,
    ROW_NUMBER() OVER (ORDER BY f.total_points DESC) as rank
  FROM forms f
  ORDER BY f.total_points DESC
  LIMIT ${limit}
`;
```

---

## Middleware Usage

### Authentication

```typescript
import { requireAuth } from '../middlewares/auth';

// Require authenticated user
router.get('/forms/me', requireAuth(), FormController.getMyForm);
```

### League Membership

```typescript
import { requireLeagueMember } from '../middlewares/league';

// Require league membership
router.get('/leagues/:id/messages', 
  requireAuth(), 
  requireLeagueMember, 
  LeagueController.getMessages
);
```

### League Admin

```typescript
import { requireLeagueAdmin } from '../middlewares/admin';

// Require league admin
router.post('/leagues/:id/messages', 
  requireAuth(), 
  requireLeagueAdmin, 
  LeagueController.createMessage
);
```

### Form Ownership

```typescript
import { requireFormOwner } from '../middlewares/form';

// Require form ownership + not locked
router.put('/forms/:id/picks', 
  requireAuth(), 
  requireFormOwner, 
  FormController.updatePicks
);
```

### Global Admin

```typescript
import { requireGlobalAdmin } from '../middlewares/admin';

// Require global admin
router.post('/admin/matches', 
  requireAuth(), 
  requireGlobalAdmin, 
  AdminController.importMatches
);
```

### Chaining Middlewares

```typescript
router.delete('/leagues/:id/members/:userId',
  requireAuth(),           // 1. Must be authenticated
  requireLeagueMember,     // 2. Must be league member
  requireLeagueAdmin,      // 3. Must be league admin
  LeagueController.removeMember
);
```

---

## Error Handling

### In Controllers

```typescript
export class ExampleController extends BaseController {
  static async create(req: Request, res: Response) {
    try {
      // Business logic
      const result = await ExampleModel.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      BaseController.handleError(res, error);
    }
  }
}
```

### In Models

```typescript
export class ExampleModel {
  static async create(data: any) {
    // Validation
    if (!data.name) {
      throw new Error('Name is required');
    }
    
    // Check existence
    const existing = await db.example.findUnique({
      where: { name: data.name }
    });
    
    if (existing) {
      throw new Error('Name already exists');
    }
    
    // Create
    return db.example.create({ data });
  }
}
```

### Custom Error Types

```typescript
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Usage
if (!league) {
  throw new NotFoundError('League not found');
}

if (member.role !== 'ADMIN') {
  throw new ForbiddenError('Admin access required');
}
```

---

## Testing Endpoints

### Using cURL

```bash
# Get auth token from Clerk
TOKEN="your_clerk_jwt_token"

# Get my form
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/forms/me

# Create form
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Test Form"}' \
  http://localhost:3000/api/v1/forms

# Update picks
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchPicks": [
      {"matchId": 1, "predScoreA": 2, "predScoreB": 1, "predOutcome": "W"}
    ]
  }' \
  http://localhost:3000/api/v1/forms/ckx123/picks

# Join league
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/leagues/ABC12345/join

# Get leaderboard
curl http://localhost:3000/api/v1/leaderboard/global
```

### Using HTTPie

```bash
# Get my form
http GET localhost:3000/api/v1/forms/me \
  Authorization:"Bearer $TOKEN"

# Create form
http POST localhost:3000/api/v1/forms \
  Authorization:"Bearer $TOKEN" \
  nickname="Test Form"

# Update picks
http PUT localhost:3000/api/v1/forms/ckx123/picks \
  Authorization:"Bearer $TOKEN" \
  matchPicks:='[{"matchId":1,"predScoreA":2,"predScoreB":1,"predOutcome":"W"}]'
```

### Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "World Cup 2026 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{clerk_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "clerk_token",
      "value": "your_token_here"
    }
  ],
  "item": [
    {
      "name": "Forms",
      "item": [
        {
          "name": "Get My Form",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/forms/me"
          }
        },
        {
          "name": "Create Form",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/forms",
            "body": {
              "mode": "raw",
              "raw": "{\"nickname\":\"Test Form\"}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

---

## Common Patterns

### Pagination

```typescript
export class ExampleController extends BaseController {
  static async list(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const [items, total] = await Promise.all([
        db.example.findMany({
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        db.example.count()
      ]);
      
      res.json({
        items,
        total,
        limit,
        offset
      });
    } catch (error) {
      BaseController.handleError(res, error);
    }
  }
}
```

### Filtering

```typescript
const filters: any = {};

if (req.query.stage) {
  filters.stage = req.query.stage;
}

if (req.query.teamId) {
  filters.OR = [
    { teamAId: req.query.teamId },
    { teamBId: req.query.teamId }
  ];
}

const matches = await db.match.findMany({
  where: filters
});
```

### Sorting

```typescript
const sortBy = req.query.sortBy as string || 'createdAt';
const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

const items = await db.example.findMany({
  orderBy: { [sortBy]: sortOrder }
});
```

---

## Useful Snippets

### Generate Join Code

```typescript
export function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
```

### Get Outcome

```typescript
export function getOutcome(scoreA: number, scoreB: number): Outcome {
  if (scoreA > scoreB) return 'W';
  if (scoreA < scoreB) return 'L';
  return 'D';
}
```

### Calculate Points

```typescript
const SCORING_MATRIX = {
  GROUP: { outcome: 1, exact: 3, advance: 2 },
  R32:   { outcome: 3, exact: 3, advance: 4 },
  R16:   { outcome: 5, exact: 3, advance: 6 },
  QF:    { outcome: 7, exact: 3, advance: 8 },
  SF:    { outcome: 9, exact: 3, advance: 10 },
  F:     { outcome: 11, exact: 3, advance: 0 }
};

export function calculateMatchPoints(
  pick: MatchPick,
  match: Match
): number {
  let points = 0;
  const stagePoints = SCORING_MATRIX[match.stage];
  
  // Outcome points
  const actualOutcome = getOutcome(match.scoreA!, match.scoreB!);
  if (pick.predOutcome === actualOutcome) {
    points += stagePoints.outcome;
  }
  
  // Exact score points
  if (pick.predScoreA === match.scoreA && pick.predScoreB === match.scoreB) {
    points += stagePoints.exact;
  }
  
  return points;
}
```

---

## Debugging

### Enable Query Logging

```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

### Log Request Details

```typescript
// src/middlewares/logging.ts
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    userId: req.auth?.userId
  });
  next();
});
```

### Inspect Database

```bash
# Open Prisma Studio
npm run db:studio

# Connect with psql
psql postgresql://postgres:postgres@localhost:5432/worldcup

# Common queries
SELECT * FROM users;
SELECT * FROM forms ORDER BY total_points DESC LIMIT 10;
SELECT * FROM league_members WHERE league_id = 'general';
```

---

## Resources

- **Full Design Doc**: [BACKEND_DESIGN.md](./BACKEND_DESIGN.md)
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com
- **Clerk Docs**: https://clerk.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

**Last Updated:** November 1, 2025

