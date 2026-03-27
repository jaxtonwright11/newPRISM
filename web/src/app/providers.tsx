'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/toast';
import { initPostHog } from '@/lib/posthog';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
