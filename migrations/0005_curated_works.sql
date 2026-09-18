-- Migration 0005: Curated Works and Relationships
-- D1 as the single persistent source of truth for Curated Works / Long-form Essays
-- Relationships with Studies and Entries normalized via junction tables

CREATE TABLE IF NOT EXISTS curated_works (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  work_type TEXT NOT NULL,
  year TEXT NOT NULL,
  date TEXT NOT NULL,
  featured_on_home INTEGER NOT NULL DEFAULT 0,
  home_layout_weight TEXT NOT NULL DEFAULT 'standard',
  cover_image TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body_blocks TEXT NOT NULL DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'published',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS curated_work_related_studies (
  work_id TEXT NOT NULL REFERENCES curated_works(id) ON DELETE CASCADE,
  study_id TEXT NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (work_id, study_id)
);

CREATE TABLE IF NOT EXISTS curated_work_related_entries (
  work_id TEXT NOT NULL REFERENCES curated_works(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (work_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_curated_works_slug ON curated_works(slug);
CREATE INDEX IF NOT EXISTS idx_curated_works_visibility ON curated_works(visibility);
CREATE INDEX IF NOT EXISTS idx_curated_works_featured ON curated_works(featured_on_home);
CREATE INDEX IF NOT EXISTS idx_curated_works_order ON curated_works(order_index);
CREATE INDEX IF NOT EXISTS idx_curated_work_related_studies_work_id ON curated_work_related_studies(work_id);
CREATE INDEX IF NOT EXISTS idx_curated_work_related_studies_study_id ON curated_work_related_studies(study_id);
CREATE INDEX IF NOT EXISTS idx_curated_work_related_entries_work_id ON curated_work_related_entries(work_id);
CREATE INDEX IF NOT EXISTS idx_curated_work_related_entries_entry_id ON curated_work_related_entries(entry_id);
