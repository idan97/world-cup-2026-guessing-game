-- DropForeignKey
ALTER TABLE "advance_picks" DROP CONSTRAINT IF EXISTS "advance_picks_formId_fkey";
ALTER TABLE "advance_picks" DROP CONSTRAINT IF EXISTS "advance_picks_teamId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "advance_picks_stage_teamId_idx";

-- DropTable
DROP TABLE IF EXISTS "advance_picks";
