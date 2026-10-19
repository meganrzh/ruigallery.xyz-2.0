/**
 * Canonical RUI Date Formatting Utilities
 *
 * Requirements:
 * 1. Full dates must render in YYYY.MM.DD format (e.g. "2026.10.05").
 * 2. Pure string-parsing approach: NO timezone shifts from `new Date()` for date-only strings.
 *    "2026-10-05" or "2026.10.05" must always remain October 5, never shifting to October 4 in UTC-minus zones.
 * 3. Handles:
 *    - "YYYY.MM.DD" (current RUI format)
 *    - "YYYY-MM-DD" (migrated curated works format)
 *    - "YYYY/MM/DD"
 *    - ISO 8601 strings (e.g. "2026-10-17T00:13:49.653Z", "2026-09-17 15:10:51")
 *    - Single-digit month/day (pads with leading zero: "2026-1-5" -> "2026.01.05")
 * 4. Safe timestamp extraction for sorting:
 *    Deterministic chronological ordering without locale or timezone bias.
 */

/**
 * Normalizes any valid date string or timestamp into the canonical RUI format: YYYY.MM.DD.
 * Returns the formatted string, or fallback (defaulting to empty string) if unparseable.
 */
export function formatFullDate(rawDate?: string | null, fallback = ''): string {
  if (!rawDate || typeof rawDate !== 'string') {
    return fallback;
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return fallback;
  }

  // 1. Direct regex for YYYY[-./]MM[-./]DD (handles date-only strings and ISO timestamps starting with date)
  const match = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  // 2. If it's already just a 4-digit year e.g. "2026"
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed || fallback;
}

/**
 * Extracts 4-digit year from date string or returns fallback.
 */
export function formatYear(rawDate?: string | null, fallback = '2026'): string {
  if (!rawDate || typeof rawDate !== 'string') {
    return fallback;
  }
  const match = rawDate.match(/\b(\d{4})\b/);
  return match ? match[1] : fallback;
}

/**
 * Converts any date representation to a deterministic numeric timestamp for chronological sorting.
 * Avoids browser timezone issues by using Date.UTC on explicit year, month, day components.
 */
export function parseDateToTimestamp(rawDate?: string | null): number {
  if (!rawDate || typeof rawDate !== 'string') {
    return 0;
  }
  const match = rawDate.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return Date.UTC(year, month, day);
  }
  // Fallback to Date.parse for other formats
  const parsed = Date.parse(rawDate);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Chronological date comparator for sorting entries or studies (newest first).
 */
export function compareDatesDesc(dateA?: string | null, dateB?: string | null): number {
  return parseDateToTimestamp(dateB) - parseDateToTimestamp(dateA);
}

/**
 * Chronological date comparator for sorting entries or studies (oldest first).
 */
export function compareDatesAsc(dateA?: string | null, dateB?: string | null): number {
  return parseDateToTimestamp(dateA) - parseDateToTimestamp(dateB);
}
