'use client';

import { useState, useEffect } from 'react';
import type { PlayerStats } from '@/types/api';

export function StatsDisplay() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/player/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
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

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-white text-xl">Loading stats...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-900 rounded-lg p-8 text-center">
        <div className="text-white text-xl">Error loading stats</div>
        <button
          onClick={fetchStats}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-white mb-6">📊 Your Statistics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-600 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-white">
            {stats.totalRuns}
          </div>
          <div className="text-blue-100 mt-2">Total Runs</div>
        </div>

        <div className="bg-green-600 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-white">
            {stats.completedArenas}
          </div>
          <div className="text-green-100 mt-2">Arenas Completed</div>
        </div>

        <div className="bg-purple-600 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-white">
            {stats.completedArenas}/3
          </div>
          <div className="text-purple-100 mt-2">Progress</div>
        </div>
      </div>

      {/* Best Times */}
      <h3 className="text-2xl font-bold text-white mb-4">🏆 Best Times</h3>
      <div className="space-y-3">
        {stats.bestTimes.map((time) => (
          <div
            key={time.arenaId}
            className="bg-gray-700 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <div className="text-white font-semibold text-lg">
                {time.arenaName}
              </div>
              {time.bestTime === null && (
                <div className="text-gray-400 text-sm">Not completed yet</div>
              )}
            </div>
            <div className="text-2xl font-mono font-bold text-yellow-400">
              {time.bestTime !== null ? formatTime(time.bestTime) : '--:--:---'}
            </div>
          </div>
        ))}
      </div>

      {stats.completedArenas === 3 && (
        <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-white font-bold text-xl">
            Congratulations!
          </div>
          <div className="text-white">
            You&apos;ve completed all arenas!
          </div>
        </div>
      )}
    </div>
  );
}