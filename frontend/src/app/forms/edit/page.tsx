'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { fetcher, api, apiUrls } from '../../../../lib/api';
import Header from '../../../components/Header';
import FormCreation from './components/FormCreation';
import FormInfo from './components/FormInfo';
import MatchPicksSection from './components/MatchPicksSection';
import AdvancePicksSection from './components/AdvancePicksSection';
import TopScorerSection from './components/TopScorerSection';
import FormActions from './components/FormActions';
import MessageBanner from './components/MessageBanner';
import type { FormData, MatchPick, AdvancePick } from './types';

export default function FormEditPage() {
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Match picks state
  const [matchPicks, setMatchPicks] = useState<MatchPick[]>([]);
  const [newMatchPick, setNewMatchPick] = useState<MatchPick>({
    matchId: 1,
    predScoreA: 0,
    predScoreB: 0,
    predOutcome: 'D',
  });

  // Advance picks state
  const [advancePicks, setAdvancePicks] = useState<AdvancePick[]>([]);
  const [newAdvancePick, setNewAdvancePick] = useState<AdvancePick>({
    stage: 'R32',
    teamId: '',
  });

  // Top scorer state
  const [topScorer, setTopScorer] = useState('');

  // Fetch existing form
  const { data: existingFormResponse, mutate: mutateForm } = useSWR<{ success: boolean; data?: FormData }>(
    user ? apiUrls.myForm() : null,
    fetcher,
    {
      onErrorRetry: (error) => {
        // Don't retry on 404 (form doesn't exist)
        if (error.message.includes('404')) {
          return;
        }
      },
    }
  );

  useEffect(() => {
    if (existingFormResponse?.data) {
      setFormData(existingFormResponse.data);
      setNickname(existingFormResponse.data.nickname);
    }
  }, [existingFormResponse]);

  // Create form if doesn't exist
  const handleCreateForm = async () => {
    if (!nickname.trim()) {
      setMessage({ type: 'error', text: 'Nickname is required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.createForm(nickname);
      if (response.data) {
        setFormData(response.data);
        setMessage({ type: 'success', text: 'Form created successfully!' });
        await mutateForm();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error creating form: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save picks as draft
  const handleSavePicks = async () => {
    if (!formData) {
      setMessage({ type: 'error', text: 'Please create a form first' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const picks = {
        matchPicks: matchPicks.length > 0 ? matchPicks : undefined,
        advancePicks: advancePicks.length > 0 ? advancePicks : undefined,
        topScorerPicks: topScorer ? [{ playerName: topScorer }] : undefined,
      };

      await api.savePicks(formData.id, picks);
      setMessage({ type: 'success', text: 'Picks saved successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error saving picks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit form as final
  const handleSubmitForm = async () => {
    if (!formData) {
      setMessage({ type: 'error', text: 'Please create a form first' });
      return;
    }

    if (!confirm('Are you sure you want to submit your final predictions? This cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Save picks first
      const picks = {
        matchPicks: matchPicks.length > 0 ? matchPicks : undefined,
        advancePicks: advancePicks.length > 0 ? advancePicks : undefined,
        topScorerPicks: topScorer ? [{ playerName: topScorer }] : undefined,
      };
      await api.savePicks(formData.id, picks);

      // Then submit
      const response = await api.submitForm(formData.id);
      if (response.data) {
        setFormData({ ...formData, isFinal: true });
        setMessage({ type: 'success', text: 'Form submitted successfully!' });
        await mutateForm();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add match pick
  const addMatchPick = () => {
    if (newMatchPick.matchId > 0) {
      setMatchPicks([...matchPicks, { ...newMatchPick }]);
      setNewMatchPick({
        matchId: newMatchPick.matchId + 1,
        predScoreA: 0,
        predScoreB: 0,
        predOutcome: 'D',
      });
    }
  };

  // Remove match pick
  const removeMatchPick = (index: number) => {
    setMatchPicks(matchPicks.filter((_, i) => i !== index));
  };

  // Add advance pick
  const addAdvancePick = () => {
    if (newAdvancePick.teamId.trim()) {
      setAdvancePicks([...advancePicks, { ...newAdvancePick }]);
      setNewAdvancePick({
        stage: 'R32',
        teamId: '',
      });
    }
  };

  // Remove advance pick
  const removeAdvancePick = (index: number) => {
    setAdvancePicks(advancePicks.filter((_, i) => i !== index));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isFormFinal = formData?.isFinal ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit My Guesses</h1>
          <p className="text-gray-600">Fill out your predictions for the World Cup 2026</p>
        </div>

        <MessageBanner message={message} />

        {!formData && (
          <FormCreation
            nickname={nickname}
            onNicknameChange={setNickname}
            onCreate={handleCreateForm}
            isLoading={isLoading}
          />
        )}

        {formData && (
          <>
            <FormInfo nickname={formData.nickname} isFinal={isFormFinal} />

            <MatchPicksSection
              picks={matchPicks}
              newPick={newMatchPick}
              onNewPickChange={setNewMatchPick}
              onAdd={addMatchPick}
              onRemove={removeMatchPick}
              isFormFinal={isFormFinal}
            />

            <AdvancePicksSection
              picks={advancePicks}
              newPick={newAdvancePick}
              onNewPickChange={setNewAdvancePick}
              onAdd={addAdvancePick}
              onRemove={removeAdvancePick}
              isFormFinal={isFormFinal}
            />

            <TopScorerSection
              topScorer={topScorer}
              onTopScorerChange={setTopScorer}
              isFormFinal={isFormFinal}
            />

            {!isFormFinal && (
              <FormActions
                onSave={handleSavePicks}
                onSubmit={handleSubmitForm}
                isSaving={isSaving}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
