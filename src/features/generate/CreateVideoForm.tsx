import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RotateCw, AlertCircle, Clock, Upload, X, Download, Library as LibraryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  type VideoFormValues,
} from './schemas';
import { VIDEO_STYLES, VIDEO_MOTIONS, type GenerateResponse } from '@/types/api';
import { generateVideo, uploadSourceImage, type UploadedSource } from './api';

type UploadState =
  | { kind: 'empty' }
  | { kind: 'uploading'; progress: number; name: string }
  | { kind: 'preview'; source: UploadedSource; name: string }
  | { kind: 'error'; reason: 'type' | 'size' };

type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading'; progress: number; timedOut: boolean }
  | { kind: 'done'; data: GenerateResponse }
  | { kind: 'error'; message: string; warming?: boolean };

const PROGRESS_DURATION_MS = 30_000;
const TIMEOUT_MS = 120_000;

export function CreateVideoForm(): JSX.Element {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ResultState>({ kind: 'idle' });
  const [upload, setUpload] = useState<UploadState>({ kind: 'empty' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const timeoutTimerRef = useRef<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<VideoFormValues>({
    mode: 'onChange',
    defaultValues: { prompt: '', style: 'Cinematic', motion: 'Medium' },
  });

  const prompt = watch('prompt') ?? '';

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
      if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current);
    };
  }, []);

  function startProgress(): void {
    const startedAt = Date.now();
    setResult({ kind: 'loading', progress: 0, timedOut: false });
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(90, (elapsed / PROGRESS_DURATION_MS) * 90);
      setResult((prev) => (prev.kind === 'loading' ? { ...prev, progress } : prev));
    }, 250);
    timeoutTimerRef.current = window.setTimeout(() => {
      setResult((prev) => (prev.kind === 'loading' ? { ...prev, timedOut: true } : prev));
    }, TIMEOUT_MS);
  }

  function clearProgress(): void {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      window.clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }

  const mutation = useMutation({
    mutationFn: generateVideo,
    onMutate: () => startProgress(),
    onSuccess: (data) => {
      clearProgress();
      setResult({ kind: 'done', data });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['mediaCounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentMedia'] });
      toast.success('Video generated and saved to your library');
    },
    onError: (err) => {
      clearProgress();
      let message = 'Generation failed. Please try again.';
      let warming = false;
      if (err instanceof ApiError) {
        if (err.code === 'model_loading') {
          message = 'The video model is warming up. Please try again in a minute or two.';
          warming = true;
        } else if (err.code === 'rate_limited') {
          message = 'Too many requests right now. Please wait and retry.';
        } else if (err.code === 'timeout') {
          message =
            'This is taking longer than expected. We will keep trying — check your library in a few minutes.';
          warming = true;
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setResult({ kind: 'error', message, warming });
    },
  });

  async function handleFile(file: File): Promise<void> {
    const okType = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
    if (!okType) {
      setUpload({ kind: 'error', reason: 'type' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUpload({ kind: 'error', reason: 'size' });
      return;
    }
    setUpload({ kind: 'uploading', progress: 0, name: file.name });
    try {
      const source = await uploadSourceImage(file);
      setUpload({ kind: 'preview', source, name: file.name });
      setValue('sourceImagePath', source.path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setUpload({ kind: 'empty' });
    }
  }

  function clearUpload(): void {
    setUpload({ kind: 'empty' });
    setValue('sourceImagePath', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onSubmit(values: VideoFormValues): void {
    mutation.mutate(values);
  }

  async function handleDownload(): Promise<void> {
    if (result.kind !== 'done') return;
    try {
      const res = await fetch(result.data.signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studio-${result.data.mediaId}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  }

  return (
    <form className="create-page" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="create-controls">
        <Field label="Prompt" counter={`${prompt.length} / 300`} error={errors.prompt?.message}>
          <Textarea
            placeholder="Describe the scene you want to film…"
            maxLength={300}
            error={!!errors.prompt}
            {...register('prompt')}
          />
        </Field>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>
            Reference image (optional)
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {upload.kind === 'empty' && (
            <button type="button" className="dropzone" onClick={() => fileInputRef.current?.click()}>
              <Upload size={22} />
              <div className="dropzone-title">Drop an image, or click to upload</div>
              <div className="dropzone-hint">JPG, PNG, WEBP · 5 MB max</div>
            </button>
          )}
          {upload.kind === 'uploading' && (
            <div className="card" style={{ padding: 14, background: 'var(--surface-sunken)' }}>
              <div className="dropzone-uploading-row">
                <span>Uploading {upload.name}</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>
                  {upload.progress}%
                </span>
              </div>
              <div className="progress">
                <div className="bar" style={{ width: `${upload.progress}%` }} />
              </div>
            </div>
          )}
          {upload.kind === 'preview' && (
            <div className="dropzone-preview">
              <img
                src={upload.source.signedUrl}
                alt="Source"
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
              />
              <button type="button" className="dropzone-remove" onClick={clearUpload} aria-label="Remove image">
                <X size={14} />
              </button>
            </div>
          )}
          {upload.kind === 'error' && (
            <div className="dropzone error">
              <AlertCircle size={22} style={{ color: 'var(--error)' }} />
              <div className="dropzone-title">
                {upload.reason === 'type' ? 'Wrong file type' : 'File too large'}
              </div>
              <div className="dropzone-hint">
                {upload.reason === 'type'
                  ? 'Only JPG, PNG, and WEBP are supported.'
                  : 'Reference images must be 5 MB or smaller.'}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setUpload({ kind: 'empty' })}>
                Try again
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>
            Style
          </div>
          <Controller
            name="style"
            control={control}
            render={({ field }) => (
              <div className="choices">
                {VIDEO_STYLES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`choice ${field.value === s ? 'active' : ''}`}
                    onClick={() => field.onChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>
            Motion intensity
          </div>
          <Controller
            name="motion"
            control={control}
            render={({ field }) => (
              <div className="choices" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {VIDEO_MOTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`choice ${field.value === m ? 'active' : ''}`}
                    onClick={() => field.onChange(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          leftIcon={result.kind === 'loading' ? null : <Sparkles size={16} />}
          disabled={!isValid || result.kind === 'loading' || upload.kind === 'uploading'}
          loading={result.kind === 'loading'}
        >
          {result.kind === 'loading' ? 'Generating…' : 'Generate video'}
        </Button>
      </div>

      <div className="result-panel">
        <div className="result-media" style={{ aspectRatio: '16/9' }}>
          {result.kind === 'idle' && (
            <div className="result-placeholder">
              <div className="orb-anim" />
              <div style={{ fontSize: 14 }}>Your generated video will appear here.</div>
            </div>
          )}
          {result.kind === 'loading' && !result.timedOut && (
            <div
              style={{
                width: '100%',
                padding: '0 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                alignItems: 'center',
              }}
            >
              <div className="orb-anim" />
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Generating your video…</div>
              <div style={{ width: '100%', maxWidth: 360 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    marginBottom: 8,
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>This usually takes 30–120 seconds.</span>
                  <span className="mono">{Math.round(result.progress)}%</span>
                </div>
                <div className="progress">
                  <div className="bar" style={{ width: `${result.progress}%` }} />
                </div>
              </div>
            </div>
          )}
          {result.kind === 'loading' && result.timedOut && (
            <div className="result-placeholder" style={{ maxWidth: 380, textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: 'var(--warning-soft)',
                  border: '1px solid rgba(245,181,68,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--warning)',
                }}
              >
                <Clock size={22} />
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Still working</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320 }}>
                This is taking longer than expected. We will keep trying — check your library in a few minutes.
              </div>
            </div>
          )}
          {result.kind === 'done' && (
            <video
              src={result.data.signedUrl}
              controls
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />
          )}
          {result.kind === 'error' && (
            <div className="result-placeholder" style={{ maxWidth: 380, textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: result.warming ? 'var(--warning-soft)' : 'var(--error-soft)',
                  border: `1px solid ${result.warming ? 'rgba(245,181,68,0.3)' : 'rgba(248,113,113,0.3)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: result.warming ? 'var(--warning)' : 'var(--error)',
                }}
              >
                {result.warming ? <Clock size={22} /> : <AlertCircle size={22} />}
              </div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {result.warming ? 'Model is warming up' : "We couldn't generate that."}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360 }}>{result.message}</div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<RotateCw size={14} />}
                onClick={handleSubmit(onSubmit)}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
        {result.kind === 'done' && (
          <div className="result-actions">
            <Button type="button" variant="secondary" leftIcon={<Download size={14} />} onClick={handleDownload}>
              Download MP4
            </Button>
            <Button type="button" variant="secondary" leftIcon={<LibraryIcon size={14} />} disabled>
              Saved to library
            </Button>
            <Button
              type="button"
              variant="ghost"
              leftIcon={<RotateCw size={14} />}
              onClick={handleSubmit(onSubmit)}
            >
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
