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

// Predictions API functions (now using Forms API)
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

  // Save match predictions (using Forms API - requires formId and token)
  saveMatchPredictions: async (
    formId: string,
    predictions: Array<{
      matchId: string;
      predScoreA: number;
      predScoreB: number;
    }>,
    token: string
  ) => {
    const api = createAuthenticatedApi(token);
    return api.savePicks(formId, {
      matchPicks: predictions.map(p => ({
        matchId: p.matchId,
        predScoreA: p.predScoreA,
        predScoreB: p.predScoreB,
        predOutcome: p.predScoreA > p.predScoreB ? 'W' : p.predScoreA < p.predScoreB ? 'L' : 'D',
      })),
    });
  },

  // Save advance predictions (using Forms API - requires formId and token)
  saveAdvancePredictions: async (
    formId: string,
    predictions: Array<{
      stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
      teamId: string;
    }>,
    token: string
  ) => {
    const api = createAuthenticatedApi(token);
    return api.savePicks(formId, {
      advancePicks: predictions,
    });
  },

  // Save top scorer prediction (using Forms API - requires formId and token)
  saveTopScorer: async (formId: string, playerName: string, token: string) => {
    const api = createAuthenticatedApi(token);
    return api.savePicks(formId, {
      topScorerPicks: [{ playerName }],
    });
  },

  // Get my predictions (using Forms API - requires formId)
  getMyPredictions: async (formId: string, token?: string) => {
    return http.get(`/forms/${formId}/with-picks`, token);
  },
};

// URL builders for SWR keys
export const apiUrls = {
  leaderboard: (leagueId: string, limit = 10) =>
    `/leagues/${leagueId}/leaderboard?limit=${limit}`,
  myForm: () => `/forms/me`,
  myPredictions: (formId?: string) => formId ? `/forms/${formId}/with-picks` : null,
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
