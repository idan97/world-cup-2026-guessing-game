# Task 03: Clerk Authentication Flow

## Objective

Implement the complete authentication flow using Clerk, including sign-in components, middleware protection, and session management.

## Requirements

- [ ] Landing page with Clerk sign-in modal
- [ ] Clerk middleware for route protection
- [ ] Sign-in and sign-up components
- [ ] Automatic session management via Clerk
- [ ] User profile management

## Pages to Create

### app/(public)/page.tsx - Landing Page

```typescript
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            World Cup 2024 Predictions
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Make your predictions, compete with friends, and climb the
            leaderboard!
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
                Sign In to Get Started
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>{redirect('/home')}</SignedIn>
        </div>
      </div>
    </div>
  );
}
```

### app/middleware.ts - Route Protection

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPrivateRoute = createRouteMatcher([
  '/home(.*)',
  '/forms(.*)',
  '/leaderboard(.*)',
  '/summaries(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isPrivateRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

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

## Components to Create

### components/Header.tsx

```typescript
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import LeagueSwitcher from './LeagueSwitcher';

export default function Header() {
  const { user } = useUser();

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
                className="hover:text-blue-300 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="hover:text-blue-300 transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/summaries"
                className="hover:text-blue-300 transition-colors"
              >
                Daily Digest
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <LeagueSwitcher />
            <div className="flex items-center space-x-2">
              <span className="text-sm">
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
import { clientFetcher } from '@/lib/fetcher';
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
    const fetchLeagues = async () => {
      try {
        const userLeagues = await clientFetcher<League[]>('/leagues');
        setLeagues(userLeagues);
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
      }
    };

    fetchLeagues();
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
import { useApiClient } from '@/lib/api-client';

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinCodeModal({ isOpen, onClose }: JoinCodeModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const apiClient = useApiClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.joinLeague(joinCode);

      // Refresh the page to update league context
      window.location.reload();
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

## Authentication Flow

### Clerk Configuration

1. **Sign-in Modal**: Uses Clerk's built-in modal component
2. **Automatic Redirects**: Signed-in users automatically redirect to `/home`
3. **Route Protection**: Clerk middleware protects all private routes
4. **Session Management**: Clerk handles all session state automatically

### User Experience

1. User visits landing page
2. Clicks "Sign In to Get Started"
3. Clerk modal opens with sign-in/sign-up options
4. After authentication, user is redirected to `/home`
5. All private routes are automatically protected

## API Integration

- **No custom auth endpoints needed** - Clerk handles all authentication
- Backend receives Clerk JWT tokens for authorization
- Use Clerk's `getToken()` in API calls for authentication

## Testing Scenarios

- [ ] Landing page displays correctly for signed-out users
- [ ] Sign-in modal opens and functions properly
- [ ] Successful authentication redirects to home page
- [ ] Middleware protects private routes correctly
- [ ] Middleware allows access to public routes
- [ ] User button and profile management work
- [ ] League switcher and join modal function

## Security Features

- **Automatic CSRF Protection**: Built into Clerk
- **Secure Token Handling**: Clerk manages all tokens securely
- **Session Management**: Automatic token refresh and validation
- **Route Protection**: Server-side middleware protection

## Dependencies

- Depends on: Task 01 (Project Setup with Clerk), Task 02 (Types & Utilities)
- Blocks: Task 04 (Home Dashboard)

## Estimated Time

4-6 hours (reduced due to Clerk's built-in features)

## Priority

Critical - Required for all protected features
