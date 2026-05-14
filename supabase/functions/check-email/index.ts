import { z } from 'npm:zod@3.24.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { ApiError, errorResponse } from '../_shared/errors.ts';

const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown';
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || now > existing.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT;
}

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return errorResponse(new ApiError(405, 'method_not_allowed', 'Method Not Allowed'));
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'invalid_input', 'Invalid email');
    }

    const isDev = (Deno.env.get('SITE_URL') ?? '').includes('localhost');
    if (!isDev) {
      const ip = getClientIp(req);
      if (isRateLimited(ip)) {
        throw new ApiError(429, 'rate_limited', 'Too many requests');
      }
    }

    const { data, error } = await adminClient().auth.admin.listUsers();
    if (error) throw new ApiError(500, 'unknown', error.message);

    const exists = data.users.some(
      (u) => typeof u.email === 'string' && u.email.toLowerCase() === parsed.data.email,
    );

    return jsonResponse({ exists });
  } catch (err) {
    return errorResponse(err);
  }
});
