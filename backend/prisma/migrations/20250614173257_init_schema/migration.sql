-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('GROUP', 'R32', 'R16', 'QF', 'SF', 'F');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('W', 'D', 'L');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FormMemberRole" AS ENUM ('OWNER', 'EDITOR');

-- CreateEnum
CREATE TYPE "TeamGroup" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "TeamGroup" NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "colboNumber" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "requestedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_members" (
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FormMemberRole" NOT NULL,

    CONSTRAINT "form_members_pkey" PRIMARY KEY ("formId","userId")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" INTEGER NOT NULL,
    "stage" "Stage" NOT NULL,
    "slot" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "teamAId" TEXT,
    "teamBId" TEXT,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "winnerTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_picks" (
    "formId" TEXT NOT NULL,
    "matchId" INTEGER NOT NULL,
    "predScoreA" INTEGER NOT NULL,
    "predScoreB" INTEGER NOT NULL,
    "predOutcome" "Outcome" NOT NULL,

    CONSTRAINT "match_picks_pkey" PRIMARY KEY ("formId","matchId")
);

-- CreateTable
CREATE TABLE "advance_picks" (
    "formId" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "advance_picks_pkey" PRIMARY KEY ("formId","stage","teamId")
);

-- CreateTable
CREATE TABLE "top_scorer_picks" (
    "formId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,

    CONSTRAINT "top_scorer_picks_pkey" PRIMARY KEY ("formId")
);

-- CreateTable
CREATE TABLE "scoring_runs" (
    "id" SERIAL NOT NULL,
    "formId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delta" INTEGER NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "scoring_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "match_picks_matchId_idx" ON "match_picks"("matchId");

-- CreateIndex
CREATE INDEX "advance_picks_stage_teamId_idx" ON "advance_picks"("stage", "teamId");

-- AddForeignKey
ALTER TABLE "form_members" ADD CONSTRAINT "form_members_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_members" ADD CONSTRAINT "form_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_picks" ADD CONSTRAINT "match_picks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_picks" ADD CONSTRAINT "match_picks_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_picks" ADD CONSTRAINT "advance_picks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_picks" ADD CONSTRAINT "advance_picks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_scorer_picks" ADD CONSTRAINT "top_scorer_picks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_runs" ADD CONSTRAINT "scoring_runs_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
