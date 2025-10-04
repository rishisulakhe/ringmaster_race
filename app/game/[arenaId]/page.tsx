'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { GameCanvas } from '@/components/GameCanvas';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import type { LevelData } from '@/types/game';
import type { CompleteRunResponse } from '@/types/api';

// Import level data
import arena1Data from '@/game/levels/arena1.json';
import arena2Data from '@/game/levels/arena2.json';
import arena3Data from '@/game/levels/arena3.json';

const levelDataMap: Record<string, LevelData> = {
  arena1: arena1Data as LevelData,
  arena2: arena2Data as LevelData,
  arena3: arena3Data as LevelData,
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const arenaId = params.arenaId as string;

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [arenaName, setArenaName] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<CompleteRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  useEffect(() => {
    loadArenaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaId]);

  const loadArenaData = async () => {
    try {
      setLoading(true);

      // Verify arena is unlocked
      const response = await fetch(`/api/arenas/${arenaId}`);

      if (!response.ok) {
        throw new Error('Failed to load arena');
      }

      const arenaData = await response.json();

      if (!arenaData.isUnlocked) {
        router.push('/menu');
        return;
      }

      // Load level data
      const levelKey = `arena${arenaData.difficulty}`;
      const level = levelDataMap[levelKey];

      if (!level) {
        throw new Error('Level data not found');
      }

      setLevelData(level);
      setArenaName(arenaData.name);
      setGameStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (timeMs: number) => {
    try {
      const response = await fetch('/api/solo/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arenaId, timeMs }),
      });

      if (!response.ok) {
        throw new Error('Failed to save run');
      }

      const data: CompleteRunResponse = await response.json();
      setResultData(data);

      // Show celebration first if it's a world record or personal best
      if ((data.isWorldRecord || data.isNewRecord) && !celebrationShown) {
        setShowCelebration(true);
        setCelebrationShown(true);
      } else {
        setShowResult(true);
      }
    } catch (err) {
      console.error('Error saving run:', err);
      alert('Failed to save your time. Please try again.');
    }
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setGameStarted(false);
    // Reload the page to restart the game
    window.location.reload();
  };

  const handleBackToMenu = () => {
    router.push('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading arena...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">Error: {error}</div>
          <button
            onClick={() => router.push('/menu')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (showCelebration && resultData) {
    return (
      <CelebrationOverlay
        isWorldRecord={resultData.isWorldRecord}
        isPersonalBest={resultData.isNewRecord}
        timeMs={resultData.run.timeMs}
        onComplete={() => {
          setShowCelebration(false);
          setShowResult(true);
        }}
      />
    );
  }

  if (showResult && resultData) {
    return (
      <div
        className="min-h-screen p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0F1B4C 0%, #1E3A8A 50%, #663399 100%)',
        }}
      >
        {/* Animated stars */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="circus-card rounded-3xl p-8 shadow-2xl"
          >
            {/* Header */}
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-6xl font-bold text-center mb-6"
              style={{
                fontFamily: 'var(--font-alfa-slab)',
                color: '#8B0000',
                textShadow: '2px 2px 0 #FFD700',
              }}
            >
              🎪 {arenaName} Complete! 🎪
            </motion.h1>

            <div className="space-y-6">
              {/* World Record Badge */}
              {resultData.isWorldRecord && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-center border-4 border-yellow-600"
                >
                  <div className="text-8xl mb-2">🏆</div>
                  <div
                    className="text-white font-bold text-4xl"
                    style={{ fontFamily: 'var(--font-alfa-slab)' }}
                  >
                    WORLD RECORD HOLDER!
                  </div>
                </motion.div>
              )}

              {/* Time Display */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-br from-red-900 to-purple-900 rounded-2xl p-6 text-center border-4 border-gold"
              >
                <div className="text-yellow-300 mb-2 text-xl font-bold" style={{ fontFamily: 'var(--font-righteous)' }}>
                  Your Time
                </div>
                <div
                  className="text-yellow-400 font-mono text-6xl font-bold"
                  style={{ fontFamily: 'var(--font-orbitron)', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}
                >
                  {formatTime(resultData.run.timeMs)}
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-800 to-blue-900 rounded-2xl p-6 text-center border-3 border-purple-600"
                >
                  <div className="text-cream mb-2 font-bold" style={{ fontFamily: 'var(--font-righteous)' }}>
                    Global Rank
                  </div>
                  <div className="text-white text-5xl font-bold" style={{ fontFamily: 'var(--font-bungee)' }}>
                    #{resultData.run.rank}
                  </div>
                  {resultData.run.rank === 1 && <div className="text-4xl mt-2">👑</div>}
                  {resultData.run.rank === 2 && <div className="text-4xl mt-2">🥈</div>}
                  {resultData.run.rank === 3 && <div className="text-4xl mt-2">🥉</div>}
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-green-800 to-emerald-900 rounded-2xl p-6 text-center border-3 border-green-600"
                >
                  <div className="text-cream mb-2 font-bold" style={{ fontFamily: 'var(--font-righteous)' }}>
                    Personal Best
                  </div>
                  <div
                    className="text-green-300 text-4xl font-bold font-mono"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {formatTime(resultData.personalBest)}
                  </div>
                  {resultData.isNewRecord && <div className="text-3xl mt-2">⭐</div>}
                </motion.div>
              </div>

              {/* Personal Best Banner */}
              {resultData.isNewRecord && !resultData.isWorldRecord && (
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-center border-3 border-green-800"
                >
                  <div
                    className="text-white font-bold text-2xl flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-bungee)' }}
                  >
                    <span>⭐</span>
                    <span>NEW PERSONAL BEST!</span>
                    <span>⭐</span>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <motion.button
                  onClick={handlePlayAgain}
                  className="flex-1 circus-button font-bold py-5 rounded-xl text-2xl text-red-900"
                  style={{ fontFamily: 'var(--font-bungee)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 TRY AGAIN
                </motion.button>
                <motion.button
                  onClick={handleBackToMenu}
                  className="flex-1 circus-button font-bold py-5 rounded-xl text-2xl text-red-900"
                  style={{ fontFamily: 'var(--font-bungee)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏠 MAIN STAGE
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!levelData || !gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Initializing game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            🎪 {arenaName}
          </h1>
          <button
            onClick={() => router.push('/menu')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Exit
          </button>
        </div>

        <GameCanvas
          levelData={levelData}
          arenaId={arenaId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}