'use client';

import { useState, useEffect } from 'react';
import { Session } from './types';

/**
 * Hook to get session data from JWT cookie
 * Parses the wc_session cookie and extracts user information
 */
export const useSession = (): Session | null => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSessionFromCookie = (): Session | null => {
      try {
        // Get the session cookie
        const cookies = document.cookie.split(';').reduce(
          (acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
          },
          {} as Record<string, string>
        );

        const sessionCookie = cookies['wc_session'];
        if (!sessionCookie) {
          return null;
        }

        // Decode JWT (simple base64 decode of payload)
        const parts = sessionCookie.split('.');
        if (parts.length !== 3) {
          return null;
        }

        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return null;
        }

        return {
          userId: payload.sub || payload.userId,
          nickname: payload.nickname,
          approved: payload.approved || false,
          colboNumber: payload.colboNumber || '',
          tokenExp: payload.exp,
        } as Session;
      } catch (error) {
        console.error('Failed to parse session cookie:', error);
        return null;
      }
    };

    setSession(getSessionFromCookie());
  }, []);

  return session;
};

/**
 * Utility function to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const session = useSession();
  return !!session;
};

/**
 * Utility function to check if user is approved
 */
export const useIsApproved = (): boolean => {
  const session = useSession();
  return !!(session?.approved);
};

/**
 * Logout function that clears the session cookie
 */
export const logout = (): void => {
  // Clear the session cookie
  document.cookie = 'wc_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Redirect to home page
  window.location.href = '/';
}; 