import { z } from 'npm:zod@3.24.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';
import { callHfModel } from '../_shared/hf.ts';
import { ApiError, errorResponse } from '../_shared/errors.ts';

const VIDEO_STYLES = ['Cinematic', 'Animated', 'Documentary', 'Dramatic'] as const;
const VIDEO_MOTIONS = ['Subtle', 'Medium', 'Dynamic'] as const;

const schema = z.object({
  prompt: z.string().trim().min(15).max(300),
  style: z.enum(VIDEO_STYLES),
  motion: z.enum(VIDEO_MOTIONS),
  sourceImagePath: z.string().optional(),
});

const MODEL = 'black-forest-labs/FLUX.1-schnell';

const styleSuffix: Record<(typeof VIDEO_STYLES)[number], string> = {
  Cinematic: ', cinematic shot, dramatic lighting, shallow depth of field, film grain',
  Animated: ', animated still frame, vibrant colors, stylized',
  Documentary: ', documentary footage frame, natural lighting, handheld feel',
  Dramatic: ', dramatic atmosphere, moody lighting, intense composition',
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
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
        kind: 'video',
        prompt: input.prompt,
        style: input.style,
        motion: input.motion,
        status: 'processing',
        provider: 'huggingface',
        model: MODEL,
      })
      .select('id')
      .single();
    if (logErr || !logRow) throw new ApiError(500, 'unknown', logErr?.message ?? 'log insert failed');
    logId = logRow.id;

    const fullPrompt = input.prompt + styleSuffix[input.style];

    const { bytes, mimeType } = await callHfModel({
      model: MODEL,
      body: {
        inputs: fullPrompt,
        parameters: { width: 1280, height: 720, num_inference_steps: 4 },
      },
      budgetMs: 140_000,
      retryOnLoading: true,
    });

    await admin
      .from('generation_logs')
      .update({
        status: 'completed',
        duration_ms: Date.now() - startedAt,
        finished_at: new Date().toISOString(),
        http_status: 200,
      })
      .eq('id', logId);

    return jsonResponse({
      sourceImageBase64: bytesToBase64(bytes),
      sourceMimeType: mimeType,
      generationLogId: logId,
      motion: input.motion,
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
