import * as Phaser from 'phaser';
import type { LevelData } from '@/types/game';
import { ARENA_THEMES } from '@/lib/circus-theme';
import { PerformanceSystem } from '@/game/systems/PerformanceSystem';

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

  // Balancing pole mechanic
  private poleGraphic!: Phaser.GameObjects.Graphics;
  private poleAngle: number = 0;
  private poleLength: number = 80;

  // Wind system
  private windWarningText!: Phaser.GameObjects.Text;
  private windDirection: number = 0; // -1 left, 0 none, 1 right
  private windForce: number = 0;
  private windFlags: Phaser.GameObjects.Graphics[] = [];

  // Advanced techniques
  private lastKeyPressTime: number = 0;
  private quickStepCounter: number = 0;
  private emergencyCatchUsed: boolean = false;
  private isFlipping: boolean = false;
  private flipStartY: number = 0;

  // Performance system
  private performanceSystem!: PerformanceSystem;
  private lastTouchDown: boolean = false;

  // Obstacle timing
  private obstacleSpeedMultiplier: number = 1;

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

    // Create balancing pole
    this.createBalancingPole();

    // Create wind indicators
    this.createWindIndicators();

    // Create performance system
    this.performanceSystem = new PerformanceSystem(this);

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
          const obstacleType = Math.floor(Math.random() * 3);
          switch (obstacleType) {
            case 0:
              this.spawnFlyingObstacle();
              break;
            case 1:
              this.spawnJugglingBalls();
              break;
            case 2:
              this.spawnFlamingHoop();
              break;
          }
        }
      },
      loop: true,
    });

    // Spawn swinging trapeze artists
    this.time.addEvent({
      delay: 8000,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.spawnTrapezeArtist();
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

    // Adjust speed based on crowd meter (dynamic difficulty)
    const baseDuration = 4000;
    const duration = baseDuration / this.obstacleSpeedMultiplier;

    // Animate across screen
    this.tweens.add({
      targets: obstacle,
      x: endX,
      duration: duration,
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

    // Wind warning text
    this.windWarningText = this.add.text(
      this.cameras.main.centerX,
      120,
      '',
      {
        fontSize: '24px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    this.windWarningText.setOrigin(0.5);
    this.windWarningText.setScrollFactor(0);
    this.windWarningText.setDepth(100);
    this.windWarningText.setVisible(false);

    // Instructions
    const instructions = this.add.text(
      this.cameras.main.centerX,
      16,
      'Balance with A/D | Space: Jump | Quick-tap A/D: Quick Step | ESC: Pause',
      {
        fontSize: '12px',
        color: '#FFFFFF',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );
    instructions.setOrigin(0.5, 0);
    instructions.setScrollFactor(0);
    instructions.setDepth(100);
  }

  createBalancingPole() {
    this.poleGraphic = this.add.graphics();
    this.poleGraphic.setDepth(10);
  }

  updatePoleVisual() {
    this.poleGraphic.clear();

    if (!this.player) return;

    // Calculate pole angle based on balance (-15 to +15 degrees)
    this.poleAngle = (this.balance / 100) * 30;

    // Pole color based on balance danger
    const absBalance = Math.abs(this.balance);
    let poleColor = 0xD4AF37; // Gold
    if (absBalance > 80) poleColor = 0xFF0000; // Red (danger)
    else if (absBalance > 60) poleColor = 0xFF6B6B; // Light red

    // Draw pole
    this.poleGraphic.lineStyle(4, poleColor, 1);
    const angleRad = (this.poleAngle * Math.PI) / 180;
    const startX = this.player.x - Math.cos(angleRad) * this.poleLength;
    const startY = this.player.y - Math.sin(angleRad) * this.poleLength - 10;
    const endX = this.player.x + Math.cos(angleRad) * this.poleLength;
    const endY = this.player.y + Math.sin(angleRad) * this.poleLength - 10;

    this.poleGraphic.lineBetween(startX, startY, endX, endY);

    // Draw pole ends (weights)
    this.poleGraphic.fillStyle(poleColor, 1);
    this.poleGraphic.fillCircle(startX, startY, 6);
    this.poleGraphic.fillCircle(endX, endY, 6);
  }

  createWindIndicators() {
    // Create flag indicators at top of screen
    for (let i = 0; i < 5; i++) {
      const flag = this.add.graphics();
      flag.setScrollFactor(0);
      flag.setDepth(50);
      flag.setAlpha(0.6);
      this.windFlags.push(flag);
    }
  }

  updateWindIndicators() {
    const flagY = 100;
    const spacing = this.cameras.main.width / (this.windFlags.length + 1);

    this.windFlags.forEach((flag, index) => {
      flag.clear();
      const x = spacing * (index + 1);

      // Flag pole
      flag.lineStyle(2, 0x8B4513, 1);
      flag.lineBetween(x, flagY, x, flagY - 30);

      // Flag based on wind direction
      if (this.windDirection !== 0) {
        const flagColor = 0xFF6B6B;
        flag.fillStyle(flagColor, 0.8);

        const flagWidth = 20 * Math.abs(this.windForce / 30);
        const flagDirection = this.windDirection;

        flag.beginPath();
        flag.moveTo(x, flagY - 30);
        flag.lineTo(x + flagWidth * flagDirection, flagY - 25);
        flag.lineTo(x + flagWidth * flagDirection, flagY - 20);
        flag.lineTo(x, flagY - 15);
        flag.closePath();
        flag.fillPath();
      }
    });
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
    // Random wind gusts that push the player with warning
    this.windTimer = this.time.addEvent({
      delay: 4000 + Math.random() * 4000,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.triggerWindGust();
        }
      },
      loop: true,
    });
  }

  triggerWindGust() {
    // 1 second warning
    const windDir = Math.random() > 0.5 ? 1 : -1;
    this.windForce = (Math.random() * 30 + 20) * windDir; // 20-50 force
    this.windDirection = windDir;

    // Show warning
    this.windWarningText.setText(`WIND ${windDir > 0 ? '→' : '←'}`);
    this.windWarningText.setVisible(true);
    this.windWarningText.setAlpha(1);

    // Pulse warning
    this.tweens.add({
      targets: this.windWarningText,
      scale: { from: 1.5, to: 1 },
      duration: 200,
    });

    // Update flags
    this.updateWindIndicators();

    // Apply wind after 1 second
    this.time.delayedCall(1000, () => {
      if (this.isOnTightrope && !this.gameFinished && !this.gamePaused) {
        this.balance += this.windForce;
        this.balance = Phaser.Math.Clamp(this.balance, -100, 100);

        // Visual wind effect
        for (let i = 0; i < 5; i++) {
          const windParticle = this.add.text(
            this.player.x + (Math.random() - 0.5) * 50,
            this.player.y - 50 + (Math.random() - 0.5) * 30,
            '💨',
            { fontSize: '24px' }
          );
          this.tweens.add({
            targets: windParticle,
            alpha: 0,
            x: windParticle.x + this.windForce * 2,
            y: windParticle.y + (Math.random() - 0.5) * 20,
            duration: 800,
            ease: 'Power2',
            onComplete: () => windParticle.destroy(),
          });
        }
      }

      // Hide warning
      this.tweens.add({
        targets: this.windWarningText,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.windWarningText.setVisible(false);
          this.windDirection = 0;
          this.windForce = 0;
          this.updateWindIndicators();
        },
      });
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

  update(_time: number, delta: number) {
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

    // Update pole visual
    this.updatePoleVisual();

    // Update performance system
    this.performanceSystem.update();

    // Dynamic difficulty based on crowd meter
    if (this.performanceSystem.isLowPerformance()) {
      this.obstacleSpeedMultiplier = 1.5; // Obstacles move faster
    } else if (this.performanceSystem.isHighPerformance()) {
      this.obstacleSpeedMultiplier = 0.8; // Slower obstacles as reward
    } else {
      this.obstacleSpeedMultiplier = 1;
    }

    // Performance tracking - movement rewards
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 50) {
      this.performanceSystem.noHesitation(delta);
    } else {
      this.performanceSystem.playerStopped(delta);
    }

    // Track perfect landings
    if (body.touching.down && !this.lastTouchDown) {
      // Check if landing was on edge of platform
      const onEdge = this.checkEdgeLanding();
      if (onEdge) {
        this.performanceSystem.perfectLanding();
      }
    }
    this.lastTouchDown = body.touching.down;

    // Check if player fell
    if (this.player.y > 750) {
      this.respawnPlayer();
    }

    // Check ESC for pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
    }
  }

  private checkEdgeLanding(): boolean {
    // Check if player is near edge of platform (within 20px)
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let nearEdge = false;

    this.platforms.getChildren().forEach((platform: any) => {
      const platformBody = platform.body as Phaser.Physics.Arcade.Body;
      if (body.touching.down && platformBody) {
        const playerCenterX = body.x + body.width / 2;
        const platformLeft = platformBody.x;
        const platformRight = platformBody.x + platformBody.width;

        if (Math.abs(playerCenterX - platformLeft) < 20 || Math.abs(playerCenterX - platformRight) < 20) {
          nearEdge = true;
        }
      }
    });

    return nearEdge;
  }

  handleInput() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const currentTime = Date.now();

    // Quick Step detection (rapid taps within 300ms)
    let speed = 200;
    let isQuickStep = false;

    if (Phaser.Input.Keyboard.JustDown(this.wasd.A) || Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      if (currentTime - this.lastKeyPressTime < 300) {
        this.quickStepCounter++;
        if (this.quickStepCounter >= 2) {
          isQuickStep = true;
          speed = 300; // Faster movement
          this.performanceSystem.closeCall(); // Reward for advanced technique
          this.showFloatingText('Quick Step!', '#00FFFF');
        }
      } else {
        this.quickStepCounter = 0;
      }
      this.lastKeyPressTime = currentTime;
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.D) || Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      if (currentTime - this.lastKeyPressTime < 300) {
        this.quickStepCounter++;
        if (this.quickStepCounter >= 2) {
          isQuickStep = true;
          speed = 300;
          this.performanceSystem.closeCall();
          this.showFloatingText('Quick Step!', '#00FFFF');
        }
      } else {
        this.quickStepCounter = 0;
      }
      this.lastKeyPressTime = currentTime;
    }

    // Horizontal movement affects balance
    const balanceShift = isQuickStep ? 0.3 : 0.8; // Quick step has better balance

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      if (this.isOnTightrope) {
        this.balance -= balanceShift;
      }
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      if (this.isOnTightrope) {
        this.balance += balanceShift;
      }
    } else {
      this.player.setVelocityX(0);
    }

    // Jump mechanics
    if (
      (Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      body.touching.down
    ) {
      // Balance Jump: Perfect balance gives higher jump
      const absBalance = Math.abs(this.balance);
      let jumpVelocity = -500;

      if (absBalance < 5 && this.isOnTightrope) {
        jumpVelocity = -600; // 20% higher
        this.performanceSystem.perfectLanding();
        this.showFloatingText('Balance Jump!', '#00FF00');
      }

      this.player.setVelocityY(jumpVelocity);
      this.flipStartY = this.player.y;

      // Down key held = Pole Vault attempt
      if (this.cursors.down?.isDown) {
        jumpVelocity = -550;
        this.player.setVelocityY(jumpVelocity);
        this.performanceSystem.trickJump();
        this.showFloatingText('Pole Vault!', '#FFD700');
      }
    }

    // Emergency Catch (one-time save when critically unbalanced)
    if (!this.emergencyCatchUsed && Math.abs(this.balance) > 90) {
      if (Phaser.Input.Keyboard.JustDown(this.wasd.A) && this.balance > 0) {
        this.balance = 50;
        this.emergencyCatchUsed = true;
        this.performanceSystem.perfectLanding();
        this.showFloatingText('Emergency Catch!', '#FF00FF');
        this.cameras.main.flash(200, 255, 0, 255);
      } else if (Phaser.Input.Keyboard.JustDown(this.wasd.D) && this.balance < 0) {
        this.balance = -50;
        this.emergencyCatchUsed = true;
        this.performanceSystem.perfectLanding();
        this.showFloatingText('Emergency Catch!', '#FF00FF');
        this.cameras.main.flash(200, 255, 0, 255);
      }
    }

    // Clamp balance
    this.balance = Phaser.Math.Clamp(this.balance, -100, 100);
  }

  private showFloatingText(text: string, color: string) {
    const floatText = this.add.text(
      this.player.x,
      this.player.y - 60,
      text,
      {
        fontSize: '18px',
        color: color,
        fontFamily: 'Impact',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    floatText.setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });
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
      this.performanceSystem.hitObstacle();
      this.respawnPlayer();
    }
  }

  spawnJugglingBalls() {
    // NPCs throw balls that arc up from below
    const startX = 100 + Math.random() * 1080;
    const startY = 720;
    const peakY = 200 + Math.random() * 200;

    const ball = this.physics.add.sprite(startX, startY, '');

    // Create ball visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF0000, 1);
    graphics.fillCircle(0, 0, 12);
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillCircle(-3, -3, 4);
    graphics.generateTexture('ball', 24, 24);
    graphics.destroy();

    ball.setTexture('ball');
    (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.obstacles.add(ball);

    // Arc motion
    this.tweens.add({
      targets: ball,
      y: peakY,
      duration: 1500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: ball,
          y: 720,
          duration: 1500,
          ease: 'Quad.easeIn',
          onComplete: () => ball.destroy(),
        });
      },
    });
  }

  spawnFlamingHoop() {
    // Hoop that moves vertically, must time jump through it
    const x = 400 + Math.random() * 480;
    const startY = 150;

    const hoop = this.physics.add.sprite(x, startY, '');

    // Create hoop visual
    const graphics = this.add.graphics();
    graphics.lineStyle(6, 0xFF8C00, 1);
    graphics.strokeCircle(0, 0, 35);
    // Flames
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const flameX = Math.cos(angle) * 35;
      const flameY = Math.sin(angle) * 35;
      graphics.fillStyle(0xFF4500, 0.8);
      graphics.fillCircle(flameX, flameY, 8);
      graphics.fillStyle(0xFFD700, 0.6);
      graphics.fillCircle(flameX, flameY, 4);
    }
    graphics.generateTexture('flamingHoop', 80, 80);
    graphics.destroy();

    hoop.setTexture('flamingHoop');
    (hoop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (hoop.body as Phaser.Physics.Arcade.Body).setSize(70, 70);
    this.obstacles.add(hoop);

    // Move down and back up
    this.tweens.add({
      targets: hoop,
      y: 500,
      duration: 3000,
      yoyo: true,
      ease: 'Sine.inOut',
      onComplete: () => hoop.destroy(),
    });

    // Rotate
    this.tweens.add({
      targets: hoop,
      angle: 360,
      duration: 2000,
      repeat: 2,
    });
  }

  spawnTrapezeArtist() {
    // Swinging performer that player must pass under/over
    const x = 400 + Math.random() * 480;
    const anchorY = 100;

    const artist = this.physics.add.sprite(x, anchorY + 150, '');

    // Create trapeze artist visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00CED1, 1);
    graphics.fillCircle(0, 0, 16);
    graphics.lineStyle(3, 0x8B4513, 1);
    graphics.lineBetween(0, -150, 0, -16);
    graphics.generateTexture('trapeze', 32, 180);
    graphics.destroy();

    artist.setTexture('trapeze');
    (artist.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (artist.body as Phaser.Physics.Arcade.Body).setSize(32, 32);
    (artist.body as Phaser.Physics.Arcade.Body).setOffset(0, 150);
    this.obstacles.add(artist);

    // Swing motion
    this.tweens.add({
      targets: artist,
      x: x - 200,
      y: anchorY + 200,
      duration: 2000,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.inOut',
      onComplete: () => artist.destroy(),
    });
  }

  respawnPlayer() {
    this.performanceSystem.playerFell();
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
      const baseTime = Date.now() - this.startTime;
      const timeBonus = this.performanceSystem.getTimeBonus();
      const finalTime = Math.max(0, baseTime - timeBonus);

      // Victory animation
      this.player.setVelocity(0, 0);
      this.player.setAngle(0);

      let bonusText = '';
      if (timeBonus > 0) {
        bonusText = `\nCrowd Bonus: -${(timeBonus / 1000).toFixed(2)}s!`;
      }

      const victoryText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        '🏆 PERFORMANCE COMPLETE! 🏆\n' + this.formatTime(finalTime) + bonusText,
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
