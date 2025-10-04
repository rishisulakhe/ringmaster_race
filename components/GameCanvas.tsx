'use client';

import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { TightropeArenaScene } from '@/game/scenes/TightropeArenaScene';
import { ClownAlleyScene } from '@/game/scenes/ClownAlleyScene';
import { JugglingTunnelScene } from '@/game/scenes/JugglingTunnelScene';
import { GameScene } from '@/game/scenes/GameScene';
import { ResultScene } from '@/game/scenes/ResultScene';
import { BootScene } from '@/game/scenes/BootScene';
import { GAME_CONFIG } from '@/game/config';
import type { LevelData } from '@/types/game';

interface GameCanvasProps {
  levelData: LevelData;
  arenaId: string;
  onComplete: (timeMs: number) => void;
}

export function GameCanvas({ levelData, arenaId, onComplete }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only initialize Phaser on the client side
    if (typeof window === 'undefined' || !containerRef.current) {
      return;
    }

    // Prevent multiple initializations
    if (gameRef.current) {
      return;
    }

    // Determine which scene to use based on arenaId
    let gameSceneClass;
    let sceneKey;

    switch (arenaId) {
      case 'arena1':
        gameSceneClass = TightropeArenaScene;
        sceneKey = 'TightropeArenaScene';
        break;
      case 'arena2':
        gameSceneClass = ClownAlleyScene;
        sceneKey = 'ClownAlleyScene';
        break;
      case 'arena3':
        gameSceneClass = JugglingTunnelScene;
        sceneKey = 'JugglingTunnelScene';
        break;
      default:
        gameSceneClass = GameScene;
        sceneKey = 'GameScene';
    }

    const config: Phaser.Types.Core.GameConfig = {
      ...GAME_CONFIG,
      parent: containerRef.current,
      scene: [BootScene, gameSceneClass, ResultScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Wait for game to be ready, then start with level data
    game.events.once('ready', () => {
      setIsLoading(false);
      const scene = game.scene.getScene(sceneKey);
      if (scene) {
        game.scene.start(sceneKey, {
          levelData,
          onComplete,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [levelData, arenaId, onComplete]);

  return (
    <div className="relative w-full flex justify-center items-center bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-4 border-amber-600">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 text-white">
          <div className="text-6xl mb-4 animate-bounce">🎪</div>
          <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-alfa-slab)' }}>
            Preparing the Stage...
          </div>
        </div>
      )}
      <div ref={containerRef} id="game-container" className="w-full max-w-[1280px]" />
    </div>
  );
}