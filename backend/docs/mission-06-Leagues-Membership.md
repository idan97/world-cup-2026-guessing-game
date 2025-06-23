# Mission 06 – Leagues & Membership

**Goal:**
Implement the core functionality for leagues, including creation, joining via a code, and managing members and messages.

## Checklist

- [ ] Add `League`, `LeagueMember`, `LeagueAllowEmail`, and `LeagueMessage` tables to the Prisma schema and migrate the database.
- [ ] Implement `GET /leagues` to list the leagues a user belongs to.
- [ ] Implement `POST /leagues` for a user to create a new private league, making them the first `ADMIN`.
- [ ] Implement `POST /leagues/:code/join` for a user to join a league using its 8-character `joinCode`.
- [ ] Implement `GET /leagues/:id/messages` for league members to view announcements.

### Admin-Specific Functionality

- [ ] Add middleware to protect league administration routes, checking for the `ADMIN` role in the `LeagueMember` table.
- [ ] Implement `POST /leagues/:id/messages` for league admins to post new announcements.
- [ ] Implement `GET /leagues/:id/members` for league admins to see a list of current members.
- [ ] Implement `DELETE /leagues/:id/members/:uid` for league admins to remove a member.
- [ ] Implement `POST /leagues/:id/join-code/rotate` for league admins to generate a new, unique `joinCode`.

## Acceptance Criteria

- [ ] Users can create and join leagues.
- [ ] A unique, 8-character join code is generated for every new league.
- [ ] Only league admins can manage members and post messages.
- [ ] All database relationships and constraints are correctly enforced.

**Design doc reference:** Section 3 (Data Model), Section 5 (REST API)
