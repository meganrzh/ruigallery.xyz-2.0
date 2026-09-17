-- Migration 0003: Entries, Threads, Entry-Threads, and Entry-Related-Studies
-- Canonically normalizes Laboratory hierarchy: Collection -> Study -> Entry
-- Threads are modeled as a horizontal cross-cutting system via entry_threads junction table.
-- Related studies are normalized via entry_related_studies junction table.

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  entry_number TEXT NOT NULL,
  study_id TEXT NOT NULL REFERENCES studies(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  rui_revision TEXT NOT NULL DEFAULT 'REV 00',
  summary TEXT,
  location TEXT,
  archival_date TEXT NOT NULL,
  published_date TEXT,
  last_modified_date TEXT,
  blocks TEXT NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'published',
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entry_threads (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, thread_id)
);

CREATE TABLE IF NOT EXISTS entry_related_studies (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  study_id TEXT NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, study_id)
);

CREATE INDEX IF NOT EXISTS idx_threads_slug ON threads(slug);
CREATE INDEX IF NOT EXISTS idx_entries_study_id ON entries(study_id);
CREATE INDEX IF NOT EXISTS idx_entries_slug ON entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_entry_number ON entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_entries_visibility ON entries(visibility);
CREATE INDEX IF NOT EXISTS idx_entry_threads_thread_id ON entry_threads(thread_id);
CREATE INDEX IF NOT EXISTS idx_entry_threads_entry_id ON entry_threads(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_related_studies_study_id ON entry_related_studies(study_id);
CREATE INDEX IF NOT EXISTS idx_entry_related_studies_entry_id ON entry_related_studies(entry_id);
