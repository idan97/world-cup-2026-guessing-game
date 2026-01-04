# World Cup 2026 API - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Clerk account (for authentication)

### Installation
```bash
cd backend
npm install
```

### Environment Setup
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/worldcup2026"
CLERK_SECRET_KEY="your_clerk_secret_key"
PORT=3000
```

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with World Cup 2026 data
npm run db:seed
```

### Start Server
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Server will be available at: `http://localhost:3000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Available Endpoints

#### 🏆 Standings (Public)
- `GET /standings` - All group standings
- `GET /standings/:groupLetter` - Specific group (A-L)
- `GET /standings/third-place/rankings` - Third place rankings

#### ⚽ Matches (Public)
- `GET /matches` - All matches with filters
  - Query params: `?stage=GROUP&group=A&upcoming=true&limit=10`
- `GET /matches/:id` - Single match
- `GET /matches/stage/:stage` - Matches by stage

#### 🎯 Predictions (Authenticated)
- `POST /predictions/matches` - Create/update match predictions
- `POST /predictions/advances` - Create/update advance predictions
- `POST /predictions/top-scorer` - Create/update top scorer
- `GET /predictions/my` - Get user's predictions

#### 📋 Forms (Authenticated)
- `GET /forms/me` - Get user's form
- `POST /forms` - Create new form
- `PUT /forms/:id` - Update form
- `PUT /forms/:id/picks` - Update picks
- `POST /forms/:id/submit` - Submit form

#### 🔐 Admin (Admin Only)
- `POST /admin/matches/:id/result` - Update match result

---

## 🧪 Testing

### Using cURL

#### Get all standings:
```bash
curl http://localhost:3000/api/standings
```

#### Get standings for group A:
```bash
curl http://localhost:3000/api/standings/A
```

#### Get upcoming matches:
```bash
curl "http://localhost:3000/api/matches?upcoming=true&limit=5"
```

#### Create predictions (requires JWT):
```bash
curl -X POST http://localhost:3000/api/predictions/matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "predictions": [
      {
        "matchId": "match_id_here",
        "predScoreA": 2,
        "predScoreB": 1
      }
    ]
  }'
```

### Using REST Client (VSCode)
Open `docs/API-EXAMPLES.http` in VSCode with REST Client extension.

### Using Postman
Import the examples from `docs/API-EXAMPLES.http`.

---

## 📖 Detailed Documentation

- **[API Endpoints](./docs/API-ENDPOINTS.md)** - Complete API reference
- **[Backend Design](./docs/BACKEND_DESIGN.md)** - Architecture & design
- **[TODO Roadmap](./docs/TODO-ROADMAP.md)** - Development progress
- **[Sprint 1 Summary](./docs/SPRINT1-SUMMARY.md)** - Latest updates

---

## 🔑 Authentication

All prediction and form endpoints require Clerk JWT authentication.

### Get JWT Token:
1. Sign up/login via Clerk
2. Get JWT from Clerk session
3. Include in Authorization header: `Bearer YOUR_JWT_TOKEN`

### Example with JavaScript:
```javascript
const { getToken } = useAuth();
const token = await getToken();

fetch('http://localhost:3000/api/predictions/my', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── StandingsController.ts
│   │   ├── MatchController.ts
│   │   ├── PredictionsController.ts
│   │   └── ...
│   ├── models/          # Data access layer
│   │   ├── GroupStanding.ts
│   │   ├── Match.ts
│   │   └── ...
│   ├── routes/          # Route definitions
│   │   ├── standings.ts
│   │   ├── matches.ts
│   │   ├── predictions.ts
│   │   └── ...
│   ├── services/        # Business logic
│   ├── middlewares/     # Express middlewares
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Seed data
│   └── migrations/      # Migration history
└── docs/                # Documentation
```

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- 2-space indentation
- Absolute imports preferred

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Database connection error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL in .env
```

### Prisma client not found
```bash
# Regenerate Prisma client
npm run db:generate
```

---

## 📊 Database Schema

### Key Models:
- **Team** - 48 teams (12 groups × 4 teams)
- **Match** - 104 matches (48 group + 56 knockout)
- **GroupStanding** - Current standings for each group
- **ThirdPlaceRanking** - Rankings for 3rd place teams
- **Form** - User prediction forms
- **MatchPick** - Match score predictions
- **AdvancePick** - Team advancement predictions
- **TopScorerPick** - Top scorer predictions

---

## 🎯 Next Steps

1. **Test the APIs** - Use the examples in `docs/API-EXAMPLES.http`
2. **Build the Frontend** - Connect React/Next.js to these endpoints
3. **Implement Scoring** - Add scoring logic for predictions
4. **Add Leaderboards** - Show rankings per league

---

## 📝 License

MIT

---

## 👥 Contributors

- Backend API - Sprint 1 ✅ (27/12/2025)

---

**Happy Coding! ⚽🏆**

