'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { subscribeToPush } from '@/lib/push';
import { identifyUser, resetUser } from '@/lib/posthog';

type AuthResult = { error: AuthError | null };
type SignUpResult = { error: AuthError | null; confirmationRequired: boolean };

type AuthContextType = {
  user: User | null;
  session: Session | null;
  supabase: SupabaseClient;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_FALLBACK_URL = 'https://placeholder.supabase.co';
const SUPABASE_FALLBACK_ANON_KEY = 'placeholder-anon-key';

function hasBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return url.startsWith('http') && key.length > 0;
}

function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  return createClient(
    url.startsWith('http') ? url : SUPABASE_FALLBACK_URL,
    key || SUPABASE_FALLBACK_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        debug: false,
      },
    }
  );
}

function supabaseNotConfiguredError() {
  return new AuthError('Supabase is not configured.');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(createBrowserSupabaseClient);
  const [supabaseConfigured] = useState(hasBrowserSupabaseConfig);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Auto-subscribe to push on sign in (non-blocking)
      if (event === 'SIGNED_IN' && session?.access_token) {
        identifyUser(session.user.id, { email: session.user.email });
        subscribeToPush(session.access_token).catch(() => {});
      }
      if (event === 'SIGNED_OUT') {
        resetUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, supabaseConfigured]);

  const signUp = async (email: string, password: string, username: string) => {
    if (!supabaseConfigured) {
      return { error: supabaseNotConfiguredError(), confirmationRequired: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error, confirmationRequired: !error && !data.session };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: supabaseNotConfiguredError() };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!supabaseConfigured) {
      return { error: supabaseNotConfiguredError() };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabaseConfigured) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, supabase, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
