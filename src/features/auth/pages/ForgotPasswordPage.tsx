import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Wordmark } from '@/components/ui/Wordmark';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';
import { requestPasswordReset } from '../api';

export function ForgotPasswordPage(): JSX.Element {
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordInput>({
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput): Promise<void> {
    const parsed = forgotPasswordSchema.safeParse(values);
    if (!parsed.success) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(parsed.data);
      setSent(parsed.data.email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset link');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <Wordmark size={22} />
          </div>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: 'var(--success-soft)',
                border: '1px solid rgba(52,211,153,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
              }}
            >
              <MailCheck size={22} />
            </div>
          </div>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-sub">
            We sent a reset link to <span style={{ color: 'var(--text-primary)' }}>{sent}</span>.
          </p>
          <Link to="/login" style={{ display: 'block' }}>
            <Button variant="secondary" style={{ width: '100%' }}>
              Back to sign in
            </Button>
          </Link>
          <div className="auth-foot">
            Didn't get it?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSent(null);
              }}
            >
              Try again
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-brand">
          <Wordmark size={22} />
        </div>
        <h2 className="auth-title">Reset your password</h2>
        <p className="auth-sub">Enter your email and we'll send a reset link.</p>
        <div className="auth-fields">
          <Field label="Email" error={errors.email?.message}>
            <Input
              type="email"
              placeholder="you@studio.app"
              autoComplete="email"
              error={!!errors.email}
              {...register('email')}
            />
          </Field>
        </div>
        <Button type="submit" variant="primary" style={{ width: '100%' }} loading={submitting} disabled={!isValid}>
          Send reset link
        </Button>
        <div className="auth-foot">
          <Link to="/login">← Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
