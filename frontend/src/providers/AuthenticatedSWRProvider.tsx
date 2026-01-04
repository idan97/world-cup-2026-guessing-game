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
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }),
    [fetcher]
  );

  return <SWRConfig value={config}>{children}</SWRConfig>;
}

