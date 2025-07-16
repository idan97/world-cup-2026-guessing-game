# World Cup 2026 Backend

Backend server for the World Cup 2026 Guessing Game built with Node.js, TypeScript, Express, and Prisma.

## Setup

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL
```

3. Start the database:

```bash
npm run docker:up
```

4. Run database migrations:

```bash
npm run db:migrate
```

5. Generate Prisma client:

```bash
npm run db:generate
```

## Development

### Available Scripts

- `npm run build` - Compile TypeScript
- `npm run start` - Start the development server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

### Database

The application uses PostgreSQL with Prisma ORM. The database schema is defined in `prisma/schema.prisma`.

To set up the database:

1. Make sure Docker is running
2. Start PostgreSQL: `npm run docker:up`
3. Run migrations: `npm run db:migrate`

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk backend authentication key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk frontend publishable key (for frontend reference)

## Architecture

- **Runtime**: Node.js 20 + Express 5
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (supports Google, GitHub, email/password, etc.)
- **Cache**: Redis (optional)
- **Tests**: Vitest + Supertest (planned)
