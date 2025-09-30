import * as Phaser from 'phaser';

export interface ResultData {
  timeMs: number;
  isPersonalBest: boolean;
  previousBest: number | null;
  rank: number;
  isWorldRecord: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultData) {
    this.resultData = data;
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // If world record, show celebration
    if (this.resultData.isWorldRecord) {
      this.showWorldRecordCelebration();
      this.time.delayedCall(3500, () => {
        this.showResults(centerX, centerY);
      });
    } else {
      this.showResults(centerX, centerY);
    }
  }

  showWorldRecordCelebration() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Flash background
    this.cameras.main.flash(500, 255, 215, 0);

    // Create confetti particles
    const particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: 1280 },
      y: -50,
      lifespan: 3000,
      speedY: { min: 200, max: 400 },
      speedX: { min: -100, max: 100 },
      scale: { start: 1, end: 0 },
      tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
      frequency: 20,
    });

    // Create simple particle texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('particle', 10, 10);
    graphics.destroy();

    // World record text
    const wrText = this.add.text(centerX, centerY - 100, '🎉 NEW WORLD RECORD! 🎉', {
      fontSize: '64px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center',
    });
    wrText.setOrigin(0.5);

    // Animate the text
    this.tweens.add({
      targets: wrText,
      scale: { from: 0.5, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: 'Bounce.easeOut',
    });

    // Previous record display
    if (this.resultData.previousBest) {
      const oldRecordText = this.add.text(
        centerX,
        centerY + 20,
        `Previous: ${this.formatTime(this.resultData.previousBest)}`,
        {
          fontSize: '32px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
        }
      );
      oldRecordText.setOrigin(0.5);
      oldRecordText.setAlpha(0.7);
    }

    const newRecordText = this.add.text(
      centerX,
      centerY + 70,
      `New Record: ${this.formatTime(this.resultData.timeMs)}`,
      {
        fontSize: '48px',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );
    newRecordText.setOrigin(0.5);

    // Play celebration sound (placeholder - would be real sound)
    // this.sound.play('fanfare');

    // Stop particles after duration
    this.time.delayedCall(3000, () => {
      particles.stop();
      this.time.delayedCall(500, () => {
        this.children.removeAll();
      });
    });
  }

  showResults(centerX: number, centerY: number) {
    // Title
    const title = this.add.text(centerX, 100, 'Race Complete!', {
      fontSize: '56px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Time display
    const timeText = this.add.text(
      centerX,
      centerY - 80,
      `Your Time: ${this.formatTime(this.resultData.timeMs)}`,
      {
        fontSize: '48px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );
    timeText.setOrigin(0.5);

    // Personal best indicator
    if (this.resultData.isPersonalBest) {
      const pbText = this.add.text(centerX, centerY - 20, '⭐ Personal Best! ⭐', {
        fontSize: '32px',
        color: '#00FF00',
      });
      pbText.setOrigin(0.5);

      // Sparkle effect
      this.tweens.add({
        targets: pbText,
        alpha: { from: 1, to: 0.5 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else if (this.resultData.previousBest) {
      const diffText = this.add.text(
        centerX,
        centerY - 20,
        `Previous Best: ${this.formatTime(this.resultData.previousBest)}`,
        {
          fontSize: '24px',
          color: '#cccccc',
        }
      );
      diffText.setOrigin(0.5);
    }

    // Rank display
    const rankText = this.add.text(centerX, centerY + 40, `Rank: #${this.resultData.rank}`, {
      fontSize: '36px',
      color: this.getRankColor(this.resultData.rank),
      stroke: '#000000',
      strokeThickness: 4,
    });
    rankText.setOrigin(0.5);

    // Buttons
    const playAgainButton = this.createButton(
      centerX - 150,
      centerY + 150,
      'Play Again',
      () => {
        this.resultData.onPlayAgain();
      }
    );

    const menuButton = this.createButton(centerX + 150, centerY + 150, 'Back to Menu', () => {
      this.resultData.onBackToMenu();
    });
  }

  createButton(x: number, y: number, text: string, onClick: () => void) {
    const button = this.add.rectangle(x, y, 250, 60, 0x4ecdc4);
    button.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(x, y, text, {
      fontSize: '24px',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5);

    button.on('pointerover', () => {
      button.setFillStyle(0x45b7aa);
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x4ecdc4);
    });

    button.on('pointerdown', () => {
      onClick();
    });

    return button;
  }

  getRankColor(rank: number): string {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#ffffff'; // White
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
}