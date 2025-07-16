# Mission 08 – Picks Endpoints

**Goal:**
Implement endpoints and DB tables for match picks, advance picks, and top scorer picks.

## Checklist

- [x] Add `match_picks`, `advance_picks`, `top_scorer_picks` tables to Prisma schema and migrate
- [x] Implement `PUT /forms/:id/picks` (save picks) - Route exists with validation
- [x] Implement `POST /forms/:id/submit` (mark form as ready)
- [x] Add validation for picks (by stage, slot, etc.)
- [x] **Complete the picks saving logic in FormModel** - ✅ IMPLEMENTED

## Implementation Completed

✅ **Picks Database Persistence** - Successfully implemented in `FormModel`:

- `saveMatchPicks()` - Handles match prediction saves with upsert logic
- `saveAdvancePicks()` - Handles advancement picks by stage
- `saveTopScorerPick()` - Handles top scorer predictions
- `savePicks()` - Atomic transaction to save all pick types safely

✅ **Controller Integration** - Updated `FormController.updatePicks()`:

- Properly maps form data to database schema
- Adds `formId` to all pick records
- Calls `FormModel.savePicks()` for atomic database persistence

✅ **Data Validation** - Enhanced form creation/updates:

- Made `nickname` required for both create and update operations
- Fixed TypeScript type compatibility issues
- Ensured proper error handling throughout

## Technical Implementation Details

**Database Operations:**

- Uses Prisma transactions for atomic saves across all pick tables
- Delete + Create pattern for match/advance picks (simpler than complex upserts)
- Upsert pattern for top scorer picks (single record per form)
- Proper foreign key relationships and cascade deletes

**API Flow:**

1. `PUT /forms/:id/picks` receives validated pick data
2. Middleware ensures form ownership and prevents final form modifications
3. Controller maps request data to database schema with `formId`
4. `FormModel.savePicks()` atomically persists all picks
5. Success response returned to client

## Acceptance Criteria

- [x] Users can save and submit picks via API
- [x] **Picks are validated and stored in DB** ✅ COMPLETED
- [x] Picks validation includes stage/slot constraints
- [x] Form submission flow works correctly
- [x] Database transactions ensure data consistency
- [x] Form creation requires meaningful nicknames

## Summary

**Status: ✅ COMPLETED** - All functionality implemented and working

Mission 8 is now complete with full picks functionality:

- Complete CRUD operations for all pick types
- Atomic database transactions for data integrity
- Comprehensive validation and error handling
- Ready to support scoring engine and leaderboard features

**Ready for:** Mission 09 (Scoring Engine) - All picks are now properly stored in the database

**Design doc reference:** Section 3 (Data model), Section 5 (API surface)
