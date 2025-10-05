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

  // Advanced features
  private streak: number = 0; // Consecutive actions without mistakes
  private maxStreak: number = 0;
  private speedMultiplier: number = 1.0; // Affects game speed rewards
  private stylePoints: number = 0;
  private styleRank: string = 'C';
  private rankText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;

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

    // Style Rank text
    this.rankText = this.scene.add.text(30, 450, 'RANK: C', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'Impact',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.rankText.setScrollFactor(0);
    this.rankText.setDepth(101);
    this.rankText.setOrigin(0.5);

    // Streak text
    this.streakText = this.scene.add.text(30, 480, '', {
      fontSize: '14px',
      color: '#00FF00',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.streakText.setScrollFactor(0);
    this.streakText.setDepth(101);
    this.streakText.setOrigin(0.5);
    this.streakText.setVisible(false);

    this.updateMeterVisual();
  }

  private updateMeterVisual() {
    const x = 20;
    const y = 200;
    const width = 25;
    const height = 150;

    this.meterGraphics.clear();

    // Background with gradient effect
    this.meterGraphics.fillStyle(0x000000, 0.8);
    this.meterGraphics.fillRect(x - 2, y - 2, width + 4, height + 4);

    // Inner background
    this.meterGraphics.fillStyle(0x1a1a1a, 0.9);
    this.meterGraphics.fillRect(x, y, width, height);

    // Meter fill with glow effect
    const fillHeight = (this.crowdMeter / 100) * height;
    let color = 0x00FF00; // Green
    let glowColor = 0x00FF00;

    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      color = 0xFFD700; // Gold
      glowColor = 0xFFFF00;
    } else if (this.crowdMeter <= this.LOW_THRESHOLD) {
      color = 0xFF0000; // Red
      glowColor = 0xFF4444;
    } else if (this.crowdMeter >= 50) {
      color = 0xFFFF00; // Yellow
      glowColor = 0xFFFF88;
    }

    // Add glow effect
    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      this.meterGraphics.fillStyle(glowColor, 0.3);
      this.meterGraphics.fillRect(x - 5, y + height - fillHeight - 5, width + 10, fillHeight + 10);
    }

    this.meterGraphics.fillStyle(color, 0.9);
    this.meterGraphics.fillRect(x, y + height - fillHeight, width, fillHeight);

    // Add shimmer effect for high meter
    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      const shimmerHeight = Math.sin(Date.now() / 200) * 10;
      this.meterGraphics.fillStyle(0xFFFFFF, 0.4);
      this.meterGraphics.fillRect(x, y + height - fillHeight + shimmerHeight, width, 3);
    }

    // Border with enhanced style
    this.meterGraphics.lineStyle(3, this.crowdMeter >= this.HIGH_THRESHOLD ? 0xFFD700 : 0xFFFFFF, 1);
    this.meterGraphics.strokeRect(x, y, width, height);

    // Threshold markers
    const highY = y + height - (this.HIGH_THRESHOLD / 100) * height;
    const lowY = y + height - (this.LOW_THRESHOLD / 100) * height;

    this.meterGraphics.lineStyle(2, 0xFFD700, 0.7);
    this.meterGraphics.lineBetween(x - 5, highY, x + width + 5, highY);
    this.meterGraphics.lineStyle(2, 0xFF0000, 0.7);
    this.meterGraphics.lineBetween(x - 5, lowY, x + width + 5, lowY);

    // Update text
    this.meterText.setText(`CROWD\n${Math.floor(this.crowdMeter)}%`);

    // Color text based on level with enhanced effects
    if (this.crowdMeter >= this.HIGH_THRESHOLD) {
      this.meterText.setColor('#FFD700');
      this.meterText.setStroke('#FF8C00', 4);
      this.meterText.setScale(1 + Math.sin(Date.now() / 300) * 0.05); // Pulse effect
    } else if (this.crowdMeter <= this.LOW_THRESHOLD) {
      this.meterText.setColor('#FF0000');
      this.meterText.setStroke('#8B0000', 4);
      this.meterText.setScale(1);
    } else {
      this.meterText.setColor('#FFFFFF');
      this.meterText.setStroke('#000000', 3);
      this.meterText.setScale(1);
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
    this.resetStreak();
  }

  public hitObstacle() {
    this.addMeter(-5, 'Hit!');
    this.resetCombo();
    this.resetStreak();
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
      // Screen edge shimmer particles
      this.createEdgeShimmer();
    } else if (this.crowdMeter <= this.LOW_THRESHOLD) {
      this.scene.cameras.main.shake(100, 0.002);
    }
  }

  private createEdgeShimmer() {
    // Create shimmer particles on screen edges
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    for (let i = 0; i < 3; i++) {
      // Left edge
      this.createShimmerParticle(10, Math.random() * height);
      // Right edge
      this.createShimmerParticle(width - 10, Math.random() * height);
    }
  }

  private createShimmerParticle(x: number, y: number) {
    const particle = this.scene.add.circle(x, y, 3, 0xFFD700, 0.8);
    particle.setScrollFactor(0);
    particle.setDepth(99);

    this.scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }

  private addCombo() {
    this.combo++;
    this.streak++;
    this.lastActionTime = Date.now();

    // Update max streak
    if (this.streak > this.maxStreak) {
      this.maxStreak = this.streak;
    }

    // Calculate speed multiplier based on streak
    this.speedMultiplier = 1.0 + (this.streak * 0.05); // 5% per action, caps naturally

    // Add style points
    const points = Math.floor(10 * this.speedMultiplier);
    this.stylePoints += points;

    this.updateComboDisplay();
    this.updateStreakDisplay();
    this.updateStyleRank();

    // Bonus for combo chains
    if (this.combo % 5 === 0) {
      this.addMeter(5, `${this.combo}x COMBO!`);
    }

    // Milestone rewards
    if (this.streak === 10) {
      this.showFloatingText('STREAK: 10! Keep Going!', '#FF00FF');
    } else if (this.streak === 25) {
      this.showFloatingText('LEGENDARY STREAK!', '#FF00FF');
      this.addMeter(10, null);
    } else if (this.streak === 50) {
      this.showFloatingText('UNSTOPPABLE!!!', '#FF00FF');
      this.addMeter(20, null);
    }
  }

  private resetCombo() {
    if (this.combo > 0) {
      this.combo = 0;
      this.updateComboDisplay();
    }
  }

  private resetStreak() {
    if (this.streak > 5) {
      this.showFloatingText(`Streak Broken: ${this.streak}`, '#FF4444');
    }
    this.streak = 0;
    this.speedMultiplier = 1.0;
    this.updateStreakDisplay();
  }

  private updateStreakDisplay() {
    if (this.streak >= 5) {
      this.streakText.setText(`🔥 ${this.streak} Streak`);
      this.streakText.setVisible(true);

      // Color based on streak level
      if (this.streak >= 25) {
        this.streakText.setColor('#FF00FF'); // Purple for legendary
      } else if (this.streak >= 10) {
        this.streakText.setColor('#FFD700'); // Gold for good
      } else {
        this.streakText.setColor('#00FF00'); // Green for starting
      }
    } else {
      this.streakText.setVisible(false);
    }
  }

  private updateStyleRank() {
    let newRank = 'C';
    let rankColor = '#FFFFFF';

    if (this.stylePoints >= 1000) {
      newRank = 'S';
      rankColor = '#FF00FF';
    } else if (this.stylePoints >= 600) {
      newRank = 'A';
      rankColor = '#FFD700';
    } else if (this.stylePoints >= 300) {
      newRank = 'B';
      rankColor = '#00FFFF';
    } else if (this.stylePoints >= 100) {
      newRank = 'C';
      rankColor = '#00FF00';
    } else {
      newRank = 'D';
      rankColor = '#AAAAAA';
    }

    if (newRank !== this.styleRank) {
      this.styleRank = newRank;
      this.rankText.setText(`RANK: ${this.styleRank}`);
      this.rankText.setColor(rankColor);

      // Rank up animation
      this.scene.tweens.add({
        targets: this.rankText,
        scale: { from: 1.8, to: 1 },
        duration: 400,
        ease: 'Back.easeOut',
      });

      if (newRank !== 'D') {
        this.showFloatingText(`RANK UP: ${newRank}!`, rankColor);
      }
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

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getMaxStreak(): number {
    return this.maxStreak;
  }

  public getStylePoints(): number {
    return this.stylePoints;
  }

  public getStyleRank(): string {
    return this.styleRank;
  }

  public destroy() {
    this.meterGraphics.destroy();
    this.meterText.destroy();
    this.comboText.destroy();
    this.rankText.destroy();
    this.streakText.destroy();
  }
}
