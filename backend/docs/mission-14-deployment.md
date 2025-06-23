# Mission 14 – Deployment & Environment

**Goal:**
Prepare the app for deployment with Docker, environment variables, and deployment scripts.

## Checklist

- [ ] Create `Dockerfile` for the backend server.
- [ ] Create `docker-compose.yml` for local development (Postgres, Redis).
- [ ] Create `.env.example` and document all required environment variables.
- [ ] Add scripts to `package.json` for running migrations and starting the server in a production environment.
- [ ] Add deployment instructions for a target platform (e.g., Render, Railway, Fly.io).
- [ ] Add a GitHub Actions workflow for continuous integration (linting, building).

## Environment Variables / Secrets

| Name                   | Purpose                                   |
| :--------------------- | :---------------------------------------- |
| `DATABASE_URL`         | Postgres connection string                |
| `JWT_SECRET`           | Secret key for signing and verifying JWTs |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                    |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                |

## Acceptance Criteria

- [ ] The application can be built and run as a Docker container.
- [ ] All required environment variables are documented.
- [ ] The CI pipeline passes on every push to the main branch.

**Design doc reference:** Section 7 (Deployment)
