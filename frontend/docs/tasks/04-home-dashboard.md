# Task 04: Home Dashboard

## Objective

Build the main dashboard page combining leaderboard, next fixtures, rules, and CTA buttons with daily digest banner.

## Requirements

- [ ] Responsive 3-column grid layout
- [ ] Leaderboard card (top 10 + highlight user)
- [ ] Next fixtures card with user's picks
- [ ] Rules accordion
- [ ] CTA buttons strip
- [ ] Daily digest banner integration
- [ ] Mobile-responsive design

## Page Structure

### app/(private)/layout.tsx - Private Layout

```typescript
import { UserButton } from '@clerk/nextjs';
import Header from '@/components/Header';
import DailyDigestBanner from '@/components/DailyDigestBanner';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DailyDigestBanner />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

### app/(private)/home/page.tsx - Dashboard Page

```typescript
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { clientFetcher } from '@/lib/fetcher';
import { useLeague } from '@/lib/useLeague';
import LeaderboardCard from '@/components/LeaderboardCard';
import NextFixturesCard from '@/components/NextFixturesCard';
import RulesCard from '@/components/RulesCard';
import CTAButtons from '@/components/CTAButtons';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const { leagueId } = useLeague();

  const { data: leaderboard } = useSWR(
    user ? `/leaderboard/${leagueId}?limit=10` : null,
    clientFetcher
  );

  const { data: fixtures } = useSWR(
    user ? `/matches/next?userId=${user.id}&window=2d` : null,
    clientFetcher
  );

  const { data: userForm } = useSWR(user ? `/forms/me` : null, clientFetcher);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="md:grid md:grid-cols-3 md:gap-4">
      <LeaderboardCard data={leaderboard} currentUserId={user?.id} />
      <NextFixturesCard data={fixtures} />
      <RulesCard />
      <div className="md:col-span-3">
        <CTAButtons formId={userForm?.id} />
      </div>
    </div>
  );
}
```

## Components to Create

### components/Header.tsx

```typescript
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LeagueSwitcher from './LeagueSwitcher';

export default function Header() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <header className="bg-slate-800 text-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/home" className="text-xl font-bold">
              WC Predictions
            </Link>

            <nav className="hidden md:flex space-x-4">
              <Link
                href="/home"
                className={`hover:text-blue-300 transition-colors ${
                  pathname === '/home' ? 'text-blue-300' : ''
                }`}
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className={`hover:text-blue-300 transition-colors ${
                  pathname === '/leaderboard' ? 'text-blue-300' : ''
                }`}
              >
                Leaderboard
              </Link>
              <Link
                href="/summaries"
                className={`hover:text-blue-300 transition-colors ${
                  pathname === '/summaries' ? 'text-blue-300' : ''
                }`}
              >
                Daily Digest
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <LeagueSwitcher />
            <div className="flex items-center space-x-2">
              <span className="text-sm hidden sm:block">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### components/LeagueSwitcher.tsx

```typescript
import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useLeague } from '@/lib/useLeague';
import JoinCodeModal from './JoinCodeModal';

interface League {
  id: string;
  name: string;
  isDefault: boolean;
}

export default function LeagueSwitcher() {
  const { leagueId, setLeagueId } = useLeague();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Load user's leagues
  useEffect(() => {
    // TODO: Fetch leagues from API
  }, []);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm"
        >
          <span>League: {leagueId}</span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            <div className="py-1">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    setLeagueId(league.id);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {league.name}
                </button>
              ))}
              <hr className="my-1" />
              <button
                onClick={() => {
                  setShowJoinModal(true);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                Join League...
              </button>
            </div>
          </div>
        )}
      </div>

      <JoinCodeModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  );
}
```

### components/JoinCodeModal.tsx

```typescript
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinCodeModal({ isOpen, onClose }: JoinCodeModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Call API to join league
      // await joinLeague(joinCode);
      onClose();
    } catch (err) {
      setError('Invalid join code or league not found');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Join League</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
              required
            />
          </div>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || joinCode.length !== 6}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Joining...' : 'Join League'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### components/DailyDigestBanner.tsx

- Fetches the latest summary on load
- Dismissible with localStorage
- `bg-yellow-100 p-3 text-sm` styling
- HTML content rendering

### components/LeaderboardCard.tsx

```typescript
import { useLeague } from '@/lib/useLeague';
import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardCardProps {
  data: LeaderboardEntry[];
  currentUserId?: string;
}

export default function LeaderboardCard({
  data,
  currentUserId,
}: LeaderboardCardProps) {
  const { leagueId } = useLeague();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <span className="text-sm text-gray-500">League: {leagueId}</span>
      </div>

      <div className="space-y-2">
        {data?.slice(0, 10).map((entry) => (
          <div
            key={entry.formId}
            className={`flex justify-between items-center p-2 rounded ${
              entry.formId === currentUserId
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono w-6 text-center">
                #{entry.rank}
              </span>
              <span className="font-medium">{entry.nickname}</span>
            </div>
            <span className="font-mono text-sm">{entry.totalPoints} pts</span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href="/leaderboard"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View full leaderboard →
        </a>
      </div>
    </div>
  );
}
```

### components/NextFixturesCard.tsx

- List of upcoming matches
- Show user's predictions if any
- Kickoff time badges
- Lock indicators
- Team flags/names

### components/RulesCard.tsx

- Accordion with rules sections
- Static content (group stage, knockout, scoring)
- Collapsible sections
- Clear typography

### components/CTAButtons.tsx

```typescript
import { useLeague } from '@/lib/useLeague';

interface CTAButtonsProps {
  formId?: string;
}

export default function CTAButtons({ formId }: CTAButtonsProps) {
  const { leagueId } = useLeague();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <a
          href={`/forms/edit?league=${leagueId}`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          {formId ? 'Edit My Predictions' : 'Create Predictions'}
        </a>

        <a
          href={`/forms/compare?league=${leagueId}#simulate`}
          className="bg-green-600 hover:bg-green-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          Simulate What-If
        </a>
      </div>

      <div className="mt-3 text-center text-sm text-gray-500">
        League: {leagueId}
      </div>
    </div>
  );
}
```

## Layout Implementation

```typescript
// Tailwind grid structure
<div className="md:grid md:grid-cols-3 md:gap-4">
  <LeaderboardCard data={leaderboard} currentUserId={session.userId} />
  <NextFixturesCard data={fixtures} />
  <RulesCard />
  <div className="md:col-span-3">
    <CTAButtons formId={userFormId} />
  </div>
</div>
```

## API Integration

- `GET /leagues/${leagueId}/leaderboard?limit=10` - Top 10 standings for current league
- `GET /matches/next?userId=${userId}&window=2d` - Upcoming fixtures with user predictions
- `GET /leagues/${leagueId}/messages/latest?type=digest` - For the digest banner
- `GET /leagues` - User's leagues for the league switcher
- `POST /leagues/${joinCode}/join` - Join league by code

## Data Fetching Strategy

- Use SWR for caching and revalidation
- Loading skeletons for each card
- Error boundaries for failed requests
- Refresh on window focus

## Responsive Design

- Mobile: stacked single column
- Tablet: 2-column grid
- Desktop: 3-column grid
- CTA buttons always full-width

## Dependencies

- Depends on: Task 03 (Auth Flow)
- Blocks: None (can work in parallel with forms)

## Estimated Time

8-10 hours

## Priority

High - Primary user interface
