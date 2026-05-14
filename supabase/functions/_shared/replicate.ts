import { ApiError } from './errors.ts';

interface CallReplicateOptions {
    model: string;
    input: Record<string, unknown>;
    budgetMs: number;
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
  logs?: string;
}

interface ReplicateResult {
    outputUrl: string;
    bytes: Uint8Array;
  mimeType: string;
}

export async function callReplicate({ model, input, budgetMs }: CallReplicateOptions): Promise<ReplicateResult> {
  const token = Deno.env.get('REPLICATE_API_TOKEN');
  if (!token) throw new ApiError(500, 'unknown', 'REPLICATE_API_TOKEN not set');

  const startedAt = Date.now();

  const initialWait = Math.min(60, Math.floor((budgetMs - 10_000) / 1000));
  const createUrl = `https://api.replicate.com/v1/models/${model}/predictions`;

  let prediction = await postCreate(createUrl, token, input, initialWait);

  while (prediction.status === 'starting' || prediction.status === 'processing') {
    if (Date.now() - startedAt > budgetMs - 5_000) {
      throw new ApiError(504, 'timeout', 'Replicate prediction did not finish in time');
    }
    await new Promise((r) => setTimeout(r, 2000));
    prediction = await fetchPrediction(prediction.id, token);
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    const detail = prediction.error ?? prediction.logs ?? 'unknown';
    throw new ApiError(502, 'unknown', `Replicate prediction ${prediction.status}: ${String(detail).slice(0, 200)}`);
  }

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof outputUrl !== 'string') {
    throw new ApiError(502, 'unknown', 'Replicate succeeded but returned no output URL');
  }

  const res = await fetch(outputUrl);
  if (!res.ok) {
    throw new ApiError(502, 'unknown', `Failed to download Replicate output (${res.status})`);
  }
  const buf = await res.arrayBuffer();
  const mimeType = res.headers.get('content-type') ?? 'video/mp4';
  return { outputUrl, bytes: new Uint8Array(buf), mimeType };
}

async function postCreate(
  url: string,
  token: string,
  input: Record<string, unknown>,
  initialWaitSec: number,
): Promise<ReplicatePrediction> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: `wait=${initialWaitSec}`,
    },
    body: JSON.stringify({ input }),
  });

  if (res.status === 429) {
    throw new ApiError(429, 'rate_limited', 'Replicate rate limit reached');
  }
  if (res.status === 402 || res.status === 403) {
    const body = await res.text().catch(() => '');
    throw new ApiError(402, 'unknown', `Replicate billing/permissions: ${body.slice(0, 200)}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(502, 'unknown', `Replicate create failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<ReplicatePrediction>;
}

async function fetchPrediction(id: string, token: string): Promise<ReplicatePrediction> {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new ApiError(502, 'unknown', `Replicate poll failed (${res.status})`);
  }
  return res.json() as Promise<ReplicatePrediction>;
}
