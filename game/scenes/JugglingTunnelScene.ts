import * as Phaser from 'phaser';
import type { LevelData } from '@/types/game';
import { ARENA_THEMES } from '@/lib/circus-theme';
import { PerformanceSystem } from '@/game/systems/PerformanceSystem';

/**
 * Arena 3: Juggling Tunnel
 * Theme: Spinning tunnel with juggling obstacles
 * Mechanics: Rotating gravity, precision timing, juggling patterns
 */
export class JugglingTunnelScene extends Phaser.Scene {
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

  private levelData!: LevelData;
  private onComplete!: (timeMs: number) => void;
  private checkpointX: number = 0;
  private checkpointY: number = 0;

  // Juggling tunnel-specific
  private tunnelRotation: number = 0;
  private rotationSpeed: number = 0.002;
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private jugglingObjects!: Phaser.GameObjects.Group;

  // Performance system
  private performanceSystem!: PerformanceSystem;
  private lastTouchDown: boolean = false;
  private obstacleProximity: number = 0;

  constructor() {
    super({ key: 'JugglingTunnelScene' });
  }

  init(data: { levelData: LevelData; onComplete: (timeMs: number) => void }) {
    this.levelData = data.levelData;
    this.onComplete = data.onComplete;
  }

  create() {
    const theme = ARENA_THEMES[3];

    this.cameras.main.setBackgroundColor(theme.backgroundColor);

    // Create tunnel effect
    this.createTunnelAtmosphere();

    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.group();
    this.jugglingObjects = this.add.group();

    // Create level elements
    this.createPlatforms();
    this.createJugglingObstacles();
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
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.finishZone, this.reachFinish, undefined, this);

    // Create HUD
    this.createHUD();

    // Create performance system
    this.performanceSystem = new PerformanceSystem(this);

    // Set checkpoint
    this.checkpointX = this.levelData.startPoint.x;
    this.checkpointY = this.levelData.startPoint.y;

    // Show countdown
    this.showCountdown();
  }

  createTunnelAtmosphere() {
    // Create rotating tunnel background
    this.backgroundGraphics = this.add.graphics();
    this.backgroundGraphics.setDepth(-10);

    // Art deco patterns
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const x = 640 + Math.cos(angle) * 300;
      const y = 360 + Math.sin(angle) * 300;

      const line = this.add.line(640, 360, 640, 360, x, y, 0x663399, 0.3);
      line.setLineWidth(2);
      line.setDepth(-5);

      // Rotate lines
      this.tweens.add({
        targets: line,
        angle: 360,
        duration: 20000,
        repeat: -1,
      });
    }

    // Concentric circles for tunnel depth
    for (let i = 1; i <= 5; i++) {
      const circle = this.add.circle(640, 360, i * 100, 0x4ECDC4, 0.1);
      circle.setStrokeStyle(2, 0xC0C0C0, 0.3);
      circle.setDepth(-8);

      this.tweens.add({
        targets: circle,
        scaleX: { from: i * 0.2, to: i * 0.25 },
        scaleY: { from: i * 0.2, to: i * 0.25 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Particle trails
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Math.random() * 1280,
        Math.random() * 720,
        2,
        0xC0C0C0,
        0.6
      );
      particle.setDepth(-6);

      this.tweens.add({
        targets: particle,
        x: 640 + (particle.x - 640) * 1.5,
        y: 360 + (particle.y - 360) * 1.5,
        alpha: 0,
        duration: 3000,
        repeat: -1,
        delay: Math.random() * 3000,
      });
    }
  }

  createPlatforms() {
    this.levelData.platforms.forEach((platformData) => {
      const isGround = platformData.y > 650;

      // Elegant silver platforms
      const platform = this.add.rectangle(
        platformData.x + platformData.width / 2,
        platformData.y + platformData.height / 2,
        platformData.width,
        platformData.height,
        isGround ? 0x4ECDC4 : 0xC0C0C0
      );
      platform.setStrokeStyle(2, 0x0F52BA);

      // Add shimmer effect
      if (!isGround) {
        this.tweens.add({
          targets: platform,
          alpha: { from: 0.8, to: 1 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
      }

      this.platforms.add(platform);
    });
  }

  createJugglingObstacles() {
    // Create juggling patterns that move in circles
    const patterns = [
      { centerX: 400, centerY: 350, count: 3, radius: 80 },
      { centerX: 800, centerY: 400, count: 4, radius: 100 },
      { centerX: 1000, centerY: 300, count: 5, radius: 120 },
    ];

    patterns.forEach((pattern, patternIndex) => {
      for (let i = 0; i < pattern.count; i++) {
        const angle = (i * Math.PI * 2) / pattern.count;
        const x = pattern.centerX + Math.cos(angle) * pattern.radius;
        const y = pattern.centerY + Math.sin(angle) * pattern.radius;

        const ball = this.physics.add.sprite(x, y, '');

        // Create juggling ball visual
        const graphics = this.add.graphics();
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
        graphics.fillStyle(colors[i % colors.length], 1);
        graphics.fillCircle(0, 0, 12);
        graphics.lineStyle(2, 0xFFFFFF, 0.6);
        graphics.strokeCircle(0, 0, 12);
        graphics.generateTexture(`ball-${patternIndex}-${i}`, 24, 24);
        graphics.destroy();

        ball.setTexture(`ball-${patternIndex}-${i}`);
        (ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (ball.body as Phaser.Physics.Arcade.Body).setCircle(12);

        this.obstacles.add(ball);

        // Circular motion
        this.tweens.add({
          targets: ball,
          angle: 360,
          duration: 3000 + patternIndex * 500,
          repeat: -1,
        });

        const centerPoint = { x: pattern.centerX, y: pattern.centerY };
        this.tweens.add({
          targets: ball,
          x: pattern.centerX + Math.cos(angle + Math.PI * 2) * pattern.radius,
          y: pattern.centerY + Math.sin(angle + Math.PI * 2) * pattern.radius,
          duration: 3000 + patternIndex * 500,
          repeat: -1,
          ease: 'Linear',
          onUpdate: (tween) => {
            const progress = tween.progress;
            const currentAngle = angle + progress * Math.PI * 2;
            ball.x = pattern.centerX + Math.cos(currentAngle) * pattern.radius;
            ball.y = pattern.centerY + Math.sin(currentAngle) * pattern.radius;
          },
        });
      }
    });

    // Add knife throwers that shoot knives periodically
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.throwKnife();
        }
      },
      loop: true,
    });
  }

  throwKnife() {
    const fromTop = Math.random() > 0.5;
    const startX = 200 + Math.random() * 880;
    const startY = fromTop ? -50 : 770;

    const knife = this.physics.add.sprite(startX, startY, '');

    // Create knife visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0xC0C0C0, 1);
    graphics.fillRect(-3, -20, 6, 40);
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(-5, 15, 10, 10);
    graphics.generateTexture('knife', 10, 50);
    graphics.destroy();

    knife.setTexture('knife');
    (knife.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.obstacles.add(knife);

    const endY = fromTop ? 770 : -50;
    this.tweens.add({
      targets: knife,
      y: endY,
      duration: 2000,
      onComplete: () => knife.destroy(),
    });

    // Spin
    this.tweens.add({
      targets: knife,
      angle: 720,
      duration: 2000,
    });
  }

  createFinishLine() {
    const finishX = this.levelData.finishLine.x;
    const finishY = this.levelData.finishLine.y;

    this.finishZone = this.add.rectangle(finishX, finishY, 50, 100, 0x4ECDC4);
    this.physics.add.existing(this.finishZone);
    (this.finishZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    const flag = this.add.text(finishX, finishY - 60, '⭐ FINISH', {
      fontSize: '20px',
      color: '#C0C0C0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Elegant glow
    this.tweens.add({
      targets: flag,
      alpha: { from: 0.6, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  createPlayer() {
    const startX = this.levelData.startPoint.x;
    const startY = this.levelData.startPoint.y;

    this.player = this.physics.add.sprite(startX, startY, '');

    // Create master juggler visual (silver outfit)
    const graphics = this.add.graphics();
    graphics.fillStyle(0xC0C0C0, 1);
    graphics.fillCircle(0, 0, 16);
    // Elegant accents - blue border
    graphics.lineStyle(2, 0x0F52BA, 1);
    graphics.strokeCircle(0, 0, 16);
    // Gold accents
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillCircle(-6, -6, 2);
    graphics.fillCircle(6, -6, 2);
    graphics.fillCircle(-6, 6, 2);
    graphics.fillCircle(6, 6, 2);
    graphics.generateTexture('juggler', 32, 32);
    graphics.destroy();

    this.player.setTexture('juggler');
    this.player.setCollideWorldBounds(false);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(32, 32);
  }

  createHUD() {
    this.timerText = this.add.text(16, 16, 'Time: 00:00.000', {
      fontSize: '24px',
      color: '#C0C0C0',
      backgroundColor: '#0F52BA',
      padding: { x: 10, y: 5 },
      fontFamily: 'Orbitron, monospace',
    });
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);

    const instructions = this.add.text(
      this.cameras.main.centerX,
      16,
      'Master the Juggling Tunnel! | Arrow Keys/WASD/Space | ESC to Pause',
      {
        fontSize: '14px',
        color: '#FFFFFF',
        backgroundColor: '#0F52BA',
        padding: { x: 10, y: 5 },
      }
    );
    instructions.setOrigin(0.5, 0);
    instructions.setScrollFactor(0);
    instructions.setDepth(100);
  }

  showCountdown() {
    const countdownText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '3',
      {
        fontSize: '72px',
        color: '#C0C0C0',
        stroke: '#0F52BA',
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
          countdownText.setText('JUGGLE! 🎯');
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

    const elapsed = Date.now() - this.startTime;
    this.timerText.setText(this.formatTime(elapsed));

    this.handleInput();

    // Update performance system
    this.performanceSystem.update();

    // Performance tracking
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 50) {
      this.performanceSystem.noHesitation(delta);
    } else {
      this.performanceSystem.playerStopped(delta);
    }

    // Check proximity to obstacles for close call rewards
    this.checkObstacleProximity();

    // Track precision jumps
    if (body.touching.down && !this.lastTouchDown) {
      this.performanceSystem.perfectLanding();
    }
    this.lastTouchDown = body.touching.down;

    // Update tunnel rotation effect
    this.tunnelRotation += this.rotationSpeed;
    this.backgroundGraphics.clear();
    this.backgroundGraphics.lineStyle(1, 0x4ECDC4, 0.2);

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 + this.tunnelRotation;
      const startRadius = 200;
      const endRadius = 500;

      this.backgroundGraphics.lineBetween(
        640 + Math.cos(angle) * startRadius,
        360 + Math.sin(angle) * startRadius,
        640 + Math.cos(angle) * endRadius,
        360 + Math.sin(angle) * endRadius
      );
    }

    if (this.player.y > 750) {
      this.respawnPlayer();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
    }
  }

  private checkObstacleProximity() {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const playerX = playerBody.x + playerBody.width / 2;
    const playerY = playerBody.y + playerBody.height / 2;
    const closeCallDistance = 50;

    let minDistance = Infinity;
    this.obstacles.getChildren().forEach((obstacle: any) => {
      const obstacleBody = obstacle.body as Phaser.Physics.Arcade.Body;
      if (obstacleBody) {
        const obsX = obstacleBody.x + obstacleBody.width / 2;
        const obsY = obstacleBody.y + obstacleBody.height / 2;
        const distance = Phaser.Math.Distance.Between(playerX, playerY, obsX, obsY);

        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    });

    // Reward close calls (threading through obstacles)
    if (minDistance < closeCallDistance && minDistance > 25) {
      if (this.obstacleProximity === 0) {
        this.performanceSystem.obstacleThreading();
      }
      this.obstacleProximity = 1;
    } else {
      this.obstacleProximity = 0;
    }
  }

  handleInput() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-220);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(220);
    } else {
      this.player.setVelocityX(0);
    }

    if (
      (Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      body.touching.down
    ) {
      this.player.setVelocityY(-520);
    }
  }

  hitObstacle() {
    if (!this.gameFinished) {
      this.performanceSystem.hitObstacle();
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    this.performanceSystem.playerFell();
    this.player.setPosition(this.checkpointX, this.checkpointY);
    this.player.setVelocity(0, 0);

    // Flash with blue
    this.cameras.main.flash(200, 15, 82, 186);
  }

  reachFinish() {
    if (!this.gameFinished) {
      this.gameFinished = true;
      const baseTime = Date.now() - this.startTime;
      const timeBonus = this.performanceSystem.getTimeBonus();
      const finalTime = Math.max(0, baseTime - timeBonus);

      this.player.setVelocity(0, 0);

      let bonusText = '';
      if (timeBonus > 0) {
        bonusText = `\nCrowd Bonus: -${(timeBonus / 1000).toFixed(2)}s!`;
      }

      const victoryText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        '⭐ MASTERY ACHIEVED! 🎯\n' + this.formatTime(finalTime) + bonusText,
        {
          fontSize: '48px',
          color: '#C0C0C0',
          stroke: '#0F52BA',
          strokeThickness: 6,
          align: 'center',
          fontFamily: 'Impact',
        }
      );
      victoryText.setOrigin(0.5);
      victoryText.setDepth(1000);

      // Elegant particle burst
      for (let i = 0; i < 30; i++) {
        const angle = (i * Math.PI * 2) / 30;
        const star = this.add.text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          '⭐',
          { fontSize: '24px' }
        );

        this.tweens.add({
          targets: star,
          x: star.x + Math.cos(angle) * 300,
          y: star.y + Math.sin(angle) * 300,
          alpha: 0,
          duration: 1500,
          onComplete: () => star.destroy(),
        });
      }

      this.cameras.main.flash(500, 79, 195, 247);

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

      const pauseText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'PAUSED\nPress ESC to Resume',
        {
          fontSize: '48px',
          color: '#FFFFFF',
          stroke: '#0F52BA',
          strokeThickness: 6,
          align: 'center',
        }
      );
      pauseText.setOrigin(0.5);
      pauseText.setDepth(1000);
      pauseText.setName('pauseText');
    } else {
      this.physics.resume();

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
