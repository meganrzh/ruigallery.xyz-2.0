-- Migration: 0013_accession_number_reset.sql
-- Goal: One-time accession reset of the 9 legitimate production entries to 001–009,
--       defensively guarded, creation of durable accession sequence,
--       and database UNIQUE constraint on entries.entry_number.

-- STEP 1: Collision-free temporary prefix for the 9 audited legitimate entries ONLY
UPDATE entries
SET entry_number = 'temp-' || id
WHERE id IN (
  'work-1789744815441',
  'work-1789756285831',
  'work-1789762928028',
  'work-1789963721275',
  'entry-1789966668365',
  'entry-1790023270296',
  'entry-1790040265434',
  'entry-1791209176613',
  'entry-1791209621290'
);

-- STEP 2: Assign sequential, gap-free accession numbers 001–009 based on audited intake order
UPDATE entries SET entry_number = '001' WHERE id = 'work-1789744815441';
UPDATE entries SET entry_number = '002' WHERE id = 'work-1789756285831';
UPDATE entries SET entry_number = '003' WHERE id = 'work-1789762928028';
UPDATE entries SET entry_number = '004' WHERE id = 'work-1789963721275';
UPDATE entries SET entry_number = '005' WHERE id = 'entry-1789966668365';
UPDATE entries SET entry_number = '006' WHERE id = 'entry-1790023270296';
UPDATE entries SET entry_number = '007' WHERE id = 'entry-1790040265434';
UPDATE entries SET entry_number = '008' WHERE id = 'entry-1791209176613';
UPDATE entries SET entry_number = '009' WHERE id = 'entry-1791209621290';

-- STEP 3: Safe Reset Scope Guard
-- Abort the transaction immediately if the table does not match the audited set of 9 legitimate entries,
-- or if any entry retains a 'temp-' accession number, or if any duplicate/gap exists.
CREATE TABLE _accession_reset_guard (
  status TEXT CHECK (status = 'VALID')
);

INSERT INTO _accession_reset_guard (status)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM entries) = 9
   AND (SELECT COUNT(DISTINCT entry_number) FROM entries) = 9
   AND (SELECT COUNT(*) FROM entries WHERE entry_number LIKE 'temp-%') = 0
   AND (SELECT MIN(CAST(entry_number AS INTEGER)) FROM entries) = 1
   AND (SELECT MAX(CAST(entry_number AS INTEGER)) FROM entries) = 9
   AND (SELECT COUNT(*) FROM entries WHERE entry_number NOT IN ('001','002','003','004','005','006','007','008','009')) = 0
  THEN 'VALID'
  ELSE 'ABORT_INVALID_ENTRY_SET'
END;

DROP TABLE _accession_reset_guard;

-- STEP 4: Create and seed the durable accession sequence counter
CREATE TABLE IF NOT EXISTS accession_sequences (
  name TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL
);

INSERT OR REPLACE INTO accession_sequences (name, last_number)
VALUES ('entry_number', 9);

-- STEP 5: Enforce database-level uniqueness
DROP INDEX IF EXISTS idx_entries_entry_number;
CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_entry_number_unique ON entries(entry_number);
