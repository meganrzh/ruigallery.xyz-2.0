import { Env, CollectionRecord, jsonResponse, errorResponse } from '../types';

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const onRequestGet = async (context: { params: { id: string }; env: Env }) => {
  try {
    const { id } = context.params;
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM collections WHERE id = ? OR slug = ?'
    ).bind(id, id).all<CollectionRecord>();

    if (!results || results.length === 0) {
      return errorResponse('Collection not found', 404);
    }

    return jsonResponse({
      success: true,
      data: results[0],
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to fetch collection', 500);
  }
};

export const onRequestPut = async (context: { params: { id: string }; request: Request; env: Env }) => {
  try {
    const { id } = context.params;
    const body = await context.request.json() as Partial<CollectionRecord>;
    const title = body.title?.trim();

    if (!title) {
      return errorResponse('Collection title is required', 400);
    }

    const now = new Date().toISOString();

    const result = await context.env.DB.prepare(
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

    const { results } = await context.env.DB.prepare(
      'SELECT * FROM collections WHERE id = ?'
    ).bind(id).all<CollectionRecord>();

    return jsonResponse({
      success: true,
      data: results?.[0] || null,
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to update collection', 500);
  }
};

export const onRequestDelete = async (context: { params: { id: string }; env: Env }) => {
  try {
    const { id } = context.params;

    // Verify if studies reference this collection
    const countCheck = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM studies WHERE collection_id = ?'
    ).bind(id).first<{ count: number }>();

    if (countCheck && countCheck.count > 0) {
      return errorResponse(
        `Cannot delete collection: ${countCheck.count} study/studies belong to this collection. Move or delete them first.`,
        409
      );
    }

    const result = await context.env.DB.prepare(
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
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to delete collection', 500);
  }
};
