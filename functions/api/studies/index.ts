import { Env, StudyRecord, jsonResponse, errorResponse } from '../types';

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const onRequestGet = async (context: { env: Env }) => {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM studies ORDER BY order_index ASC, created_at ASC'
    ).all<StudyRecord>();

    return jsonResponse({
      success: true,
      data: results || [],
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to fetch studies', 500);
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = await context.request.json() as Partial<StudyRecord>;
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
    const collectionExists = await context.env.DB.prepare(
      'SELECT id FROM collections WHERE id = ?'
    ).bind(collection_id).first<{ id: string }>();

    if (!collectionExists) {
      return errorResponse(`Referenced collection '${collection_id}' does not exist`, 400);
    }

    const order_index = typeof body.order_index === 'number' ? body.order_index : 0;
    const now = new Date().toISOString();

    await context.env.DB.prepare(
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

    const { results } = await context.env.DB.prepare(
      'SELECT * FROM studies WHERE id = ?'
    ).bind(id).all<StudyRecord>();

    return jsonResponse({
      success: true,
      data: results?.[0] || null,
    }, 201);
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to create study', 500);
  }
};
