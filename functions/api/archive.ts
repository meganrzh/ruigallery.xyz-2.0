import { Env, CollectionRecord, StudyRecord, jsonResponse, errorResponse } from './types';

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const onRequestGet = async (context: { env: Env }) => {
  try {
    const [collectionsResult, studiesResult] = await Promise.all([
      context.env.DB.prepare('SELECT * FROM collections ORDER BY order_index ASC, created_at ASC').all<CollectionRecord>(),
      context.env.DB.prepare('SELECT * FROM studies ORDER BY order_index ASC, created_at ASC').all<StudyRecord>(),
    ]);

    return jsonResponse({
      success: true,
      data: {
        collections: collectionsResult.results || [],
        studies: studiesResult.results || [],
      },
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'Failed to fetch archive data', 500);
  }
};
