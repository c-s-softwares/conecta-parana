/*
  Warnings:

  - You are about to drop the column `is_internal` on the `ticket_comments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ticket_comments" DROP COLUMN "is_internal";
