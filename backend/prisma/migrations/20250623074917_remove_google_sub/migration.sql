/*
  Warnings:

  - You are about to drop the column `googleSub` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_googleSub_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googleSub";
