/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "communicates" ADD COLUMN     "priority" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "priority" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- RenameIndex
ALTER INDEX "uniq_like_user_communicate" RENAME TO "likes_user_id_communicate_id_key";

-- RenameIndex
ALTER INDEX "uniq_like_user_event" RENAME TO "likes_user_id_event_id_key";

-- RenameIndex
ALTER INDEX "uniq_like_user_news" RENAME TO "likes_user_id_news_id_key";

-- RenameIndex
ALTER INDEX "uniq_save_user_communicate" RENAME TO "saves_user_id_communicate_id_key";

-- RenameIndex
ALTER INDEX "uniq_save_user_event" RENAME TO "saves_user_id_event_id_key";

-- RenameIndex
ALTER INDEX "uniq_save_user_local" RENAME TO "saves_user_id_local_id_key";

-- RenameIndex
ALTER INDEX "uniq_save_user_news" RENAME TO "saves_user_id_news_id_key";
