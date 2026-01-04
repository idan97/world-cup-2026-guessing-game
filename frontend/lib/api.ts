// Simple HTTP client that works with Clerk auth
// For mutations (POST/PUT/DELETE), pass token from useAuth().getToken()
const apiCall = async (url: string, options: RequestInit = {}, token?: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  
  const json = await response.json();
  // API returns { success, message, data } - extract the data
  return json.data !== undefined ? json.data : json;
};

// HTTP methods - pass token for authenticated requests
export const http = {
  get: (url: string, token?: string) => apiCall(url, {}, token),
  post: (url: string, data?: unknown, token?: string) =>
    apiCall(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, token),
  put: (url: string, data?: unknown, token?: string) =>
    apiCall(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, token),
  delete: (url: string, token?: string) => apiCall(url, { method: 'DELETE' }, token),
};

// SWR fetcher (just uses GET)
export const fetcher = (url: string) => http.get(url);

// Simple API functions
export const joinLeague = (joinCode: string) =>
  http.post(`/leagues/${joinCode}/join`);

// Form API functions - factory that creates authenticated API
export const createAuthenticatedApi = (token: string) => ({
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
    }, token);
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
    const response = await http.put(`/forms/${formId}/picks`, picks, token);
    return response;
  },

  // Submit form as final
  submitForm: async (formId: string) => {
    const response = await http.post(`/forms/${formId}/submit`, undefined, token);
    return response;
  },
});

// Legacy - for backward compatibility (will throw if used without token)
export const api = createAuthenticatedApi('');

// Predictions API functions (using new structure)
export const predictionsApi = {
  // Get all matches
  getMatches: async (params?: { stage?: string; group?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.stage) query.append('stage', params.stage);
    if (params?.group) query.append('group', params.group);
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return http.get(`/matches${queryString ? `?${queryString}` : ''}`);
  },

  // Get standings (teams)
  getStandings: async (group?: string) => {
    if (group) {
      return http.get(`/standings/${group}`);
    }
    return http.get('/standings');
  },

  // Save match predictions (new API)
  saveMatchPredictions: async (predictions: Array<{
    matchId: string;
    predScoreA: number;
    predScoreB: number;
  }>) => {
    return http.post('/predictions/matches', { predictions });
  },

  // Save advance predictions (new API)
  saveAdvancePredictions: async (predictions: Array<{
    stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
    teamId: string;
  }>) => {
    return http.post('/predictions/advances', { predictions });
  },

  // Save top scorer prediction (new API)
  saveTopScorer: async (playerName: string) => {
    return http.post('/predictions/top-scorer', { playerName });
  },

  // Get my predictions
  getMyPredictions: async () => {
    return http.get('/predictions/my');
  },
};

// URL builders for SWR keys
export const apiUrls = {
  leaderboard: (leagueId: string, limit = 10) =>
    `/leagues/${leagueId}/leaderboard?limit=${limit}`,
  myForm: () => `/forms/me`,
  myPredictions: () => `/predictions/my`,
  matches: (params?: { stage?: string; group?: string }) => {
    const query = new URLSearchParams();
    if (params?.stage) query.append('stage', params.stage);
    if (params?.group) query.append('group', params.group);
    return `/matches${query.toString() ? `?${query}` : ''}`;
  },
  standings: () => '/standings',
  nextMatches: (userId?: string, window = '2d') =>
    `/matches/next${userId ? `?userId=${userId}&window=${window}` : ''}`,
  compareData: (formId: string) => `/forms/${formId}/compare`,
};
