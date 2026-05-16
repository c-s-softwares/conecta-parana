/*
  Warnings:

  - You are about to drop the column `post_id` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `post_id` on the `likes` table. All the data in the column will be lost.
  - You are about to drop the column `post_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_post_id_fkey";

-- DropForeignKey
ALTER TABLE "likes" DROP CONSTRAINT "likes_post_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_post_id_fkey";

-- AlterTable
ALTER TABLE "favorites" DROP COLUMN "post_id",
ADD COLUMN     "communicate_id" TEXT;

-- AlterTable
ALTER TABLE "likes" DROP COLUMN "post_id",
ADD COLUMN     "communicate_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "post_id",
ADD COLUMN     "communicate_id" TEXT;

-- DropTable
DROP TABLE "posts";

-- CreateTable
CREATE TABLE "communicates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "city_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "communicates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_communicate_id_fkey" FOREIGN KEY ("communicate_id") REFERENCES "communicates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_communicate_id_fkey" FOREIGN KEY ("communicate_id") REFERENCES "communicates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_communicate_id_fkey" FOREIGN KEY ("communicate_id") REFERENCES "communicates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communicates" ADD CONSTRAINT "communicates_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communicates" ADD CONSTRAINT "communicates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
