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
      // 1. GET /api/archive
      if (pathname === '/api/archive' && method === 'GET') {
        const [collectionsResult, studiesResult] = await Promise.all([
          env.DB.prepare('SELECT * FROM collections ORDER BY order_index ASC, created_at ASC').all<CollectionRecord>(),
          env.DB.prepare('SELECT * FROM studies ORDER BY order_index ASC, created_at ASC').all<StudyRecord>(),
        ]);

        return jsonResponse({
          success: true,
          data: {
            collections: collectionsResult.results || [],
            studies: studiesResult.results || [],
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
          // Check if studies reference this collection
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

          // Verify collection exists
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

      // If an /api/ route is unmatched, return a 404 JSON response instead of HTML
      if (pathname.startsWith('/api/')) {
        return errorResponse(`API endpoint '${pathname}' not found`, 404);
      }

      // Fallback for non-API requests (if worker handles them)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response('Not found', { status: 404 });
    } catch (err: any) {
      return errorResponse(err?.message || 'Internal Server Error', 500);
    }
  },
};
