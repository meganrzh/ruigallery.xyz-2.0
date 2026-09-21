/**
 * Typed API Client for ruigallery.xyz
 * Connects frontend components to Cloudflare Pages Functions / Worker and D1 database.
 */

import { Collection, Study, Thread, Entry, EntryBlock, RuiRevision, CuratedWork, CuratedWorkBlock } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RawCollectionRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  period: string | null;
  location_context: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface RawStudyRecord {
  id: string;
  slug: string;
  collection_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  archival_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface RawThreadRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  order?: number;
}

export interface RawHydratedEntry {
  id: string;
  slug: string;
  entryNumber: string;
  studyId?: string | null;
  collectionId?: string | null;
  title: string;
  subtitle?: string | null;
  ruiRevision?: string | null;
  medium?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  location?: string | null;
  createdDate: string;
  displayDate?: string | null;
  publishedDate?: string | null;
  lastModifiedDate?: string | null;
  featuredOnHome?: boolean | number;
  homeLayoutWeight?: string | null;
  coverImage?: string | null;
  coverImageCaption?: string | null;
  coverImageAlt?: string | null;
  blocks: EntryBlock[];
  metadata?: Record<string, string> | null;
  threadIds: string[];
  relatedStudyIds: string[];
  relatedEntryIds?: string[];
  visibility: 'published' | 'draft' | 'hidden';
  order?: number;
}

// Convert D1 database record to frontend Collection type
export function mapRecordToCollection(record: RawCollectionRecord): Collection {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    subtitle: record.subtitle || undefined,
    description: record.description || '',
    period: record.period || '',
    order: record.order_index,
    locationContext: record.location_context || undefined,
  };
}

// Convert D1 database record to frontend Study type
export function mapRecordToStudy(record: RawStudyRecord): Study {
  return {
    id: record.id,
    slug: record.slug,
    collectionId: record.collection_id,
    title: record.title,
    subtitle: record.subtitle || undefined,
    description: record.description || '',
    createdDate: record.archival_date || record.created_at.split('T')[0].replace(/-/g, '.'),
    threadIds: [],
    relatedStudyIds: [],
    order: record.order_index,
  };
}

export function mapRawToThread(record: RawThreadRecord): Thread {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description || undefined,
  };
}

export function mapRawToEntry(raw: RawHydratedEntry): Entry {
  return {
    id: raw.id,
    slug: raw.slug,
    entryNumber: raw.entryNumber,
    collectionId: raw.collectionId || undefined,
    studyId: raw.studyId || undefined,
    title: raw.title,
    subtitle: raw.subtitle || undefined,
    ruiRevision: raw.ruiRevision !== undefined ? raw.ruiRevision : null,
    medium: raw.medium || undefined,
    createdDate: raw.createdDate,
    displayDate: raw.displayDate || undefined,
    lastModifiedDate: raw.lastModifiedDate || undefined,
    publishedDate: raw.publishedDate || undefined,
    location: raw.location || undefined,
    featuredOnHome: Boolean(raw.featuredOnHome),
    homeLayoutWeight: (raw.homeLayoutWeight as any) || 'standard',
    coverImage: raw.coverImage || undefined,
    coverImageCaption: raw.coverImageCaption || undefined,
    coverImageAlt: raw.coverImageAlt || undefined,
    threadIds: raw.threadIds || [],
    relatedStudyIds: raw.relatedStudyIds || [],
    relatedEntryIds: raw.relatedEntryIds || [],
    summary: raw.summary || undefined,
    excerpt: raw.excerpt || undefined,
    blocks: raw.blocks || [],
    metadata: raw.metadata || {},
    visibility: raw.visibility || 'published',
    order: raw.order,
  };
}

export interface RawHydratedCuratedWork {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  workType: 'Essay' | 'Photography' | 'Visual Work' | 'Mixed Media' | 'Spatial Study';
  year: string;
  date: string;
  archivalDate: string;
  featuredOnHome: boolean;
  homeLayoutWeight: 'dominant' | 'standard' | 'editorial-compact' | 'horizontal-wide';
  coverImage: string;
  coverImageCaption?: string;
  coverImageAlt?: string;
  excerpt: string;
  bodyBlocks: CuratedWorkBlock[];
  metadata?: {
    medium?: string;
    dimensions?: string;
    edition?: string;
    location?: string;
    readingTime?: string;
  };
  relatedStudyIds?: string[];
  relatedEntryIds?: string[];
  visibility: 'published' | 'draft' | 'hidden';
  order?: number;
}

export function mapRawToCuratedWork(raw: RawHydratedCuratedWork): CuratedWork {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    subtitle: raw.subtitle || undefined,
    workType: raw.workType || 'Essay',
    year: raw.year,
    date: raw.date,
    archivalDate: raw.archivalDate || (raw.year ? `${raw.year}-01-01` : '2026-01-01'),
    featuredOnHome: Boolean(raw.featuredOnHome),
    homeLayoutWeight: raw.homeLayoutWeight || 'standard',
    coverImage: raw.coverImage || '',
    coverImageCaption: raw.coverImageCaption || undefined,
    coverImageAlt: raw.coverImageAlt || undefined,
    excerpt: raw.excerpt || '',
    bodyBlocks: raw.bodyBlocks || [],
    metadata: raw.metadata || {},
    relatedStudyIds: raw.relatedStudyIds || [],
    relatedEntryIds: raw.relatedEntryIds || [],
    visibility: raw.visibility || 'published',
    order: raw.order,
  };
}

// Safe response parser that prevents SyntaxError when server returns HTML fallback
async function parseApiResponse<T>(res: Response, fallbackError: string): Promise<ApiResponse<T>> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`API returned non-JSON response (${res.status} ${res.statusText}). Endpoint may not be served in current environment.`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || fallbackError);
  }
  return json;
}

export const api = {
  /**
   * Check administrator authentication state via Cloudflare Access assertion
   */
  async getSession(): Promise<{ authenticated: boolean; user?: { email?: string } }> {
    try {
      const res = await fetch('/api/admin/session', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        return { authenticated: false };
      }
      const json: ApiResponse<{ authenticated: boolean; user?: { email?: string } }> = await res.json();
      if (json.data && typeof json.data.authenticated === 'boolean') {
        return json.data;
      }
      return { authenticated: Boolean((json as any).authenticated), user: (json as any).user };
    } catch {
      return { authenticated: false };
    }
  },

  /**
   * Fetch complete aggregate archive (Collections, Studies, Threads, Entries, Curated Works) from D1
   */
  async getArchive(): Promise<{
    collections: Collection[];
    studies: Study[];
    threads: Thread[];
    entries: Entry[];
    curatedWorks: CuratedWork[];
  } | null> {
    try {
      const res = await fetch('/api/archive', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;

      const json: ApiResponse<{
        collections: RawCollectionRecord[];
        studies: RawStudyRecord[];
        threads: RawThreadRecord[];
        entries: RawHydratedEntry[];
        curatedWorks: RawHydratedCuratedWork[];
      }> = await res.json();
      if (!json.success || !json.data) return null;

      return {
        collections: (json.data.collections || []).map(mapRecordToCollection),
        studies: (json.data.studies || []).map(mapRecordToStudy),
        threads: (json.data.threads || []).map(mapRawToThread),
        entries: (json.data.entries || []).map(mapRawToEntry),
        curatedWorks: (json.data.curatedWorks || []).map(mapRawToCuratedWork),
      };
    } catch {
      return null;
    }
  },

  // Collections CRUD
  async getCollections(): Promise<Collection[]> {
    const res = await fetch('/api/collections', { credentials: 'same-origin' });
    const json = await parseApiResponse<RawCollectionRecord[]>(res, 'Failed to fetch collections');
    return (json.data || []).map(mapRecordToCollection);
  },

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const payload: Partial<RawCollectionRecord> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle || null;
    if (updates.description !== undefined) payload.description = updates.description || null;
    if (updates.period !== undefined) payload.period = updates.period || null;
    if (updates.locationContext !== undefined) payload.location_context = updates.locationContext || null;
    if (updates.order !== undefined) payload.order_index = updates.order;

    const res = await fetch(`/api/admin/collections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const json = await parseApiResponse<RawCollectionRecord>(res, 'Failed to update collection');
    return mapRecordToCollection(json.data!);
  },

  async reorderCollections(items: { id: string; order: number }[]): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/collections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, order_index: i.order })),
        }),
      });
      if (res.ok) return true;
    } catch {
      // fallback to individual updates below
    }

    await Promise.all(
      items.map((item) =>
        api.updateCollection(item.id, { order: item.order })
      )
    );
    return true;
  },

  async createCollection(collection: Partial<Collection>): Promise<Collection> {
    const payload: Partial<RawCollectionRecord> = {
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      subtitle: collection.subtitle || null,
      description: collection.description || null,
      period: collection.period || null,
      location_context: collection.locationContext || null,
      order_index: collection.order || 0,
    };

    const res = await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const json = await parseApiResponse<RawCollectionRecord>(res, 'Failed to create collection');
    return mapRecordToCollection(json.data!);
  },

  async deleteCollection(id: string): Promise<void> {
    const res = await fetch(`/api/admin/collections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    await parseApiResponse<unknown>(res, 'Failed to delete collection');
  },

  // Studies CRUD
  async getStudies(): Promise<Study[]> {
    const res = await fetch('/api/studies', { credentials: 'same-origin' });
    const json = await parseApiResponse<RawStudyRecord[]>(res, 'Failed to fetch studies');
    return (json.data || []).map(mapRecordToStudy);
  },

  async updateStudy(id: string, updates: Partial<Study>): Promise<Study> {
    const payload: Partial<RawStudyRecord> = {
      title: updates.title,
      subtitle: updates.subtitle || null,
      description: updates.description || null,
      collection_id: updates.collectionId,
      archival_date: updates.createdDate || null,
      order_index: updates.order,
    };

    const res = await fetch(`/api/admin/studies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const json = await parseApiResponse<RawStudyRecord>(res, 'Failed to update study');
    return mapRecordToStudy(json.data!);
  },

  async createStudy(study: Partial<Study>): Promise<Study> {
    const payload: Partial<RawStudyRecord> = {
      id: study.id,
      slug: study.slug,
      collection_id: study.collectionId,
      title: study.title,
      subtitle: study.subtitle || null,
      description: study.description || null,
      archival_date: study.createdDate || null,
      order_index: study.order || 0,
    };

    const res = await fetch('/api/admin/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const json = await parseApiResponse<RawStudyRecord>(res, 'Failed to create study');
    return mapRecordToStudy(json.data!);
  },

  async deleteStudy(id: string): Promise<void> {
    const res = await fetch(`/api/admin/studies/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    await parseApiResponse<unknown>(res, 'Failed to delete study');
  },

  // Threads CRUD
  async getThreads(): Promise<Thread[]> {
    const res = await fetch('/api/threads', { credentials: 'same-origin' });
    const json = await parseApiResponse<RawThreadRecord[]>(res, 'Failed to fetch threads');
    return (json.data || []).map(mapRawToThread);
  },

  async createThread(thread: Partial<Thread>): Promise<Thread> {
    const res = await fetch('/api/admin/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(thread),
    });
    const json = await parseApiResponse<RawThreadRecord>(res, 'Failed to create thread');
    return mapRawToThread(json.data!);
  },

  async updateThread(id: string, updates: Partial<Thread>): Promise<Thread> {
    const res = await fetch(`/api/admin/threads/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(updates),
    });
    const json = await parseApiResponse<RawThreadRecord>(res, 'Failed to update thread');
    return mapRawToThread(json.data!);
  },

  async deleteThread(id: string): Promise<void> {
    const res = await fetch(`/api/admin/threads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    await parseApiResponse<unknown>(res, 'Failed to delete thread');
  },

  // Entries CRUD
  async getEntries(params?: {
    studyId?: string;
    collectionId?: string;
    threadId?: string;
    visibility?: string;
  }): Promise<Entry[]> {
    const searchParams = new URLSearchParams();
    if (params?.studyId) searchParams.set('studyId', params.studyId);
    if (params?.collectionId) searchParams.set('collectionId', params.collectionId);
    if (params?.threadId) searchParams.set('threadId', params.threadId);
    if (params?.visibility) searchParams.set('visibility', params.visibility);

    const qs = searchParams.toString();
    const res = await fetch(`/api/entries${qs ? '?' + qs : ''}`, { credentials: 'same-origin' });
    const json = await parseApiResponse<RawHydratedEntry[]>(res, 'Failed to fetch entries');
    return (json.data || []).map(mapRawToEntry);
  },

  async getEntry(idOrSlug: string): Promise<Entry> {
    const res = await fetch(`/api/entries/${encodeURIComponent(idOrSlug)}`, { credentials: 'same-origin' });
    const json = await parseApiResponse<RawHydratedEntry>(res, 'Entry not found');
    return mapRawToEntry(json.data!);
  },

  async createEntry(entry: Partial<Entry>): Promise<Entry> {
    const res = await fetch('/api/admin/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(entry),
    });
    const json = await parseApiResponse<RawHydratedEntry>(res, 'Failed to create entry');
    return mapRawToEntry(json.data!);
  },

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry> {
    const res = await fetch(`/api/admin/entries/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(updates),
    });
    const json = await parseApiResponse<RawHydratedEntry>(res, 'Failed to update entry');
    return mapRawToEntry(json.data!);
  },

  async deleteEntry(id: string): Promise<void> {
    const res = await fetch(`/api/admin/entries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    await parseApiResponse<unknown>(res, 'Failed to delete entry');
  },

  // Curated Works CRUD
  async getWorks(params?: {
    featured?: boolean;
    visibility?: string;
  }): Promise<CuratedWork[]> {
    const searchParams = new URLSearchParams();
    if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
    if (params?.visibility) searchParams.set('visibility', params.visibility);

    const qs = searchParams.toString();
    const res = await fetch(`/api/works${qs ? '?' + qs : ''}`, { credentials: 'same-origin' });
    const json = await parseApiResponse<RawHydratedCuratedWork[]>(res, 'Failed to fetch curated works');
    return (json.data || []).map(mapRawToCuratedWork);
  },

  async getWork(idOrSlug: string): Promise<CuratedWork> {
    const res = await fetch(`/api/works/${encodeURIComponent(idOrSlug)}`, { credentials: 'same-origin' });
    const json = await parseApiResponse<RawHydratedCuratedWork>(res, 'Curated work not found');
    return mapRawToCuratedWork(json.data!);
  },

  async createWork(work: Partial<CuratedWork>): Promise<CuratedWork> {
    const res = await fetch('/api/admin/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(work),
    });
    const json = await parseApiResponse<RawHydratedCuratedWork>(res, 'Failed to create curated work');
    return mapRawToCuratedWork(json.data!);
  },

  async updateWork(id: string, updates: Partial<CuratedWork>): Promise<CuratedWork> {
    const res = await fetch(`/api/admin/works/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(updates),
    });
    const json = await parseApiResponse<RawHydratedCuratedWork>(res, 'Failed to update curated work');
    return mapRawToCuratedWork(json.data!);
  },

  async deleteWork(id: string): Promise<void> {
    const res = await fetch(`/api/admin/works/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    await parseApiResponse<unknown>(res, 'Failed to delete curated work');
  },
};
