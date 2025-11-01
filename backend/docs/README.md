# Backend Documentation

Welcome to the World Cup 2026 Prediction Platform backend documentation.

---

## 📚 Documentation Index

### Essential Reading

1. **[BACKEND_DESIGN.md](./BACKEND_DESIGN.md)** ⭐
   - Complete system design and architecture
   - Data model with all entities and relationships
   - Full REST API specification
   - Scoring system rules and logic
   - Authentication & authorization flows
   - Background jobs & automation
   - Deployment instructions
   - Implementation status tracking

2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** 🚀
   - Common commands and scripts
   - API endpoint patterns
   - Database query examples
   - Middleware usage guide
   - Error handling patterns
   - Testing with cURL/Postman
   - Useful code snippets

### Historical Documents

The `archive/` folder contains the original mission-based documents that have been consolidated into the main design document:

- `mission-08-picks.md` - Picks endpoints implementation
- `mission-09-scoring-engine.md` - Scoring logic and audit trail
- `mission-10-leaderboard.md` - Leaderboard endpoints and caching
- `mission-11-simulation.md` - What-if simulation feature
- `mission-12-admin.md` - Admin endpoints
- `mission-13-background-jobs.md` - Background job specifications
- `mission-14-deployment.md` - Deployment setup

These are kept for historical reference but should not be used for current development.

---

## 🎯 Quick Start

### New to the Project?

1. Read the [Overview & Goals](./BACKEND_DESIGN.md#1-overview--goals) section
2. Review the [Data Model](./BACKEND_DESIGN.md#4-data-model) to understand the database structure
3. Check the [REST API](./BACKEND_DESIGN.md#6-rest-api) section for available endpoints
4. Use the [Quick Reference](./QUICK_REFERENCE.md) for daily development tasks

### Setting Up Development Environment

See the [Quick Reference - Getting Started](./QUICK_REFERENCE.md#getting-started) section.

### Working on a Feature

1. Check [Implementation Status](./BACKEND_DESIGN.md#10-implementation-status) to see what's done
2. Review the relevant API endpoints in the design doc
3. Follow the [API Patterns](./QUICK_REFERENCE.md#api-patterns) guide
4. Use the [Development Workflow](./BACKEND_DESIGN.md#11-development-workflow) for commits

---

## 📖 Documentation Structure

```
docs/
├── README.md                 # This file - documentation index
├── BACKEND_DESIGN.md         # ⭐ Main design document
├── QUICK_REFERENCE.md        # 🚀 Developer quick reference
├── backend-design.md         # Redirect to main design doc
└── archive/                  # Historical mission documents
    ├── mission-08-picks.md
    ├── mission-09-scoring-engine.md
    ├── mission-10-leaderboard.md
    ├── mission-11-simulation.md
    ├── mission-12-admin.md
    ├── mission-13-background-jobs.md
    └── mission-14-deployment.md
```

---

## 🔍 Finding Information

### By Topic

| Topic | Document | Section |
|-------|----------|---------|
| **Database Schema** | BACKEND_DESIGN.md | [Data Model](./BACKEND_DESIGN.md#4-data-model) |
| **API Endpoints** | BACKEND_DESIGN.md | [REST API](./BACKEND_DESIGN.md#6-rest-api) |
| **Scoring Rules** | BACKEND_DESIGN.md | [Scoring System](./BACKEND_DESIGN.md#5-scoring-system) |
| **Authentication** | BACKEND_DESIGN.md | [Auth & Authorization](./BACKEND_DESIGN.md#7-authentication--authorization) |
| **Background Jobs** | BACKEND_DESIGN.md | [Jobs & Automation](./BACKEND_DESIGN.md#8-background-jobs--automation) |
| **Deployment** | BACKEND_DESIGN.md | [Deployment](./BACKEND_DESIGN.md#9-deployment) |
| **Common Commands** | QUICK_REFERENCE.md | [Common Commands](./QUICK_REFERENCE.md#common-commands) |
| **Code Patterns** | QUICK_REFERENCE.md | [API Patterns](./QUICK_REFERENCE.md#api-patterns) |
| **Database Queries** | QUICK_REFERENCE.md | [Database Queries](./QUICK_REFERENCE.md#database-queries) |
| **Testing** | QUICK_REFERENCE.md | [Testing Endpoints](./QUICK_REFERENCE.md#testing-endpoints) |

### By Task

| Task | Where to Look |
|------|---------------|
| "How do I create a new endpoint?" | [QUICK_REFERENCE.md - API Patterns](./QUICK_REFERENCE.md#api-patterns) |
| "What's the database schema?" | [BACKEND_DESIGN.md - Data Model](./BACKEND_DESIGN.md#4-data-model) |
| "How does scoring work?" | [BACKEND_DESIGN.md - Scoring System](./BACKEND_DESIGN.md#5-scoring-system) |
| "How do I test an endpoint?" | [QUICK_REFERENCE.md - Testing](./QUICK_REFERENCE.md#testing-endpoints) |
| "What's the deployment process?" | [BACKEND_DESIGN.md - Deployment](./BACKEND_DESIGN.md#9-deployment) |
| "How do I add middleware?" | [QUICK_REFERENCE.md - Middleware Usage](./QUICK_REFERENCE.md#middleware-usage) |
| "What's implemented so far?" | [BACKEND_DESIGN.md - Implementation Status](./BACKEND_DESIGN.md#10-implementation-status) |

---

## 🏗️ Current Implementation Status

### ✅ Completed
- Database schema and migrations
- Authentication with Clerk
- User management
- League system (create, join, manage)
- League messages
- Forms and predictions (match picks, advance picks, top scorer)
- Admin endpoints (match management)

### 🚧 In Progress
- Scoring engine
- Leaderboards

### 📋 Planned
- What-if simulation
- Background jobs
- Production deployment

See the full [Implementation Status](./BACKEND_DESIGN.md#10-implementation-status) for details.

---

## 🤝 Contributing

### Code Style

- Follow TypeScript strict mode
- Use ESLint and Prettier
- Follow the commit convention: `feat(scope) | description`

### Before Committing

```bash
npm run lint      # Check for linting errors
npm run format    # Format code
npm run build     # Ensure TypeScript compiles
```

### Commit Convention

```
feat(leagues)  | join-code flow
feat(scoring)  | match processing
fix(api)       | handle null scores
docs(design)   | update scoring rules
```

See [Development Workflow](./BACKEND_DESIGN.md#11-development-workflow) for more details.

---

## 📞 Support

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL is running (`npm run docker:up`)
2. **Prisma client errors**: Run `npm run db:generate`
3. **Migration errors**: Check migration files in `prisma/migrations/`
4. **Auth errors**: Verify Clerk environment variables

### Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Express Documentation**: https://expressjs.com
- **Clerk Documentation**: https://clerk.com/docs
- **TypeScript Documentation**: https://www.typescriptlang.org/docs

---

## 📝 Updating Documentation

When making significant changes:

1. Update the relevant section in `BACKEND_DESIGN.md`
2. Add any new patterns to `QUICK_REFERENCE.md`
3. Update the [Implementation Status](./BACKEND_DESIGN.md#10-implementation-status)
4. Update the version number and last updated date

---

**Last Updated:** November 1, 2025  
**Documentation Version:** 2.0

