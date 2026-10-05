-- Migration: 0012_entry_collection_id.sql
-- Purpose: Decouple Entry from mandatory Study hierarchy by adding direct collection_id to entries.
-- An Entry can now belong directly to a Collection without requiring a Study.

-- Step 1: Add collection_id column with foreign key to collections table
ALTER TABLE entries ADD COLUMN collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL;

-- Step 2: Index for performance on collection-based queries and filters
CREATE INDEX IF NOT EXISTS idx_entries_collection_id ON entries(collection_id);

-- Step 3: Backfill collection_id for all existing entries that have an assigned study
UPDATE entries
SET collection_id = (
  SELECT collection_id FROM studies WHERE studies.id = entries.study_id
)
WHERE study_id IS NOT NULL;
