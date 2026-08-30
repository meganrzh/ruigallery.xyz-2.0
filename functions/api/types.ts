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

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
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

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message, success: false }, status);
}
