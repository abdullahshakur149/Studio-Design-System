import type { VideoMotion } from '@/types/api';

interface KenBurnsOptions {
    image: HTMLImageElement;
    width?: number;
    height?: number;
    durationMs?: number;
    fps?: number;
    motion: VideoMotion;
    onProgress?: (p: number) => void;
}

interface KenBurnsResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  width: number;
  height: number;
}

interface MotionParams {
  startScale: number;
  endScale: number;
  startCx: number;
  startCy: number;
  endCx: number;
  endCy: number;
}

function paramsForMotion(motion: VideoMotion): MotionParams {
  switch (motion) {
    case 'Subtle':
      return { startScale: 1.0, endScale: 1.08, startCx: 0.5, startCy: 0.5, endCx: 0.5, endCy: 0.5 };
    case 'Medium':
      return { startScale: 1.0, endScale: 1.18, startCx: 0.4, startCy: 0.5, endCx: 0.6, endCy: 0.5 };
    case 'Dynamic':
      return { startScale: 1.0, endScale: 1.35, startCx: 0.3, startCy: 0.4, endCx: 0.7, endCy: 0.6 };
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function pickMimeType(): string {
  const candidates = [
    'video/mp4;codecs=avc1',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return 'video/webm';
}

export async function composeKenBurnsVideo(opts: KenBurnsOptions): Promise<KenBurnsResult> {
  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const durationMs = opts.durationMs ?? 8000;
  const fps = opts.fps ?? 30;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) throw new Error('Could not get canvas 2D context');
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const stream = canvas.captureStream(fps);
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = (e) => reject(e);
  });

  const params = paramsForMotion(opts.motion);
  const startedAt = performance.now();
  const img = opts.image;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  recorder.start();

  await new Promise<void>((resolve) => {
    function tick(): void {
      const elapsed = performance.now() - startedAt;
      const rawT = Math.min(1, elapsed / durationMs);
      const t = easeInOut(rawT);

      const scale = params.startScale + (params.endScale - params.startScale) * t;
      const cx = params.startCx + (params.endCx - params.startCx) * t;
      const cy = params.startCy + (params.endCy - params.startCy) * t;

      const canvasAspect = width / height;
      const imgAspect = imgW / imgH;
      let cropW: number;
      let cropH: number;
      if (imgAspect > canvasAspect) {

        cropH = imgH / scale;
        cropW = cropH * canvasAspect;
      } else {
        cropW = imgW / scale;
        cropH = cropW / canvasAspect;
      }
      const cropX = Math.max(0, Math.min(imgW - cropW, cx * imgW - cropW / 2));
      const cropY = Math.max(0, Math.min(imgH - cropH, cy * imgH - cropH / 2));

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, width, height);

      opts.onProgress?.(rawT);

      if (rawT >= 1) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });

  await new Promise((r) => setTimeout(r, 100));
  recorder.stop();
  const blob = await finished;

  return { blob, mimeType, durationMs, width, height };
}

export async function imageFromBase64(base64: string, mimeType: string): Promise<HTMLImageElement> {
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}
