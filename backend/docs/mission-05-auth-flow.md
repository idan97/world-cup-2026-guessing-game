# Mission 05 – Auth Flow (Clerk)

**Goal:**
Implement Clerk authentication with automatic user provisioning and league membership sync on every request.

## Checklist

- [ ] Add `@clerk/clerk-sdk-node` to dependencies.
- [ ] Configure Clerk middleware with `CLERK_SECRET_KEY`.
- [ ] Create DB sync middleware that runs after Clerk auth:
  - Upsert user record using Clerk's `userId` and session claims.
  - Ensure user is added to "General" league as `PLAYER`.
  - Process `LeagueAllowEmail` entries for user's email.
- [ ] Remove custom Google OAuth endpoints and JWT logic.
- [ ] Update authentication middleware to use Clerk's session data.

## Clerk Auth Flow

Clerk handles authentication via its built-in components and middleware. No custom endpoints needed.

**Backend Integration:**

```typescript
// app.ts
import { clerkMiddleware, requireAuth } from '@clerk/clerk-sdk-node';
import { syncUser } from './middlewares/clerk';

app.use(clerkMiddleware({ secretKey: config.clerkSecretKey }));
app.use(requireAuth()); // Verifies __session on every request
app.use(syncUser); // Syncs user data with database
```

**User Session Data:**

```typescript
// Available in req.auth after Clerk middleware
{
  userId: string;
  sessionClaims: {
    email_address: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  };
}
```

## Acceptance Criteria

- [ ] Users can authenticate using Clerk (supports multiple providers: Google, GitHub, email/password).
- [ ] User records are automatically synced in the database on every authenticated request.
- [ ] All authenticated users are automatically added to the "General" league as a `PLAYER`.
- [ ] Pre-approved league memberships (via `LeagueAllowEmail`) are processed automatically.
- [ ] No custom JWT handling required - Clerk manages sessions via secure HTTP-only cookies.

**Design doc reference:** Section 5 (REST API), Section 1 (High-Level Goals)
