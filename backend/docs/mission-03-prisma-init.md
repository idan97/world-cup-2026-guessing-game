# Mission 03 – Prisma Init & DB Schema

**Goal:**
Set up Prisma ORM, create your initial schema based on the types, and run the first migration to a local Postgres DB.

## Checklist

- [ ] Install Prisma CLI and client (`npm i -D prisma @prisma/client`)
- [ ] Create `prisma/schema.prisma` based on your types
- [ ] Set up a local Postgres database (can use Docker)
- [ ] Run `npx prisma migrate dev` to create the DB
- [ ] Generate Prisma client
- [ ] Add a script to reset the DB

## Acceptance Criteria

- `prisma/schema.prisma` matches your types
- Migration runs and creates tables
- Prisma client connects to the DB

**Design doc reference:** Section 3 (Data model), Section 2 (Tech stack)
