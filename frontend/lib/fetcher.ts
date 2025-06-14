import { ApiError } from './types';

/**
 * Wrapped fetch function with credentials and API base URL
 * Automatically includes cookies for session management
 */
export const fetcher = <T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<T> =>
  fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    ...init,
  }).then(async (response) => {
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response body is not JSON, use status text
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null as T;
    }

    return response.json() as Promise<T>;
  });

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  get: <T>(url: string) => fetcher<T>(url),
  
  post: <T>(url: string, data?: unknown) =>
    fetcher<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: <T>(url: string, data?: unknown) =>
    fetcher<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: <T>(url: string) =>
    fetcher<T>(url, {
      method: 'DELETE',
    }),
}; 