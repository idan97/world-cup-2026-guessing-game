'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { createAuthenticatedApi, http } from './api';

// Hook that returns authenticated API functions
export function useApi() {
  const { getToken } = useAuth();

  const getAuthenticatedApi = useCallback(async () => {
    const token = await getToken();
    return createAuthenticatedApi(token || '');
  }, [getToken]);

  // Convenience methods that handle token automatically
  const createForm = useCallback(
    async (nickname: string, picks?: Parameters<ReturnType<typeof createAuthenticatedApi>['createForm']>[1]) => {
      const api = await getAuthenticatedApi();
      return api.createForm(nickname, picks);
    },
    [getAuthenticatedApi]
  );

  const savePicks = useCallback(
    async (formId: string, picks: Parameters<ReturnType<typeof createAuthenticatedApi>['savePicks']>[1]) => {
      const api = await getAuthenticatedApi();
      return api.savePicks(formId, picks);
    },
    [getAuthenticatedApi]
  );

  const submitForm = useCallback(
    async (formId: string) => {
      const api = await getAuthenticatedApi();
      return api.submitForm(formId);
    },
    [getAuthenticatedApi]
  );

  const joinLeague = useCallback(
    async (joinCode: string) => {
      const token = await getToken();
      return http.post(`/leagues/${joinCode}/join`, undefined, token || '');
    },
    [getToken]
  );

  // Predictions API
  const saveMatchPredictions = useCallback(
    async (predictions: Array<{ matchId: string; predScoreA: number; predScoreB: number }>) => {
      const token = await getToken();
      return http.post('/predictions/matches', { predictions }, token || '');
    },
    [getToken]
  );

  const saveAdvancePredictions = useCallback(
    async (predictions: Array<{ stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F'; teamId: string }>) => {
      const token = await getToken();
      return http.post('/predictions/advances', { predictions }, token || '');
    },
    [getToken]
  );

  const saveTopScorer = useCallback(
    async (playerName: string) => {
      const token = await getToken();
      return http.post('/predictions/top-scorer', { playerName }, token || '');
    },
    [getToken]
  );

  return {
    createForm,
    savePicks,
    submitForm,
    joinLeague,
    saveMatchPredictions,
    saveAdvancePredictions,
    saveTopScorer,
  };
}

