/*
  Warnings:

  - Added the required column `city_id` to the `suggestions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "city_id" TEXT NOT NULL,
ADD COLUMN     "responded_at" TIMESTAMP(3),
ADD COLUMN     "responded_by_id" TEXT,
ADD COLUMN     "response" TEXT;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_responded_by_id_fkey" FOREIGN KEY ("responded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
