import { Env, CollectionRecord, jsonResponse, errorResponse } from '../types';

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
      'SELECT * FROM collections ORDER BY order_index ASC, created_at ASC'
    ).all<CollectionRecord>();

    return jsonResponse({
      success: true,
      data: results || [],
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to fetch collections', 500);
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = await context.request.json() as Partial<CollectionRecord>;
    const id = body.id || `col-${Date.now()}`;
    const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `col-${Date.now()}`;
    const title = body.title?.trim();

    if (!title) {
      return errorResponse('Collection title is required', 400);
    }

    const order_index = typeof body.order_index === 'number' ? body.order_index : 0;
    const now = new Date().toISOString();

    await context.env.DB.prepare(
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

    const { results } = await context.env.DB.prepare(
      'SELECT * FROM collections WHERE id = ?'
    ).bind(id).all<CollectionRecord>();

    return jsonResponse({
      success: true,
      data: results?.[0] || null,
    }, 201);
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to create collection', 500);
  }
};
