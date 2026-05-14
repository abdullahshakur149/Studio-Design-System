import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSession } from './useSession';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { ROUTES } from '@/constants/routes';

interface RequireVerifiedAuthProps {
  children: ReactNode;
}

export function RequireVerifiedAuth({ children }: RequireVerifiedAuthProps): JSX.Element {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (!session.user.email_confirmed_at) return <Navigate to={ROUTES.VERIFY_EMAIL_PENDING} replace />;
  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: RequireVerifiedAuthProps): JSX.Element {
  const { session, loading } = useSession();
  if (loading) return <FullPageSpinner />;
  if (session?.user.email_confirmed_at) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
}
