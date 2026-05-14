// Video generation pipeline — Deno (Supabase Edge Function).

import { z } from 'npm:zod@3.24.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';
import { callHfModel } from '../_shared/hf.ts';
import { ApiError, errorResponse } from '../_shared/errors.ts';
import { sendFirstCreation } from '../_shared/email.ts';

const VIDEO_STYLES = ['Cinematic', 'Animated', 'Documentary', 'Dramatic'] as const;
const VIDEO_MOTIONS = ['Subtle', 'Medium', 'Dynamic'] as const;

const schema = z.object({
  prompt: z.string().trim().min(15).max(300),
  style: z.enum(VIDEO_STYLES),
  motion: z.enum(VIDEO_MOTIONS),
  sourceImagePath: z.string().optional(),
});

const MODEL = 'cerspense/zeroscope_v2_576w';

const styleSuffix: Record<(typeof VIDEO_STYLES)[number], string> = {
  Cinematic: ', cinematic shot, dramatic lighting, shallow depth of field',
  Animated: ', animated, vibrant colors, stylized',
  Documentary: ', documentary footage, natural lighting, handheld',
  Dramatic: ', dramatic atmosphere, moody lighting, intense',
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return errorResponse(new ApiError(405, 'method_not_allowed', 'Method Not Allowed'));
  }

  const startedAt = Date.now();
  let logId: string | null = null;
  const admin = adminClient();

  try {
    const user = await requireUser(req);
    if (!user.emailConfirmed) {
      throw new ApiError(403, 'forbidden', 'Please verify your email first');
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'invalid_input', parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    const input = parsed.data;

    const { data: logRow, error: logErr } = await admin
      .from('generation_logs')
      .insert({
        user_id: user.id,
        kind: 'video',
        prompt: input.prompt,
        style: input.style,
        motion: input.motion,
        status: 'running',
        provider: 'huggingface',
        model: MODEL,
      })
      .select('id')
      .single();
    if (logErr || !logRow) throw new ApiError(500, 'unknown', logErr?.message ?? 'log insert failed');
    logId = logRow.id;

    const prompt = input.prompt + styleSuffix[input.style];

    // Allow retry-on-loading since we now have a 150s budget instead of 60s
    const { bytes, mimeType } = await callHfModel({
      model: MODEL,
      body: { inputs: prompt, parameters: { num_frames: 24, fps: 8 } },
      budgetMs: 140_000,
      retryOnLoading: true,
    });

    const mediaId = crypto.randomUUID();
    const storagePath = `${user.id}/${mediaId}.mp4`;

    const { error: uploadErr } = await admin.storage
      .from('media-videos')
      .upload(storagePath, bytes, { contentType: mimeType || 'video/mp4', upsert: false });
    if (uploadErr) throw new ApiError(500, 'unknown', `Storage upload failed: ${uploadErr.message}`);

    const { error: insertErr } = await admin.from('media').insert({
      id: mediaId,
      user_id: user.id,
      kind: 'video',
      prompt: input.prompt,
      style: input.style,
      motion: input.motion,
      source_image_path: input.sourceImagePath ?? null,
      storage_path: storagePath,
      storage_bucket: 'media-videos',
      mime_type: mimeType || 'video/mp4',
      size_bytes: bytes.byteLength,
      duration_ms: 3000,
      generation_log_id: logId,
    });
    if (insertErr) throw new ApiError(500, 'unknown', `Media insert failed: ${insertErr.message}`);

    await admin
      .from('generation_logs')
      .update({
        status: 'succeeded',
        duration_ms: Date.now() - startedAt,
        finished_at: new Date().toISOString(),
        http_status: 200,
      })
      .eq('id', logId);

    const { data: signed, error: signErr } = await admin.storage
      .from('media-videos')
      .createSignedUrl(storagePath, 3600);
    if (signErr || !signed) throw new ApiError(500, 'unknown', 'Could not sign URL');

    maybeSendFirstCreation(user.id, user.email).catch((err) => {
      console.warn('First-creation email failed:', err);
    });

    return jsonResponse({
      mediaId,
      signedUrl: signed.signedUrl,
      storagePath,
      mimeType: mimeType || 'video/mp4',
      sizeBytes: bytes.byteLength,
    });
  } catch (err) {
    if (logId) {
      await admin
        .from('generation_logs')
        .update({
          status: err instanceof ApiError && err.code === 'timeout' ? 'timeout' : 'failed',
          duration_ms: Date.now() - startedAt,
          finished_at: new Date().toISOString(),
          error_code: err instanceof ApiError ? err.code : 'unknown',
          error_message: err instanceof Error ? err.message.slice(0, 500) : 'Unknown',
        })
        .eq('id', logId);
    }
    return errorResponse(err);
  }
});

async function maybeSendFirstCreation(userId: string, email: string): Promise<void> {
  const admin = adminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, first_creation_emailed_at')
    .eq('id', userId)
    .single();
  if (!profile || profile.first_creation_emailed_at) return;
  await sendFirstCreation(email, profile.display_name || email.split('@')[0] || 'there');
  await admin
    .from('profiles')
    .update({ first_creation_emailed_at: new Date().toISOString() })
    .eq('id', userId)
    .is('first_creation_emailed_at', null);
}
