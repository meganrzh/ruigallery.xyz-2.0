/**
 * Typed API Client for ruigallery.xyz
 * Connects frontend components to Cloudflare Pages Functions / Worker and D1 database.
 */

import { Collection, Study, Thread, Entry, EntryBlock, RuiRevision } from '../types';

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
  studyId: string;
  collectionId: string;
  title: string;
  ruiRevision: string;
  summary?: string;
  location?: string;
  createdDate: string;
  publishedDate?: string;
  lastModifiedDate?: string;
  blocks: EntryBlock[];
  threadIds: string[];
  relatedStudyIds: string[];
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
    collectionId: raw.collectionId,
    studyId: raw.studyId,
    title: raw.title,
    ruiRevision: (raw.ruiRevision || 'REV 00') as RuiRevision,
    createdDate: raw.createdDate,
    lastModifiedDate: raw.lastModifiedDate || undefined,
    publishedDate: raw.publishedDate || undefined,
    location: raw.location || undefined,
    threadIds: raw.threadIds || [],
    relatedStudyIds: raw.relatedStudyIds || [],
    summary: raw.summary || undefined,
    blocks: raw.blocks || [],
    visibility: raw.visibility || 'published',
  };
}

export const api = {
  /**
   * Fetch complete aggregate archive (Collections, Studies, Threads, Entries) from D1
   */
  async getArchive(): Promise<{
    collections: Collection[];
    studies: Study[];
    threads: Thread[];
    entries: Entry[];
  } | null> {
    try {
      const res = await fetch('/api/archive', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const json: ApiResponse<{
        collections: RawCollectionRecord[];
        studies: RawStudyRecord[];
        threads: RawThreadRecord[];
        entries: RawHydratedEntry[];
      }> = await res.json();
      if (!json.success || !json.data) return null;

      return {
        collections: (json.data.collections || []).map(mapRecordToCollection),
        studies: (json.data.studies || []).map(mapRecordToStudy),
        threads: (json.data.threads || []).map(mapRawToThread),
        entries: (json.data.entries || []).map(mapRawToEntry),
      };
    } catch {
      return null;
    }
  },

  // Collections CRUD
  async getCollections(): Promise<Collection[]> {
    const res = await fetch('/api/collections');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json: ApiResponse<RawCollectionRecord[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch collections');
    return json.data.map(mapRecordToCollection);
  },

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const payload: Partial<RawCollectionRecord> = {
      title: updates.title,
      subtitle: updates.subtitle || null,
      description: updates.description || null,
      period: updates.period || null,
      location_context: updates.locationContext || null,
      order_index: updates.order,
    };

    const res = await fetch(`/api/collections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<RawCollectionRecord> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to update collection');
    }
    return mapRecordToCollection(json.data);
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

    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<RawCollectionRecord> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to create collection');
    }
    return mapRecordToCollection(json.data);
  },

  async deleteCollection(id: string): Promise<void> {
    const res = await fetch(`/api/collections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json: ApiResponse<unknown> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete collection');
    }
  },

  // Studies CRUD
  async getStudies(): Promise<Study[]> {
    const res = await fetch('/api/studies');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json: ApiResponse<RawStudyRecord[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch studies');
    return json.data.map(mapRecordToStudy);
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

    const res = await fetch(`/api/studies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<RawStudyRecord> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to update study');
    }
    return mapRecordToStudy(json.data);
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

    const res = await fetch('/api/studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json: ApiResponse<RawStudyRecord> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to create study');
    }
    return mapRecordToStudy(json.data);
  },

  async deleteStudy(id: string): Promise<void> {
    const res = await fetch(`/api/studies/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json: ApiResponse<unknown> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete study');
    }
  },

  // Threads CRUD
  async getThreads(): Promise<Thread[]> {
    const res = await fetch('/api/threads');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json: ApiResponse<RawThreadRecord[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch threads');
    return json.data.map(mapRawToThread);
  },

  async createThread(thread: Partial<Thread>): Promise<Thread> {
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thread),
    });
    const json: ApiResponse<RawThreadRecord> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to create thread');
    }
    return mapRawToThread(json.data);
  },

  async updateThread(id: string, updates: Partial<Thread>): Promise<Thread> {
    const res = await fetch(`/api/threads/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json: ApiResponse<RawThreadRecord> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to update thread');
    }
    return mapRawToThread(json.data);
  },

  async deleteThread(id: string): Promise<void> {
    const res = await fetch(`/api/threads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json: ApiResponse<unknown> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete thread');
    }
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
    const res = await fetch(`/api/entries${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json: ApiResponse<RawHydratedEntry[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch entries');
    return json.data.map(mapRawToEntry);
  },

  async getEntry(idOrSlug: string): Promise<Entry> {
    const res = await fetch(`/api/entries/${encodeURIComponent(idOrSlug)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json: ApiResponse<RawHydratedEntry> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Entry not found');
    return mapRawToEntry(json.data);
  },

  async createEntry(entry: Partial<Entry>): Promise<Entry> {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    const json: ApiResponse<RawHydratedEntry> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to create entry');
    }
    return mapRawToEntry(json.data);
  },

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry> {
    const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json: ApiResponse<RawHydratedEntry> = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to update entry');
    }
    return mapRawToEntry(json.data);
  },

  async deleteEntry(id: string): Promise<void> {
    const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json: ApiResponse<unknown> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete entry');
    }
  },
};
