CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE kvs ( key TEXT PRIMARY KEY, value TEXT );
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20241204125818');
