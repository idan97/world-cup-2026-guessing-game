'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LeagueSwitcher from './LeagueSwitcher';
;

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

            <nav className="hidden md:flex space-x-4 space-x-reverse">
              <Link
                href="/home"
                className={`hover:text-blue-300 transition-colors ${
                  pathname === '/home' ? 'text-blue-300' : ''
                }`}
              >
                בית
              </Link>
              <Link
                href="/forms/bracket"
                className={`hover:text-blue-300 transition-colors ${
                  pathname === '/forms/bracket' ? 'text-blue-300' : ''
                }`}
              >
                טופס ניבויים
              </Link>
              <Link
                href="/leaderboard"
                className={`hover:text-blue-300 transition-colors ${
                  pathname === '/leaderboard' ? 'text-blue-300' : ''
                }`}
              >
                טבלת דירוג
              </Link>
              <Link
                href="/simulate"
                className={`hover:text-violet-300 transition-colors ${
                  pathname === '/simulate' ? 'text-violet-300' : ''
                }`}
              >
                🔮 What If?
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