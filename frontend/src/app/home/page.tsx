'use client';

import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { fetcher, apiUrls } from '../../../lib/api';
import { useLeague } from '../../../lib/useLeague';
import Header from '../../components/Header';
import LeaderboardCard from '../../components/LeaderboardCard';
import NextFixturesCard from '../../components/NextFixturesCard';
import RulesCard from '../../components/RulesCard';
import CTAButtons from '../../components/CTAButtons';
import type { LeaderboardEntry, NextMatch, FormDraft } from '../../../lib/types';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const { leagueId } = useLeague();

  const { data: leaderboard } = useSWR<LeaderboardEntry[]>(
    user ? apiUrls.leaderboard(leagueId, 10) : null,
    fetcher
  );

  const { data: fixtures } = useSWR<NextMatch[]>(
    user ? apiUrls.nextMatches(user.id, '2d') : null,
    fetcher
  );

  const { data: userForm } = useSWR<FormDraft>(
    user ? apiUrls.myForm(leagueId) : null,
    fetcher
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 World Cup 2026 Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName || 'Player'}! Current league: <span className="font-medium">{leagueId}</span>
          </p>
        </div>

        {/* 3-column grid layout */}
        <div className="md:grid md:grid-cols-3 md:gap-6 space-y-6 md:space-y-0">
          <LeaderboardCard data={leaderboard || []} currentUserId={user?.id} />
          <NextFixturesCard data={fixtures || []} />
          <RulesCard />
          
          {/* CTA buttons span full width */}
          <div className="md:col-span-3">
            <CTAButtons formId={userForm?.id} />
          </div>
        </div>

        {/* Success Message for Authentication */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Dashboard Ready! 🎉
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your dashboard is now league-aware and ready for predictions. You&apos;re viewing data for the <strong>{leagueId}</strong> league.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 