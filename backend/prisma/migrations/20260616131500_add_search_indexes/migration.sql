CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX "events_title_description_idx" ON "events" USING GIN ("title" gin_trgm_ops, "description" gin_trgm_ops);
CREATE INDEX "communicates_title_description_idx" ON "communicates" USING GIN ("title" gin_trgm_ops, "description" gin_trgm_ops);
CREATE INDEX "news_title_description_idx" ON "news" USING GIN ("title" gin_trgm_ops, "description" gin_trgm_ops);
CREATE INDEX "locals_name_description_address_idx" ON "locals" USING GIN ("name" gin_trgm_ops, "description" gin_trgm_ops, "address" gin_trgm_ops);
