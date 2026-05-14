import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Wordmark } from '@/components/ui/Wordmark';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas';
import { setNewPassword } from '../api';
import { ROUTES } from '@/constants/routes';
import { SeoMeta } from '@/components/SeoMeta';

export function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordInput>({
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const mismatch = !!(password && confirmPassword && password !== confirmPassword);

  async function onSubmit(values: ResetPasswordInput): Promise<void> {
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) return;
    setSubmitting(true);
    try {
      await setNewPassword(parsed.data);
      toast.success('Password updated — please sign in');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <SeoMeta title="Reset password — Studio" noIndex />
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-brand">
          <Wordmark size={22} />
        </div>
        <h2 className="auth-title">Set a new password</h2>
        <p className="auth-sub">Choose something strong — at least 8 characters.</p>
        <div className="auth-fields">
          <Field
            label="New password"
            hint={errors.password ? null : 'Minimum 8 characters.'}
            error={errors.password?.message}
          >
            <Input type="password" autoComplete="new-password" error={!!errors.password} {...register('password')} />
          </Field>
          <Field
            label="Confirm password"
            error={mismatch ? 'Passwords do not match' : errors.confirmPassword?.message}
          >
            <Input
              type="password"
              autoComplete="new-password"
              error={mismatch || !!errors.confirmPassword}
              {...register('confirmPassword')}
            />
          </Field>
        </div>
        <Button
          type="submit"
          variant="primary"
          style={{ width: '100%' }}
          loading={submitting}
          disabled={!isValid || mismatch}
        >
          Update password
        </Button>
      </form>
    </div>
  );
}
