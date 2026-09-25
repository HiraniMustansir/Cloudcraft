'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Bookmark,
  Cloud,
  LogOut,
  Plus,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers';
import { createClient } from '@/lib/supabase/client';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, openAuth } = useAuth();
  const [search, setSearch] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submitSearch = () => {
    router.push(
      search.trim() ? `/?q=${encodeURIComponent(search.trim())}` : '/',
    );
  };

  const publish = () => {
    if (!user) return openAuth();
    router.push('/publish');
  };

  const initials = (profile?.display_name || user?.email || 'Developer')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="cc-header">
      <Link className="cc-brand" href="/">
        <span className="cc-brand-mark">
          <Cloud />
        </span>
        <span>Cloudcraft</span>
        <small>Collective</small>
      </Link>
      <nav className="cc-nav" aria-label="Primary navigation">
        <Link className={pathname === '/' ? 'active' : ''} href="/">
          Explore
        </Link>
        <Link
          className={pathname === '/following' ? 'active' : ''}
          href="/following"
        >
          Following
        </Link>
        <Link className={pathname === '/saved' ? 'active' : ''} href="/saved">
          Saved
        </Link>
      </nav>
      <form
        className="cc-search"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <Search />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patterns, services, architects"
          aria-label="Search architectures"
        />
        <kbd>↵</kbd>
      </form>
      <div className="cc-header-actions">
        <div className="cc-popover-wrap">
          <button
            className="cc-icon-button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell />
          </button>
          {notificationsOpen && (
            <div className="cc-popover cc-notifications">
              <strong>Notifications</strong>
              <p>You’re all caught up.</p>
            </div>
          )}
        </div>
        <Button onClick={publish} className="cc-publish">
          <Plus /> New design
        </Button>
        <div className="cc-popover-wrap" ref={accountRef}>
          <button
            className="cc-avatar"
            onClick={() =>
              user ? setAccountOpen((value) => !value) : openAuth()
            }
            aria-label={user ? 'Open account menu' : 'Sign in'}
          >
            {user ? initials || 'DEV' : <UserRound />}
          </button>
          {accountOpen && user && (
            <div className="cc-popover cc-account-menu">
              <div className="cc-account-summary">
                <strong>{profile?.display_name ?? 'Developer'}</strong>
                <span>{user.email}</span>
              </div>
              <Link href="/profile" onClick={() => setAccountOpen(false)}>
                <UserRound /> Profile
              </Link>
              <Link href="/saved" onClick={() => setAccountOpen(false)}>
                <Bookmark /> Saved
              </Link>
              <Link href="/settings" onClick={() => setAccountOpen(false)}>
                <Settings /> Settings
              </Link>
              <button
                onClick={async () => {
                  await createClient().auth.signOut();
                  setAccountOpen(false);
                  router.push('/');
                }}
              >
                <LogOut /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
