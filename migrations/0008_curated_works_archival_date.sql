-- Migration 0008: Canonical Archival Date for Curated Works
-- Adds canonical machine-sortable authored date (YYYY-MM-DD)
-- Explicitly backfills existing seeded works without synthetic default dates

-- 1. Add nullable archival_date column with no fabricated default
ALTER TABLE curated_works ADD COLUMN archival_date TEXT;

-- 2. Explicitly backfill the four canonical seeded works based on authored dates
UPDATE curated_works SET archival_date = '2026-08-01' WHERE id = 'work-arch-forgetting';
UPDATE curated_works SET archival_date = '2025-10-01' WHERE id = 'work-stone-salt';
UPDATE curated_works SET archival_date = '2025-05-01' WHERE id = 'work-cartographic-palimpsest';
UPDATE curated_works SET archival_date = '2024-11-01' WHERE id = 'work-optical-scans';

-- 3. Create index for high-performance chronological sorting
CREATE INDEX IF NOT EXISTS idx_curated_works_archival_date ON curated_works(archival_date);
