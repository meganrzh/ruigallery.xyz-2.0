-- Migration: 0014_collection_medium_scope.sql
-- Purpose: Add optional medium_scope to collections to support medium-scoped bodies of work (series).
-- Cross-medium collections have medium_scope = NULL.

-- Step 1: Add medium_scope column to collections table
ALTER TABLE collections ADD COLUMN medium_scope TEXT DEFAULT NULL;

-- Step 2: Index for performance on medium-scoped collection lookups
CREATE INDEX IF NOT EXISTS idx_collections_medium_scope ON collections(medium_scope);
