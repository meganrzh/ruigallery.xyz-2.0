-- ==============================================================================
-- Migration: 0010_unify_curated_works_into_entries.sql
-- Goal: Safely rebuild entries table with optional study_id and editorial columns,
--       preserve 100% of existing entries and junction relationships,
--       preserve staging backup tables (_bak_*),
--       introduce entry_related_entries, and migrate the 4 curated works.
-- ==============================================================================

-- STEP 1: Backup all active entries and junction data into temporary staging tables
CREATE TABLE IF NOT EXISTS _bak_entries AS SELECT * FROM entries;
CREATE TABLE IF NOT EXISTS _bak_entry_threads AS SELECT * FROM entry_threads;
CREATE TABLE IF NOT EXISTS _bak_entry_related_studies AS SELECT * FROM entry_related_studies;

-- STEP 2: Drop junction tables referencing entries to prevent FK cascade or locking
DROP TABLE IF EXISTS entry_threads;
DROP TABLE IF EXISTS entry_related_studies;
DROP TABLE IF EXISTS entries;

-- STEP 3: Recreate entries table with nullable study_id and editorial columns
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  entry_number TEXT NOT NULL,
  study_id TEXT REFERENCES studies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  rui_revision TEXT,
  medium TEXT,
  summary TEXT,
  excerpt TEXT,
  location TEXT,
  archival_date TEXT NOT NULL,
  display_date TEXT,
  published_date TEXT,
  last_modified_date TEXT,
  featured_on_home INTEGER NOT NULL DEFAULT 0,
  home_layout_weight TEXT DEFAULT 'standard',
  cover_image TEXT,
  cover_image_caption TEXT,
  cover_image_alt TEXT,
  blocks TEXT NOT NULL DEFAULT '[]',
  metadata TEXT NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'published',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- STEP 4: Recreate junction tables with foreign keys to new entries table
CREATE TABLE entry_threads (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, thread_id)
);

CREATE TABLE entry_related_studies (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  study_id TEXT NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, study_id)
);

CREATE TABLE IF NOT EXISTS entry_related_entries (
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  related_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, related_entry_id)
);

-- STEP 5: Restore all 14 original entries from backup
INSERT INTO entries (
  id, slug, entry_number, study_id, title, rui_revision, medium, summary,
  location, archival_date, published_date, last_modified_date, blocks,
  visibility, order_index, created_at, updated_at
)
SELECT 
  id, slug, entry_number, study_id, title, rui_revision, medium, summary,
  location, archival_date, published_date, last_modified_date, blocks,
  visibility, order_index, created_at, updated_at
FROM _bak_entries;

-- STEP 6: Restore all junction records for original entries
INSERT INTO entry_threads (entry_id, thread_id, created_at)
SELECT entry_id, thread_id, created_at FROM _bak_entry_threads;

INSERT INTO entry_related_studies (entry_id, study_id, created_at)
SELECT entry_id, study_id, created_at FROM _bak_entry_related_studies;

-- STEP 7: Migrate the 4 Curated Works into entries directly from source columns
-- Note: rui_revision is explicitly set to NULL (they never had an RUI revision)
INSERT INTO entries (
  id,
  slug,
  entry_number,
  study_id,
  title,
  subtitle,
  rui_revision,
  medium,
  summary,
  excerpt,
  location,
  archival_date,
  display_date,
  published_date,
  last_modified_date,
  featured_on_home,
  home_layout_weight,
  cover_image,
  cover_image_caption,
  cover_image_alt,
  blocks,
  metadata,
  visibility,
  order_index,
  created_at,
  updated_at
)
VALUES
  -- 1. The Architecture of Forgetting
  (
    'work-arch-forgetting',
    'the-architecture-of-forgetting',
    '015',
    NULL,
    (SELECT title FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT subtitle FROM curated_works WHERE id = 'work-arch-forgetting'),
    NULL,
    'Creative Writing',
    (SELECT excerpt FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT excerpt FROM curated_works WHERE id = 'work-arch-forgetting'),
    json_extract((SELECT metadata FROM curated_works WHERE id = 'work-arch-forgetting'), '$.location'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT date FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT featured_on_home FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT home_layout_weight FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT cover_image FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT cover_image_caption FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT cover_image_alt FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT body_blocks FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT metadata FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT visibility FROM curated_works WHERE id = 'work-arch-forgetting'),
    15,
    (SELECT created_at FROM curated_works WHERE id = 'work-arch-forgetting'),
    (SELECT updated_at FROM curated_works WHERE id = 'work-arch-forgetting')
  ),

  -- 2. Stone, Salt, and Stone
  (
    'work-stone-salt',
    'stone-salt-and-stone-venetian-thresholds',
    '016',
    NULL,
    (SELECT title FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT subtitle FROM curated_works WHERE id = 'work-stone-salt'),
    NULL,
    'Visual Work',
    (SELECT excerpt FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT excerpt FROM curated_works WHERE id = 'work-stone-salt'),
    json_extract((SELECT metadata FROM curated_works WHERE id = 'work-stone-salt'), '$.location'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT date FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT featured_on_home FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT home_layout_weight FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT cover_image FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT cover_image_caption FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT cover_image_alt FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT body_blocks FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT metadata FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT visibility FROM curated_works WHERE id = 'work-stone-salt'),
    16,
    (SELECT created_at FROM curated_works WHERE id = 'work-stone-salt'),
    (SELECT updated_at FROM curated_works WHERE id = 'work-stone-salt')
  ),

  -- 3. Cartographic Palimpsest No. 4
  (
    'work-cartographic-palimpsest',
    'cartographic-palimpsest-chinatown-typographies',
    '017',
    NULL,
    (SELECT title FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT subtitle FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    NULL,
    'Visual Work',
    (SELECT excerpt FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT excerpt FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    json_extract((SELECT metadata FROM curated_works WHERE id = 'work-cartographic-palimpsest'), '$.location'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT date FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT featured_on_home FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT home_layout_weight FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT cover_image FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT cover_image_caption FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT cover_image_alt FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT body_blocks FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT metadata FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT visibility FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    17,
    (SELECT created_at FROM curated_works WHERE id = 'work-cartographic-palimpsest'),
    (SELECT updated_at FROM curated_works WHERE id = 'work-cartographic-palimpsest')
  ),

  -- 4. Instruments of Observation
  (
    'work-optical-scans',
    'instruments-of-observation-optical-scans',
    '018',
    NULL,
    (SELECT title FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT subtitle FROM curated_works WHERE id = 'work-optical-scans'),
    NULL,
    'Visual Work',
    (SELECT excerpt FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT excerpt FROM curated_works WHERE id = 'work-optical-scans'),
    json_extract((SELECT metadata FROM curated_works WHERE id = 'work-optical-scans'), '$.location'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT date FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT archival_date FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT featured_on_home FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT home_layout_weight FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT cover_image FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT cover_image_caption FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT cover_image_alt FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT body_blocks FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT metadata FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT visibility FROM curated_works WHERE id = 'work-optical-scans'),
    18,
    (SELECT created_at FROM curated_works WHERE id = 'work-optical-scans'),
    (SELECT updated_at FROM curated_works WHERE id = 'work-optical-scans')
  );

-- STEP 8: Migrate relationships from curated work junction tables
-- Related studies
INSERT OR IGNORE INTO entry_related_studies (entry_id, study_id, created_at)
SELECT work_id, study_id, created_at FROM curated_work_related_studies;

-- Ensure curated_work_related_entries has source relationships if not already present
INSERT OR IGNORE INTO curated_work_related_entries (work_id, entry_id, created_at)
VALUES
  ('work-arch-forgetting', 'entry-014', datetime('now')),
  ('work-arch-forgetting', 'entry-007', datetime('now')),
  ('work-stone-salt', 'entry-013', datetime('now')),
  ('work-stone-salt', 'entry-008', datetime('now')),
  ('work-cartographic-palimpsest', 'entry-012', datetime('now')),
  ('work-cartographic-palimpsest', 'entry-005', datetime('now')),
  ('work-optical-scans', 'entry-010', datetime('now')),
  ('work-optical-scans', 'entry-006', datetime('now'));

-- Related entries
INSERT OR IGNORE INTO entry_related_entries (entry_id, related_entry_id, created_at)
SELECT work_id, entry_id, created_at FROM curated_work_related_entries;

-- STEP 9: Recreate all indexes on entries and junction tables
CREATE INDEX IF NOT EXISTS idx_entries_study_id ON entries(study_id);
CREATE INDEX IF NOT EXISTS idx_entries_slug ON entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_entry_number ON entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_entries_archival_date ON entries(archival_date);
CREATE INDEX IF NOT EXISTS idx_entries_visibility ON entries(visibility);
CREATE INDEX IF NOT EXISTS idx_entries_medium ON entries(medium);
CREATE INDEX IF NOT EXISTS idx_entries_featured ON entries(featured_on_home);
CREATE INDEX IF NOT EXISTS idx_entry_threads_thread_id ON entry_threads(thread_id);
CREATE INDEX IF NOT EXISTS idx_entry_threads_entry_id ON entry_threads(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_related_studies_study_id ON entry_related_studies(study_id);
CREATE INDEX IF NOT EXISTS idx_entry_related_studies_entry_id ON entry_related_studies(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_related_entries_entry_id ON entry_related_entries(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_related_entries_related ON entry_related_entries(related_entry_id);

-- NOTE: STEP 10 (Dropping staging backup tables) is intentionally omitted per instructions.
-- _bak_entries, _bak_entry_threads, and _bak_entry_related_studies are preserved for rollback safety.
