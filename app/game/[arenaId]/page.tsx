'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GameCanvas } from '@/components/GameCanvas';
import { ResultScene } from '@/game/scenes/ResultScene';
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

  useEffect(() => {
    loadArenaData();
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
      setShowResult(true);
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

  if (showResult && resultData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              🎪 {arenaName} Complete! 🎪
            </h1>

            <div className="space-y-6">
              {resultData.isWorldRecord && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-center animate-pulse">
                  <div className="text-6xl mb-2">🏆</div>
                  <div className="text-white font-bold text-3xl">
                    NEW WORLD RECORD!
                  </div>
                </div>
              )}

              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">Your Time</div>
                <div className="text-yellow-400 font-mono text-5xl font-bold">
                  {formatTime(resultData.run.timeMs)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-gray-400 mb-2">Rank</div>
                  <div className="text-white text-3xl font-bold">
                    #{resultData.run.rank}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-gray-400 mb-2">Personal Best</div>
                  <div className="text-green-400 text-3xl font-bold font-mono">
                    {formatTime(resultData.personalBest)}
                  </div>
                </div>
              </div>

              {resultData.isNewRecord && !resultData.isWorldRecord && (
                <div className="bg-green-600 rounded-lg p-4 text-center">
                  <div className="text-white font-bold text-xl">
                    ⭐ New Personal Best! ⭐
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg text-xl"
                >
                  🔄 Play Again
                </button>
                <button
                  onClick={handleBackToMenu}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-xl"
                >
                  🏠 Back to Menu
                </button>
              </div>
            </div>
          </div>
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