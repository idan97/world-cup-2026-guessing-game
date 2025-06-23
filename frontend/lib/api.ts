// Simple HTTP client that works with Clerk auth
const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

// HTTP methods
export const http = {
  get: (url: string) => apiCall(url),
  post: (url: string, data?: unknown) => apiCall(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: (url: string, data?: unknown) => apiCall(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: (url: string) => apiCall(url, { method: 'DELETE' }),
};

// SWR fetcher (just uses GET)
export const fetcher = (url: string) => http.get(url);

// Simple API functions
export const joinLeague = (joinCode: string) => http.post(`/leagues/${joinCode}/join`);

// URL builders for SWR keys
export const apiUrls = {
  leaderboard: (leagueId: string, limit = 10) => `/leagues/${leagueId}/leaderboard?limit=${limit}`,
  myForm: (leagueId: string) => `/leagues/${leagueId}/forms/me`,
  nextMatches: (userId?: string, window = '2d') => `/matches/next${userId ? `?userId=${userId}&window=${window}` : ''}`,
  compareData: (leagueId: string) => `/leagues/${leagueId}/forms/me/compare`,
}; 