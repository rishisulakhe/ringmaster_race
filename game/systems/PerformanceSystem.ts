import * as Phaser from 'phaser';

/**
 * Performance System - Crowd Excitement & Style Points
 * Tracks player performance and affects gameplay
 */
export class PerformanceSystem {
  private scene: Phaser.Scene;
  private crowdMeter: number = 50; // 0-100%
  private combo: number = 0;
  private lastActionTime: number = 0;
  private meterGraphics!: Phaser.GameObjects.Graphics;
  private meterText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  // Thresholds
  private readonly HIGH_THRESHOLD = 75;
  private readonly LOW_THRESHOLD = 25;
  private readonly COMBO_TIMEOUT = 3000; // 3 seconds to maintain combo

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createMeterUI();
  }

  private createMeterUI() {
    // Meter background
    this.meterGraphics = this.scene.add.graphics();
    this.meterGraphics.setScrollFactor(0);
    this.meterGraphics.setDepth(100);

    // Meter text
    this.meterText = this.scene.add.text(30, 150, 'CROWD\n50%', {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: 'Arial Black',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.meterText.setScrollFactor(0);
    this.meterText.setDepth(101);
    this.meterText.setOrigin(0.5);

    // Combo text
    this.comboText = this.scene.add.text(30, 400, '', {
      fontSize: '20px',
      color: '#FFD700',
      fontFamily: 'Impact',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.comboText.setScrollFactor(0);
    this.comboText.setDepth(101);
    this.comboText.setOrigin(0.5);
    this.comboText.setVisible(false);

    this.updateMeterVisual();
  }

  private updateMeterVisual() {
    const x = 20;
    const y = 200;
    const width = 20;
    const height = 150;

    this.meterGraphics.clear();

    // Background
    this.meterGraphics.fillStyle(0x000000, 0.7);
    this.meterGraphics.fillRect(x, y, width, height);

    // Border
    this.meterGraphics.lineStyle(2, 0xFFFFFF, 1);
    this.meterGraphics.strokeRect(x, y, width, height);

    // Meter fill
    const fillHeight = (this.crowdMeter / 100) * height;
    let color = 0x00FF00; // Green

    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      color = 0xFFD700; // Gold
    } else if (this.crowdMeter <= this.LOW_THRESHOLD) {
      color = 0xFF0000; // Red
    } else if (this.crowdMeter >= 50) {
      color = 0xFFFF00; // Yellow
    }

    this.meterGraphics.fillStyle(color, 0.8);
    this.meterGraphics.fillRect(x, y + height - fillHeight, width, fillHeight);

    // Threshold markers
    const highY = y + height - (this.HIGH_THRESHOLD / 100) * height;
    const lowY = y + height - (this.LOW_THRESHOLD / 100) * height;

    this.meterGraphics.lineStyle(1, 0xFFFFFF, 0.5);
    this.meterGraphics.lineBetween(x, highY, x + width, highY);
    this.meterGraphics.lineBetween(x, lowY, x + width, lowY);

    // Update text
    this.meterText.setText(`CROWD\n${Math.floor(this.crowdMeter)}%`);

    // Color text based on level
    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      this.meterText.setColor('#FFD700');
      this.meterText.setStroke('#FF8C00', 3);
    } else if (this.crowdMeter <= this.LOW_THRESHOLD) {
      this.meterText.setColor('#FF0000');
      this.meterText.setStroke('#8B0000', 3);
    } else {
      this.meterText.setColor('#FFD700');
      this.meterText.setStroke('#000000', 3);
    }
  }

  // Action rewards
  public perfectLanding() {
    this.addMeter(2, 'Perfect Landing!');
    this.addCombo();
  }

  public closeCall() {
    this.addMeter(3, 'Close Call!');
    this.addCombo();
  }

  public trickJump() {
    this.addMeter(4, 'Trick Jump!');
    this.addCombo();
  }

  public obstacleThreading() {
    this.addMeter(3, 'Threading!');
    this.addCombo();
  }

  public noHesitation(deltaTime: number) {
    // Small continuous reward for moving
    this.addMeter(deltaTime * 0.001, null);
  }

  // Penalties
  public playerFell() {
    this.addMeter(-10, 'Fell!');
    this.resetCombo();
  }

  public hitObstacle() {
    this.addMeter(-5, 'Hit!');
    this.resetCombo();
  }

  public playerStopped(deltaTime: number) {
    // Small continuous penalty for not moving
    this.addMeter(-deltaTime * 0.001, null);
  }

  public safePlay() {
    this.addMeter(-2, null);
  }

  private addMeter(amount: number, message: string | null) {
    this.crowdMeter = Phaser.Math.Clamp(this.crowdMeter + amount, 0, 100);
    this.updateMeterVisual();

    if (message) {
      this.showFloatingText(message, amount > 0 ? '#00FF00' : '#FF0000');
    }

    // Visual feedback for high/low states
    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      this.scene.cameras.main.flash(100, 255, 215, 0, false, undefined, 0.2);
    } else if (this.crowdMeter <= this.LOW_THRESHOLD) {
      this.scene.cameras.main.shake(100, 0.002);
    }
  }

  private addCombo() {
    this.combo++;
    this.lastActionTime = Date.now();
    this.updateComboDisplay();

    // Bonus for combo chains
    if (this.combo % 5 === 0) {
      this.addMeter(5, `${this.combo}x COMBO!`);
    }
  }

  private resetCombo() {
    if (this.combo > 0) {
      this.combo = 0;
      this.updateComboDisplay();
    }
  }

  private updateComboDisplay() {
    if (this.combo > 1) {
      this.comboText.setText(`${this.combo}x COMBO`);
      this.comboText.setVisible(true);

      // Pulse effect
      this.scene.tweens.add({
        targets: this.comboText,
        scale: { from: 1.5, to: 1 },
        duration: 200,
      });
    } else {
      this.comboText.setVisible(false);
    }
  }

  private showFloatingText(text: string, color: string) {
    const floatText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 100,
      text,
      {
        fontSize: '24px',
        color: color,
        fontFamily: 'Impact',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    floatText.setOrigin(0.5);
    floatText.setScrollFactor(0);
    floatText.setDepth(200);

    this.scene.tweens.add({
      targets: floatText,
      y: floatText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });
  }

  public update() {
    // Check combo timeout
    if (this.combo > 0 && Date.now() - this.lastActionTime > this.COMBO_TIMEOUT) {
      this.resetCombo();
    }
  }

  // Getters
  public getCrowdMeter(): number {
    return this.crowdMeter;
  }

  public isHighPerformance(): boolean {
    return this.crowdMeter >= this.HIGH_THRESHOLD;
  }

  public isLowPerformance(): boolean {
    return this.crowdMeter <= this.LOW_THRESHOLD;
  }

  public getTimeBonus(): number {
    // Time reduction bonus if finished with high crowd meter
    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      const bonusPercent = (this.crowdMeter - this.HIGH_THRESHOLD) / (100 - this.HIGH_THRESHOLD);
      return bonusPercent * 5000; // Up to 5 seconds bonus
    }
    return 0;
  }

  public destroy() {
    this.meterGraphics.destroy();
    this.meterText.destroy();
    this.comboText.destroy();
  }
}
