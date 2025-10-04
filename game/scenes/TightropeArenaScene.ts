import * as Phaser from 'phaser';
import type { LevelData } from '@/types/game';
import { ARENA_THEMES } from '@/lib/circus-theme';

/**
 * Arena 1: Tightrope Walkway
 * Theme: High-wire circus performer balancing above the crowd
 * Mechanics: Balance meter, wind gusts, narrow platforms (tightropes)
 */
export class TightropeArenaScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private finishZone!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  private startTime: number = 0;
  private gameStarted: boolean = false;
  private gamePaused: boolean = false;
  private gameFinished: boolean = false;
  private timerText!: Phaser.GameObjects.Text;
  private balanceMeter!: Phaser.GameObjects.Graphics;
  private balanceMeterBg!: Phaser.GameObjects.Graphics;

  private levelData!: LevelData;
  private onComplete!: (timeMs: number) => void;
  private checkpointX: number = 0;
  private checkpointY: number = 0;

  // Tightrope-specific
  private balance: number = 0; // -100 to 100, 0 is balanced
  private balanceDecay: number = 0.5; // How fast balance returns to center
  private isOnTightrope: boolean = false;
  private windTimer!: Phaser.Time.TimerEvent;
  private crowdAmbience!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'TightropeArenaScene' });
  }

  init(data: { levelData: LevelData; onComplete: (timeMs: number) => void }) {
    this.levelData = data.levelData;
    this.onComplete = data.onComplete;
  }

  create() {
    const theme = ARENA_THEMES[1];

    // Set circus atmosphere background
    this.cameras.main.setBackgroundColor(theme.backgroundColor);

    // Create big top interior atmosphere
    this.createCircusAtmosphere();

    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.group();

    // Create level elements
    this.createTightropes();
    this.createObstacles();
    this.createFinishLine();
    this.createPlayer();

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Set up collisions
    this.physics.add.collider(this.player, this.platforms, this.onTightropeContact, undefined, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.finishZone, this.reachFinish, undefined, this);

    // Create HUD
    this.createHUD();

    // Set checkpoint
    this.checkpointX = this.levelData.startPoint.x;
    this.checkpointY = this.levelData.startPoint.y;

    // Start wind gusts
    this.startWindEffects();

    // Show countdown
    this.showCountdown();
  }

  createCircusAtmosphere() {
    // Audience silhouettes at bottom
    const audienceY = 650;
    for (let i = 0; i < 30; i++) {
      const audience = this.add.ellipse(
        i * 45,
        audienceY + Math.random() * 30,
        30 + Math.random() * 20,
        40 + Math.random() * 30,
        0x1a0a0a,
        0.6
      );
      audience.setScrollFactor(0.8);
    }

    // Spotlights from above
    const spotlight1 = this.add.circle(200, 100, 80, 0xFFFFFF, 0.1);
    const spotlight2 = this.add.circle(600, 100, 80, 0xFFFFFF, 0.1);
    const spotlight3 = this.add.circle(1000, 100, 80, 0xFFFFFF, 0.1);

    this.tweens.add({
      targets: [spotlight1, spotlight2, spotlight3],
      alpha: { from: 0.05, to: 0.15 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Curtain drapes on sides
    this.add.rectangle(0, 360, 100, 720, 0x8B0000, 0.3).setOrigin(0, 0.5);
    this.add.rectangle(1280, 360, 100, 720, 0x8B0000, 0.3).setOrigin(1, 0.5);
  }

  createTightropes() {
    this.levelData.platforms.forEach((platformData) => {
      // For tightrope, make platforms very narrow visually
      const isGround = platformData.y > 650;
      const ropeWidth = isGround ? platformData.width : 4; // Thin rope visual

      // Create visual rope
      const rope = this.add.rectangle(
        platformData.x + platformData.width / 2,
        platformData.y + platformData.height / 2,
        ropeWidth,
        isGround ? platformData.height : 2,
        isGround ? 0x8B4513 : 0xD4AF37 // Ground or golden rope
      );

      // Add platform to physics (keep original hitbox for easier gameplay)
      const platform = this.add.rectangle(
        platformData.x + platformData.width / 2,
        platformData.y + platformData.height / 2,
        platformData.width,
        platformData.height,
        0x000000,
        0 // Invisible hitbox
      );
      this.platforms.add(platform);

      // Add pole supports for tightropes
      if (!isGround) {
        const leftPole = this.add.rectangle(
          platformData.x,
          platformData.y + platformData.height / 2,
          6,
          600,
          0x8B4513
        );
        leftPole.setOrigin(0.5, 0);

        const rightPole = this.add.rectangle(
          platformData.x + platformData.width,
          platformData.y + platformData.height / 2,
          6,
          600,
          0x8B4513
        );
        rightPole.setOrigin(0.5, 0);
      }
    });
  }

  createObstacles() {
    // Create flying objects (juggling pins) that pass by
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.spawnFlyingObstacle();
        }
      },
      loop: true,
    });
  }

  spawnFlyingObstacle() {
    const startX = Math.random() > 0.5 ? -50 : 1330;
    const y = 200 + Math.random() * 300;
    const endX = startX < 0 ? 1330 : -50;

    const obstacle = this.physics.add.sprite(startX, y, '');

    // Create juggling pin visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF6B6B, 1);
    graphics.fillRect(-5, -15, 10, 30);
    graphics.fillCircle(0, -15, 8);
    graphics.fillCircle(0, 15, 8);
    graphics.generateTexture('pin', 20, 50);
    graphics.destroy();

    obstacle.setTexture('pin');
    (obstacle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.obstacles.add(obstacle);

    // Animate across screen
    this.tweens.add({
      targets: obstacle,
      x: endX,
      duration: 4000,
      onComplete: () => obstacle.destroy(),
    });

    // Rotate
    this.tweens.add({
      targets: obstacle,
      angle: 360,
      duration: 1000,
      repeat: -1,
    });
  }

  createFinishLine() {
    const finishX = this.levelData.finishLine.x;
    const finishY = this.levelData.finishLine.y;

    this.finishZone = this.add.rectangle(finishX, finishY, 50, 100, 0xFFD700);
    this.physics.add.existing(this.finishZone);
    (this.finishZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Animated flag
    const flag = this.add.text(finishX, finishY - 60, '🏁 FINISH', {
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: flag,
      y: finishY - 70,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  createPlayer() {
    const startX = this.levelData.startPoint.x;
    const startY = this.levelData.startPoint.y;

    this.player = this.physics.add.sprite(startX, startY, '');

    // Create acrobat performer visual (pink outfit)
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF69B4, 1);
    graphics.fillCircle(0, 0, 16);
    // Add sequin sparkle effect
    graphics.fillStyle(0xFFFFFF, 0.8);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      graphics.fillCircle(Math.cos(angle) * 12, Math.sin(angle) * 12, 2);
    }
    graphics.generateTexture('performer', 32, 32);
    graphics.destroy();

    this.player.setTexture('performer');
    this.player.setCollideWorldBounds(false);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(32, 32);
  }

  createHUD() {
    // Timer
    this.timerText = this.add.text(16, 16, 'Time: 00:00.000', {
      fontSize: '24px',
      color: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      fontFamily: 'Orbitron, monospace',
    });
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);

    // Balance Meter
    const meterX = this.cameras.main.centerX;
    const meterY = 80;

    this.add.text(meterX, meterY - 30, 'BALANCE', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.balanceMeterBg = this.add.graphics();
    this.balanceMeterBg.setScrollFactor(0).setDepth(99);

    this.balanceMeter = this.add.graphics();
    this.balanceMeter.setScrollFactor(0).setDepth(100);

    this.updateBalanceMeter();

    // Instructions
    const instructions = this.add.text(
      this.cameras.main.centerX,
      16,
      'Keep Balanced on the Tightrope! | Arrow Keys/WASD/Space | ESC to Pause',
      {
        fontSize: '14px',
        color: '#FFFFFF',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );
    instructions.setOrigin(0.5, 0);
    instructions.setScrollFactor(0);
    instructions.setDepth(100);
  }

  updateBalanceMeter() {
    const meterX = this.cameras.main.centerX;
    const meterY = 80;
    const meterWidth = 200;
    const meterHeight = 20;

    // Background
    this.balanceMeterBg.clear();
    this.balanceMeterBg.fillStyle(0x333333, 0.8);
    this.balanceMeterBg.fillRect(meterX - meterWidth / 2, meterY, meterWidth, meterHeight);
    this.balanceMeterBg.lineStyle(2, 0xFFFFFF, 1);
    this.balanceMeterBg.strokeRect(meterX - meterWidth / 2, meterY, meterWidth, meterHeight);

    // Center line
    this.balanceMeterBg.lineStyle(2, 0x00FF00, 0.5);
    this.balanceMeterBg.lineBetween(meterX, meterY, meterX, meterY + meterHeight);

    // Balance indicator
    this.balanceMeter.clear();
    const balancePercent = this.balance / 100; // -1 to 1
    const indicatorX = meterX + (balancePercent * meterWidth / 2);

    // Color based on balance severity
    const absBalance = Math.abs(this.balance);
    let color = 0x00FF00; // Green (balanced)
    if (absBalance > 60) color = 0xFF0000; // Red (danger)
    else if (absBalance > 30) color = 0xFFFF00; // Yellow (caution)

    this.balanceMeter.fillStyle(color, 0.8);
    this.balanceMeter.fillRect(indicatorX - 3, meterY - 5, 6, meterHeight + 10);
  }

  startWindEffects() {
    // Random wind gusts that push the player
    this.windTimer = this.time.addEvent({
      delay: 5000 + Math.random() * 5000,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused && this.isOnTightrope) {
          const windForce = (Math.random() - 0.5) * 60; // -30 to +30
          this.balance += windForce;
          this.balance = Phaser.Math.Clamp(this.balance, -100, 100);

          // Visual wind effect
          const windText = this.add.text(
            this.player.x,
            this.player.y - 50,
            '💨',
            { fontSize: '32px' }
          );
          this.tweens.add({
            targets: windText,
            alpha: 0,
            x: windText.x + windForce,
            duration: 1000,
            onComplete: () => windText.destroy(),
          });
        }
      },
      loop: true,
    });
  }

  showCountdown() {
    const countdownText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '3',
      {
        fontSize: '72px',
        color: '#FFD700',
        stroke: '#8B0000',
        strokeThickness: 8,
        fontFamily: 'Impact',
      }
    );
    countdownText.setOrigin(0.5);
    countdownText.setDepth(1000);

    let count = 3;
    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(count.toString());
        } else {
          countdownText.setText('GO!');
          this.time.delayedCall(500, () => {
            countdownText.destroy();
            this.startGame();
          });
        }
      },
    });
  }

  startGame() {
    this.gameStarted = true;
    this.startTime = Date.now();
  }

  update() {
    if (!this.gameStarted || this.gamePaused || this.gameFinished) {
      return;
    }

    // Update timer
    const elapsed = Date.now() - this.startTime;
    this.timerText.setText(this.formatTime(elapsed));

    // Handle input
    this.handleInput();

    // Update balance
    this.updateBalance();
    this.updateBalanceMeter();

    // Check if player fell
    if (this.player.y > 750) {
      this.respawnPlayer();
    }

    // Check ESC for pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
    }
  }

  handleInput() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 200;

    // Horizontal movement affects balance
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      if (this.isOnTightrope) {
        this.balance -= 0.8; // Moving left shifts balance left
      }
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      if (this.isOnTightrope) {
        this.balance += 0.8; // Moving right shifts balance right
      }
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (
      (Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      body.touching.down
    ) {
      this.player.setVelocityY(-500);
    }

    // Clamp balance
    this.balance = Phaser.Math.Clamp(this.balance, -100, 100);
  }

  updateBalance() {
    // Natural balance decay toward center
    if (this.isOnTightrope) {
      if (this.balance > 0) {
        this.balance -= this.balanceDecay;
        if (this.balance < 0) this.balance = 0;
      } else if (this.balance < 0) {
        this.balance += this.balanceDecay;
        if (this.balance > 0) this.balance = 0;
      }

      // Tilt player visual based on balance
      const tilt = (this.balance / 100) * 15; // -15 to +15 degrees
      this.player.setAngle(tilt);

      // If too unbalanced, player falls
      if (Math.abs(this.balance) > 95) {
        this.respawnPlayer();
      }
    } else {
      // Reset balance when not on rope
      this.balance = 0;
      this.player.setAngle(0);
    }
  }

  onTightropeContact() {
    this.isOnTightrope = true;
  }

  hitObstacle() {
    if (!this.gameFinished) {
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    this.player.setPosition(this.checkpointX, this.checkpointY);
    this.player.setVelocity(0, 0);
    this.balance = 0;
    this.player.setAngle(0);

    // Flash effect
    this.cameras.main.flash(200, 255, 0, 0);
  }

  reachFinish() {
    if (!this.gameFinished) {
      this.gameFinished = true;
      const finalTime = Date.now() - this.startTime;

      // Victory animation
      this.player.setVelocity(0, 0);
      this.player.setAngle(0);

      const victoryText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        '🏆 PERFORMANCE COMPLETE! 🏆\n' + this.formatTime(finalTime),
        {
          fontSize: '48px',
          color: '#FFD700',
          stroke: '#8B0000',
          strokeThickness: 6,
          align: 'center',
          fontFamily: 'Impact',
        }
      );
      victoryText.setOrigin(0.5);
      victoryText.setDepth(1000);

      // Confetti
      this.cameras.main.flash(500, 255, 215, 0);

      this.time.delayedCall(1500, () => {
        if (this.onComplete) {
          this.onComplete(finalTime);
        }
      });
    }
  }

  togglePause() {
    this.gamePaused = !this.gamePaused;

    if (this.gamePaused) {
      this.physics.pause();
      if (this.windTimer) {
        this.windTimer.paused = true;
      }

      const pauseText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'PAUSED\nPress ESC to Resume',
        {
          fontSize: '48px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center',
        }
      );
      pauseText.setOrigin(0.5);
      pauseText.setDepth(1000);
      pauseText.setName('pauseText');
    } else {
      this.physics.resume();
      if (this.windTimer) {
        this.windTimer.paused = false;
      }

      const pauseText = this.children.getByName('pauseText');
      if (pauseText) {
        pauseText.destroy();
      }
    }
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `Time: ${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
}
