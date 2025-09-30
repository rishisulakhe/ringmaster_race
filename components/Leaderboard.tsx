'use client';

import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@/types/api';

interface LeaderboardProps {
  arenaId: string;
  arenaName: string;
}

export function Leaderboard({ arenaId, arenaName }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/solo/leaderboard/${arenaId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'; // Gold
    if (rank === 2) return 'text-gray-300'; // Silver
    if (rank === 3) return 'text-orange-400'; // Bronze
    return 'text-white';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 rounded-lg p-8 text-center">
        <div className="text-white text-xl">Error: {error}</div>
        <button
          onClick={fetchLeaderboard}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          🏆 {arenaName} - Top 10
        </h2>
        <button
          onClick={fetchLeaderboard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-6xl mb-4">🏁</div>
          <p className="text-xl">No times recorded yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-4 rounded-lg transition-all
                ${
                  entry.isCurrentPlayer
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105'
                    : 'bg-gray-700 hover:bg-gray-600'
                }
                ${entry.rank <= 3 ? 'border-2 border-yellow-400' : ''}
              `}
            >
              {/* Rank */}
              <div
                className={`text-2xl font-bold w-16 text-center ${getRankColor(
                  entry.rank
                )}`}
              >
                {getRankIcon(entry.rank)}
              </div>

              {/* Username */}
              <div className="flex-1 ml-4">
                <div className="text-white font-semibold text-lg">
                  {entry.username}
                  {entry.isCurrentPlayer && (
                    <span className="ml-2 text-yellow-300 text-sm">
                      (You)
                    </span>
                  )}
                </div>
                <div className="text-gray-300 text-sm">
                  {new Date(entry.completedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Time */}
              <div className={`text-2xl font-mono font-bold ${getRankColor(entry.rank)}`}>
                {formatTime(entry.timeMs)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}