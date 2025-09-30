// Phaser Game Types

export interface LevelData {
  id: string;
  name: string;
  platforms: Platform[];
  obstacles: Obstacle[];
  startPoint: Point;
  finishLine: Point;
  background: string;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'moving';
  moveSpeed?: number;
  moveDistance?: number;
  moveAxis?: 'horizontal' | 'vertical';
}

export interface Obstacle {
  x: number;
  y: number;
  type: string;
  width?: number;
  height?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface GameConfig {
  arenaId: string;
  arenaName: string;
  levelData: LevelData;
  onComplete: (timeMs: number) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface PlayerState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isOnGround: boolean;
  isJumping: boolean;
}

export interface GameStats {
  startTime: number;
  currentTime: number;
  checkpoints: Point[];
  deaths: number;
}
