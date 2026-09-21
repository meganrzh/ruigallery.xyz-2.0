-- Migration 0009: Dedicated Medium Field for Laboratory Entries
-- Adds a nullable medium field for creative/formal classification
-- Explicitly backfills existing entries according to their actual content

-- 1. Add nullable medium column
ALTER TABLE entries ADD COLUMN medium TEXT;

-- 2. Explicit backfill of existing entries (no fabricated default)
UPDATE entries SET medium = 'Research / Inquiry' WHERE id = 'entry-001';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-002';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-003';
UPDATE entries SET medium = 'Research / Inquiry' WHERE id = 'entry-004';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-005';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-006';
UPDATE entries SET medium = 'Research / Inquiry' WHERE id = 'entry-007';
UPDATE entries SET medium = 'Creative Writing' WHERE id = 'entry-008';
UPDATE entries SET medium = 'Creative Writing' WHERE id = 'entry-009';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-010';
UPDATE entries SET medium = 'Research / Inquiry' WHERE id = 'entry-011';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-012';
UPDATE entries SET medium = 'Visual Work' WHERE id = 'entry-013';
UPDATE entries SET medium = 'Research / Inquiry' WHERE id = 'entry-014';

-- 3. Index for medium filtering and grouping
CREATE INDEX IF NOT EXISTS idx_entries_medium ON entries(medium);
