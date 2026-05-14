import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Wordmark } from '@/components/ui/Wordmark';
import { loginSchema, type LoginInput } from '../schemas';
import { login, LoginError } from '../api';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state as LocationState | null;
  const redirectTo = fromState?.from?.pathname ?? '/dashboard';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    mode: 'onSubmit',
    defaultValues: { email: '', password: '', remember: false },
  });

  async function onSubmit(values: LoginInput): Promise<void> {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      if (first?.path[0] === 'email') setError('email', { message: first.message });
      return;
    }
    setSubmitting(true);
    try {
      await login(parsed.data);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof LoginError) {
        if (err.field === 'email') setError('email', { message: err.message });
        else if (err.field === 'password') setError('password', { message: err.message });
        else toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Sign in failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-brand">
          <Wordmark size={22} />
        </div>
        <h2 className="auth-title">Sign in to Studio</h2>
        <p className="auth-sub">Welcome back.</p>
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
          <Field label="Password" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={!!errors.password}
              {...register('password')}
            />
          </Field>
          <div className="auth-row">
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <Checkbox label="Remember me for 30 days" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
        <Button type="submit" variant="primary" style={{ width: '100%' }} loading={submitting}>
          Sign in
        </Button>
        <div className="auth-foot">
          New to Studio? <Link to="/signup">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
