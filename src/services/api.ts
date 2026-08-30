/**
 * Typed API Client for ruigallery.xyz
 * Connects frontend components to Cloudflare Pages Functions and D1 database.
 */

import { Collection, Study } from '../types';

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
    threadIds: [], // Will be hydrated from junction table in later phases
    relatedStudyIds: [],
    order: record.order_index,
  };
}

export const api = {
  /**
   * Fetch complete aggregate archive (Collections & Studies) from D1
   */
  async getArchive(): Promise<{ collections: Collection[]; studies: Study[] } | null> {
    try {
      const res = await fetch('/api/archive', {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return null;
      const json: ApiResponse<{ collections: RawCollectionRecord[]; studies: RawStudyRecord[] }> = await res.json();
      if (!json.success || !json.data) return null;

      return {
        collections: (json.data.collections || []).map(mapRecordToCollection),
        studies: (json.data.studies || []).map(mapRecordToStudy),
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
};
