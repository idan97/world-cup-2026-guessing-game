'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { apiUrls } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import type { FormDraft } from '../../lib/types';

export default function FormExample() {
  const api = useApi();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Use SWR to fetch the user's form data (fetcher provided by SWRConfig)
  const { data: formData, mutate } = useSWR<FormDraft>(apiUrls.myForm(), {
    shouldRetryOnError: false,
    errorRetryCount: 0,
  });

  // Save form draft using direct API call
  const handleSave = async () => {
    if (!formData?.id) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      await api.savePicks(formData.id, {
        matchPicks: [],
        advancePicks: [],
        topScorerPicks: formData?.topScorer
          ? [{ playerName: formData.topScorer }]
          : [],
      });

      // Refresh the form data after saving
      await mutate();

      setMessage('Form saved successfully!');
    } catch (error) {
      setMessage(
        `Error saving form: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Submit final form using direct API call
  const handleSubmit = async () => {
    if (!formData?.id) {
      return;
    }

    if (
      !confirm(
        'Are you sure you want to submit your final predictions? This cannot be undone.',
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await api.submitForm(formData.id);

      // Refresh the form data after submitting
      await mutate();

      setMessage('Form submitted successfully!');
    } catch (error) {
      setMessage(
        `Error submitting form: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Form Example</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Form ID: {formData.id}</p>
          <p className="text-sm text-gray-600">
            Status: {formData.isFinal ? 'Final' : 'Draft'}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded text-sm ${
              message.includes('Error')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || formData.isFinal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.isFinal}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Final'}
          </button>
        </div>
      </div>
    </div>
  );
}
