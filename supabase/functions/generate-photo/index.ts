// Photo generation pipeline — runs on Deno (Supabase Edge Functions).

import { z } from 'npm:zod@3.24.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';
import { callHfModel } from '../_shared/hf.ts';
import { ApiError, errorResponse } from '../_shared/errors.ts';
import { sendFirstCreation } from '../_shared/email.ts';

const PHOTO_STYLES = ['Realistic', 'Cartoon', 'Oil Painting', 'Watercolour', 'Digital Art'] as const;
const PHOTO_ASPECTS = ['1:1', '4:5', '16:9'] as const;

const schema = z.object({
  prompt: z.string().trim().min(10).max(500),
  style: z.enum(PHOTO_STYLES),
  aspectRatio: z.enum(PHOTO_ASPECTS),
});

const MODEL = 'black-forest-labs/FLUX.1-schnell';

const styleSuffix: Record<(typeof PHOTO_STYLES)[number], string> = {
  Realistic: ', photorealistic, sharp focus, 35mm photo',
  Cartoon: ', cartoon illustration, bold lines, flat colors',
  'Oil Painting': ', oil painting, thick brushstrokes, canvas texture',
  Watercolour: ', watercolour painting, soft palette, paper texture',
  'Digital Art': ', digital art, vibrant colors, detailed',
};

function aspectToDims(aspect: (typeof PHOTO_ASPECTS)[number]): { width: number; height: number } {
  switch (aspect) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '4:5':
      return { width: 896, height: 1152 };
    case '16:9':
      return { width: 1280, height: 720 };
  }
}

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
        kind: 'photo',
        prompt: input.prompt,
        style: input.style,
        aspect_ratio: input.aspectRatio,
        status: 'running',
        provider: 'huggingface',
        model: MODEL,
      })
      .select('id')
      .single();
    if (logErr || !logRow) throw new ApiError(500, 'unknown', logErr?.message ?? 'log insert failed');
    logId = logRow.id;

    const dims = aspectToDims(input.aspectRatio);
    const prompt = input.prompt + styleSuffix[input.style];

    const { bytes, mimeType } = await callHfModel({
      model: MODEL,
      body: {
        inputs: prompt,
        parameters: { width: dims.width, height: dims.height, num_inference_steps: 4 },
      },
      budgetMs: 140_000,
      retryOnLoading: true,
    });

    const mediaId = crypto.randomUUID();
    const ext = mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : 'png';
    const storagePath = `${user.id}/${mediaId}.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from('media-photos')
      .upload(storagePath, bytes, { contentType: mimeType, upsert: false });
    if (uploadErr) throw new ApiError(500, 'unknown', `Storage upload failed: ${uploadErr.message}`);

    const { error: insertErr } = await admin.from('media').insert({
      id: mediaId,
      user_id: user.id,
      kind: 'photo',
      prompt: input.prompt,
      style: input.style,
      aspect_ratio: input.aspectRatio,
      storage_path: storagePath,
      storage_bucket: 'media-photos',
      mime_type: mimeType,
      size_bytes: bytes.byteLength,
      width: dims.width,
      height: dims.height,
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
      .from('media-photos')
      .createSignedUrl(storagePath, 3600);
    if (signErr || !signed) throw new ApiError(500, 'unknown', 'Could not sign URL');

    // Fire-and-forget first-creation email
    maybeSendFirstCreation(user.id, user.email).catch((err) => {
      console.warn('First-creation email failed:', err);
    });

    return jsonResponse({
      mediaId,
      signedUrl: signed.signedUrl,
      storagePath,
      mimeType,
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
