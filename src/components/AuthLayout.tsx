import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { RequireVerifiedAuth } from '@/features/auth/RequireVerifiedAuth';

export function AuthLayout(): JSX.Element {
  return (
    <RequireVerifiedAuth>
      <div className="app">
        <Nav />
        <main className="app-body">
          <Outlet />
        </main>
      </div>
    </RequireVerifiedAuth>
  );
}
