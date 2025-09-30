import * as Phaser from 'phaser';

export const GAME_CONFIG = {
  width: 1280,
  height: 720,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  parent: 'game-container',
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export const PLAYER_CONFIG = {
  speed: 200,
  jumpVelocity: -500,
  size: 32,
};

export const COLORS = {
  player: 0xff6b6b,
  platform: 0x4ecdc4,
  movingPlatform: 0xffe66d,
  obstacle: 0xff0000,
  finish: 0x00ff00,
  ground: 0x8b4513,
};
