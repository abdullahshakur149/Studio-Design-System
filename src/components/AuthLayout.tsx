import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { SeoMeta } from './SeoMeta';
import { RequireVerifiedAuth } from '@/features/auth/RequireVerifiedAuth';
import { ROUTES } from '@/constants/routes';

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard — Studio',
  [ROUTES.DASHBOARD_CREATE]: 'Create — Studio',
  [ROUTES.DASHBOARD_LIBRARY]: 'My Library — Studio',
  [ROUTES.DASHBOARD_PROFILE]: 'Profile — Studio',
};

export function AuthLayout(): JSX.Element {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Studio';

  return (
    <RequireVerifiedAuth>
      <SeoMeta title={title} noIndex />
      <div className="app">
        <Nav />
        <main className="app-body">
          <Outlet />
        </main>
      </div>
    </RequireVerifiedAuth>
  );
}
