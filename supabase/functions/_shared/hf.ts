import { ApiError } from './errors.ts';

interface HfCallOptions {
  model: string;
  body: Record<string, unknown>;
  budgetMs: number;
  retryOnLoading: boolean;
}

interface HfResult {
  bytes: Uint8Array;
  mimeType: string;
}

/**
 * Calls Hugging Face Inference API and returns binary bytes.
 * Retries once on 503 "model loading" if retryOnLoading is true.
 */
export async function callHfModel({ model, body, budgetMs, retryOnLoading }: HfCallOptions): Promise<HfResult> {
  const token = Deno.env.get('HUGGINGFACE_API_TOKEN');
  if (!token) throw new ApiError(500, 'unknown', 'HUGGINGFACE_API_TOKEN not set');

  const url = `https://api-inference.huggingface.co/models/${model}`;
  const startedAt = Date.now();

  async function attempt(): Promise<HfResult> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'image/png,video/mp4,application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 200) {
      const buf = await res.arrayBuffer();
      const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
      return { bytes: new Uint8Array(buf), mimeType };
    }

    if (res.status === 503) {
      let estimated = 30;
      try {
        const json: unknown = await res.json();
        if (json && typeof json === 'object' && 'estimated_time' in json) {
          const t = (json as { estimated_time?: unknown }).estimated_time;
          if (typeof t === 'number') estimated = Math.ceil(t);
        }
      } catch {
        // ignore
      }
      throw new ApiError(503, 'model_loading', 'Model is currently loading', { estimatedSeconds: estimated });
    }

    if (res.status === 429) {
      throw new ApiError(429, 'rate_limited', 'Hugging Face rate limit reached');
    }

    let errBody = '';
    try {
      errBody = await res.text();
    } catch {
      // ignore
    }
    throw new ApiError(502, 'unknown', `HF call failed (${res.status}): ${errBody.slice(0, 200)}`);
  }

  try {
    return await attempt();
  } catch (err) {
    if (
      retryOnLoading &&
      err instanceof ApiError &&
      err.code === 'model_loading' &&
      Date.now() - startedAt < budgetMs - 10_000
    ) {
      const wait = Math.min((err.extra?.['estimatedSeconds'] as number | undefined) ?? 25, 25);
      await new Promise((r) => setTimeout(r, (wait + 2) * 1000));
      return await attempt();
    }
    throw err;
  }
}
