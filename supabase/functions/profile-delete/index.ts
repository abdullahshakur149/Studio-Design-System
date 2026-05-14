import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';
import { ApiError, errorResponse } from '../_shared/errors.ts';

const BUCKETS = ['media-photos', 'media-videos', 'user-uploads'] as const;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return errorResponse(new ApiError(405, 'method_not_allowed', 'Method Not Allowed'));
  }

  try {
    const user = await requireUser(req);
    const admin = adminClient();

    for (const bucket of BUCKETS) {
      const { data: objects, error: listErr } = await admin.storage.from(bucket).list(user.id, {
        limit: 1000,
      });
      if (listErr) {
        console.warn(`list ${bucket}/${user.id} failed:`, listErr.message);
        continue;
      }
      if (!objects || objects.length === 0) continue;
      const paths = objects.map((o) => `${user.id}/${o.name}`);
      const { error: removeErr } = await admin.storage.from(bucket).remove(paths);
      if (removeErr) console.warn(`remove ${bucket} failed:`, removeErr.message);
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) throw new ApiError(500, 'unknown', `Could not delete user: ${deleteErr.message}`);

    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
});
