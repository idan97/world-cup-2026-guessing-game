# Mission 04 – Express App Skeleton

**Goal:**
Set up the Express app skeleton with config, logger, and a health check route. Ensure the server starts and responds to requests.

## Checklist

- [ ] Install Express (`npm i express` and `npm i -D @types/express`)
- [ ] Create `src/index.ts` to bootstrap the app
- [ ] Add pino logger (`npm i pino pino-pretty`)
- [ ] Add a health check route (`GET /healthz`)
- [ ] Add config for port and env
- [ ] Ensure TypeScript compiles and app runs

## Acceptance Criteria

- App starts with `npm run start` or `ts-node src/index.ts`
- `GET /healthz` returns 200 OK
- Logger outputs to console

**Design doc reference:** Section 2 (Tech stack)
