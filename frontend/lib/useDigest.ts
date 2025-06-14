'use client';

import { useState, useEffect, useRef } from 'react';
import { DailyDigest } from './types';

interface UseDigestReturn {
  digest: DailyDigest | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Hook for Server-Sent Events connection to daily digest
 * Manages connection state and automatically reconnects on failure
 */
export const useDigest = (): UseDigestReturn => {
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const connectToSSE = () => {
      try {
        const eventSource = new EventSource(
          `${process.env.NEXT_PUBLIC_API}/sse/daily`,
          { withCredentials: true }
        );

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
            console.log('Daily digest SSE connection established');
          }
        };

        eventSource.onmessage = (event) => {
          if (mounted) {
            try {
              const data = JSON.parse(event.data) as DailyDigest;
              setDigest(data);
              console.log('Received daily digest:', data.date);
            } catch (err) {
              console.error('Failed to parse digest data:', err);
              setError('Failed to parse digest data');
            }
          }
        };

        eventSource.onerror = () => {
          if (mounted) {
            setIsConnected(false);
            setError('Connection lost');
            console.warn('Daily digest SSE connection lost');

            // Attempt to reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mounted) {
                console.log('Attempting to reconnect to daily digest SSE...');
                connectToSSE();
              }
            }, 5000);
          }
        };
      } catch (err) {
        if (mounted) {
          console.error('Failed to establish SSE connection:', err);
          setError('Failed to establish connection');
          setIsConnected(false);
        }
      }
    };

    // Only connect if we have an API URL
    if (process.env.NEXT_PUBLIC_API) {
      connectToSSE();
    } else {
      console.warn('NEXT_PUBLIC_API not configured, skipping SSE connection');
    }

    return () => {
      mounted = false;
      
      // Close EventSource connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  return { digest, isConnected, error };
};

/**
 * Hook to get the latest digest with fallback to API
 * Falls back to REST API if SSE is not available
 */
export const useDigestWithFallback = (): UseDigestReturn => {
  const sseResult = useDigest();
  const [fallbackDigest, setFallbackDigest] = useState<DailyDigest | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  // If SSE fails, try to fetch latest digest via REST API
  useEffect(() => {
    if (sseResult.error && !sseResult.digest) {
      const fetchFallback = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API}/summaries/latest`,
            { credentials: 'include' }
          );
          
          if (response.ok) {
            const data = await response.json();
            setFallbackDigest(data);
            setFallbackError(null);
          } else {
            setFallbackError('Failed to fetch digest');
          }
        } catch (err) {
          console.error('Fallback digest fetch failed:', err);
          setFallbackError('Network error');
        }
      };

      fetchFallback();
    }
  }, [sseResult.error, sseResult.digest]);

  // Return SSE data if available, otherwise fallback data
  return {
    digest: sseResult.digest || fallbackDigest,
    isConnected: sseResult.isConnected,
    error: sseResult.error || fallbackError,
  };
}; 