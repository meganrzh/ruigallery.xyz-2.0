-- Phase 2 Initial Schema: Collections & Studies
-- Normalized relational schema strictly matching Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  period TEXT,
  location_context TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS studies (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  archival_date TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_studies_collection_id ON studies(collection_id);
CREATE INDEX IF NOT EXISTS idx_studies_slug ON studies(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
