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
    async (
      nickname: string,
      picks?: Parameters<
        ReturnType<typeof createAuthenticatedApi>['createForm']
      >[1]
    ) => {
      const api = await getAuthenticatedApi();
      return api.createForm(nickname, picks);
    },
    [getAuthenticatedApi]
  );

  const savePicks = useCallback(
    async (
      formId: string,
      picks: Parameters<
        ReturnType<typeof createAuthenticatedApi>['savePicks']
      >[1]
    ) => {
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

  // Predictions API (now using Forms API)
  // NOTE: matchId should be matchNumber (number), not match database ID (string)
  const saveMatchPredictions = useCallback(
    async (
      formId: string,
      predictions: Array<{
        matchId: number;
        predScoreA: number;
        predScoreB: number;
      }>
    ) => {
      const api = await getAuthenticatedApi();
      return api.savePicks(formId, {
        matchPicks: predictions.map((p) => {
          const predOutcome: 'W' | 'D' | 'L' =
            p.predScoreA > p.predScoreB
              ? 'W'
              : p.predScoreA < p.predScoreB
              ? 'L'
              : 'D';
          return {
            matchId: p.matchId,
            predScoreA: p.predScoreA,
            predScoreB: p.predScoreB,
            predOutcome,
          };
        }),
      });
    },
    [getAuthenticatedApi]
  );

  const saveAdvancePredictions = useCallback(
    async (
      formId: string,
      predictions: Array<{
        stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
        teamId: string;
      }>
    ) => {
      const api = await getAuthenticatedApi();
      return api.savePicks(formId, {
        advancePicks: predictions,
      });
    },
    [getAuthenticatedApi]
  );

  const saveTopScorer = useCallback(
    async (formId: string, playerName: string) => {
      const api = await getAuthenticatedApi();
      return api.savePicks(formId, {
        topScorerPicks: [{ playerName }],
      });
    },
    [getAuthenticatedApi]
  );

  const calculateBracket = useCallback(
    async (
      matchResults: Array<{
        matchId: string;
        team1Score: number;
        team2Score: number;
      }>
    ) => {
      const api = await getAuthenticatedApi();
      return api.calculateBracket(matchResults);
    },
    [getAuthenticatedApi]
  );

  return {
    createForm,
    savePicks,
    submitForm,
    joinLeague,
    saveMatchPredictions,
    saveAdvancePredictions,
    saveTopScorer,
    calculateBracket,
  };
}
