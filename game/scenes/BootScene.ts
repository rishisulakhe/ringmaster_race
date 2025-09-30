import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // TODO: Load real assets here when available
    // For now, we'll use Phaser's built-in graphics

    // Display loading text
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading...',
      {
        fontSize: '32px',
        color: '#ffffff',
      }
    );
    loadingText.setOrigin(0.5);
  }

  create() {
    // Transition to GameScene after loading
    // The GameScene key will be set dynamically when we initialize the game
    this.scene.start('GameScene');
  }
}