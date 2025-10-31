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
  post: (url: string, data?: unknown) =>
    apiCall(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (url: string, data?: unknown) =>
    apiCall(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: (url: string) => apiCall(url, { method: 'DELETE' }),
};

// SWR fetcher (just uses GET)
export const fetcher = (url: string) => http.get(url);

// Simple API functions
export const joinLeague = (joinCode: string) =>
  http.post(`/leagues/${joinCode}/join`);

// Form API functions
export const api = {
  // Create a new form
  createForm: async (
    nickname: string,
    picks?: {
      matchPicks?: Array<{
        matchId: number;
        predScoreA: number;
        predScoreB: number;
        predOutcome: 'W' | 'D' | 'L';
      }>;
      advancePicks?: Array<{
        stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
        teamId: string;
      }>;
      topScorerPicks?: Array<{ playerName: string }>;
    }
  ) => {
    const response = await http.post('/forms', {
      nickname,
      ...(picks || {}),
    });
    return response;
  },

  // Save picks (draft)
  savePicks: async (
    formId: string,
    picks: {
      matchPicks?: Array<{
        matchId: number;
        predScoreA: number;
        predScoreB: number;
        predOutcome: 'W' | 'D' | 'L';
      }>;
      advancePicks?: Array<{
        stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
        teamId: string;
      }>;
      topScorerPicks?: Array<{ playerName: string }>;
    }
  ) => {
    const response = await http.put(`/forms/${formId}/picks`, picks);
    return response;
  },

  // Submit form as final
  submitForm: async (formId: string) => {
    const response = await http.post(`/forms/${formId}/submit`);
    return response;
  },
};

// URL builders for SWR keys
export const apiUrls = {
  leaderboard: (leagueId: string, limit = 10) =>
    `/leagues/${leagueId}/leaderboard?limit=${limit}`,
  myForm: () => `/forms/me`,
  nextMatches: (userId?: string, window = '2d') =>
    `/matches/next${userId ? `?userId=${userId}&window=${window}` : ''}`,
  compareData: (formId: string) => `/forms/${formId}/compare`,
};
