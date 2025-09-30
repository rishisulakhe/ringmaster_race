'use client';

import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
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

    const config: Phaser.Types.Core.GameConfig = {
      ...GAME_CONFIG,
      parent: containerRef.current,
      scene: [BootScene, GameScene, ResultScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Wait for game to be ready, then start with level data
    game.events.once('ready', () => {
      setIsLoading(false);
      const gameScene = game.scene.getScene('GameScene') as GameScene;
      if (gameScene) {
        game.scene.start('GameScene', {
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
    <div className="relative w-full flex justify-center items-center bg-gray-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-2xl">
          Loading Game...
        </div>
      )}
      <div ref={containerRef} id="game-container" className="w-full max-w-[1280px]" />
    </div>
  );
}