import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.47.10';

export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AuthedUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    throw new (await import('./errors.ts')).ApiError(401, 'unauthorized', 'Missing bearer token');
  }
  const token = match[1];

  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    throw new (await import('./errors.ts')).ApiError(401, 'unauthorized', 'Invalid or expired session');
  }
  if (!data.user.email) {
    throw new (await import('./errors.ts')).ApiError(401, 'unauthorized', 'User has no email');
  }
  return {
    id: data.user.id,
    email: data.user.email,
    emailConfirmed: !!data.user.email_confirmed_at,
  };
}
