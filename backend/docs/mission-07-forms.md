# Mission 07 – User Forms

**Goal:**
Implement endpoints and database logic for creating and managing a user's single, global prediction form.

## Checklist

- [ ] Add `Form` table to the Prisma schema with a unique constraint on `ownerId` to enforce one form per user.
- [ ] Implement `GET /forms/me` to fetch the authenticated user's form.
- [ ] Implement `POST /forms` to create a blank form, returning a 409 Conflict error if one already exists for the user.
- [ ] Add middleware to ensure only the form's owner can access and modify it.

## Acceptance Criteria

- [ ] A user can create exactly one prediction form.
- [ ] A user can retrieve their own form data.
- [ ] Users are prevented from creating more than one form.
- [ ] Users cannot access or modify forms belonging to other users.

**Design doc reference:** Section 3 (Data model), Section 5 (REST API)
