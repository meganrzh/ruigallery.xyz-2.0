import { Env, StudyRecord, jsonResponse, errorResponse } from '../types';

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
      'SELECT * FROM studies WHERE id = ? OR slug = ?'
    ).bind(id, id).all<StudyRecord>();

    if (!results || results.length === 0) {
      return errorResponse('Study not found', 404);
    }

    return jsonResponse({
      success: true,
      data: results[0],
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to fetch study', 500);
  }
};

export const onRequestPut = async (context: { params: { id: string }; request: Request; env: Env }) => {
  try {
    const { id } = context.params;
    const body = await context.request.json() as Partial<StudyRecord>;
    const title = body.title?.trim();

    if (!title) {
      return errorResponse('Study title is required', 400);
    }

    if (body.collection_id) {
      const collectionExists = await context.env.DB.prepare(
        'SELECT id FROM collections WHERE id = ?'
      ).bind(body.collection_id).first<{ id: string }>();

      if (!collectionExists) {
        return errorResponse(`Referenced collection '${body.collection_id}' does not exist`, 400);
      }
    }

    const now = new Date().toISOString();

    const result = await context.env.DB.prepare(
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

    const { results } = await context.env.DB.prepare(
      'SELECT * FROM studies WHERE id = ?'
    ).bind(id).all<StudyRecord>();

    return jsonResponse({
      success: true,
      data: results?.[0] || null,
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to update study', 500);
  }
};

export const onRequestDelete = async (context: { params: { id: string }; env: Env }) => {
  try {
    const { id } = context.params;

    const result = await context.env.DB.prepare(
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
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to delete study', 500);
  }
};
