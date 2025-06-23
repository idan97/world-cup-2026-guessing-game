/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `colboNumber` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `form_members` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleSub]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `googleSub` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeagueRole" AS ENUM ('ADMIN', 'PLAYER');

-- DropForeignKey
ALTER TABLE "form_members" DROP CONSTRAINT "form_members_formId_fkey";

-- DropForeignKey
ALTER TABLE "form_members" DROP CONSTRAINT "form_members_userId_fkey";

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "approvedAt",
DROP COLUMN "colboNumber",
DROP COLUMN "isApproved",
DROP COLUMN "requestedAt",
DROP COLUMN "role",
ADD COLUMN     "googleSub" TEXT NOT NULL;

-- DropTable
DROP TABLE "form_members";

-- DropEnum
DROP TYPE "FormMemberRole";

-- DropEnum
DROP TYPE "UserRole";

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

-- CreateIndex
CREATE UNIQUE INDEX "leagues_joinCode_key" ON "leagues"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "league_allow_emails_leagueId_email_key" ON "league_allow_emails"("leagueId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "forms_ownerId_key" ON "forms"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSub_key" ON "users"("googleSub");

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
