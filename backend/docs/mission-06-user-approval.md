# Mission 06 – User Approval Flow

**Goal:**
Implement the admin approval flow for new users, including e-mail notification and approval endpoint.

## Checklist

- [ ] Add `isApproved`, `requestedAt`, `approvedAt` fields to `users` table
- [ ] Block unapproved users from main app routes (middleware)
- [ ] Implement admin endpoint to list pending users (`GET /admin/users/pending`)
- [ ] Implement admin endpoint to approve user (`POST /admin/users/:id/approve`)
- [ ] Send e-mail to admins on new signup (stub mailer is fine)
- [ ] Send confirmation e-mail to user on approval

## Acceptance Criteria

- Unapproved users are blocked from main app
- Admin can approve users via endpoint
- E-mails are sent (can be logged to console in dev)

**Design doc reference:** Section 5 (API surface), Section 7 (Admin-approval e-mail flow)
