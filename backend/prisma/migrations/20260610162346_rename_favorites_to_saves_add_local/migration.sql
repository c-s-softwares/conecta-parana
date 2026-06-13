ALTER TABLE "favorites" DROP CONSTRAINT "favorites_communicate_id_fkey";
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_event_id_fkey";
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_news_id_fkey";
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_id_fkey";

DROP TABLE "favorites";

CREATE TABLE "saves" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "communicate_id" TEXT,
    "news_id" TEXT,
    "local_id" TEXT,

    CONSTRAINT "saves_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saves" ADD CONSTRAINT "saves_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saves" ADD CONSTRAINT "saves_communicate_id_fkey" FOREIGN KEY ("communicate_id") REFERENCES "communicates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saves" ADD CONSTRAINT "saves_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saves" ADD CONSTRAINT "saves_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
