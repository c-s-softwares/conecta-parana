/*
  Warnings:

  - You are about to drop the column `latitude` on the `locals` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `locals` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `locals` table. All the data in the column will be lost.
  - Added the required column `coordinates` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_user_id` to the `locals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "locals" DROP CONSTRAINT "locals_user_id_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "coordinates" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "locals" DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "user_id",
ADD COLUMN     "coordinates" geometry(Point, 4326),
ADD COLUMN     "created_by_user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "locals" ADD CONSTRAINT "locals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
