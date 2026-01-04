'use client';

import { ClerkProvider } from '@clerk/nextjs';
import AuthenticatedSWRProvider from './AuthenticatedSWRProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthenticatedSWRProvider>{children}</AuthenticatedSWRProvider>
    </ClerkProvider>
  );
}

