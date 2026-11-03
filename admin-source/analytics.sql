
CREATE TABLE IF NOT EXISTS daily_visits(day TEXT NOT NULL,visitor TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(day,visitor));
CREATE TABLE IF NOT EXISTS analytics_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT OR IGNORE INTO analytics_meta(key,value) VALUES('started_at',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
