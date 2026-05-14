import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { RequireVerifiedAuth } from '@/features/auth/RequireVerifiedAuth';

export function AuthLayout(): JSX.Element {
  return (
    <RequireVerifiedAuth>
      <Nav />
      <main>
        <Outlet />
      </main>
    </RequireVerifiedAuth>
  );
}
