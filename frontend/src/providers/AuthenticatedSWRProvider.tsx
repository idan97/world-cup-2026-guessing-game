'use client';

import { SWRConfig } from 'swr';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useMemo } from 'react';

export default function AuthenticatedSWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (url: string) => {
      const token = await getToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const json = await response.json();
      // API returns { success, message, data } - extract the data
      return json.data !== undefined ? json.data : json;
    },
    [getToken]
  );

  const config = useMemo(
    () => ({
      fetcher,
      revalidateOnFocus: false, // Don't refetch when window gets focus
      revalidateOnReconnect: false, // Don't refetch when reconnecting
      refreshInterval: 0, // Disable automatic polling
      dedupingInterval: 2000,
      shouldRetryOnError: false, // Don't retry on 404 errors
      errorRetryCount: 0, // Don't retry failed requests
    }),
    [fetcher]
  );

  return <SWRConfig value={config}>{children}</SWRConfig>;
}

