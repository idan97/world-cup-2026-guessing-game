# Mission 05 – Auth Flow (Magic Link)

**Goal:**
Implement the authentication flow: magic link login, JWT issuance, and smart user registration handling.

## Checklist

- [x] Add `users` table to Prisma schema and migrate
- [x] Implement `POST /auth/login` (smart login: email only for returning users, full registration for new users)
- [x] Implement `GET /auth/callback` (verify link, issue JWT)
- [x] Implement `GET /me` (authenticated user profile)
- [x] Use JWT for session management with proper middleware
- [x] Handle new user registration with admin approval notifications

## Login Flow Implementation

### Returning Users (Existing Email)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:** `204 No Content` → Magic link sent

### New Users (First Time)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

**Response:** `400 Bad Request`

```json
{
  "error": "Bad Request",
  "message": "displayName and colboNumber are required for new users",
  "code": "NEW_USER_REGISTRATION_REQUIRED"
}
```

### New User Registration

```http
POST /auth/login
Content-Type: application/json

{
  "email": "newuser@example.com",
  "displayName": "John Doe",
  "colboNumber": "EMP001"
}
```

**Response:** `204 No Content` → Account created, approval notifications sent, magic link sent

## Acceptance Criteria

- [x] Returning users can login with email only
- [x] New users get clear error message with code for missing registration info
- [x] New users can complete registration with all required fields
- [x] JWT is issued with proper user data and approval status
- [x] Admin approval notifications are sent for new signups
- [x] Authentication middleware protects routes correctly

**Design doc reference:** Section 5 (API surface), Section 2 (Tech stack), Section 7 (Admin-approval flow)
