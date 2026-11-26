import type { Entry } from '../types';

export interface EntryRelatedEntryLink {
  entry_id: string;
  related_entry_id: string;
}

/**
 * Returns a canonical ordered pair [minId, maxId] representing one symmetric
 * cross-reference edge between two distinct Entries.
 * Returns null for empty IDs or self-references.
 */
export function canonicalEntryPair(idA: string, idB: string): [string, string] | null {
  const a = typeof idA === 'string' ? idA.trim() : '';
  const b = typeof idB === 'string' ? idB.trim() : '';
  if (!a || !b || a === b) return null;
  return a < b ? [a, b] : [b, a];
}

/**
 * Validates, trims, deduplicates, and strips self-references from a list of
 * cross-referenced Entry IDs.
 */
export function normalizeRelatedEntryIds(raw: unknown, selfId?: string): string[] {
  if (!Array.isArray(raw)) return [];
  const cleanSelf = typeof selfId === 'string' ? selfId.trim() : '';
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || (cleanSelf && trimmed === cleanSelf)) continue;
    seen.add(trimmed);
  }
  return Array.from(seen);
}

/**
 * Resolves raw entry_related_entries rows into a symmetric bidirectional
 * adjacency map (entryId -> unique direct partner entry IDs).
 *
 * - Treats every row (entry_id, related_entry_id) as an undirected relationship
 *   so historical one-way rows automatically become bidirectional.
 * - Deduplicates historical reciprocal pairs (A,B) and (B,A).
 * - Ignores self-references (A,A).
 * - Strictly direct (non-transitive): A-B and B-C does not link A-C.
 * - When allowedEntryIds is provided, both endpoints must be in the allowed set
 *   (used to filter out deleted or non-published entries on public routes).
 */
export function buildBidirectionalRelatedEntriesMap(
  rows: EntryRelatedEntryLink[],
  allowedEntryIds?: Set<string>
): Map<string, string[]> {
  const adjacency = new Map<string, Set<string>>();

  const addEdge = (fromId: string, toId: string) => {
    const from = typeof fromId === 'string' ? fromId.trim() : '';
    const to = typeof toId === 'string' ? toId.trim() : '';
    if (!from || !to || from === to) return;
    if (allowedEntryIds && (!allowedEntryIds.has(from) || !allowedEntryIds.has(to))) {
      return;
    }
    let set = adjacency.get(from);
    if (!set) {
      set = new Set<string>();
      adjacency.set(from, set);
    }
    set.add(to);
  };

  for (const row of rows) {
    addEdge(row.entry_id, row.related_entry_id);
    addEdge(row.related_entry_id, row.entry_id);
  }

  const result = new Map<string, string[]>();
  for (const [entryId, neighbors] of adjacency.entries()) {
    result.set(entryId, Array.from(neighbors));
  }
  return result;
}

/**
 * Normalizes an array of Entries in memory so all direct cross-references are
 * symmetric, deduplicated, free of self-references, and point to existing Entries.
 */
export function hydrateBidirectionalEntries(entries: Entry[]): Entry[] {
  const validIds = new Set(entries.map((e) => e.id));
  const links: EntryRelatedEntryLink[] = [];

  for (const entry of entries) {
    for (const relId of normalizeRelatedEntryIds(entry.relatedEntryIds, entry.id)) {
      links.push({ entry_id: entry.id, related_entry_id: relId });
    }
  }

  const map = buildBidirectionalRelatedEntriesMap(links, validIds);
  return entries.map((entry) => ({
    ...entry,
    relatedEntryIds: map.get(entry.id) || [],
  }));
}

/**
 * Synchronizes an authoritative created or updated Entry into the in-memory
 * entries list and updates reciprocal relatedEntryIds on all affected partners.
 */
export function applySymmetricRelatedEntries(
  entries: Entry[],
  updatedEntry: Entry,
  isNew = false
): Entry[] {
  const baseList = isNew
    ? [updatedEntry, ...entries.filter((e) => e.id !== updatedEntry.id)]
    : entries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));

  const validIds = new Set(baseList.map((e) => e.id));
  const normalizedTargetIds = normalizeRelatedEntryIds(
    updatedEntry.relatedEntryIds,
    updatedEntry.id
  ).filter((rid) => validIds.has(rid));
  const targetSet = new Set(normalizedTargetIds);

  return baseList.map((entry) => {
    if (entry.id === updatedEntry.id) {
      return {
        ...entry,
        relatedEntryIds: normalizedTargetIds,
      };
    }

    const currentRelated = normalizeRelatedEntryIds(entry.relatedEntryIds, entry.id);
    const currentlyLinked = currentRelated.includes(updatedEntry.id);
    const shouldBeLinked = targetSet.has(entry.id);

    if (shouldBeLinked && !currentlyLinked) {
      return {
        ...entry,
        relatedEntryIds: [...currentRelated, updatedEntry.id],
      };
    }
    if (!shouldBeLinked && currentlyLinked) {
      return {
        ...entry,
        relatedEntryIds: currentRelated.filter((rid) => rid !== updatedEntry.id),
      };
    }
    return entry;
  });
}

/**
 * Removes a deleted Entry and strips any cross-references pointing to it
 * from all remaining Entries.
 */
export function removeEntryAndCrossReferences(entries: Entry[], deletedId: string): Entry[] {
  return entries
    .filter((entry) => entry.id !== deletedId)
    .map((entry) => {
      if (!entry.relatedEntryIds || !entry.relatedEntryIds.includes(deletedId)) {
        return entry;
      }
      return {
        ...entry,
        relatedEntryIds: entry.relatedEntryIds.filter((rid) => rid !== deletedId),
      };
    });
}
