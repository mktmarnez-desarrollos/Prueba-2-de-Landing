CREATE TABLE IF NOT EXISTS images(name TEXT PRIMARY KEY,mime TEXT NOT NULL,body BLOB NOT NULL,updated TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE INDEX IF NOT EXISTS attempts_expiry ON attempts(expires);

CREATE TABLE IF NOT EXISTS daily_visits(day TEXT NOT NULL,visitor TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(day,visitor));
CREATE TABLE IF NOT EXISTS analytics_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT OR IGNORE INTO analytics_meta(key,value) VALUES('started_at',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
