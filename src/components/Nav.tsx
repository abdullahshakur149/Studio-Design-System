import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useSession } from '@/features/auth/useSession';
import { logout } from '@/features/auth/api';
import { Wordmark } from './ui/Wordmark';

function getInitials(email: string, displayName?: string | null): string {
  if (displayName && displayName.trim().length > 0) {
    const parts = displayName.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toLowerCase() || email.slice(0, 2).toLowerCase();
  }
  return email.slice(0, 2).toLowerCase();
}

export function Nav(): JSX.Element {
  const { session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const email = session?.user.email ?? '';
  const displayName =
    typeof session?.user.user_metadata?.['display_name'] === 'string'
      ? (session.user.user_metadata['display_name'] as string)
      : null;
  const initials = getInitials(email, displayName);

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login', { replace: true });
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', match: (p: string) => p === '/dashboard' },
    { to: '/dashboard/create', label: 'Create', match: (p: string) => p.startsWith('/dashboard/create') },
    { to: '/dashboard/library', label: 'My Library', match: (p: string) => p.startsWith('/dashboard/library') },
  ];

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
          <Wordmark size={22} />
        </Link>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={() => `nav-link ${l.match(location.pathname) ? 'active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-spacer" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="nav-avatar" title={email}>
              {initials}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="nav-menu" align="end" sideOffset={8}>
              <div className="nav-menu-header">
                <div className="nav-menu-name">{displayName ?? email.split('@')[0]}</div>
                <div className="nav-menu-email">{email}</div>
              </div>
              <DropdownMenu.Item asChild>
                <Link className="nav-menu-item" to="/dashboard/profile">
                  <User size={14} /> Profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="nav-menu-divider" />
              <DropdownMenu.Item className="nav-menu-item danger" onSelect={handleLogout}>
                <LogOut size={14} /> Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
