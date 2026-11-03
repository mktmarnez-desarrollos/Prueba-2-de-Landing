CREATE TABLE IF NOT EXISTS landing_journeys (
 id TEXT PRIMARY KEY, visitor TEXT NOT NULL, day TEXT NOT NULL, started TEXT NOT NULL,
 updated TEXT NOT NULL, seq INTEGER NOT NULL, reached TEXT NOT NULL, clicks TEXT NOT NULL,
 last_section TEXT NOT NULL, depth INTEGER NOT NULL, reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS landing_journeys_day ON landing_journeys(day);
CREATE INDEX IF NOT EXISTS landing_journeys_visitor_day ON landing_journeys(visitor,day);
CREATE TABLE IF NOT EXISTS engagement_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT OR IGNORE INTO engagement_meta(key,value) VALUES('started_at',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
