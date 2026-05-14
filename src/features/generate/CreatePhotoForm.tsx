import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RotateCw, AlertCircle, Download, Library as LibraryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';
import type { PhotoFormValues } from './schemas';
import { PHOTO_STYLES, PHOTO_ASPECT_RATIOS, type GenerateResponse } from '@/types/api';
import { generatePhoto } from './api';

const RATIO_LABELS: Record<(typeof PHOTO_ASPECT_RATIOS)[number], { label: string; w: number; h: number }> = {
  '1:1': { label: 'Square 1:1', w: 28, h: 28 },
  '4:5': { label: 'Portrait 4:5', w: 26, h: 32 },
  '16:9': { label: 'Landscape 16:9', w: 36, h: 20 },
};

type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; data: GenerateResponse; aspect: string }
  | { kind: 'error'; message: string; warming?: boolean };

export function CreatePhotoForm(): JSX.Element {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ResultState>({ kind: 'idle' });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<PhotoFormValues>({
    mode: 'onChange',
    defaultValues: { prompt: '', style: 'Realistic', aspectRatio: '1:1' },
  });

  const prompt = watch('prompt') ?? '';

  const mutation = useMutation({
    mutationFn: generatePhoto,
    onMutate: () => setResult({ kind: 'loading' }),
    onSuccess: (data, vars) => {
      setResult({ kind: 'done', data, aspect: vars.aspectRatio });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['mediaCounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentMedia'] });
      toast.success('Photo generated and saved to your library');
    },
    onError: async (err) => {
      let message = 'Generation failed. Please try again.';
      let warming = false;
      if (err instanceof ApiError) {
        if (err.code === 'model_loading') {
          message = 'The model is warming up. Please try again in about a minute.';
          warming = true;
        } else if (err.code === 'rate_limited') {
          message = 'Too many requests right now. Please wait a moment and retry.';
        } else if (err.code === 'invalid_input') {
          message = 'Your prompt was rejected by the model. Try rephrasing.';
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setResult({ kind: 'error', message, warming });
    },
  });

  function onSubmit(values: PhotoFormValues): void {
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
      a.download = `studio-${result.data.mediaId}.png`;
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
        <Field label="Prompt" counter={`${prompt.length} / 500`} error={errors.prompt?.message}>
          <Textarea
            placeholder="Describe what you want to generate…"
            maxLength={500}
            error={!!errors.prompt}
            {...register('prompt')}
          />
        </Field>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>
            Style
          </div>
          <Controller
            name="style"
            control={control}
            render={({ field }) => (
              <div className="choices">
                {PHOTO_STYLES.map((s) => (
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
            Aspect ratio
          </div>
          <Controller
            name="aspectRatio"
            control={control}
            render={({ field }) => (
              <div className="ratio-choices">
                {PHOTO_ASPECT_RATIOS.map((r) => {
                  const conf = RATIO_LABELS[r];
                  return (
                    <button
                      type="button"
                      key={r}
                      className={`ratio ${field.value === r ? 'active' : ''}`}
                      onClick={() => field.onChange(r)}
                    >
                      <div className="ratio-shape" style={{ width: conf.w, height: conf.h }} />
                      <div className="ratio-label">{conf.label}</div>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          leftIcon={result.kind === 'loading' ? null : <Sparkles size={16} />}
          disabled={!isValid || result.kind === 'loading'}
          loading={result.kind === 'loading'}
        >
          {result.kind === 'loading' ? 'Generating…' : 'Generate'}
        </Button>
      </div>

      <div className="result-panel">
        <div className="result-media">
          {result.kind === 'idle' && (
            <div className="result-placeholder">
              <div className="orb-anim" />
              <div style={{ fontSize: 14 }}>Your generated photo will appear here.</div>
            </div>
          )}
          {result.kind === 'loading' && (
            <div className="result-placeholder">
              <div className="orb-anim" />
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Generating your photo…</div>
            </div>
          )}
          {result.kind === 'done' && (
            <img
              src={result.data.signedUrl}
              alt="Generated"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                aspectRatio: result.aspect.replace(':', '/'),
                objectFit: 'contain',
              }}
            />
          )}
          {result.kind === 'error' && (
            <div className="result-placeholder">
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
                <AlertCircle size={22} />
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
              Download
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

