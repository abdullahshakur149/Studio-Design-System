import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase, setRememberMe } from '@/lib/supabase';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { Wordmark } from '@/components/ui/Wordmark';
import { Button } from '@/components/ui/Button';

type Status = 'verifying' | 'success' | 'error';

export function VerifyCallbackPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function run(): Promise<void> {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const errParam = searchParams.get('error_description');

      if (errParam) {
        if (active) {
          setStatus('error');
          setErrorMessage(errParam);
        }
        return;
      }

      if (!tokenHash || !type) {
        // Supabase may have already exchanged the URL fragment for a session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (active) {
            setRememberMe(true);
            setStatus('success');
            toast.success('Welcome to Studio!');
          }
          return;
        }
        if (active) {
          setStatus('error');
          setErrorMessage('Invalid or expired verification link');
        }
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink',
      });

      if (!active) return;
      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }
      setRememberMe(true);
      setStatus('success');
      toast.success('Welcome to Studio!');
    }

    run();
    return () => {
      active = false;
    };
  }, [searchParams]);

  if (status === 'verifying') {
    return <FullPageSpinner />;
  }

  if (status === 'success') {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      return <Navigate to="/reset-password" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Wordmark size={22} />
        </div>
        <h2 className="auth-title">Verification failed</h2>
        <p className="auth-sub">{errorMessage || 'The link is invalid or has expired.'}</p>
        <Button variant="primary" style={{ width: '100%' }} onClick={() => (window.location.href = '/login')}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
