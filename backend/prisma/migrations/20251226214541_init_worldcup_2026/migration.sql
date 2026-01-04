-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('GROUP', 'R32', 'R16', 'QF', 'SF', 'F');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('W', 'D', 'L');

-- CreateEnum
CREATE TYPE "LeagueRole" AS ENUM ('ADMIN', 'PLAYER');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "fifaCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHebrew" TEXT,
    "groupLetter" TEXT,
    "groupPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_standings" (
    "id" TEXT NOT NULL,
    "groupLetter" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "teamId" TEXT,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDiff" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "third_place_rankings" (
    "id" TEXT NOT NULL,
    "groupLetter" TEXT NOT NULL,
    "teamId" TEXT,
    "rank" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "goalDiff" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "third_place_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "stage" "Stage" NOT NULL,
    "team1Code" TEXT NOT NULL,
    "team2Code" TEXT NOT NULL,
    "team1Name" TEXT,
    "team2Name" TEXT,
    "team1Id" TEXT,
    "team2Id" TEXT,
    "team1Score" INTEGER,
    "team2Score" INTEGER,
    "winnerId" TEXT,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "playedAt" TIMESTAMP(3),
    "venue" TEXT,
    "venueCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "joinCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_members" (
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "LeagueRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_members_pkey" PRIMARY KEY ("leagueId","userId")
);

-- CreateTable
CREATE TABLE "league_allow_emails" (
    "id" SERIAL NOT NULL,
    "leagueId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "LeagueRole" NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_allow_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_messages" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_picks" (
    "formId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "teams_fifaCode_key" ON "teams"("fifaCode");

-- CreateIndex
CREATE INDEX "teams_fifaCode_idx" ON "teams"("fifaCode");

-- CreateIndex
CREATE INDEX "teams_groupLetter_idx" ON "teams"("groupLetter");

-- CreateIndex
CREATE INDEX "group_standings_groupLetter_idx" ON "group_standings"("groupLetter");

-- CreateIndex
CREATE INDEX "group_standings_points_goalDiff_goalsFor_idx" ON "group_standings"("points", "goalDiff", "goalsFor");

-- CreateIndex
CREATE UNIQUE INDEX "group_standings_groupLetter_position_key" ON "group_standings"("groupLetter", "position");

-- CreateIndex
CREATE UNIQUE INDEX "third_place_rankings_groupLetter_key" ON "third_place_rankings"("groupLetter");

-- CreateIndex
CREATE INDEX "third_place_rankings_rank_idx" ON "third_place_rankings"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "matches_matchNumber_key" ON "matches"("matchNumber");

-- CreateIndex
CREATE INDEX "matches_matchNumber_idx" ON "matches"("matchNumber");

-- CreateIndex
CREATE INDEX "matches_stage_idx" ON "matches"("stage");

-- CreateIndex
CREATE INDEX "matches_isFinished_idx" ON "matches"("isFinished");

-- CreateIndex
CREATE INDEX "matches_scheduledAt_idx" ON "matches"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_joinCode_key" ON "leagues"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "league_allow_emails_leagueId_email_key" ON "league_allow_emails"("leagueId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "forms_ownerId_key" ON "forms"("ownerId");

-- CreateIndex
CREATE INDEX "match_picks_matchId_idx" ON "match_picks"("matchId");

-- CreateIndex
CREATE INDEX "advance_picks_stage_teamId_idx" ON "advance_picks"("stage", "teamId");

-- AddForeignKey
ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "third_place_rankings" ADD CONSTRAINT "third_place_rankings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_allow_emails" ADD CONSTRAINT "league_allow_emails_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_messages" ADD CONSTRAINT "league_messages_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_messages" ADD CONSTRAINT "league_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
