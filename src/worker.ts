/**
 * Cloudflare Worker Backend for ruigallery.xyz
 * Handles /api/* endpoints with Cloudflare D1 integration while delegating
 * non-API static routes and SPAs to static assets.
 */

import { handleAdminMutationRoutes } from './adminRoutes';

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
  CF_ACCESS_AUD?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  ENVIRONMENT?: string;
  ALLOW_DEV_ADMIN_BYPASS?: string | boolean;
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

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cf-Access-Jwt-Assertion',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message, success: false }, status);
}

export function handleCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cf-Access-Jwt-Assertion',
    },
  });
}

// ---------------------------------------------------------------------------
// Cloudflare Access JWT Cryptographic Verification (Zero Trust Perimeter)
// ---------------------------------------------------------------------------

interface JwkKey {
  kid: string;
  kty: string;
  alg: string;
  use?: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: JwkKey[];
}

let cachedJwks: { keys: JwkKey[]; expiresAt: number; teamDomain: string } | null = null;

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeJson<T>(base64Url: string): T {
  const bytes = base64UrlToUint8Array(base64Url);
  const decoded = new TextDecoder().decode(bytes);
  return JSON.parse(decoded) as T;
}

async function getAccessJwks(teamDomain: string): Promise<JwkKey[]> {
  const cleanDomain = teamDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const now = Date.now();
  if (cachedJwks && cachedJwks.teamDomain === cleanDomain && cachedJwks.expiresAt > now) {
    return cachedJwks.keys;
  }

  const certsUrl = `https://${cleanDomain}/cdn-cgi/access/certs`;
  const res = await fetch(certsUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch Cloudflare Access certificates from ${certsUrl} (HTTP ${res.status})`);
  }

  const data = (await res.json()) as JwksResponse;
  if (!data || !Array.isArray(data.keys)) {
    throw new Error(`Invalid JWKS response structure from ${certsUrl}`);
  }

  cachedJwks = {
    keys: data.keys,
    teamDomain: cleanDomain,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes cache
  };

  return data.keys;
}

function extractAccessJwt(request: Request): string | null {
  // 1. Header: Cf-Access-Jwt-Assertion
  const headerJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (headerJwt && headerJwt.trim()) {
    return headerJwt.trim();
  }

  // 2. Cookie: CF_Authorization
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === 'CF_Authorization') {
        const val = rest.join('=');
        if (val) return decodeURIComponent(val.trim());
      }
    }
  }

  // 3. Header: Authorization Bearer <token>
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const val = authHeader.slice(7).trim();
    if (val) return val;
  }

  return null;
}

interface JwtHeader {
  alg: string;
  kid: string;
  typ?: string;
}

interface JwtPayload {
  aud: string | string[];
  email?: string;
  sub?: string;
  iss?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  type?: string;
  identity_nonce?: string;
  custom?: Record<string, unknown>;
}

export async function authenticateAdminRequest(
  request: Request,
  env: Env
): Promise<{ authenticated: boolean; user?: { email?: string; sub?: string }; error?: string }> {
  // Developer bypass option for strictly local development/testing if explicitly enabled
  const isDevMode = env.ENVIRONMENT === 'development' || !env.ENVIRONMENT || env.ENVIRONMENT === 'preview';
  const allowBypass = env.ALLOW_DEV_ADMIN_BYPASS === 'true' || env.ALLOW_DEV_ADMIN_BYPASS === true;

  if (isDevMode && allowBypass) {
    return {
      authenticated: true,
      user: { email: 'dev-admin@rui-local.test', sub: 'dev-admin' },
    };
  }

  const aud = env.CF_ACCESS_AUD?.trim();
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim();

  // Fail-closed: Both AUD and TEAM_DOMAIN must be configured to validate mutations
  if (!aud || !teamDomain) {
    return {
      authenticated: false,
      error: 'Cloudflare Access authentication is not configured on this Worker (CF_ACCESS_AUD and CF_ACCESS_TEAM_DOMAIN required). All mutations are sealed.',
    };
  }

  const token = extractAccessJwt(request);
  if (!token) {
    return {
      authenticated: false,
      error: 'Missing Cloudflare Access assertion token',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      authenticated: false,
      error: 'Malformed JWT token structure',
    };
  }

  try {
    const header = base64UrlDecodeJson<JwtHeader>(parts[0]);
    const payload = base64UrlDecodeJson<JwtPayload>(parts[1]);

    if (header.alg !== 'RS256') {
      return {
        authenticated: false,
        error: `Unsupported JWT algorithm: ${header.alg}`,
      };
    }

    const currentTimeSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTimeSec) {
      return {
        authenticated: false,
        error: 'Cloudflare Access assertion token has expired',
      };
    }
    if (payload.nbf && payload.nbf > currentTimeSec) {
      return {
        authenticated: false,
        error: 'Cloudflare Access assertion token is not yet valid',
      };
    }

    // Validate AUD claim
    const payloadAuds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!payloadAuds.includes(aud)) {
      return {
        authenticated: false,
        error: 'JWT audience claim does not match configured CF_ACCESS_AUD',
      };
    }

    // Validate ISS claim
    const cleanDomain = teamDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const expectedIssuer = `https://${cleanDomain}`;
    if (payload.iss && payload.iss !== expectedIssuer) {
      return {
        authenticated: false,
        error: `JWT issuer claim '${payload.iss}' does not match expected '${expectedIssuer}'`,
      };
    }

    // Fetch and match public key
    const jwks = await getAccessJwks(cleanDomain);
    const keyMatch = jwks.find((k) => k.kid === header.kid);
    if (!keyMatch) {
      return {
        authenticated: false,
        error: `No matching public key found in Cloudflare Access certs for kid '${header.kid}'`,
      };
    }

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      keyMatch,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signatureBytes = base64UrlToUint8Array(parts[2]);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      dataBytes
    );

    if (!isValid) {
      return {
        authenticated: false,
        error: 'Cryptographic signature verification failed for Cloudflare Access token',
      };
    }

    return {
      authenticated: true,
      user: {
        email: payload.email,
        sub: payload.sub,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown JWT verification failure';
    return {
      authenticated: false,
      error: `Access token verification error: ${msg}`,
    };
  }
}

export function hydrateEntry(
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

export function hydrateCuratedWork(
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
export function normalizeNullableText(
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
      // 0. Method barrier: Block any mutating methods on public /api/* routes
      if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          return errorResponse('Method Not Allowed: Mutations must use /api/admin/*', 405);
        }
      }

      // 1. Cloudflare Access Protected Admin API Namespace (/api/admin/*)
      if (pathname.startsWith('/api/admin/')) {
        const auth = await authenticateAdminRequest(request, env);
        if (!auth.authenticated) {
          return errorResponse(`Unauthorized: ${auth.error || 'Authentication required'}`, 401);
        }

        // Session status check endpoint for Admin UI hydration & Cloudflare Access redirect support
        if (pathname === '/api/admin/session' && method === 'GET') {
          const redirectParam = url.searchParams.get('redirect');
          if (redirectParam && (redirectParam.startsWith('/') || redirectParam.startsWith('http'))) {
            return Response.redirect(redirectParam, 302);
          }
          return jsonResponse({
            success: true,
            authenticated: true,
            user: {
              email: auth.user?.email,
              sub: auth.user?.sub,
            },
          });
        }

        return await handleAdminMutationRoutes(request, env, pathname, method);
      }

      // -----------------------------------------------------------------------
      // PUBLIC UNRESTRICTED READ-ONLY API (GET)
      // -----------------------------------------------------------------------

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

      // 2. GET /api/collections
      if (pathname === '/api/collections' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM collections ORDER BY order_index ASC, created_at ASC'
        ).all<CollectionRecord>();

        return jsonResponse({
          success: true,
          data: results || [],
        });
      }

      // 3. GET /api/collections/:id
      const collectionMatch = pathname.match(/^\/api\/collections\/([^/]+)$/);
      if (collectionMatch && method === 'GET') {
        const id = decodeURIComponent(collectionMatch[1]);

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

      // 4. GET /api/studies
      if (pathname === '/api/studies' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM studies ORDER BY order_index ASC, created_at ASC'
        ).all<StudyRecord>();

        return jsonResponse({
          success: true,
          data: results || [],
        });
      }

      // 5. GET /api/studies/:id
      const studyMatch = pathname.match(/^\/api\/studies\/([^/]+)$/);
      if (studyMatch && method === 'GET') {
        const id = decodeURIComponent(studyMatch[1]);

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

      // 6. GET /api/threads
      if (pathname === '/api/threads' && method === 'GET') {
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

      // 7. GET /api/threads/:id
      const threadMatch = pathname.match(/^\/api\/threads\/([^/]+)$/);
      if (threadMatch && method === 'GET') {
        const id = decodeURIComponent(threadMatch[1]);

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
      }

      // 9. GET /api/entries/:id
      const entryMatch = pathname.match(/^\/api\/entries\/([^/]+)$/);
      if (entryMatch && method === 'GET') {
        const id = decodeURIComponent(entryMatch[1]);
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

      // 10. /api/works
      if (pathname === '/api/works') {
        if (method !== 'GET') {
          return errorResponse('Method Not Allowed', 405);
        }

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

      // 11. /api/works/:id
      const workMatch = pathname.match(/^\/api\/works\/([^/]+)$/);
      if (workMatch) {
        if (method !== 'GET') {
          return errorResponse('Method Not Allowed', 405);
        }

        const id = decodeURIComponent(workMatch[1]);
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
