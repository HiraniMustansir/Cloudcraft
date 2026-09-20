'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthDialog } from '@/app/auth-dialog';
import { getProfileForUser } from '@/lib/cloudcraft-data';
import type { Profile } from '@/lib/cloudcraft-types';
import { createClient } from '@/lib/supabase/client';

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  openAuth: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    setProfile(nextUser ? await getProfileForUser(nextUser) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => loadProfile(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, [loadProfile, supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await getProfileForUser(user));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        openAuth: () => setAuthOpen(true),
        refreshProfile,
      }}
    >
      {children}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} user={user} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AppProviders');
  return value;
}
