import * as Phaser from 'phaser';
import type { LevelData } from '@/types/game';
import { ARENA_THEMES } from '@/lib/circus-theme';

/**
 * Arena 2: Clown Alley
 * Theme: Chaotic backstage clown preparation area
 * Mechanics: Bouncy platforms, pie launchers, banana peels, exaggerated physics
 */
export class ClownAlleyScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.GameObjects.Group;
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

  // Clown-specific
  private pieTimer!: Phaser.Time.TimerEvent;
  private bananaPeels!: Phaser.Physics.Arcade.Group;
  private honkingHorns!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: 'ClownAlleyScene' });
  }

  init(data: { levelData: LevelData; onComplete: (timeMs: number) => void }) {
    this.levelData = data.levelData;
    this.onComplete = data.onComplete;
  }

  create() {
    const theme = ARENA_THEMES[2];

    // Set clown alley background
    this.cameras.main.setBackgroundColor(theme.backgroundColor);

    // Create chaotic clown atmosphere
    this.createClownAtmosphere();

    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.add.group();
    this.obstacles = this.physics.add.group();
    this.bananaPeels = this.physics.add.group();
    this.honkingHorns = this.physics.add.staticGroup();

    // Create level elements
    this.createPlatforms();
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
    this.physics.add.collider(this.player, this.platforms);
    this.movingPlatforms.getChildren().forEach((platform) => {
      this.physics.add.collider(this.player, platform as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.bananaPeels, this.slipOnBanana, undefined, this);
    this.physics.add.overlap(this.player, this.honkingHorns, this.hitHorn, undefined, this);
    this.physics.add.overlap(this.player, this.finishZone, this.reachFinish, undefined, this);

    // Create HUD
    this.createHUD();

    // Set checkpoint
    this.checkpointX = this.levelData.startPoint.x;
    this.checkpointY = this.levelData.startPoint.y;

    // Start clown chaos
    this.startPieLaunchers();
    this.spawnBananaPeels();
    this.createHonkingHorns();

    // Show countdown
    this.showCountdown();
  }

  createClownAtmosphere() {
    // Colorful wallpaper with polka dots
    for (let i = 0; i < 100; i++) {
      const dot = this.add.circle(
        Math.random() * 1280,
        Math.random() * 720,
        5 + Math.random() * 10,
        [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0x663399][Math.floor(Math.random() * 4)],
        0.3
      );
      dot.setScrollFactor(0.5);
    }

    // Circus posters on walls
    const posterPositions = [100, 400, 700, 1000];
    posterPositions.forEach(x => {
      const poster = this.add.rectangle(x, 150, 80, 120, 0xFFD700, 0.6);
      poster.setStrokeStyle(4, 0x8B0000);
      const posterText = this.add.text(x, 150, '🤡', { fontSize: '48px' });
      posterText.setOrigin(0.5);
    });

    // Hanging lights
    for (let i = 0; i < 10; i++) {
      const light = this.add.circle(i * 128, 50, 15, 0xFFFF00, 0.6);
      this.tweens.add({
        targets: light,
        alpha: { from: 0.3, to: 0.8 },
        duration: 500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createPlatforms() {
    this.levelData.platforms.forEach((platformData) => {
      if (platformData.type === 'static') {
        const isGround = platformData.y > 650;

        // Colorful platforms with stripes
        const platform = this.add.rectangle(
          platformData.x + platformData.width / 2,
          platformData.y + platformData.height / 2,
          platformData.width,
          platformData.height,
          isGround ? 0xFF6B6B : 0xFFE66D
        );
        platform.setStrokeStyle(3, 0x000000);
        this.platforms.add(platform);

        // Add bouncy effect to some platforms
        if (!isGround && Math.random() > 0.5) {
          const trampoline = this.add.text(
            platformData.x + platformData.width / 2,
            platformData.y - 10,
            '🎪',
            { fontSize: '20px' }
          );
          trampoline.setOrigin(0.5);
        }
      } else if (platformData.type === 'moving') {
        const platform = this.physics.add.sprite(
          platformData.x + platformData.width / 2,
          platformData.y + platformData.height / 2,
          ''
        );

        // Clown car visual
        const graphics = this.add.graphics();
        graphics.fillStyle(0xFF1493, 1);
        graphics.fillRect(-platformData.width/2, -platformData.height/2, platformData.width, platformData.height);
        graphics.lineStyle(3, 0x000000);
        graphics.strokeRect(-platformData.width/2, -platformData.height/2, platformData.width, platformData.height);
        graphics.generateTexture('clowncar', platformData.width, platformData.height);
        graphics.destroy();

        platform.setTexture('clowncar');
        platform.setDisplaySize(platformData.width, platformData.height);
        (platform.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (platform.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        // Set up exaggerated movement
        const startX = platformData.x + platformData.width / 2;
        const startY = platformData.y + platformData.height / 2;

        if (platformData.moveAxis === 'horizontal') {
          this.tweens.add({
            targets: platform,
            x: startX + (platformData.moveDistance || 150),
            duration: 1500 / (platformData.moveSpeed || 1),
            yoyo: true,
            repeat: -1,
            ease: 'Bounce.easeInOut',
          });
        } else {
          this.tweens.add({
            targets: platform,
            y: startY + (platformData.moveDistance || 150),
            duration: 1500 / (platformData.moveSpeed || 1),
            yoyo: true,
            repeat: -1,
            ease: 'Bounce.easeInOut',
          });
        }

        this.movingPlatforms.add(platform);
      }
    });
  }

  createObstacles() {
    // Obstacles created dynamically
  }

  startPieLaunchers() {
    // Launch pies from the sides periodically
    this.pieTimer = this.time.addEvent({
      delay: 2500,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.launchPie();
        }
      },
      loop: true,
    });
  }

  launchPie() {
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -50 : 1330;
    const y = 200 + Math.random() * 400;

    const pie = this.physics.add.sprite(startX, y, '');

    // Create pie visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFE4B5, 1);
    graphics.fillCircle(0, 0, 15);
    graphics.fillStyle(0xFFFFFF, 0.8);
    graphics.fillCircle(0, 0, 10);
    graphics.generateTexture('pie', 30, 30);
    graphics.destroy();

    pie.setTexture('pie');
    (pie.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.obstacles.add(pie);

    // Launch toward opposite side
    const endX = fromLeft ? 1330 : -50;
    this.tweens.add({
      targets: pie,
      x: endX,
      duration: 3000,
      onComplete: () => pie.destroy(),
    });

    // Wobble
    this.tweens.add({
      targets: pie,
      scaleX: [1, 1.2, 1],
      scaleY: [1, 0.8, 1],
      duration: 300,
      repeat: -1,
    });
  }

  spawnBananaPeels() {
    // Random banana peels on ground
    const peelPositions = [300, 500, 700, 900, 1100];
    peelPositions.forEach(x => {
      const peel = this.physics.add.sprite(x + Math.random() * 50, 520, '');

      // Create banana peel visual
      const graphics = this.add.graphics();
      graphics.fillStyle(0xFFFF00, 1);
      graphics.fillEllipse(0, 0, 30, 15);
      graphics.lineStyle(2, 0x000000);
      graphics.strokeEllipse(0, 0, 30, 15);
      graphics.generateTexture('banana', 30, 15);
      graphics.destroy();

      peel.setTexture('banana');
      (peel.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      this.bananaPeels.add(peel);
    });
  }

  createHonkingHorns() {
    // Speed boost horns scattered around
    const hornPositions = [{ x: 400, y: 480 }, { x: 800, y: 380 }];
    hornPositions.forEach(pos => {
      const horn = this.add.text(pos.x, pos.y, '📯', { fontSize: '32px' });
      horn.setOrigin(0.5);

      const hornZone = this.add.rectangle(pos.x, pos.y, 40, 40, 0xFF00FF, 0);
      this.physics.add.existing(hornZone);
      (hornZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      this.honkingHorns.add(hornZone);

      // Pulse animation
      this.tweens.add({
        targets: horn,
        scale: { from: 1, to: 1.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });
  }

  createFinishLine() {
    const finishX = this.levelData.finishLine.x;
    const finishY = this.levelData.finishLine.y;

    this.finishZone = this.add.rectangle(finishX, finishY, 50, 100, 0x00FF00);
    this.physics.add.existing(this.finishZone);
    (this.finishZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    const flag = this.add.text(finishX, finishY - 60, '🎉 FINISH', {
      fontSize: '20px',
      color: '#00FF00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: flag,
      angle: { from: -10, to: 10 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  createPlayer() {
    const startX = this.levelData.startPoint.x;
    const startY = this.levelData.startPoint.y;

    this.player = this.physics.add.sprite(startX, startY, '');

    // Create clown player visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFE66D, 1);
    graphics.fillCircle(0, 0, 16);
    // Red nose
    graphics.fillStyle(0xFF0000, 1);
    graphics.fillCircle(0, 0, 8);
    // Colorful dots
    graphics.fillStyle(0x4ECDC4, 1);
    graphics.fillCircle(-10, -10, 4);
    graphics.fillCircle(10, -10, 4);
    graphics.generateTexture('clown', 32, 32);
    graphics.destroy();

    this.player.setTexture('clown');
    this.player.setCollideWorldBounds(false);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(32, 32);
  }

  createHUD() {
    this.timerText = this.add.text(16, 16, 'Time: 00:00.000', {
      fontSize: '24px',
      color: '#FFE66D',
      backgroundColor: '#663399',
      padding: { x: 10, y: 5 },
      fontFamily: 'Orbitron, monospace',
    });
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);

    const instructions = this.add.text(
      this.cameras.main.centerX,
      16,
      'Navigate the Clown Chaos! | Arrow Keys/WASD/Space | ESC to Pause',
      {
        fontSize: '14px',
        color: '#FFFFFF',
        backgroundColor: '#663399',
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
        color: '#FFE66D',
        stroke: '#663399',
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
          countdownText.setText('HONK! 📯');
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

    const elapsed = Date.now() - this.startTime;
    this.timerText.setText(this.formatTime(elapsed));

    this.handleInput();

    if (this.player.y > 750) {
      this.respawnPlayer();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
    }
  }

  handleInput() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-200);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(200);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (
      (Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      body.touching.down
    ) {
      this.player.setVelocityY(-500);
    }
  }

  hitObstacle(player: any, obstacle: any) {
    if (!this.gameFinished) {
      // Pie splat effect
      const splat = this.add.text(player.x, player.y, '💥', { fontSize: '48px' });
      this.tweens.add({
        targets: splat,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => splat.destroy(),
      });

      obstacle.destroy();
      this.respawnPlayer();
    }
  }

  slipOnBanana(player: any, banana: any) {
    // Slip effect - launch player
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-300);
    body.setVelocityX((Math.random() - 0.5) * 400);

    // Spin the player
    this.tweens.add({
      targets: this.player,
      angle: 720,
      duration: 1000,
      onComplete: () => this.player.setAngle(0),
    });

    banana.destroy();
  }

  hitHorn(player: any, horn: any) {
    // Speed boost!
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const boostDirection = body.velocity.x >= 0 ? 1 : -1;
    body.setVelocityX(400 * boostDirection);

    // Honk sound visual
    const honk = this.add.text(player.x, player.y - 50, '📯 HONK!', {
      fontSize: '24px',
      color: '#FFD700',
    });
    honk.setOrigin(0.5);

    this.tweens.add({
      targets: honk,
      y: honk.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => honk.destroy(),
    });

    horn.destroy();
  }

  respawnPlayer() {
    this.player.setPosition(this.checkpointX, this.checkpointY);
    this.player.setVelocity(0, 0);
    this.player.setAngle(0);
    this.cameras.main.flash(200, 255, 105, 180);
  }

  reachFinish() {
    if (!this.gameFinished) {
      this.gameFinished = true;
      const finalTime = Date.now() - this.startTime;

      this.player.setVelocity(0, 0);

      const victoryText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        '🎉 WHAT A SHOW! 🤡\n' + this.formatTime(finalTime),
        {
          fontSize: '48px',
          color: '#FFE66D',
          stroke: '#663399',
          strokeThickness: 6,
          align: 'center',
          fontFamily: 'Impact',
        }
      );
      victoryText.setOrigin(0.5);
      victoryText.setDepth(1000);

      // Confetti explosion
      for (let i = 0; i < 50; i++) {
        const confetti = this.add.text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          ['🎊', '🎉', '🎈', '🎁'][Math.floor(Math.random() * 4)],
          { fontSize: '32px' }
        );

        this.tweens.add({
          targets: confetti,
          x: confetti.x + (Math.random() - 0.5) * 600,
          y: confetti.y + Math.random() * 400,
          angle: Math.random() * 720,
          alpha: 0,
          duration: 2000,
          onComplete: () => confetti.destroy(),
        });
      }

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
      if (this.pieTimer) {
        this.pieTimer.paused = true;
      }

      const pauseText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'PAUSED\nPress ESC to Resume',
        {
          fontSize: '48px',
          color: '#FFFFFF',
          stroke: '#663399',
          strokeThickness: 6,
          align: 'center',
        }
      );
      pauseText.setOrigin(0.5);
      pauseText.setDepth(1000);
      pauseText.setName('pauseText');
    } else {
      this.physics.resume();
      if (this.pieTimer) {
        this.pieTimer.paused = false;
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
