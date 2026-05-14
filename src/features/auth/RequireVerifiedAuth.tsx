import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSession } from './useSession';
import { FullPageSpinner } from '@/components/FullPageSpinner';

interface RequireVerifiedAuthProps {
  children: ReactNode;
}

export function RequireVerifiedAuth({ children }: RequireVerifiedAuthProps): JSX.Element {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!session.user.email_confirmed_at) return <Navigate to="/verify-email-pending" replace />;
  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: RequireVerifiedAuthProps): JSX.Element {
  const { session, loading } = useSession();
  if (loading) return <FullPageSpinner />;
  if (session?.user.email_confirmed_at) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
