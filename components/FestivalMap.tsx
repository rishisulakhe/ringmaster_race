'use client';

import { useRouter } from 'next/navigation';
import type { ArenaResponse } from '@/types/api';

interface FestivalMapProps {
  arenas: ArenaResponse[];
}

export function FestivalMap({ arenas }: FestivalMapProps) {
  const router = useRouter();

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      default:
        return 'Unknown';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'bg-green-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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

  const handleArenaClick = (arena: ArenaResponse) => {
    if (arena.isUnlocked) {
      router.push(`/game/${arena.id}`);
    }
  };

  const isWorldRecordHolder = (arena: ArenaResponse) => {
    return (
      arena.personalBest !== null &&
      arena.worldRecord !== null &&
      arena.personalBest === arena.worldRecord
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-pink-800 to-orange-700 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold text-center text-white mb-4">
          🎪 Circus Dash: Street Rush 🎪
        </h1>
        <p className="text-2xl text-center text-yellow-300 mb-12">
          Choose Your Arena
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {arenas.map((arena) => (
            <button
              key={arena.id}
              onClick={() => handleArenaClick(arena)}
              disabled={!arena.isUnlocked}
              className={`
                relative p-6 rounded-2xl shadow-2xl transform transition-all duration-300
                ${
                  arena.isUnlocked
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105 hover:shadow-yellow-500/50 cursor-pointer'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }
              `}
            >
              {/* Lock icon for locked arenas */}
              {!arena.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl">🔒</div>
                </div>
              )}

              {/* World record holder badge */}
              {isWorldRecordHolder(arena) && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 rounded-full p-3 shadow-lg animate-pulse">
                  <div className="text-3xl">👑</div>
                </div>
              )}

              {/* Completion trophy */}
              {arena.personalBest !== null && arena.isUnlocked && (
                <div className="absolute -top-3 -left-3 text-4xl">
                  🏆
                </div>
              )}

              <div className={arena.isUnlocked ? '' : 'opacity-30'}>
                {/* Tent icon */}
                <div className="text-7xl text-center mb-4">🎪</div>

                {/* Arena name */}
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  {arena.name}
                </h2>

                {/* Difficulty badge */}
                <div className="flex justify-center mb-3">
                  <span
                    className={`${getDifficultyColor(
                      arena.difficulty
                    )} text-white px-4 py-1 rounded-full text-sm font-semibold`}
                  >
                    {getDifficultyLabel(arena.difficulty)}
                  </span>
                </div>

                {/* Description */}
                {arena.description && (
                  <p className="text-white text-center text-sm mb-4 opacity-90">
                    {arena.description}
                  </p>
                )}

                {/* Stats */}
                {arena.isUnlocked && (
                  <div className="bg-white/20 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-white text-sm">
                      <span>Your Best:</span>
                      <span className="font-mono font-bold">
                        {arena.personalBest
                          ? formatTime(arena.personalBest)
                          : '--:--:---'}
                      </span>
                    </div>
                    <div className="flex justify-between text-yellow-200 text-sm">
                      <span>World Record:</span>
                      <span className="font-mono font-bold">
                        {arena.worldRecord
                          ? formatTime(arena.worldRecord)
                          : '--:--:---'}
                      </span>
                    </div>
                  </div>
                )}

                {!arena.isUnlocked && (
                  <p className="text-white text-center text-sm mt-4">
                    Complete previous arena to unlock
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => router.push('/leaderboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            📊 Leaderboards
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            👤 My Profile
          </button>
        </div>
      </div>
    </div>
  );
}