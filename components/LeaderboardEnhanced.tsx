'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '@/types/api';

interface LeaderboardProps {
  arenaId: string;
  arenaName: string;
}

export function LeaderboardEnhanced({ arenaId, arenaName }: LeaderboardProps) {
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
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#FFFFFF';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="circus-card rounded-2xl p-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-4"
        >
          🎪
        </motion.div>
        <div className="text-red-900 text-2xl font-bold" style={{ fontFamily: 'var(--font-righteous)' }}>
          Loading Hall of Fame...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="circus-card rounded-2xl p-8 text-center border-4 border-red-600">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-red-900 text-2xl font-bold mb-4">Error: {error}</div>
        <motion.button
          onClick={fetchLeaderboard}
          className="circus-button px-6 py-3 rounded-lg font-bold text-red-900"
          style={{ fontFamily: 'var(--font-bungee)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 RETRY
        </motion.button>
      </div>
    );
  }

  return (
    <div className="circus-card rounded-3xl shadow-2xl p-8 relative overflow-hidden">
      {/* Decorative circus lights border */}
      <div className="absolute top-0 left-0 right-0 h-4 flex justify-around bg-red-900">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF1493', '#00CED1', '#32CD32'][i % 4],
            }}
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h2
            className="text-5xl font-bold mb-2"
            style={{
              fontFamily: 'var(--font-alfa-slab)',
              color: '#8B0000',
              textShadow: '2px 2px 0 #FFD700',
            }}
          >
            🏆 HALL OF FAME 🏆
          </h2>
          <p
            className="text-2xl font-semibold"
            style={{
              fontFamily: 'var(--font-righteous)',
              color: '#663399',
            }}
          >
            {arenaName} - Top 10 Performers
          </p>
        </div>
        <motion.button
          onClick={fetchLeaderboard}
          className="circus-button px-6 py-3 rounded-lg font-bold text-red-900"
          style={{ fontFamily: 'var(--font-bungee)' }}
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          🔄 REFRESH
        </motion.button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <motion.div
            className="text-9xl mb-6"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏁
          </motion.div>
          <p
            className="text-3xl font-bold"
            style={{
              fontFamily: 'var(--font-righteous)',
              color: '#663399',
            }}
          >
            No times recorded yet!
            <br />
            Be the first star performer!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative flex items-center justify-between p-5 rounded-xl transition-all
                ${
                  entry.rank === 1
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-4 border-yellow-600 shadow-lg'
                    : entry.rank === 2
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 border-4 border-gray-500'
                    : entry.rank === 3
                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 border-4 border-orange-700'
                    : 'bg-gradient-to-r from-purple-100 to-blue-100 border-3 border-purple-400'
                }
                ${entry.isCurrentPlayer ? 'ring-4 ring-green-500 scale-105' : ''}
              `}
              whileHover={{ scale: entry.isCurrentPlayer ? 1.05 : 1.02 }}
            >
              {/* Podium decoration for top 3 */}
              {entry.rank <= 3 && (
                <motion.div
                  className="absolute -top-2 -left-2 text-4xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {entry.rank === 1 && '🌟'}
                  {entry.rank === 2 && '⭐'}
                  {entry.rank === 3 && '✨'}
                </motion.div>
              )}

              {/* Rank */}
              <div className="flex items-center gap-4">
                <div
                  className="text-4xl font-bold w-20 text-center"
                  style={{
                    fontFamily: 'var(--font-bungee)',
                    color: entry.rank <= 3 ? '#000000' : getRankColor(entry.rank),
                    textShadow: entry.rank <= 3 ? '1px 1px 2px rgba(255,255,255,0.5)' : 'none',
                  }}
                >
                  {getRankIcon(entry.rank)}
                </div>

                {/* Username */}
                <div className="flex-1">
                  <div
                    className={`font-bold text-2xl ${entry.rank <= 3 ? 'text-black' : 'text-gray-900'}`}
                    style={{ fontFamily: 'var(--font-righteous)' }}
                  >
                    {entry.username}
                    {entry.isCurrentPlayer && (
                      <span className="ml-3 text-green-700 text-lg">
                        (YOU! 🎭)
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-sm font-semibold ${entry.rank <= 3 ? 'text-gray-800' : 'text-gray-600'}`}
                  >
                    📅 {new Date(entry.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div
                className={`text-3xl font-bold font-mono px-6 py-3 rounded-lg ${
                  entry.rank === 1
                    ? 'bg-yellow-600 text-white'
                    : entry.rank === 2
                    ? 'bg-gray-600 text-white'
                    : entry.rank === 3
                    ? 'bg-orange-700 text-white'
                    : 'bg-purple-600 text-white'
                }`}
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                {formatTime(entry.timeMs)}
              </div>

              {/* Sparkle effect for top 3 */}
              {entry.rank <= 3 && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-xl"
                      style={{
                        left: `${10 + i * 20}%`,
                        top: '50%',
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        y: [0, -20, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                    >
                      ✨
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom decorative border */}
      <div className="mt-8 pt-6 border-t-4 border-red-900 text-center">
        <p
          className="text-lg font-bold text-gray-700"
          style={{ fontFamily: 'var(--font-righteous)' }}
        >
          🎪 Can you claim the top spot? 🎪
        </p>
      </div>
    </div>
  );
}
