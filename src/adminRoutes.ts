import type {
  D1PreparedStatement,
  Env,
  CollectionRecord,
  StudyRecord,
  ThreadRecord,
  EntryRecord,
  EntryThreadRecord,
  EntryRelatedStudyRecord,
  EntryRelatedEntryRecord,
  CuratedWorkRecord,
  CuratedWorkRelatedStudyRecord,
  CuratedWorkRelatedEntryRecord,
} from './worker';
import {
  jsonResponse,
  errorResponse,
  hydrateEntry,
  hydrateCuratedWork,
  normalizeNullableText,
} from './worker';

export async function handleAdminMutationRoutes(
  request: Request,
  env: Env,
  pathname: string,
  method: string
): Promise<Response> {
  // -------------------------------------------------------------------------
  // 1. COLLECTIONS MUTATIONS
  // -------------------------------------------------------------------------

  // POST /api/admin/collections/reorder
  if (pathname === '/api/admin/collections/reorder') {
    if (method !== 'POST') return errorResponse('Method Not Allowed', 405);
    const body = (await request.json()) as { items?: Array<{ id: string; order_index: number }> };
    const items = body.items || [];
    const now = new Date().toISOString();
    const statements = items.map((item) =>
      env.DB.prepare('UPDATE collections SET order_index = ?, updated_at = ? WHERE id = ?')
        .bind(item.order_index, now, item.id)
    );

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({ success: true, count: statements.length });
  }

  // POST /api/admin/collections
  if (pathname === '/api/admin/collections') {
    if (method !== 'POST') return errorResponse('Method Not Allowed', 405);
    const body = (await request.json()) as Partial<CollectionRecord>;
    const id = body.id || `col-${Date.now()}`;
    const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `col-${Date.now()}`;
    const title = body.title?.trim();

    if (!title) {
      return errorResponse('Collection title is required', 400);
    }

    let order_index = typeof body.order_index === 'number' && body.order_index > 0 ? body.order_index : null;
    if (order_index === null) {
      const maxRow = await env.DB.prepare('SELECT MAX(order_index) as max_order FROM collections').first<{ max_order: number | null }>();
      order_index = (maxRow?.max_order ?? 0) + 1;
    }
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

  // PUT /api/admin/collections/:id, DELETE /api/admin/collections/:id
  const collectionMatch = pathname.match(/^\/api\/admin\/collections\/([^/]+)$/);
  if (collectionMatch) {
    const id = decodeURIComponent(collectionMatch[1]);

    if (method === 'PUT') {
      const body = (await request.json()) as Partial<CollectionRecord>;
      const title = body.title !== undefined ? body.title.trim() : null;

      if (body.title !== undefined && !title) {
        return errorResponse('Collection title cannot be empty', 400);
      }

      const now = new Date().toISOString();

      const result = await env.DB.prepare(
        `UPDATE collections
         SET title = COALESCE(?, title),
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

    return errorResponse('Method Not Allowed', 405);
  }

  // -------------------------------------------------------------------------
  // 2. STUDIES MUTATIONS
  // -------------------------------------------------------------------------

  // POST /api/admin/studies
  if (pathname === '/api/admin/studies') {
    if (method !== 'POST') return errorResponse('Method Not Allowed', 405);
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

    const collExists = await env.DB.prepare(
      'SELECT id FROM collections WHERE id = ?'
    ).bind(collection_id).first();

    if (!collExists) {
      return errorResponse(`Collection '${collection_id}' does not exist`, 400);
    }

    let order_index = typeof body.order_index === 'number' ? body.order_index : null;
    if (order_index === null) {
      const maxRow = await env.DB.prepare(
        'SELECT MAX(order_index) as max_order FROM studies WHERE collection_id = ?'
      ).bind(collection_id).first<{ max_order: number | null }>();
      order_index = (maxRow?.max_order ?? 0) + 1;
    }
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

  // PUT /api/admin/studies/:id, DELETE /api/admin/studies/:id
  const studyMatch = pathname.match(/^\/api\/admin\/studies\/([^/]+)$/);
  if (studyMatch) {
    const id = decodeURIComponent(studyMatch[1]);

    if (method === 'PUT') {
      const body = (await request.json()) as Partial<StudyRecord>;
      const title = body.title !== undefined ? body.title.trim() : null;

      if (body.title !== undefined && !title) {
        return errorResponse('Study title cannot be empty', 400);
      }

      if (body.collection_id) {
        const collExists = await env.DB.prepare(
          'SELECT id FROM collections WHERE id = ?'
        ).bind(body.collection_id).first();
        if (!collExists) {
          return errorResponse(`Target collection '${body.collection_id}' does not exist`, 400);
        }
      }

      const now = new Date().toISOString();

      const result = await env.DB.prepare(
        `UPDATE studies
         SET collection_id = COALESCE(?, collection_id),
             title = COALESCE(?, title),
             subtitle = COALESCE(?, subtitle),
             description = COALESCE(?, description),
             archival_date = COALESCE(?, archival_date),
             order_index = COALESCE(?, order_index),
             updated_at = ?
         WHERE id = ?`
      ).bind(
        body.collection_id || null,
        title,
        body.subtitle ?? null,
        body.description ?? null,
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
      const countCheck = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM entries WHERE study_id = ?'
      ).bind(id).first<{ count: number }>();

      if (countCheck && countCheck.count > 0) {
        return errorResponse(
          `Cannot delete study: ${countCheck.count} entry/entries are assigned to this study. Reassign or delete them first.`,
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

    return errorResponse('Method Not Allowed', 405);
  }

  // -------------------------------------------------------------------------
  // 3. THREADS MUTATIONS
  // -------------------------------------------------------------------------

  // POST /api/admin/threads
  if (pathname === '/api/admin/threads') {
    if (method !== 'POST') return errorResponse('Method Not Allowed', 405);
    const body = (await request.json()) as Partial<ThreadRecord>;
    const id = body.id || `thr-${Date.now()}`;
    const name = body.name?.trim();
    const slug = body.slug || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `thr-${Date.now()}`;

    if (!name) {
      return errorResponse('Thread name is required', 400);
    }

    let order_index = typeof body.order_index === 'number' ? body.order_index : null;
    if (order_index === null) {
      const maxRow = await env.DB.prepare('SELECT MAX(order_index) as max_order FROM threads').first<{ max_order: number | null }>();
      order_index = (maxRow?.max_order ?? 0) + 1;
    }
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO threads (id, slug, name, description, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      slug,
      name,
      body.description || null,
      order_index,
      now,
      now
    ).run();

    const { results } = await env.DB.prepare(
      'SELECT * FROM threads WHERE id = ?'
    ).bind(id).all<ThreadRecord>();

    const row = results?.[0];
    return jsonResponse(
      {
        success: true,
        data: row
          ? {
              id: row.id,
              slug: row.slug,
              name: row.name,
              description: row.description || undefined,
              order: row.order_index,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }
          : null,
      },
      201
    );
  }

  // PUT /api/admin/threads/:id, DELETE /api/admin/threads/:id
  const threadMatch = pathname.match(/^\/api\/admin\/threads\/([^/]+)$/);
  if (threadMatch) {
    const id = decodeURIComponent(threadMatch[1]);

    if (method === 'PUT') {
      const body = (await request.json()) as Partial<ThreadRecord>;
      const name = body.name !== undefined ? body.name.trim() : null;

      if (body.name !== undefined && !name) {
        return errorResponse('Thread name cannot be empty', 400);
      }

      const now = new Date().toISOString();

      const result = await env.DB.prepare(
        `UPDATE threads
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             order_index = COALESCE(?, order_index),
             updated_at = ?
         WHERE id = ?`
      ).bind(
        name,
        body.description ?? null,
        body.order_index ?? null,
        now,
        id
      ).run();

      if (result.meta?.changes === 0) {
        return errorResponse('Thread not found', 404);
      }

      const { results } = await env.DB.prepare(
        'SELECT * FROM threads WHERE id = ?'
      ).bind(id).all<ThreadRecord>();

      const row = results?.[0];
      return jsonResponse({
        success: true,
        data: row
          ? {
              id: row.id,
              slug: row.slug,
              name: row.name,
              description: row.description || undefined,
              order: row.order_index,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }
          : null,
      });
    }

    if (method === 'DELETE') {
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

    return errorResponse('Method Not Allowed', 405);
  }

  // -------------------------------------------------------------------------
  // 4. ENTRIES MUTATIONS
  // -------------------------------------------------------------------------

  // POST /api/admin/entries
  if (pathname === '/api/admin/entries') {
    if (method !== 'POST') return errorResponse('Method Not Allowed', 405);

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
        batchStatements.push(
          env.DB.prepare('INSERT OR IGNORE INTO entry_threads (entry_id, thread_id) VALUES (?, ?)').bind(id, tId)
        );
      }
    }

    if (Array.isArray(body.relatedStudyIds)) {
      for (const sId of body.relatedStudyIds) {
        batchStatements.push(
          env.DB.prepare('INSERT OR IGNORE INTO entry_related_studies (entry_id, study_id) VALUES (?, ?)').bind(id, sId)
        );
      }
    }

    if (Array.isArray(body.relatedEntryIds)) {
      for (const rId of body.relatedEntryIds) {
        batchStatements.push(
          env.DB.prepare('INSERT OR IGNORE INTO entry_related_entries (entry_id, related_entry_id) VALUES (?, ?)').bind(id, rId)
        );
      }
    }

    await env.DB.batch(batchStatements);

    const insertedEntry = await env.DB.prepare('SELECT * FROM entries WHERE id = ?').bind(id).first<EntryRecord>();

    if (!insertedEntry) {
      return errorResponse('Failed to verify newly created entry', 500);
    }

    const studyMap = new Map<string, string>();
    if (studyId && studyCollectionId) {
      studyMap.set(studyId, studyCollectionId);
    }

    const threadsMap = new Map<string, string[]>();
    threadsMap.set(id, body.threadIds || []);

    const relStudiesMap = new Map<string, string[]>();
    relStudiesMap.set(id, body.relatedStudyIds || []);

    const relEntriesMap = new Map<string, string[]>();
    relEntriesMap.set(id, body.relatedEntryIds || []);

    const hydrated = hydrateEntry(insertedEntry, studyMap, threadsMap, relStudiesMap, relEntriesMap);

    return jsonResponse(
      {
        success: true,
        data: hydrated,
      },
      201
    );
  }

  // PUT /api/admin/entries/:id, DELETE /api/admin/entries/:id
  const entryMatch = pathname.match(/^\/api\/admin\/entries\/([^/]+)$/);
  if (entryMatch) {
    const id = decodeURIComponent(entryMatch[1]);

    if (method === 'PUT') {
      const existingEntry = await env.DB.prepare('SELECT * FROM entries WHERE id = ?').bind(id).first<EntryRecord>();
      if (!existingEntry) {
        return errorResponse('Entry not found', 404);
      }

      const body = (await request.json()) as {
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

      const title = body.title !== undefined ? body.title.trim() : existingEntry.title;
      if (!title) {
        return errorResponse('Entry title cannot be empty', 400);
      }

      let studyId = existingEntry.study_id;
      if (body.studyId !== undefined) {
        const trimmed = body.studyId?.trim() || null;
        if (trimmed) {
          const study = await env.DB.prepare('SELECT id FROM studies WHERE id = ?').bind(trimmed).first();
          if (!study) {
            return errorResponse(`Referenced study '${trimmed}' does not exist`, 400);
          }
          studyId = trimmed;
        } else {
          studyId = null;
        }
      }

      const now = new Date().toISOString();
      const slug = body.slug !== undefined ? body.slug.trim() : existingEntry.slug;
      const entryNumber = body.entryNumber !== undefined ? body.entryNumber.trim() : existingEntry.entry_number;
      const ruiRevision = body.ruiRevision !== undefined ? body.ruiRevision : existingEntry.rui_revision;
      const medium = normalizeNullableText(body.medium, existingEntry.medium, true);
      const subtitle = normalizeNullableText(body.subtitle, existingEntry.subtitle, true);
      const summary = body.summary !== undefined ? body.summary : existingEntry.summary;
      const excerpt = normalizeNullableText(body.excerpt, existingEntry.excerpt, true);
      const location = body.location !== undefined ? body.location : existingEntry.location;
      const archivalDate = body.createdDate !== undefined ? body.createdDate : existingEntry.archival_date;
      const displayDate = normalizeNullableText(body.displayDate, existingEntry.display_date, true);
      const publishedDate = body.publishedDate !== undefined ? body.publishedDate : existingEntry.published_date;
      const lastModifiedDate = now;
      const featuredOnHome =
        body.featuredOnHome !== undefined
          ? (body.featuredOnHome ? 1 : 0)
          : existingEntry.featured_on_home;
      const homeLayoutWeight =
        body.homeLayoutWeight !== undefined ? body.homeLayoutWeight : existingEntry.home_layout_weight;
      const coverImage = normalizeNullableText(body.coverImage, existingEntry.cover_image, true);
      const coverImageCaption = normalizeNullableText(body.coverImageCaption, existingEntry.cover_image_caption, true);
      const coverImageAlt = normalizeNullableText(body.coverImageAlt, existingEntry.cover_image_alt, true);
      const blocksJson = body.blocks !== undefined ? JSON.stringify(body.blocks) : existingEntry.blocks;
      const metadataJson = body.metadata !== undefined ? JSON.stringify(body.metadata) : existingEntry.metadata;
      const visibility = body.visibility !== undefined ? body.visibility : existingEntry.visibility;
      const order_index = typeof body.order === 'number' ? body.order : existingEntry.order_index;

      const batchStatements: D1PreparedStatement[] = [
        env.DB.prepare(
          `UPDATE entries SET
            slug = ?, entry_number = ?, study_id = ?, title = ?, subtitle = ?,
            rui_revision = ?, medium = ?, summary = ?, excerpt = ?, location = ?,
            archival_date = ?, display_date = ?, published_date = ?, last_modified_date = ?,
            featured_on_home = ?, home_layout_weight = ?, cover_image = ?, cover_image_caption = ?,
            cover_image_alt = ?, blocks = ?, metadata = ?, visibility = ?, order_index = ?,
            updated_at = ?
           WHERE id = ?`
        ).bind(
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
          id
        ),
      ];

      if (Array.isArray(body.threadIds)) {
        batchStatements.push(env.DB.prepare('DELETE FROM entry_threads WHERE entry_id = ?').bind(id));
        for (const tId of body.threadIds) {
          batchStatements.push(
            env.DB.prepare('INSERT OR IGNORE INTO entry_threads (entry_id, thread_id) VALUES (?, ?)').bind(id, tId)
          );
        }
      }

      if (Array.isArray(body.relatedStudyIds)) {
        batchStatements.push(env.DB.prepare('DELETE FROM entry_related_studies WHERE entry_id = ?').bind(id));
        for (const sId of body.relatedStudyIds) {
          batchStatements.push(
            env.DB.prepare('INSERT OR IGNORE INTO entry_related_studies (entry_id, study_id) VALUES (?, ?)').bind(id, sId)
          );
        }
      }

      if (Array.isArray(body.relatedEntryIds)) {
        batchStatements.push(env.DB.prepare('DELETE FROM entry_related_entries WHERE entry_id = ?').bind(id));
        for (const rId of body.relatedEntryIds) {
          batchStatements.push(
            env.DB.prepare('INSERT OR IGNORE INTO entry_related_entries (entry_id, related_entry_id) VALUES (?, ?)').bind(id, rId)
          );
        }
      }

      await env.DB.batch(batchStatements);

      const [updatedEntry, studyCollectionMapResult, threadsResult, relStudiesResult, relEntriesResult] =
        await Promise.all([
          env.DB.prepare('SELECT * FROM entries WHERE id = ?').bind(id).first<EntryRecord>(),
          env.DB.prepare('SELECT id, collection_id FROM studies').all<{ id: string; collection_id: string }>(),
          env.DB.prepare('SELECT thread_id FROM entry_threads WHERE entry_id = ?').bind(id).all<{ thread_id: string }>(),
          env.DB.prepare('SELECT study_id FROM entry_related_studies WHERE entry_id = ?').bind(id).all<{ study_id: string }>(),
          env.DB.prepare('SELECT related_entry_id FROM entry_related_entries WHERE entry_id = ?').bind(id).all<{ related_entry_id: string }>(),
        ]);

      if (!updatedEntry) {
        return errorResponse('Failed to reload updated entry', 500);
      }

      const studyMap = new Map<string, string>();
      for (const s of studyCollectionMapResult.results || []) {
        studyMap.set(s.id, s.collection_id);
      }

      const threadsMap = new Map<string, string[]>();
      threadsMap.set(id, (threadsResult.results || []).map((r) => r.thread_id));

      const relStudiesMap = new Map<string, string[]>();
      relStudiesMap.set(id, (relStudiesResult.results || []).map((r) => r.study_id));

      const relEntriesMap = new Map<string, string[]>();
      relEntriesMap.set(id, (relEntriesResult.results || []).map((r) => r.related_entry_id));

      const hydrated = hydrateEntry(updatedEntry, studyMap, threadsMap, relStudiesMap, relEntriesMap);

      return jsonResponse({
        success: true,
        data: hydrated,
      });
    }

    if (method === 'DELETE') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM entry_threads WHERE entry_id = ?').bind(id),
        env.DB.prepare('DELETE FROM entry_related_studies WHERE entry_id = ?').bind(id),
        env.DB.prepare('DELETE FROM entry_related_entries WHERE entry_id = ? OR related_entry_id = ?').bind(id, id),
        env.DB.prepare('DELETE FROM curated_work_related_entries WHERE entry_id = ?').bind(id),
        env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(id),
      ]);

      return jsonResponse({
        success: true,
        message: 'Entry deleted successfully',
        id,
      });
    }

    return errorResponse('Method Not Allowed', 405);
  }

  // -------------------------------------------------------------------------
  // 5. WORKS MUTATIONS
  // -------------------------------------------------------------------------

  // POST /api/admin/works
  if (pathname === '/api/admin/works') {
    if (method !== 'POST') return errorResponse('Method Not Allowed', 405);

    const body = (await request.json()) as {
      id?: string;
      slug?: string;
      title?: string;
      subtitle?: string | null;
      workType?: string;
      year?: string;
      date?: string;
      archivalDate?: string;
      featuredOnHome?: boolean;
      homeLayoutWeight?: string;
      coverImage?: string;
      coverImageCaption?: string | null;
      coverImageAlt?: string | null;
      excerpt?: string;
      bodyBlocks?: unknown[];
      metadata?: Record<string, string>;
      relatedStudyIds?: string[];
      relatedEntryIds?: string[];
      visibility?: 'published' | 'draft' | 'hidden';
      order?: number;
    };

    const title = body.title?.trim();
    if (!title) {
      return errorResponse('Curated work title is required', 400);
    }

    const workType = body.workType?.trim() || 'Visual Work';
    const year = body.year?.trim() || new Date().getFullYear().toString();
    const id = body.id || `work-${Date.now()}`;
    const slug =
      body.slug ||
      `work-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}` ||
      id;
    const now = new Date().toISOString();
    const archivalDate = body.archivalDate || body.date || now.slice(0, 10).replace(/-/g, '.');

    const batchStatements: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO curated_works (
          id, slug, title, subtitle, work_type, year, date, archival_date,
          featured_on_home, home_layout_weight, cover_image, cover_image_caption, cover_image_alt,
          excerpt, body_blocks, metadata, visibility, order_index, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        slug,
        title,
        body.subtitle || null,
        workType,
        year,
        body.date || year,
        archivalDate,
        body.featuredOnHome ? 1 : 0,
        body.homeLayoutWeight || 'standard',
        body.coverImage || '',
        body.coverImageCaption || null,
        body.coverImageAlt || null,
        body.excerpt || '',
        JSON.stringify(body.bodyBlocks || []),
        JSON.stringify(body.metadata || {}),
        body.visibility || 'published',
        typeof body.order === 'number' ? body.order : 0,
        now,
        now
      ),
    ];

    if (Array.isArray(body.relatedStudyIds)) {
      for (const sId of body.relatedStudyIds) {
        batchStatements.push(
          env.DB.prepare('INSERT OR IGNORE INTO curated_work_related_studies (work_id, study_id) VALUES (?, ?)').bind(id, sId)
        );
      }
    }

    if (Array.isArray(body.relatedEntryIds)) {
      for (const eId of body.relatedEntryIds) {
        batchStatements.push(
          env.DB.prepare('INSERT OR IGNORE INTO curated_work_related_entries (work_id, entry_id) VALUES (?, ?)').bind(id, eId)
        );
      }
    }

    await env.DB.batch(batchStatements);

    const insertedWork = await env.DB.prepare('SELECT * FROM curated_works WHERE id = ?').bind(id).first<CuratedWorkRecord>();

    if (!insertedWork) {
      return errorResponse('Failed to verify newly created curated work', 500);
    }

    const workStudiesMap = new Map<string, string[]>();
    workStudiesMap.set(id, body.relatedStudyIds || []);

    const workEntriesMap = new Map<string, string[]>();
    workEntriesMap.set(id, body.relatedEntryIds || []);

    const hydrated = hydrateCuratedWork(insertedWork, workStudiesMap, workEntriesMap);

    return jsonResponse(
      {
        success: true,
        data: hydrated,
      },
      201
    );
  }

  // PUT /api/admin/works/:id, DELETE /api/admin/works/:id
  const workMatch = pathname.match(/^\/api\/admin\/works\/([^/]+)$/);
  if (workMatch) {
    const id = decodeURIComponent(workMatch[1]);

    if (method === 'PUT') {
      const existingWork = await env.DB.prepare('SELECT * FROM curated_works WHERE id = ?').bind(id).first<CuratedWorkRecord>();
      if (!existingWork) {
        return errorResponse('Curated work not found', 404);
      }

      const body = (await request.json()) as {
        slug?: string;
        title?: string;
        subtitle?: string | null;
        workType?: string;
        year?: string;
        date?: string;
        archivalDate?: string;
        featuredOnHome?: boolean;
        homeLayoutWeight?: string;
        coverImage?: string;
        coverImageCaption?: string | null;
        coverImageAlt?: string | null;
        excerpt?: string;
        bodyBlocks?: unknown[];
        metadata?: Record<string, string>;
        relatedStudyIds?: string[];
        relatedEntryIds?: string[];
        visibility?: 'published' | 'draft' | 'hidden';
        order?: number;
      };

      const now = new Date().toISOString();

      const batchStatements: D1PreparedStatement[] = [
        env.DB.prepare(
          `UPDATE curated_works SET
            slug = COALESCE(?, slug),
            title = COALESCE(?, title),
            subtitle = COALESCE(?, subtitle),
            work_type = COALESCE(?, work_type),
            year = COALESCE(?, year),
            date = COALESCE(?, date),
            archival_date = COALESCE(?, archival_date),
            featured_on_home = COALESCE(?, featured_on_home),
            home_layout_weight = COALESCE(?, home_layout_weight),
            cover_image = COALESCE(?, cover_image),
            cover_image_caption = COALESCE(?, cover_image_caption),
            cover_image_alt = COALESCE(?, cover_image_alt),
            excerpt = COALESCE(?, excerpt),
            body_blocks = COALESCE(?, body_blocks),
            metadata = COALESCE(?, metadata),
            visibility = COALESCE(?, visibility),
            order_index = COALESCE(?, order_index),
            updated_at = ?
           WHERE id = ?`
        ).bind(
          body.slug ?? null,
          body.title ?? null,
          body.subtitle !== undefined ? body.subtitle : null,
          body.workType ?? null,
          body.year ?? null,
          body.date ?? null,
          body.archivalDate ?? null,
          body.featuredOnHome !== undefined ? (body.featuredOnHome ? 1 : 0) : null,
          body.homeLayoutWeight ?? null,
          body.coverImage ?? null,
          body.coverImageCaption !== undefined ? body.coverImageCaption : null,
          body.coverImageAlt !== undefined ? body.coverImageAlt : null,
          body.excerpt ?? null,
          body.bodyBlocks !== undefined ? JSON.stringify(body.bodyBlocks) : null,
          body.metadata !== undefined ? JSON.stringify(body.metadata) : null,
          body.visibility ?? null,
          body.order !== undefined ? body.order : null,
          now,
          id
        ),
      ];

      if (Array.isArray(body.relatedStudyIds)) {
        batchStatements.push(env.DB.prepare('DELETE FROM curated_work_related_studies WHERE work_id = ?').bind(id));
        for (const sId of body.relatedStudyIds) {
          batchStatements.push(
            env.DB.prepare('INSERT OR IGNORE INTO curated_work_related_studies (work_id, study_id) VALUES (?, ?)').bind(id, sId)
          );
        }
      }

      if (Array.isArray(body.relatedEntryIds)) {
        batchStatements.push(env.DB.prepare('DELETE FROM curated_work_related_entries WHERE work_id = ?').bind(id));
        for (const eId of body.relatedEntryIds) {
          batchStatements.push(
            env.DB.prepare('INSERT OR IGNORE INTO curated_work_related_entries (work_id, entry_id) VALUES (?, ?)').bind(id, eId)
          );
        }
      }

      await env.DB.batch(batchStatements);

      const [updatedWork, workStudiesResult, workEntriesResult] = await Promise.all([
        env.DB.prepare('SELECT * FROM curated_works WHERE id = ?').bind(id).first<CuratedWorkRecord>(),
        env.DB.prepare('SELECT study_id FROM curated_work_related_studies WHERE work_id = ?').bind(id).all<{ study_id: string }>(),
        env.DB.prepare('SELECT entry_id FROM curated_work_related_entries WHERE work_id = ?').bind(id).all<{ entry_id: string }>(),
      ]);

      if (!updatedWork) {
        return errorResponse('Failed to reload updated curated work', 500);
      }

      const workStudiesMap = new Map<string, string[]>();
      workStudiesMap.set(id, (workStudiesResult.results || []).map((r) => r.study_id));

      const workEntriesMap = new Map<string, string[]>();
      workEntriesMap.set(id, (workEntriesResult.results || []).map((r) => r.entry_id));

      const hydrated = hydrateCuratedWork(updatedWork, workStudiesMap, workEntriesMap);

      return jsonResponse({
        success: true,
        data: hydrated,
      });
    }

    if (method === 'DELETE') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM curated_work_related_studies WHERE work_id = ?').bind(id),
        env.DB.prepare('DELETE FROM curated_work_related_entries WHERE work_id = ?').bind(id),
        env.DB.prepare('DELETE FROM curated_works WHERE id = ?').bind(id),
      ]);

      return jsonResponse({
        success: true,
        message: 'Curated work deleted successfully',
        id,
      });
    }

    return errorResponse('Method Not Allowed', 405);
  }

  // If no admin route matched
  return errorResponse(`Admin endpoint '${pathname}' not found`, 404);
}
