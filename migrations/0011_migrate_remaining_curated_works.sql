-- ==============================================================================
-- Migration: 0011_migrate_remaining_curated_works.sql
-- Goal: Complete CuratedWork -> Entry unification by migrating any legacy
--       curated_works records not already represented in the entries table.
--
-- Safety Guarantees:
-- 1. Dynamic detection: Migrates only records where cw.id NOT IN (SELECT id FROM entries).
-- 2. Non-destructive: Does NOT touch, overwrite, or renumber existing Entries.
-- 3. Zero collision entry numbering: Uses MAX(COALESCE(MAX(CAST(entry_number AS INTEGER)), 0), COUNT(*))
--    plus ROW_NUMBER() to allocate strictly unused sequential 3-digit entry numbers.
-- 4. Complete fidelity: Preserves id, slug, title, subtitle, archival_date,
--    display_date, featured_on_home, home_layout_weight, cover_image,
--    cover_image_caption, cover_image_alt, excerpt, body_blocks, metadata,
--    visibility, and timestamps.
-- 5. No data loss: Preserves legacy work_type and year in Entry metadata via json_set.
-- 6. Research hierarchy integrity: study_id and rui_revision remain NULL (no fabricated hierarchy).
-- 7. Relationships migrated: Imports junction relationships into entry_related_studies
--    and entry_related_entries without duplicates (INSERT OR IGNORE).
-- 8. Rollback table protection: Does not alter or drop curated_works, junction tables, or _bak_* tables.
-- ==============================================================================

-- STEP 1: Migrate all remaining curated_works into entries
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
SELECT
  cw.id,
  cw.slug,
  printf('%03d', (
    SELECT MAX(
      COALESCE((SELECT MAX(CAST(entry_number AS INTEGER)) FROM entries), 0),
      (SELECT COUNT(*) FROM entries)
    )
  ) + ROW_NUMBER() OVER (ORDER BY cw.order_index ASC, cw.created_at ASC, cw.id ASC)),
  NULL,
  cw.title,
  cw.subtitle,
  NULL,
  COALESCE(
    NULLIF(json_extract(cw.metadata, '$.medium'), ''),
    CASE WHEN cw.work_type = 'Essay' THEN 'Creative Writing' ELSE NULLIF(cw.work_type, '') END,
    'Visual Work'
  ),
  cw.excerpt,
  cw.excerpt,
  json_extract(cw.metadata, '$.location'),
  NULLIF(cw.archival_date, ''),
  NULLIF(cw.date, ''),
  NULL,
  NULL,
  cw.featured_on_home,
  COALESCE(NULLIF(cw.home_layout_weight, ''), 'standard'),
  cw.cover_image,
  cw.cover_image_caption,
  cw.cover_image_alt,
  cw.body_blocks,
  CASE 
    WHEN json_valid(cw.metadata) = 1 THEN 
      json_set(cw.metadata, '$.legacy_work_type', COALESCE(cw.work_type, ''), '$.year', COALESCE(cw.year, ''))
    ELSE 
      json_object('legacy_work_type', COALESCE(cw.work_type, ''), 'year', COALESCE(cw.year, ''))
  END,
  COALESCE(NULLIF(cw.visibility, ''), 'published'),
  COALESCE((SELECT MAX(order_index) FROM entries), 0) + ROW_NUMBER() OVER (ORDER BY cw.order_index ASC, cw.created_at ASC, cw.id ASC),
  COALESCE(NULLIF(cw.created_at, ''), datetime('now')),
  COALESCE(NULLIF(cw.updated_at, ''), datetime('now'))
FROM curated_works cw
WHERE cw.id NOT IN (SELECT id FROM entries);

-- STEP 2: Migrate junction relationships into entry_related_studies
INSERT OR IGNORE INTO entry_related_studies (entry_id, study_id, created_at)
SELECT cwrs.work_id, cwrs.study_id, cwrs.created_at
FROM curated_work_related_studies cwrs
JOIN entries e ON e.id = cwrs.work_id
JOIN studies s ON s.id = cwrs.study_id;

-- STEP 3: Migrate junction relationships into entry_related_entries
INSERT OR IGNORE INTO entry_related_entries (entry_id, related_entry_id, created_at)
SELECT cwre.work_id, cwre.entry_id, cwre.created_at
FROM curated_work_related_entries cwre
JOIN entries e1 ON e1.id = cwre.work_id
JOIN entries e2 ON e2.id = cwre.entry_id;
