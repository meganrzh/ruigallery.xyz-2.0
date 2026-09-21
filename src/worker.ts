/**
 * Cloudflare Worker Backend for ruigallery.xyz
 * Handles /api/* endpoints with Cloudflare D1 integration while delegating
 * non-API static routes and SPAs to static assets.
 */

export interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: {
    changes?: number;
    last_row_id?: number;
    duration?: number;
    [key: string]: unknown;
  };
  changes?: number;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<{ success: boolean; results?: T[] }>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface Env {
  DB: D1Database;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export interface CollectionRecord {
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

export interface StudyRecord {
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

export interface ThreadRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface EntryRecord {
  id: string;
  slug: string;
  entry_number: string;
  study_id: string | null;
  title: string;
  subtitle: string | null;
  rui_revision: string | null;
  medium: string | null;
  summary: string | null;
  excerpt: string | null;
  location: string | null;
  archival_date: string;
  display_date: string | null;
  published_date: string | null;
  last_modified_date: string | null;
  featured_on_home: number;
  home_layout_weight: string | null;
  cover_image: string | null;
  cover_image_caption: string | null;
  cover_image_alt: string | null;
  blocks: string;
  metadata: string | null;
  visibility: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface EntryThreadRecord {
  entry_id: string;
  thread_id: string;
}

export interface EntryRelatedStudyRecord {
  entry_id: string;
  study_id: string;
}

export interface EntryRelatedEntryRecord {
  entry_id: string;
  related_entry_id: string;
}

export interface CuratedWorkRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  work_type: string;
  year: string;
  date: string;
  archival_date: string;
  featured_on_home: number;
  home_layout_weight: string;
  cover_image: string;
  cover_image_caption: string | null;
  cover_image_alt: string | null;
  excerpt: string;
  body_blocks: string;
  metadata: string | null;
  visibility: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CuratedWorkRelatedStudyRecord {
  work_id: string;
  study_id: string;
}

export interface CuratedWorkRelatedEntryRecord {
  work_id: string;
  entry_id: string;
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message, success: false }, status);
}

function handleCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function hydrateEntry(
  entry: EntryRecord,
  studyCollectionMap: Map<string, string>,
  entryThreadsMap: Map<string, string[]>,
  entryRelatedStudiesMap: Map<string, string[]>,
  entryRelatedEntriesMap?: Map<string, string[]>
) {
  let blocks: unknown[] = [];
  try {
    blocks = typeof entry.blocks === 'string' ? JSON.parse(entry.blocks) : (entry.blocks || []);
  } catch {
    blocks = [];
  }

  let metadata: Record<string, string> = {};
  try {
    metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : (entry.metadata || {});
  } catch {
    metadata = {};
  }

  return {
    id: entry.id,
    slug: entry.slug,
    entryNumber: entry.entry_number,
    studyId: entry.study_id || undefined,
    collectionId: entry.study_id ? (studyCollectionMap.get(entry.study_id) || '') : undefined,
    title: entry.title,
    subtitle: entry.subtitle || undefined,
    ruiRevision: entry.rui_revision !== undefined ? entry.rui_revision : null,
    medium: entry.medium || undefined,
    summary: entry.summary || '',
    excerpt: entry.excerpt || undefined,
    location: entry.location || '',
    createdDate: entry.archival_date,
    displayDate: entry.display_date || undefined,
    publishedDate: entry.published_date || entry.archival_date,
    lastModifiedDate: entry.last_modified_date || entry.archival_date,
    featuredOnHome: Boolean(entry.featured_on_home),
    homeLayoutWeight: entry.home_layout_weight || 'standard',
    coverImage: entry.cover_image || undefined,
    coverImageCaption: entry.cover_image_caption || undefined,
    coverImageAlt: entry.cover_image_alt || undefined,
    blocks,
    metadata,
    threadIds: entryThreadsMap.get(entry.id) || [],
    relatedStudyIds: entryRelatedStudiesMap.get(entry.id) || [],
    relatedEntryIds: entryRelatedEntriesMap?.get(entry.id) || [],
    visibility: (entry.visibility || 'published') as 'published' | 'draft' | 'hidden',
    order: entry.order_index,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

function hydrateCuratedWork(
  work: CuratedWorkRecord,
  workStudiesMap: Map<string, string[]>,
  workEntriesMap: Map<string, string[]>
) {
  let bodyBlocks: unknown[] = [];
  try {
    bodyBlocks = typeof work.body_blocks === 'string' ? JSON.parse(work.body_blocks) : (work.body_blocks || []);
  } catch {
    bodyBlocks = [];
  }

  let metadata: Record<string, string> = {};
  try {
    metadata = typeof work.metadata === 'string' ? JSON.parse(work.metadata) : (work.metadata || {});
  } catch {
    metadata = {};
  }

  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    subtitle: work.subtitle || undefined,
    workType: work.work_type,
    year: work.year,
    date: work.date,
    archivalDate: work.archival_date || '',
    featuredOnHome: Boolean(work.featured_on_home),
    homeLayoutWeight: work.home_layout_weight,
    coverImage: work.cover_image,
    coverImageCaption: work.cover_image_caption || undefined,
    coverImageAlt: work.cover_image_alt || undefined,
    excerpt: work.excerpt,
    bodyBlocks,
    metadata,
    relatedStudyIds: workStudiesMap.get(work.id) || [],
    relatedEntryIds: workEntriesMap.get(work.id) || [],
    visibility: (work.visibility || 'published') as 'published' | 'draft' | 'hidden',
    order: work.order_index,
    createdAt: work.created_at,
    updatedAt: work.updated_at,
  };
}

/**
 * Normalizes optional/nullable text inputs across Worker and D1 boundaries.
 * Enforces explicit semantics:
 * 1. undefined: omitted field -> returns existingValue on PUT (isUpdate=true), or null on POST.
 * 2. null or empty string ("" / whitespace): author cleared field -> returns SQL null.
 * 3. non-empty text: trimmed text -> returns trimmed text.
 */
function normalizeNullableText(
  value: unknown,
  existingValue: string | null = null,
  isUpdate: boolean = false
): string | null {
  if (value === undefined) {
    return isUpdate ? (existingValue ?? null) : null;
  }
  if (value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Fast-path OPTIONS for CORS preflight on API routes
    if (method === 'OPTIONS' && pathname.startsWith('/api/')) {
      return handleCorsOptions();
    }

    try {
      // 1. GET /api/archive (Aggregate for initial hydration)
      if (pathname === '/api/archive' && method === 'GET') {
        const [
          collectionsResult,
          studiesResult,
          threadsResult,
          entriesResult,
          entryThreadsResult,
          entryRelatedStudiesResult,
          entryRelatedEntriesResult,
          worksResult,
          workStudiesResult,
          workEntriesResult,
        ] = await Promise.all([
          env.DB.prepare('SELECT * FROM collections ORDER BY order_index ASC, created_at ASC').all<CollectionRecord>(),
          env.DB.prepare('SELECT * FROM studies ORDER BY order_index ASC, created_at ASC').all<StudyRecord>(),
          env.DB.prepare('SELECT * FROM threads ORDER BY order_index ASC, created_at ASC').all<ThreadRecord>(),
          env.DB.prepare('SELECT * FROM entries ORDER BY order_index ASC, archival_date DESC').all<EntryRecord>(),
          env.DB.prepare('SELECT entry_id, thread_id FROM entry_threads').all<EntryThreadRecord>(),
          env.DB.prepare('SELECT entry_id, study_id FROM entry_related_studies').all<EntryRelatedStudyRecord>(),
          env.DB.prepare('SELECT entry_id, related_entry_id FROM entry_related_entries').all<EntryRelatedEntryRecord>(),
          env.DB.prepare('SELECT * FROM curated_works ORDER BY archival_date DESC, created_at DESC').all<CuratedWorkRecord>(),
          env.DB.prepare('SELECT work_id, study_id FROM curated_work_related_studies').all<CuratedWorkRelatedStudyRecord>(),
          env.DB.prepare('SELECT work_id, entry_id FROM curated_work_related_entries').all<CuratedWorkRelatedEntryRecord>(),
        ]);

        const studyCollectionMap = new Map<string, string>();
        for (const s of studiesResult.results || []) {
          studyCollectionMap.set(s.id, s.collection_id);
        }

        const entryThreadsMap = new Map<string, string[]>();
        for (const et of entryThreadsResult.results || []) {
          const list = entryThreadsMap.get(et.entry_id) || [];
          list.push(et.thread_id);
          entryThreadsMap.set(et.entry_id, list);
        }

        const entryRelatedStudiesMap = new Map<string, string[]>();
        for (const ers of entryRelatedStudiesResult.results || []) {
          const list = entryRelatedStudiesMap.get(ers.entry_id) || [];
          list.push(ers.study_id);
          entryRelatedStudiesMap.set(ers.entry_id, list);
        }

        const entryRelatedEntriesMap = new Map<string, string[]>();
        for (const ere of entryRelatedEntriesResult.results || []) {
          const list = entryRelatedEntriesMap.get(ere.entry_id) || [];
          list.push(ere.related_entry_id);
          entryRelatedEntriesMap.set(ere.entry_id, list);
        }

        const hydratedEntries = (entriesResult.results || []).map((e) =>
          hydrateEntry(e, studyCollectionMap, entryThreadsMap, entryRelatedStudiesMap, entryRelatedEntriesMap)
        );

        const hydratedThreads = (threadsResult.results || []).map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          description: t.description || undefined,
          order: t.order_index,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));

        const workStudiesMap = new Map<string, string[]>();
        for (const ws of workStudiesResult.results || []) {
          const list = workStudiesMap.get(ws.work_id) || [];
          list.push(ws.study_id);
          workStudiesMap.set(ws.work_id, list);
        }

        const workEntriesMap = new Map<string, string[]>();
        for (const we of workEntriesResult.results || []) {
          const list = workEntriesMap.get(we.work_id) || [];
          list.push(we.entry_id);
          workEntriesMap.set(we.work_id, list);
        }

        const hydratedWorks = (worksResult.results || []).map((w) =>
          hydrateCuratedWork(w, workStudiesMap, workEntriesMap)
        );

        return jsonResponse({
          success: true,
          data: {
            collections: collectionsResult.results || [],
            studies: studiesResult.results || [],
            threads: hydratedThreads,
            entries: hydratedEntries,
            curatedWorks: hydratedWorks,
          },
        });
      }

      // 2. /api/collections
      if (pathname === '/api/collections') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT * FROM collections ORDER BY order_index ASC, created_at ASC'
          ).all<CollectionRecord>();

          return jsonResponse({
            success: true,
            data: results || [],
          });
        }

        if (method === 'POST') {
          const body = (await request.json()) as Partial<CollectionRecord>;
          const id = body.id || `col-${Date.now()}`;
          const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `col-${Date.now()}`;
          const title = body.title?.trim();

          if (!title) {
            return errorResponse('Collection title is required', 400);
          }

          const order_index = typeof body.order_index === 'number' ? body.order_index : 0;
          const now = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO collections (id, slug, title, subtitle, description, period, location_context, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            slug,
            title,
            body.subtitle || null,
            body.description || null,
            body.period || null,
            body.location_context || null,
            order_index,
            now,
            now
          ).run();

          const { results } = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ?'
          ).bind(id).all<CollectionRecord>();

          return jsonResponse(
            {
              success: true,
              data: results?.[0] || null,
            },
            201
          );
        }
      }

      // 3. /api/collections/:id
      const collectionMatch = pathname.match(/^\/api\/collections\/([^/]+)$/);
      if (collectionMatch) {
        const id = decodeURIComponent(collectionMatch[1]);

        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ? OR slug = ?'
          ).bind(id, id).all<CollectionRecord>();

          if (!results || results.length === 0) {
            return errorResponse('Collection not found', 404);
          }

          return jsonResponse({
            success: true,
            data: results[0],
          });
        }

        if (method === 'PUT') {
          const body = (await request.json()) as Partial<CollectionRecord>;
          const title = body.title?.trim();

          if (!title) {
            return errorResponse('Collection title is required', 400);
          }

          const now = new Date().toISOString();

          const result = await env.DB.prepare(
            `UPDATE collections
             SET title = ?,
                 subtitle = COALESCE(?, subtitle),
                 description = COALESCE(?, description),
                 period = COALESCE(?, period),
                 location_context = COALESCE(?, location_context),
                 order_index = COALESCE(?, order_index),
                 updated_at = ?
             WHERE id = ?`
          ).bind(
            title,
            body.subtitle ?? null,
            body.description ?? null,
            body.period ?? null,
            body.location_context ?? null,
            body.order_index ?? null,
            now,
            id
          ).run();

          if (result.meta?.changes === 0) {
            return errorResponse('Collection not found', 404);
          }

          const { results } = await env.DB.prepare(
            'SELECT * FROM collections WHERE id = ?'
          ).bind(id).all<CollectionRecord>();

          return jsonResponse({
            success: true,
            data: results?.[0] || null,
          });
        }

        if (method === 'DELETE') {
          const countCheck = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM studies WHERE collection_id = ?'
          ).bind(id).first<{ count: number }>();

          if (countCheck && countCheck.count > 0) {
            return errorResponse(
              `Cannot delete collection: ${countCheck.count} study/studies belong to this collection. Move or delete them first.`,
              409
            );
          }

          const result = await env.DB.prepare(
            'DELETE FROM collections WHERE id = ?'
          ).bind(id).run();

          if (result.meta?.changes === 0) {
            return errorResponse('Collection not found', 404);
          }

          return jsonResponse({
            success: true,
            message: 'Collection deleted successfully',
            id,
          });
        }
      }

      // 4. /api/studies
      if (pathname === '/api/studies') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT * FROM studies ORDER BY order_index ASC, created_at ASC'
          ).all<StudyRecord>();

          return jsonResponse({
            success: true,
            data: results || [],
          });
        }

        if (method === 'POST') {
          const body = (await request.json()) as Partial<StudyRecord>;
          const id = body.id || `std-${Date.now()}`;
          const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `std-${Date.now()}`;
          const title = body.title?.trim();
          const collection_id = body.collection_id?.trim();

          if (!title) {
            return errorResponse('Study title is required', 400);
          }
          if (!collection_id) {
            return errorResponse('Valid collection_id is required', 400);
          }

          const collectionExists = await env.DB.prepare(
            'SELECT id FROM collections WHERE id = ?'
          ).bind(collection_id).first<{ id: string }>();

          if (!collectionExists) {
            return errorResponse(`Referenced collection '${collection_id}' does not exist`, 400);
          }

          const order_index = typeof body.order_index === 'number' ? body.order_index : 0;
          const now = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO studies (id, slug, collection_id, title, subtitle, description, archival_date, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            slug,
            collection_id,
            title,
            body.subtitle || null,
            body.description || null,
            body.archival_date || null,
            order_index,
            now,
            now
          ).run();

          const { results } = await env.DB.prepare(
            'SELECT * FROM studies WHERE id = ?'
          ).bind(id).all<StudyRecord>();

          return jsonResponse(
            {
              success: true,
              data: results?.[0] || null,
            },
            201
          );
        }
      }

      // 5. /api/studies/:id
      const studyMatch = pathname.match(/^\/api\/studies\/([^/]+)$/);
      if (studyMatch) {
        const id = decodeURIComponent(studyMatch[1]);

        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT * FROM studies WHERE id = ? OR slug = ?'
          ).bind(id, id).all<StudyRecord>();

          if (!results || results.length === 0) {
            return errorResponse('Study not found', 404);
          }

          return jsonResponse({
            success: true,
            data: results[0],
          });
        }

        if (method === 'PUT') {
          const body = (await request.json()) as Partial<StudyRecord>;
          const title = body.title?.trim();

          if (!title) {
            return errorResponse('Study title is required', 400);
          }

          if (body.collection_id) {
            const collectionExists = await env.DB.prepare(
              'SELECT id FROM collections WHERE id = ?'
            ).bind(body.collection_id).first<{ id: string }>();

            if (!collectionExists) {
              return errorResponse(`Referenced collection '${body.collection_id}' does not exist`, 400);
            }
          }

          const now = new Date().toISOString();

          const result = await env.DB.prepare(
            `UPDATE studies
             SET title = ?,
                 subtitle = COALESCE(?, subtitle),
                 description = COALESCE(?, description),
                 collection_id = COALESCE(?, collection_id),
                 archival_date = COALESCE(?, archival_date),
                 order_index = COALESCE(?, order_index),
                 updated_at = ?
             WHERE id = ?`
          ).bind(
            title,
            body.subtitle ?? null,
            body.description ?? null,
            body.collection_id ?? null,
            body.archival_date ?? null,
            body.order_index ?? null,
            now,
            id
          ).run();

          if (result.meta?.changes === 0) {
            return errorResponse('Study not found', 404);
          }

          const { results } = await env.DB.prepare(
            'SELECT * FROM studies WHERE id = ?'
          ).bind(id).all<StudyRecord>();

          return jsonResponse({
            success: true,
            data: results?.[0] || null,
          });
        }

        if (method === 'DELETE') {
          // Check if entries reference this study
          const entryCountCheck = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM entries WHERE study_id = ?'
          ).bind(id).first<{ count: number }>();

          if (entryCountCheck && entryCountCheck.count > 0) {
            return errorResponse(
              `Cannot delete study: ${entryCountCheck.count} entry/entries belong to this study. Delete them first.`,
              409
            );
          }

          const result = await env.DB.prepare(
            'DELETE FROM studies WHERE id = ?'
          ).bind(id).run();

          if (result.meta?.changes === 0) {
            return errorResponse('Study not found', 404);
          }

          return jsonResponse({
            success: true,
            message: 'Study deleted successfully',
            id,
          });
        }
      }

      // 6. /api/threads
      if (pathname === '/api/threads') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT * FROM threads ORDER BY order_index ASC, created_at ASC'
          ).all<ThreadRecord>();

          return jsonResponse({
            success: true,
            data: (results || []).map((t) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              description: t.description || undefined,
              order: t.order_index,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            })),
          });
        }

        if (method === 'POST') {
          const body = (await request.json()) as {
            id?: string;
            slug?: string;
            name?: string;
            description?: string;
            order?: number;
          };

          const name = body.name?.trim();
          if (!name) {
            return errorResponse('Thread name is required', 400);
          }

          const id = body.id || `thread-${Date.now()}`;
          const slug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;
          const description = body.description?.trim() || null;
          const order_index = typeof body.order === 'number' ? body.order : 0;
          const now = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO threads (id, slug, name, description, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(id, slug, name, description, order_index, now, now).run();

          const created = await env.DB.prepare(
            'SELECT * FROM threads WHERE id = ?'
          ).bind(id).first<ThreadRecord>();

          return jsonResponse(
            {
              success: true,
              data: created
                ? {
                    id: created.id,
                    slug: created.slug,
                    name: created.name,
                    description: created.description || undefined,
                    order: created.order_index,
                    createdAt: created.created_at,
                    updatedAt: created.updated_at,
                  }
                : null,
            },
            201
          );
        }
      }

      // 7. /api/threads/:id
      const threadMatch = pathname.match(/^\/api\/threads\/([^/]+)$/);
      if (threadMatch) {
        const id = decodeURIComponent(threadMatch[1]);

        if (method === 'GET') {
          const thread = await env.DB.prepare(
            'SELECT * FROM threads WHERE id = ? OR slug = ?'
          ).bind(id, id).first<ThreadRecord>();

          if (!thread) {
            return errorResponse('Thread not found', 404);
          }

          return jsonResponse({
            success: true,
            data: {
              id: thread.id,
              slug: thread.slug,
              name: thread.name,
              description: thread.description || undefined,
              order: thread.order_index,
              createdAt: thread.created_at,
              updatedAt: thread.updated_at,
            },
          });
        }

        if (method === 'PUT') {
          const body = (await request.json()) as {
            name?: string;
            description?: string;
            order?: number;
          };

          const name = body.name?.trim();
          if (!name) {
            return errorResponse('Thread name is required', 400);
          }

          const now = new Date().toISOString();
          const result = await env.DB.prepare(
            `UPDATE threads
             SET name = ?,
                 description = COALESCE(?, description),
                 order_index = COALESCE(?, order_index),
                 updated_at = ?
             WHERE id = ?`
          ).bind(
            name,
            body.description ?? null,
            typeof body.order === 'number' ? body.order : null,
            now,
            id
          ).run();

          if (result.meta?.changes === 0) {
            return errorResponse('Thread not found', 404);
          }

          const updated = await env.DB.prepare(
            'SELECT * FROM threads WHERE id = ?'
          ).bind(id).first<ThreadRecord>();

          return jsonResponse({
            success: true,
            data: updated
              ? {
                  id: updated.id,
                  slug: updated.slug,
                  name: updated.name,
                  description: updated.description || undefined,
                  order: updated.order_index,
                  createdAt: updated.created_at,
                  updatedAt: updated.updated_at,
                }
              : null,
          });
        }

        if (method === 'DELETE') {
          // Explicitly delete cascade associations
          await env.DB.prepare('DELETE FROM entry_threads WHERE thread_id = ?').bind(id).run();
          const result = await env.DB.prepare('DELETE FROM threads WHERE id = ?').bind(id).run();

          if (result.meta?.changes === 0) {
            return errorResponse('Thread not found', 404);
          }

          return jsonResponse({
            success: true,
            message: 'Thread deleted successfully',
            id,
          });
        }
      }

      // 8. /api/entries
      if (pathname === '/api/entries') {
        if (method === 'GET') {
          const studyFilter = url.searchParams.get('studyId');
          const collectionFilter = url.searchParams.get('collectionId');
          const threadFilter = url.searchParams.get('threadId');
          const visibilityFilter = url.searchParams.get('visibility');
          const featuredParam = url.searchParams.get('featured');

          const [entriesResult, studiesResult, entryThreadsResult, entryRelatedStudiesResult, entryRelatedEntriesResult] =
            await Promise.all([
              env.DB.prepare('SELECT * FROM entries ORDER BY order_index ASC, archival_date DESC').all<EntryRecord>(),
              env.DB.prepare('SELECT id, collection_id FROM studies').all<{ id: string; collection_id: string }>(),
              env.DB.prepare('SELECT entry_id, thread_id FROM entry_threads').all<EntryThreadRecord>(),
              env.DB.prepare('SELECT entry_id, study_id FROM entry_related_studies').all<EntryRelatedStudyRecord>(),
              env.DB.prepare('SELECT entry_id, related_entry_id FROM entry_related_entries').all<EntryRelatedEntryRecord>(),
            ]);

          const studyCollectionMap = new Map<string, string>();
          for (const s of studiesResult.results || []) {
            studyCollectionMap.set(s.id, s.collection_id);
          }

          const entryThreadsMap = new Map<string, string[]>();
          for (const et of entryThreadsResult.results || []) {
            const list = entryThreadsMap.get(et.entry_id) || [];
            list.push(et.thread_id);
            entryThreadsMap.set(et.entry_id, list);
          }

          const entryRelatedStudiesMap = new Map<string, string[]>();
          for (const ers of entryRelatedStudiesResult.results || []) {
            const list = entryRelatedStudiesMap.get(ers.entry_id) || [];
            list.push(ers.study_id);
            entryRelatedStudiesMap.set(ers.entry_id, list);
          }

          const entryRelatedEntriesMap = new Map<string, string[]>();
          for (const ere of entryRelatedEntriesResult.results || []) {
            const list = entryRelatedEntriesMap.get(ere.entry_id) || [];
            list.push(ere.related_entry_id);
            entryRelatedEntriesMap.set(ere.entry_id, list);
          }

          let list = (entriesResult.results || []).map((e) =>
            hydrateEntry(e, studyCollectionMap, entryThreadsMap, entryRelatedStudiesMap, entryRelatedEntriesMap)
          );

          if (studyFilter) {
            list = list.filter((e) => e.studyId === studyFilter);
          }
          if (collectionFilter) {
            list = list.filter((e) => e.collectionId === collectionFilter);
          }
          if (threadFilter) {
            list = list.filter((e) => e.threadIds.includes(threadFilter));
          }
          if (visibilityFilter) {
            list = list.filter((e) => e.visibility === visibilityFilter);
          }
          if (featuredParam !== null) {
            const isFeatured = featuredParam === 'true' || featuredParam === '1';
            list = list.filter((e) => Boolean(e.featuredOnHome) === isFeatured);
          }

          return jsonResponse({
            success: true,
            data: list,
          });
        }

        if (method === 'POST') {
          const body = (await request.json()) as {
            id?: string;
            slug?: string;
            entryNumber?: string;
            studyId?: string | null;
            title?: string;
            subtitle?: string | null;
            ruiRevision?: string | null;
            medium?: string | null;
            summary?: string | null;
            excerpt?: string | null;
            location?: string | null;
            createdDate?: string;
            displayDate?: string | null;
            publishedDate?: string | null;
            lastModifiedDate?: string | null;
            featuredOnHome?: boolean | number;
            homeLayoutWeight?: string | null;
            coverImage?: string | null;
            coverImageCaption?: string | null;
            coverImageAlt?: string | null;
            blocks?: unknown[];
            metadata?: Record<string, string> | null;
            threadIds?: string[];
            relatedStudyIds?: string[];
            relatedEntryIds?: string[];
            visibility?: string;
            order?: number;
          };

          const title = body.title?.trim();
          if (!title) {
            return errorResponse('Entry title is required', 400);
          }

          const studyId = body.studyId?.trim() || null;
          let studyCollectionId = '';
          if (studyId) {
            const study = await env.DB.prepare(
              'SELECT id, collection_id FROM studies WHERE id = ?'
            ).bind(studyId).first<{ id: string; collection_id: string }>();

            if (!study) {
              return errorResponse(`Referenced study '${studyId}' does not exist`, 400);
            }
            studyCollectionId = study.collection_id;
          }

          const id = body.id || `entry-${Date.now()}`;
          const entryNumber = body.entryNumber || '001';
          const slug =
            body.slug ||
            `entry-${entryNumber}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}` ||
            id;
          const ruiRevision = body.ruiRevision !== undefined ? body.ruiRevision : 'REV 00';
          const medium = body.medium?.trim() || null;
          const subtitle = body.subtitle?.trim() || null;
          const summary = body.summary || '';
          const excerpt = body.excerpt || null;
          const location = body.location || '';
          const now = new Date().toISOString();
          const archivalDate = body.createdDate || now.slice(0, 10).replace(/-/g, '.');
          const displayDate = body.displayDate || null;
          const publishedDate = body.publishedDate || archivalDate;
          const lastModifiedDate = body.lastModifiedDate || archivalDate;
          const featuredOnHome = body.featuredOnHome ? 1 : 0;
          const homeLayoutWeight = body.homeLayoutWeight || 'standard';
          const coverImage = body.coverImage?.trim() || null;
          const coverImageCaption = body.coverImageCaption?.trim() || null;
          const coverImageAlt = body.coverImageAlt?.trim() || null;
          const blocksJson = JSON.stringify(body.blocks || []);
          const metadataJson = JSON.stringify(body.metadata || {});
          const visibility = body.visibility || 'published';
          const order_index = typeof body.order === 'number' ? body.order : 0;

          const batchStatements: D1PreparedStatement[] = [
            env.DB.prepare(
              `INSERT INTO entries (
                id, slug, entry_number, study_id, title, subtitle, rui_revision,
                medium, summary, excerpt, location, archival_date, display_date,
                published_date, last_modified_date, featured_on_home, home_layout_weight,
                cover_image, cover_image_caption, cover_image_alt, blocks, metadata,
                visibility, order_index, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              id,
              slug,
              entryNumber,
              studyId,
              title,
              subtitle,
              ruiRevision,
              medium,
              summary,
              excerpt,
              location,
              archivalDate,
              displayDate,
              publishedDate,
              lastModifiedDate,
              featuredOnHome,
              homeLayoutWeight,
              coverImage,
              coverImageCaption,
              coverImageAlt,
              blocksJson,
              metadataJson,
              visibility,
              order_index,
              now,
              now
            ),
          ];

          if (Array.isArray(body.threadIds)) {
            for (const tId of body.threadIds) {
              if (tId) {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO entry_threads (entry_id, thread_id, created_at) VALUES (?, ?, ?)'
                  ).bind(id, tId, now)
                );
              }
            }
          }

          if (Array.isArray(body.relatedStudyIds)) {
            for (const sId of body.relatedStudyIds) {
              if (sId) {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO entry_related_studies (entry_id, study_id, created_at) VALUES (?, ?, ?)'
                  ).bind(id, sId, now)
                );
              }
            }
          }

          if (Array.isArray(body.relatedEntryIds)) {
            for (const reId of body.relatedEntryIds) {
              if (reId) {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO entry_related_entries (entry_id, related_entry_id, created_at) VALUES (?, ?, ?)'
                  ).bind(id, reId, now)
                );
              }
            }
          }

          await env.DB.batch(batchStatements);

          const studyCollectionMap = new Map<string, string>();
          if (studyId && studyCollectionId) {
            studyCollectionMap.set(studyId, studyCollectionId);
          }
          const entryThreadsMap = new Map<string, string[]>([[id, body.threadIds || []]]);
          const entryRelatedStudiesMap = new Map<string, string[]>([[id, body.relatedStudyIds || []]]);
          const entryRelatedEntriesMap = new Map<string, string[]>([[id, body.relatedEntryIds || []]]);

          const createdEntry = await env.DB.prepare(
            'SELECT * FROM entries WHERE id = ?'
          ).bind(id).first<EntryRecord>();

          if (!createdEntry) {
            return errorResponse('Failed to retrieve created entry', 500);
          }

          return jsonResponse(
            {
              success: true,
              data: hydrateEntry(createdEntry, studyCollectionMap, entryThreadsMap, entryRelatedStudiesMap, entryRelatedEntriesMap),
            },
            201
          );
        }
      }

      // 9. /api/entries/:id
      const entryMatch = pathname.match(/^\/api\/entries\/([^/]+)$/);
      if (entryMatch) {
        const id = decodeURIComponent(entryMatch[1]);

        if (method === 'GET') {
          const entry = await env.DB.prepare(
            'SELECT * FROM entries WHERE id = ? OR slug = ?'
          ).bind(id, id).first<EntryRecord>();

          if (!entry) {
            return errorResponse('Entry not found', 404);
          }

          const [study, entryThreads, entryRelatedStudies, entryRelatedEntries] = await Promise.all([
            entry.study_id
              ? env.DB.prepare('SELECT collection_id FROM studies WHERE id = ?')
                  .bind(entry.study_id)
                  .first<{ collection_id: string }>()
              : Promise.resolve(null),
            env.DB.prepare('SELECT thread_id FROM entry_threads WHERE entry_id = ?')
              .bind(entry.id)
              .all<{ thread_id: string }>(),
            env.DB.prepare('SELECT study_id FROM entry_related_studies WHERE entry_id = ?')
              .bind(entry.id)
              .all<{ study_id: string }>(),
            env.DB.prepare('SELECT related_entry_id FROM entry_related_entries WHERE entry_id = ?')
              .bind(entry.id)
              .all<{ related_entry_id: string }>(),
          ]);

          const studyCollectionMap = new Map<string, string>();
          if (entry.study_id && study?.collection_id) {
            studyCollectionMap.set(entry.study_id, study.collection_id);
          }
          const entryThreadsMap = new Map<string, string[]>([
            [entry.id, (entryThreads.results || []).map((r) => r.thread_id)],
          ]);
          const entryRelatedStudiesMap = new Map<string, string[]>([
            [entry.id, (entryRelatedStudies.results || []).map((r) => r.study_id)],
          ]);
          const entryRelatedEntriesMap = new Map<string, string[]>([
            [entry.id, (entryRelatedEntries.results || []).map((r) => r.related_entry_id)],
          ]);

          return jsonResponse({
            success: true,
            data: hydrateEntry(entry, studyCollectionMap, entryThreadsMap, entryRelatedStudiesMap, entryRelatedEntriesMap),
          });
        }

        if (method === 'PUT') {
          const existing = await env.DB.prepare(
            'SELECT * FROM entries WHERE id = ? OR slug = ?'
          ).bind(id, id).first<EntryRecord>();

          if (!existing) {
            return errorResponse('Entry not found', 404);
          }

          const entryId = existing.id;
          const body = (await request.json()) as {
            title?: string;
            subtitle?: string | null;
            slug?: string;
            entryNumber?: string;
            studyId?: string | null;
            ruiRevision?: string | null;
            medium?: string | null;
            summary?: string | null;
            excerpt?: string | null;
            location?: string | null;
            createdDate?: string;
            displayDate?: string | null;
            publishedDate?: string | null;
            lastModifiedDate?: string | null;
            featuredOnHome?: boolean | number;
            homeLayoutWeight?: string | null;
            coverImage?: string | null;
            coverImageCaption?: string | null;
            coverImageAlt?: string | null;
            blocks?: unknown[];
            metadata?: Record<string, string> | null;
            threadIds?: string[];
            relatedStudyIds?: string[];
            relatedEntryIds?: string[];
            visibility?: string;
            order?: number;
          };

          if (body.studyId) {
            const studyExists = await env.DB.prepare(
              'SELECT id FROM studies WHERE id = ?'
            ).bind(body.studyId).first<{ id: string }>();

            if (!studyExists) {
              return errorResponse(`Referenced study '${body.studyId}' does not exist`, 400);
            }
          }

          const now = new Date().toISOString();
          const lastModified = body.lastModifiedDate || now.slice(0, 10).replace(/-/g, '.');
          const blocksJson = body.blocks !== undefined ? JSON.stringify(body.blocks) : null;
          const metadataJson = body.metadata !== undefined ? JSON.stringify(body.metadata) : null;
          const updatedMedium =
            body.medium !== undefined
              ? (body.medium ? body.medium.trim() : null)
              : existing.medium;
          const updatedStudyId =
            body.studyId !== undefined
              ? (body.studyId ? body.studyId.trim() : null)
              : existing.study_id;
          const updatedFeatured =
            body.featuredOnHome !== undefined
              ? (body.featuredOnHome ? 1 : 0)
              : existing.featured_on_home;
          const updatedRuiRevision =
            body.ruiRevision !== undefined
              ? (body.ruiRevision ? body.ruiRevision : null)
              : existing.rui_revision;

          const batchStatements: D1PreparedStatement[] = [
            env.DB.prepare(
              `UPDATE entries
               SET title = COALESCE(?, title),
                   subtitle = COALESCE(?, subtitle),
                   slug = COALESCE(?, slug),
                   entry_number = COALESCE(?, entry_number),
                   study_id = ?,
                   rui_revision = ?,
                   medium = ?,
                   summary = COALESCE(?, summary),
                   excerpt = COALESCE(?, excerpt),
                   location = COALESCE(?, location),
                   archival_date = COALESCE(?, archival_date),
                   display_date = COALESCE(?, display_date),
                   published_date = COALESCE(?, published_date),
                   last_modified_date = ?,
                   featured_on_home = ?,
                   home_layout_weight = COALESCE(?, home_layout_weight),
                   cover_image = COALESCE(?, cover_image),
                   cover_image_caption = COALESCE(?, cover_image_caption),
                   cover_image_alt = COALESCE(?, cover_image_alt),
                   blocks = COALESCE(?, blocks),
                   metadata = COALESCE(?, metadata),
                   visibility = COALESCE(?, visibility),
                   order_index = COALESCE(?, order_index),
                   updated_at = ?
               WHERE id = ?`
            ).bind(
              body.title ?? null,
              body.subtitle ?? null,
              body.slug ?? null,
              body.entryNumber ?? null,
              updatedStudyId,
              updatedRuiRevision,
              updatedMedium,
              body.summary ?? null,
              body.excerpt ?? null,
              body.location ?? null,
              body.createdDate ?? null,
              body.displayDate ?? null,
              body.publishedDate ?? null,
              lastModified,
              updatedFeatured,
              body.homeLayoutWeight ?? null,
              body.coverImage ?? null,
              body.coverImageCaption ?? null,
              body.coverImageAlt ?? null,
              blocksJson,
              metadataJson,
              body.visibility ?? null,
              typeof body.order === 'number' ? body.order : null,
              now,
              entryId
            ),
          ];

          if (Array.isArray(body.threadIds)) {
            batchStatements.push(
              env.DB.prepare('DELETE FROM entry_threads WHERE entry_id = ?').bind(entryId)
            );
            for (const tId of body.threadIds) {
              if (tId) {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO entry_threads (entry_id, thread_id, created_at) VALUES (?, ?, ?)'
                  ).bind(entryId, tId, now)
                );
              }
            }
          }

          if (Array.isArray(body.relatedStudyIds)) {
            batchStatements.push(
              env.DB.prepare('DELETE FROM entry_related_studies WHERE entry_id = ?').bind(entryId)
            );
            for (const sId of body.relatedStudyIds) {
              if (sId) {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO entry_related_studies (entry_id, study_id, created_at) VALUES (?, ?, ?)'
                  ).bind(entryId, sId, now)
                );
              }
            }
          }

          if (Array.isArray(body.relatedEntryIds)) {
            batchStatements.push(
              env.DB.prepare('DELETE FROM entry_related_entries WHERE entry_id = ?').bind(entryId)
            );
            for (const reId of body.relatedEntryIds) {
              if (reId) {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO entry_related_entries (entry_id, related_entry_id, created_at) VALUES (?, ?, ?)'
                  ).bind(entryId, reId, now)
                );
              }
            }
          }

          await env.DB.batch(batchStatements);

          const updatedEntry = await env.DB.prepare(
            'SELECT * FROM entries WHERE id = ?'
          ).bind(entryId).first<EntryRecord>();

          if (!updatedEntry) {
            return errorResponse('Failed to retrieve updated entry', 500);
          }

          const [study, entryThreads, entryRelatedStudies, entryRelatedEntries] = await Promise.all([
            updatedEntry.study_id
              ? env.DB.prepare('SELECT collection_id FROM studies WHERE id = ?')
                  .bind(updatedEntry.study_id)
                  .first<{ collection_id: string }>()
              : Promise.resolve(null),
            env.DB.prepare('SELECT thread_id FROM entry_threads WHERE entry_id = ?')
              .bind(entryId)
              .all<{ thread_id: string }>(),
            env.DB.prepare('SELECT study_id FROM entry_related_studies WHERE entry_id = ?')
              .bind(entryId)
              .all<{ study_id: string }>(),
            env.DB.prepare('SELECT related_entry_id FROM entry_related_entries WHERE entry_id = ?')
              .bind(entryId)
              .all<{ related_entry_id: string }>(),
          ]);

          const studyCollectionMap = new Map<string, string>();
          if (updatedEntry.study_id && study?.collection_id) {
            studyCollectionMap.set(updatedEntry.study_id, study.collection_id);
          }
          const entryThreadsMap = new Map<string, string[]>([
            [entryId, (entryThreads.results || []).map((r) => r.thread_id)],
          ]);
          const entryRelatedStudiesMap = new Map<string, string[]>([
            [entryId, (entryRelatedStudies.results || []).map((r) => r.study_id)],
          ]);
          const entryRelatedEntriesMap = new Map<string, string[]>([
            [entryId, (entryRelatedEntries.results || []).map((r) => r.related_entry_id)],
          ]);

          return jsonResponse({
            success: true,
            data: hydrateEntry(updatedEntry, studyCollectionMap, entryThreadsMap, entryRelatedStudiesMap, entryRelatedEntriesMap),
          });
        }

        if (method === 'DELETE') {
          const existing = await env.DB.prepare(
            'SELECT id FROM entries WHERE id = ? OR slug = ?'
          ).bind(id, id).first<{ id: string }>();

          if (!existing) {
            return errorResponse('Entry not found', 404);
          }

          const entryId = existing.id;
          await env.DB.batch([
            env.DB.prepare('DELETE FROM entry_threads WHERE entry_id = ?').bind(entryId),
            env.DB.prepare('DELETE FROM entry_related_studies WHERE entry_id = ?').bind(entryId),
            env.DB.prepare('DELETE FROM entry_related_entries WHERE entry_id = ? OR related_entry_id = ?').bind(entryId, entryId),
            env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(entryId),
          ]);

          return jsonResponse({
            success: true,
            message: 'Entry deleted successfully',
            id: entryId,
          });
        }
      }

      // 10. /api/works
      if (pathname === '/api/works') {
        if (method === 'GET') {
          const featuredParam = url.searchParams.get('featured');
          const visibilityParam = url.searchParams.get('visibility');

          let query = 'SELECT * FROM curated_works WHERE 1=1';
          const params: unknown[] = [];

          if (featuredParam !== null) {
            query += ' AND featured_on_home = ?';
            params.push(featuredParam === 'true' || featuredParam === '1' ? 1 : 0);
          }

          if (visibilityParam) {
            query += ' AND visibility = ?';
            params.push(visibilityParam);
          }

          query += ' ORDER BY archival_date DESC, created_at DESC';

          const [worksResult, workStudiesResult, workEntriesResult] = await Promise.all([
            env.DB.prepare(query).bind(...params).all<CuratedWorkRecord>(),
            env.DB.prepare('SELECT work_id, study_id FROM curated_work_related_studies').all<CuratedWorkRelatedStudyRecord>(),
            env.DB.prepare('SELECT work_id, entry_id FROM curated_work_related_entries').all<CuratedWorkRelatedEntryRecord>(),
          ]);

          const workStudiesMap = new Map<string, string[]>();
          for (const ws of workStudiesResult.results || []) {
            const list = workStudiesMap.get(ws.work_id) || [];
            list.push(ws.study_id);
            workStudiesMap.set(ws.work_id, list);
          }

          const workEntriesMap = new Map<string, string[]>();
          for (const we of workEntriesResult.results || []) {
            const list = workEntriesMap.get(we.work_id) || [];
            list.push(we.entry_id);
            workEntriesMap.set(we.work_id, list);
          }

          const hydratedWorks = (worksResult.results || []).map((w) =>
            hydrateCuratedWork(w, workStudiesMap, workEntriesMap)
          );

          return jsonResponse({
            success: true,
            data: hydratedWorks,
          });
        }

        if (method === 'POST') {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

          if (!body.title || typeof body.title !== 'string') {
            return errorResponse('Missing required field: title');
          }
          if (!body.slug || typeof body.slug !== 'string') {
            return errorResponse('Missing required field: slug');
          }

          const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
          if (!body.archivalDate || typeof body.archivalDate !== 'string' || !ISO_DATE_REGEX.test(body.archivalDate.trim())) {
            return errorResponse('Missing or invalid required field: archivalDate (must be YYYY-MM-DD)');
          }

          const id = ((body.id as string) || `work-${Date.now()}`).trim();
          const slug = body.slug.trim().toLowerCase();
          const title = (body.title as string).trim();
          const subtitle = normalizeNullableText(body.subtitle);
          const workType = String(body.workType || 'Essay');
          const year = String(body.year || new Date().getFullYear().toString());
          const date = String(body.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
          const archivalDate = body.archivalDate.trim();
          const featuredOnHome = body.featuredOnHome ? 1 : 0;
          const homeLayoutWeight = String(body.homeLayoutWeight || 'standard');
          const coverImage = String(body.coverImage || '');
          const coverImageCaption = normalizeNullableText(body.coverImageCaption);
          const coverImageAlt = normalizeNullableText(body.coverImageAlt);
          const excerpt = String(body.excerpt || '');
          const bodyBlocks = JSON.stringify(Array.isArray(body.bodyBlocks) ? body.bodyBlocks : []);
          const metadata = JSON.stringify(body.metadata && typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {});
          const visibility = String(body.visibility || 'published');
          const orderIndex = (typeof body.order === 'number' ? body.order : 0) ?? 0;
          const now = new Date().toISOString();

          // Check if slug or id exists
          const existing = await env.DB.prepare(
            'SELECT id FROM curated_works WHERE id = ? OR slug = ?'
          ).bind(id, slug).first();

          if (existing) {
            return errorResponse(`Curated work with ID '${id}' or slug '${slug}' already exists`, 409);
          }

          const batchStatements: D1PreparedStatement[] = [
            env.DB.prepare(
              `INSERT INTO curated_works (
                id, slug, title, subtitle, work_type, year, date, archival_date, featured_on_home,
                home_layout_weight, cover_image, cover_image_caption, cover_image_alt, excerpt, body_blocks, metadata, visibility, order_index, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              id,
              slug,
              title,
              subtitle,
              workType,
              year,
              date,
              archivalDate,
              featuredOnHome,
              homeLayoutWeight,
              coverImage,
              coverImageCaption,
              coverImageAlt,
              excerpt,
              bodyBlocks,
              metadata,
              visibility,
              orderIndex,
              now,
              now
            ),
          ];

          if (Array.isArray(body.relatedStudyIds)) {
            for (const sId of body.relatedStudyIds) {
              if (sId && typeof sId === 'string') {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO curated_work_related_studies (work_id, study_id, created_at) VALUES (?, ?, ?)'
                  ).bind(id, sId.trim(), now)
                );
              }
            }
          }

          if (Array.isArray(body.relatedEntryIds)) {
            for (const eId of body.relatedEntryIds) {
              if (eId && typeof eId === 'string') {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO curated_work_related_entries (work_id, entry_id, created_at) VALUES (?, ?, ?)'
                  ).bind(id, eId.trim(), now)
                );
              }
            }
          }

          await env.DB.batch(batchStatements);

          const createdWork = await env.DB.prepare(
            'SELECT * FROM curated_works WHERE id = ?'
          ).bind(id).first<CuratedWorkRecord>();

          if (!createdWork) {
            return errorResponse('Failed to retrieve created curated work', 500);
          }

          const workStudiesMap = new Map<string, string[]>([[id, (body.relatedStudyIds as string[]) || []]]);
          const workEntriesMap = new Map<string, string[]>([[id, (body.relatedEntryIds as string[]) || []]]);

          return jsonResponse(
            {
              success: true,
              data: hydrateCuratedWork(createdWork, workStudiesMap, workEntriesMap),
            },
            201
          );
        }
      }

      // 11. /api/works/:id
      const workMatch = pathname.match(/^\/api\/works\/([^/]+)$/);
      if (workMatch) {
        const id = decodeURIComponent(workMatch[1]);

        if (method === 'GET') {
          const work = await env.DB.prepare(
            'SELECT * FROM curated_works WHERE id = ? OR slug = ?'
          ).bind(id, id).first<CuratedWorkRecord>();

          if (!work) {
            return errorResponse('Curated work not found', 404);
          }

          const [studiesResult, entriesResult] = await Promise.all([
            env.DB.prepare('SELECT study_id FROM curated_work_related_studies WHERE work_id = ?')
              .bind(work.id)
              .all<{ study_id: string }>(),
            env.DB.prepare('SELECT entry_id FROM curated_work_related_entries WHERE work_id = ?')
              .bind(work.id)
              .all<{ entry_id: string }>(),
          ]);

          const workStudiesMap = new Map<string, string[]>([
            [work.id, (studiesResult.results || []).map((r) => r.study_id)],
          ]);
          const workEntriesMap = new Map<string, string[]>([
            [work.id, (entriesResult.results || []).map((r) => r.entry_id)],
          ]);

          return jsonResponse({
            success: true,
            data: hydrateCuratedWork(work, workStudiesMap, workEntriesMap),
          });
        }

        if (method === 'PUT') {
          const existing = await env.DB.prepare(
            'SELECT * FROM curated_works WHERE id = ? OR slug = ?'
          ).bind(id, id).first<CuratedWorkRecord>();

          if (!existing) {
            return errorResponse('Curated work not found', 404);
          }

          const workId = existing.id;
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const now = new Date().toISOString();

          const slug = (body.slug !== undefined && body.slug !== null
            ? String(body.slug).trim().toLowerCase()
            : existing.slug) ?? '';

          const title = (body.title !== undefined && body.title !== null
            ? String(body.title).trim()
            : existing.title) ?? '';

          const subtitle = normalizeNullableText(body.subtitle, existing.subtitle ?? null, true);

          const workType = (body.workType !== undefined && body.workType !== null
            ? String(body.workType)
            : existing.work_type) ?? 'Essay';

          const year = (body.year !== undefined && body.year !== null
            ? String(body.year)
            : existing.year) ?? '';

          const date = (body.date !== undefined && body.date !== null
            ? String(body.date)
            : existing.date) ?? '';

          const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
          let archivalDate = existing.archival_date;
          if (body.archivalDate !== undefined && body.archivalDate !== null) {
            const candidate = String(body.archivalDate).trim();
            if (!ISO_DATE_REGEX.test(candidate)) {
              return errorResponse('Invalid field: archivalDate (must be YYYY-MM-DD)');
            }
            archivalDate = candidate;
          }

          const featuredOnHome = (body.featuredOnHome !== undefined && body.featuredOnHome !== null
            ? (body.featuredOnHome ? 1 : 0)
            : existing.featured_on_home) ?? 0;

          const homeLayoutWeight = (body.homeLayoutWeight !== undefined && body.homeLayoutWeight !== null
            ? String(body.homeLayoutWeight)
            : existing.home_layout_weight) ?? 'standard';

          const coverImage = (body.coverImage !== undefined && body.coverImage !== null
            ? String(body.coverImage)
            : existing.cover_image) ?? '';

          const coverImageCaption = normalizeNullableText(body.coverImageCaption, existing.cover_image_caption ?? null, true);

          const coverImageAlt = normalizeNullableText(body.coverImageAlt, existing.cover_image_alt ?? null, true);

          const excerpt = (body.excerpt !== undefined && body.excerpt !== null
            ? String(body.excerpt)
            : existing.excerpt) ?? '';

          const bodyBlocks = (body.bodyBlocks !== undefined && body.bodyBlocks !== null
            ? JSON.stringify(Array.isArray(body.bodyBlocks) ? body.bodyBlocks : [])
            : (existing.body_blocks ?? '[]')) ?? '[]';

          const metadata = (body.metadata !== undefined && body.metadata !== null
            ? JSON.stringify(typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {})
            : (existing.metadata ?? '{}')) ?? '{}';

          const visibility = (body.visibility !== undefined && body.visibility !== null
            ? String(body.visibility)
            : existing.visibility) ?? 'published';

          const orderIndex = (typeof body.order === 'number'
            ? body.order
            : existing.order_index) ?? 0;

          const batchStatements: D1PreparedStatement[] = [
            env.DB.prepare(
              `UPDATE curated_works SET
                slug = ?, title = ?, subtitle = ?, work_type = ?, year = ?, date = ?, archival_date = ?,
                featured_on_home = ?, home_layout_weight = ?, cover_image = ?, cover_image_caption = ?, cover_image_alt = ?, excerpt = ?,
                body_blocks = ?, metadata = ?, visibility = ?, order_index = ?, updated_at = ?
              WHERE id = ?`
            ).bind(
              slug,
              title,
              subtitle,
              workType,
              year,
              date,
              archivalDate,
              featuredOnHome,
              homeLayoutWeight,
              coverImage,
              coverImageCaption,
              coverImageAlt,
              excerpt,
              bodyBlocks,
              metadata,
              visibility,
              orderIndex,
              now,
              workId
            ),
          ];

          if (Array.isArray(body.relatedStudyIds)) {
            batchStatements.push(
              env.DB.prepare('DELETE FROM curated_work_related_studies WHERE work_id = ?').bind(workId)
            );
            for (const sId of body.relatedStudyIds) {
              if (sId && typeof sId === 'string') {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO curated_work_related_studies (work_id, study_id, created_at) VALUES (?, ?, ?)'
                  ).bind(workId, sId.trim(), now)
                );
              }
            }
          }

          if (Array.isArray(body.relatedEntryIds)) {
            batchStatements.push(
              env.DB.prepare('DELETE FROM curated_work_related_entries WHERE work_id = ?').bind(workId)
            );
            for (const eId of body.relatedEntryIds) {
              if (eId && typeof eId === 'string') {
                batchStatements.push(
                  env.DB.prepare(
                    'INSERT OR IGNORE INTO curated_work_related_entries (work_id, entry_id, created_at) VALUES (?, ?, ?)'
                  ).bind(workId, eId.trim(), now)
                );
              }
            }
          }

          await env.DB.batch(batchStatements);

          const updatedWork = await env.DB.prepare(
            'SELECT * FROM curated_works WHERE id = ?'
          ).bind(workId).first<CuratedWorkRecord>();

          if (!updatedWork) {
            return errorResponse('Failed to retrieve updated curated work', 500);
          }

          const [studiesResult, entriesResult] = await Promise.all([
            env.DB.prepare('SELECT study_id FROM curated_work_related_studies WHERE work_id = ?')
              .bind(workId)
              .all<{ study_id: string }>(),
            env.DB.prepare('SELECT entry_id FROM curated_work_related_entries WHERE work_id = ?')
              .bind(workId)
              .all<{ entry_id: string }>(),
          ]);

          const workStudiesMap = new Map<string, string[]>([
            [workId, (studiesResult.results || []).map((r) => r.study_id)],
          ]);
          const workEntriesMap = new Map<string, string[]>([
            [workId, (entriesResult.results || []).map((r) => r.entry_id)],
          ]);

          return jsonResponse({
            success: true,
            data: hydrateCuratedWork(updatedWork, workStudiesMap, workEntriesMap),
          });
        }

        if (method === 'DELETE') {
          const existing = await env.DB.prepare(
            'SELECT id FROM curated_works WHERE id = ? OR slug = ?'
          ).bind(id, id).first<{ id: string }>();

          if (!existing) {
            return errorResponse('Curated work not found', 404);
          }

          const workId = existing.id;
          await env.DB.batch([
            env.DB.prepare('DELETE FROM curated_work_related_studies WHERE work_id = ?').bind(workId),
            env.DB.prepare('DELETE FROM curated_work_related_entries WHERE work_id = ?').bind(workId),
            env.DB.prepare('DELETE FROM curated_works WHERE id = ?').bind(workId),
          ]);

          return jsonResponse({
            success: true,
            message: 'Curated work deleted successfully',
            id: workId,
          });
        }
      }

      // If an /api/ route is unmatched, return a 404 JSON response instead of HTML
      if (pathname.startsWith('/api/')) {
        return errorResponse(`API endpoint '${pathname}' not found`, 404);
      }

      // Fallback for non-API requests (if worker handles them)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response('Not found', { status: 404 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return errorResponse(message, 500);
    }
  },
};
