'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// League context management
export const useLeague = () => {
  const searchParams = useSearchParams();
  const [leagueId, setLeagueId] = useState<string>('general');

  useEffect(() => {
    const urlLeagueId = searchParams.get('league');
    if (urlLeagueId) {
      setLeagueId(urlLeagueId);
    } else {
      // Load from localStorage as fallback
      const savedLeagueId = localStorage.getItem('selectedLeague');
      if (savedLeagueId) {
        setLeagueId(savedLeagueId);
      }
    }
  }, [searchParams]);

  const setLeague = (id: string) => {
    setLeagueId(id);
    localStorage.setItem('selectedLeague', id);
  };

  return {
    leagueId,
    setLeagueId: setLeague,
  };
}; 