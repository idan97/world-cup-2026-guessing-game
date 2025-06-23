'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useLeague } from '../../lib/useLeague';
import { fetcher, joinLeague } from '../../lib/api';
import type { League } from '../../lib/types';

export default function LeagueSwitcher() {
  const { leagueId, setLeagueId } = useLeague();
  const [isOpen, setIsOpen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const { data: leagues = [], mutate } = useSWR<League[]>('/leagues', fetcher);

  const currentLeague = leagues.find(league => league.id === leagueId);

  // Handle joining a league using direct API call
  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError('');

    try {
      await joinLeague(joinCode.trim().toUpperCase());
      
      // Refresh the leagues list after joining
      await mutate();
      
      // Close modal and reset form
      setShowJoinModal(false);
      setJoinCode('');
      
      // Show success (you could add a toast here)
      alert('Successfully joined league!');
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join league');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm"
        >
          <span>League: {currentLeague?.name || leagueId}</span>
          <span className="text-sm">▼</span>
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
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    league.id === leagueId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {league.name}
                  {league.isDefault && (
                    <span className="text-xs text-gray-500 ml-2">(Default)</span>
                  )}
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

      {/* Join League Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Join League</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleJoinLeague}>
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

              {joinError && (
                <div className="mb-4 text-sm text-red-600">{joinError}</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || joinCode.length !== 6}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join League'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 