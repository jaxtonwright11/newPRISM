'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { subscribeToPush } from '@/lib/push';
import { identifyUser, resetUser } from '@/lib/posthog';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create browser client
  const [supabase] = useState(() =>
    createBrowserSupabaseClient()
  );
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [supabase]);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error, confirmationRequired: !error && !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signOut = async () => {
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
