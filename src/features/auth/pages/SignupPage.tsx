import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Wordmark } from '@/components/ui/Wordmark';
import { signupSchema, type SignupInput } from '../schemas';
import { signUp } from '../api';
import { ROUTES } from '@/constants/routes';
import { SeoMeta } from '@/components/SeoMeta';

export function SignupPage(): JSX.Element {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<SignupInput>({
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: SignupInput): Promise<void> {
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      if (first?.path[0] === 'email') setError('email', { message: first.message });
      if (first?.path[0] === 'password') setError('password', { message: first.message });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(parsed.data);
      toast.success('Account created — check your inbox to verify');
      navigate(ROUTES.VERIFY_EMAIL_PENDING, { state: { email: parsed.data.email } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      if (message.toLowerCase().includes('already exists')) {
        setError('email', { message });
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <SeoMeta
        title="Create Account Studio"
        description="Create a free Studio account in seconds and start generating AI photos and videos from text prompts."
        canonicalPath={ROUTES.SIGNUP}
      />
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-brand">
          <Wordmark size={22} />
        </div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-sub">Start creating in under a minute.</p>
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
          <Field
            label="Password"
            hint={errors.password ? null : 'Minimum 8 characters.'}
            error={errors.password?.message}
          >
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={!!errors.password}
              {...register('password')}
            />
          </Field>
        </div>
        <Button type="submit" variant="primary" style={{ width: '100%' }} loading={submitting} disabled={!isValid}>
          Create account
        </Button>
        <div className="auth-foot">
          Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
        </div>
      </form>
    </div>
  );
}
