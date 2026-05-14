import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Wordmark } from '@/components/ui/Wordmark';
import { useSession } from '../useSession';
import { resendVerificationEmail, logout } from '../api';
import { ROUTES } from '@/constants/routes';
import { SeoMeta } from '@/components/SeoMeta';

interface LocationState {
  email?: string;
}

export function VerifyEmailPendingPage(): JSX.Element {
  const location = useLocation();
  const { session } = useSession();
  const fromState = location.state as LocationState | null;
  const email = fromState?.email ?? session?.user.email ?? 'your email';
  const [resending, setResending] = useState(false);

  async function handleResend(): Promise<void> {
    if (!session?.user.email && !fromState?.email) {
      toast.error('Could not determine your email — please sign in again');
      return;
    }
    setResending(true);
    try {
      await resendVerificationEmail(fromState?.email ?? session?.user.email ?? '');
      toast.success('Verification email sent — check your inbox');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend email');
    } finally {
      setResending(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    await logout();
  }

  return (
    <div className="auth-page">
      <SeoMeta title="Verify your email — Studio" noIndex />
      <div className="auth-card">
        <div className="auth-brand">
          <Wordmark size={22} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'var(--accent-soft)',
              border: '1px solid rgba(124,92,255,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Mail size={24} />
          </div>
        </div>
        <h2 className="auth-title">Verify your email</h2>
        <p className="auth-sub">
          We sent a verification link to <span style={{ color: 'var(--text-primary)' }}>{email}</span>. Click the
          link in the message to finish setting up your account.
        </p>
        <Button variant="primary" style={{ width: '100%' }} loading={resending} onClick={handleResend}>
          Resend verification email
        </Button>
        <Button variant="ghost" style={{ width: '100%', marginTop: 8 }} onClick={handleSignOut}>
          Sign out
        </Button>
        <div className="auth-foot">
          Wrong email? <Link to={ROUTES.SIGNUP}>Use a different one</Link>
        </div>
      </div>
    </div>
  );
}
