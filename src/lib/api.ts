import { supabase } from './supabase';
import { env } from './env';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

const FUNCTIONS_BASE = `${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;

export async function callFunction<TResponse>(fn: string, opts: ApiOptions = {}): Promise<TResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: env.VITE_SUPABASE_ANON_KEY,
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else {

    headers['Authorization'] = `Bearer ${env.VITE_SUPABASE_ANON_KEY}`;
  }

  const res = await fetch(`${FUNCTIONS_BASE}/${fn}`, {
    method: opts.method ?? 'POST',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok) {
    let code = 'unknown';
    let message = `Request failed with status ${res.status}`;
    try {
      const json: unknown = await res.json();
      if (typeof json === 'object' && json !== null) {
        const j = json as { error?: string; message?: string };
        code = j.error ?? code;
        message = j.message ?? message;
      }
    } catch {

    }
    throw new ApiError(res.status, code, message);
  }

  return res.json() as Promise<TResponse>;
}
