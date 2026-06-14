/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `news` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "news" DROP COLUMN "deleted_at",
ALTER COLUMN "is_active" SET DEFAULT true;
