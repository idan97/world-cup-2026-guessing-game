# Mission 07 – Forms & Membership

**Goal:**
Implement endpoints and DB tables for forms and form membership (owner/editor roles).

## Checklist

- [ ] Add `forms` and `form_members` tables to Prisma schema and migrate
- [ ] Implement `GET /me/forms` (list user forms)
- [ ] Implement `POST /forms` (create new form)
- [ ] Implement membership roles (owner/editor)
- [ ] Add middleware to check form access

## Acceptance Criteria

- Users can create and list forms
- Membership roles are enforced

**Design doc reference:** Section 3 (Data model), Section 5 (API surface)
