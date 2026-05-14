import { jsonResponse } from './cors.ts';

export type ApiErrorCode =
  | 'unauthorized'
  | 'invalid_input'
  | 'rate_limited'
  | 'model_loading'
  | 'timeout'
  | 'storage_full'
  | 'method_not_allowed'
  | 'forbidden'
  | 'not_found'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return jsonResponse({ error: err.code, message: err.message, ...err.extra }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('Unhandled error:', err);
  return jsonResponse({ error: 'unknown', message }, { status: 500 });
}
