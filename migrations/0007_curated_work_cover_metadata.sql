-- Migration 0007: Curated Work Cover Metadata (Caption and Alt Text)
-- Adds optional cover_image_caption and cover_image_alt columns to curated_works

ALTER TABLE curated_works ADD COLUMN cover_image_caption TEXT;
ALTER TABLE curated_works ADD COLUMN cover_image_alt TEXT;
