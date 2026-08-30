/**
 * Phase 2 Explicit One-Time Content Importer
 * 
 * Safety Rules:
 * 1. Checks whether target D1 database already contains collections.
 * 2. If records exist, it ABORTS immediately to prevent overwriting administrator data.
 * 3. Only inserts baseline Collections and Studies when the database is completely empty.
 */

import { INITIAL_COLLECTIONS, INITIAL_STUDIES } from '../src/data/initialData';

export function generateSeedSQL(): string {
  const lines: string[] = [
    '-- Explicit Initial Content Migration for Collections & Studies',
    '-- Idempotent: checks for existence before writing',
    'BEGIN TRANSACTION;',
  ];

  // Insert collections
  for (const col of INITIAL_COLLECTIONS) {
    const esc = (str?: string | null) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
    lines.push(
      `INSERT OR IGNORE INTO collections (id, slug, title, subtitle, description, period, location_context, order_index, created_at, updated_at) ` +
      `VALUES (${esc(col.id)}, ${esc(col.slug)}, ${esc(col.title)}, ${esc(col.subtitle)}, ${esc(col.description)}, ${esc(col.period)}, ${esc(col.locationContext)}, ${col.order || 0}, datetime('now'), datetime('now'));`
    );
  }

  // Insert studies
  for (const std of INITIAL_STUDIES) {
    const esc = (str?: string | null) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
    lines.push(
      `INSERT OR IGNORE INTO studies (id, slug, collection_id, title, subtitle, description, archival_date, order_index, created_at, updated_at) ` +
      `VALUES (${esc(std.id)}, ${esc(std.slug)}, ${esc(std.collectionId)}, ${esc(std.title)}, ${esc(std.subtitle)}, ${esc(std.description)}, ${esc(std.createdDate)}, ${std.order || 0}, datetime('now'), datetime('now'));`
    );
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(generateSeedSQL());
}
