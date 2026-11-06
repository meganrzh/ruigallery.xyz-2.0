-- Migration: 0015_study_medium_scope.sql
-- Purpose: Add optional medium_scope to studies table for medium-scoped study subdivisions.
-- Collections are inherently cross-medium; collections.medium_scope is retired from active models.

-- Step 1: Add medium_scope column to studies table (nullable, default NULL = unrestricted)
ALTER TABLE studies ADD COLUMN medium_scope TEXT DEFAULT NULL;

-- Step 2: Index for efficient lookup of medium-scoped studies
CREATE INDEX IF NOT EXISTS idx_studies_medium_scope ON studies(medium_scope);

-- Step 3: Clean up retired collections index
DROP INDEX IF EXISTS idx_collections_medium_scope;
