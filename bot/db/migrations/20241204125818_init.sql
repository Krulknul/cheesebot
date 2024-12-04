-- migrate:up
CREATE TABLE kvs ( key TEXT PRIMARY KEY, value TEXT );

-- migrate:down