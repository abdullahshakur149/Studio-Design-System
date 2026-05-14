import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src="/empty-orb.svg" alt="" width={120} height={120} />
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          404
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, letterSpacing: '-0.01em' }}>This page doesn't exist</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
          The link you followed may be broken, or the page may have been removed.
        </p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
