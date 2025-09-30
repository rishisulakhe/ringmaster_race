import * as Phaser from 'phaser';
import type { LevelData, Platform as PlatformData } from '@/types/game';
import { PLAYER_CONFIG, COLORS } from '../config';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.GameObjects.Group;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private finishZone!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
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

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelData: LevelData; onComplete: (timeMs: number) => void }) {
    this.levelData = data.levelData;
    this.onComplete = data.onComplete;
  }

  create() {
    // Set background color
    this.cameras.main.setBackgroundColor(this.levelData.background);

    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.add.group();
    this.obstacles = this.physics.add.staticGroup();

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
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Set up collisions
    this.physics.add.collider(this.player, this.platforms);

    // Collide with moving platforms
    this.movingPlatforms.getChildren().forEach((platform) => {
      this.physics.add.collider(this.player, platform as Phaser.Physics.Arcade.Sprite);
    });

    // Overlap with obstacles (causes death)
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);

    // Overlap with finish line
    this.physics.add.overlap(this.player, this.finishZone, this.reachFinish, undefined, this);

    // Create HUD
    this.createHUD();

    // Set checkpoint to start
    this.checkpointX = this.levelData.startPoint.x;
    this.checkpointY = this.levelData.startPoint.y;

    // Display countdown
    this.showCountdown();
  }

  createPlatforms() {
    this.levelData.platforms.forEach((platformData: PlatformData) => {
      if (platformData.type === 'static') {
        const platform = this.add.rectangle(
          platformData.x + platformData.width / 2,
          platformData.y + platformData.height / 2,
          platformData.width,
          platformData.height,
          platformData.y > 650 ? COLORS.ground : COLORS.platform
        );
        this.platforms.add(platform);
      } else if (platformData.type === 'moving') {
        const platform = this.physics.add.sprite(
          platformData.x + platformData.width / 2,
          platformData.y + platformData.height / 2,
          ''
        );

        // Create visual
        const graphics = this.add.rectangle(
          0, 0,
          platformData.width,
          platformData.height,
          COLORS.movingPlatform
        );
        platform.setDisplaySize(platformData.width, platformData.height);

        // Make immovable
        (platform.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (platform.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        // Set up movement
        const startX = platformData.x + platformData.width / 2;
        const startY = platformData.y + platformData.height / 2;

        if (platformData.moveAxis === 'horizontal') {
          this.tweens.add({
            targets: platform,
            x: startX + (platformData.moveDistance || 100),
            duration: 2000 / (platformData.moveSpeed || 1),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
          });
        } else {
          this.tweens.add({
            targets: platform,
            y: startY + (platformData.moveDistance || 100),
            duration: 2000 / (platformData.moveSpeed || 1),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
          });
        }

        this.movingPlatforms.add(platform);
      }
    });
  }

  createObstacles() {
    this.levelData.obstacles.forEach((obstacleData) => {
      const obstacle = this.add.rectangle(
        obstacleData.x + (obstacleData.width || 30) / 2,
        obstacleData.y + (obstacleData.height || 30) / 2,
        obstacleData.width || 30,
        obstacleData.height || 30,
        COLORS.obstacle
      );
      this.obstacles.add(obstacle);
    });
  }

  createFinishLine() {
    const finishX = this.levelData.finishLine.x;
    const finishY = this.levelData.finishLine.y;

    this.finishZone = this.add.rectangle(finishX, finishY, 50, 100, COLORS.finish);
    this.physics.add.existing(this.finishZone);
    (this.finishZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Add flag text
    this.add.text(finishX, finishY - 60, '🏁 FINISH', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  createPlayer() {
    const startX = this.levelData.startPoint.x;
    const startY = this.levelData.startPoint.y;

    this.player = this.physics.add.sprite(startX, startY, '');

    // Create player visual (red circle)
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.player, 1);
    graphics.fillCircle(0, 0, PLAYER_CONFIG.size / 2);
    graphics.generateTexture('player', PLAYER_CONFIG.size, PLAYER_CONFIG.size);
    graphics.destroy();

    this.player.setTexture('player');
    this.player.setCollideWorldBounds(false);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(PLAYER_CONFIG.size, PLAYER_CONFIG.size);
  }

  createHUD() {
    // Timer display
    this.timerText = this.add.text(16, 16, 'Time: 00:00.000', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);

    // Instructions
    const instructions = this.add.text(
      this.cameras.main.centerX,
      16,
      'Arrow Keys / WASD / Space to Jump | ESC to Pause',
      {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
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
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
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

    // Check if player fell off the world
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

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-PLAYER_CONFIG.speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(PLAYER_CONFIG.speed);
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
      this.player.setVelocityY(PLAYER_CONFIG.jumpVelocity);
    }
  }

  hitObstacle() {
    if (!this.gameFinished) {
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    this.player.setPosition(this.checkpointX, this.checkpointY);
    this.player.setVelocity(0, 0);
  }

  reachFinish() {
    if (!this.gameFinished) {
      this.gameFinished = true;
      const finalTime = Date.now() - this.startTime;

      // Show completion message
      const completionText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'FINISHED!\n' + this.formatTime(finalTime),
        {
          fontSize: '48px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center',
        }
      );
      completionText.setOrigin(0.5);
      completionText.setDepth(1000);

      // Callback to React with final time
      this.time.delayedCall(1000, () => {
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
          color: '#ffffff',
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