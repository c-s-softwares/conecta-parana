-- Criar indices unicos para Likes
CREATE UNIQUE INDEX "uniq_like_user_event" ON "likes"("user_id", "event_id");
CREATE UNIQUE INDEX "uniq_like_user_communicate" ON "likes"("user_id", "communicate_id");
CREATE UNIQUE INDEX "uniq_like_user_news" ON "likes"("user_id", "news_id");

-- Criar indices unicos para Saves
CREATE UNIQUE INDEX "uniq_save_user_event" ON "saves"("user_id", "event_id");
CREATE UNIQUE INDEX "uniq_save_user_communicate" ON "saves"("user_id", "communicate_id");
CREATE UNIQUE INDEX "uniq_save_user_news" ON "saves"("user_id", "news_id");
CREATE UNIQUE INDEX "uniq_save_user_local" ON "saves"("user_id", "local_id");
