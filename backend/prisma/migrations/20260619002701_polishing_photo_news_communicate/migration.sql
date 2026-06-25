-- AlterTable
ALTER TABLE "news" ADD COLUMN     "link_url" TEXT;

-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "communicate_id" TEXT,
ADD COLUMN     "news_id" TEXT;

-- CreateIndex
CREATE INDEX "photos_news_id_idx" ON "photos"("news_id");

-- CreateIndex
CREATE INDEX "photos_communicate_id_idx" ON "photos"("communicate_id");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_communicate_id_fkey" FOREIGN KEY ("communicate_id") REFERENCES "communicates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint: exclusividade da FK em photos (no máximo um alvo entre event/local/ticket/news/communicate).
-- <= 1 (não = 1) porque user_avatar nao preenche nenhuma FK.
ALTER TABLE "photos" ADD CONSTRAINT "photo_exactly_one_owner" CHECK (
  (CASE WHEN "event_id" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "local_id" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "ticket_id" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "news_id" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "communicate_id" IS NOT NULL THEN 1 ELSE 0 END) <= 1
);
