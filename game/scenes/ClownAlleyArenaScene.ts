import * as Phaser from 'phaser';
import type { LevelData } from '@/types/game';
import { ARENA_THEMES } from '@/lib/circus-theme';
import { PerformanceSystem } from '@/game/systems/PerformanceSystem';

/**
 * Arena 2: Clown Alley
 * Theme: Chaotic clown performances with unpredictable obstacles
 * Mechanics: Chaos management, chain reactions, prop throwing, pie fights
 */

interface InteractiveProp {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'trampoline' | 'seesaw' | 'bowtie' | 'unicycle' | 'clowncar';
  data?: any;
}

interface ThrowableItem {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'pie' | 'ball' | 'confetti';
}

interface ClownNPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: 'idle' | 'walking' | 'fleeing' | 'chasing' | 'stunned';
  walkSpeed: number;
  direction: number;
  stunnedUntil?: number;
}

export class ClownAlleyArenaScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private finishZone!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private throwKey!: Phaser.Input.Keyboard.Key;

  private startTime: number = 0;
  private gameStarted: boolean = false;
  private gamePaused: boolean = false;
  private gameFinished: boolean = false;
  private timerText!: Phaser.GameObjects.Text;

  private levelData!: LevelData;
  private onComplete!: (timeMs: number) => void;
  private checkpointX: number = 0;
  private checkpointY: number = 0;

  // Clown Alley specific
  private randomSeed: number;
  private rng!: Phaser.Math.RandomDataGenerator;
  private interactiveProps: InteractiveProp[] = [];
  private throwableItems: ThrowableItem[] = [];
  private heldItem: ThrowableItem | null = null;
  private clownNPCs: ClownNPC[] = [];
  private trampolineChain: number = 0;
  private chainMultiplier: number = 1.0;
  private visionObscured: boolean = false;
  private pieOverlay!: Phaser.GameObjects.Graphics;

  // Performance system
  private performanceSystem!: PerformanceSystem;

  constructor() {
    super({ key: 'ClownAlleyArenaScene' });
    this.randomSeed = Date.now(); // Will be set by init
  }

  init(data: { levelData: LevelData; onComplete: (timeMs: number) => void; seed?: number }) {
    this.levelData = data.levelData;
    this.onComplete = data.onComplete;
    this.randomSeed = data.seed || Date.now();
    this.rng = new Phaser.Math.RandomDataGenerator([this.randomSeed.toString()]);
  }

  create() {
    const theme = ARENA_THEMES[2];

    // Set chaotic clown atmosphere
    this.cameras.main.setBackgroundColor(theme.backgroundColor);

    // Create circus atmosphere
    this.createClownAtmosphere();

    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.group();

    // Create level elements with procedural generation
    this.createPlatforms();
    this.createInteractiveProps();
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
    this.throwKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Set up collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.finishZone, this.reachFinish, undefined, this);

    // Create HUD
    this.createHUD();

    // Create pie overlay
    this.pieOverlay = this.add.graphics();
    this.pieOverlay.setScrollFactor(0);
    this.pieOverlay.setDepth(150);
    this.pieOverlay.setVisible(false);

    // Create performance system
    this.performanceSystem = new PerformanceSystem(this);

    // Set checkpoint
    this.checkpointX = this.levelData.startPoint.x;
    this.checkpointY = this.levelData.startPoint.y;

    // Start chaos events
    this.startChaosEvents();

    // Spawn clown NPCs
    this.spawnClownNPCs();

    // Show countdown
    this.showCountdown();
  }

  createClownAtmosphere() {
    // Colorful confetti background
    for (let i = 0; i < 50; i++) {
      const colors = [0xFF69B4, 0x00CED1, 0xFFD700, 0xFF6347, 0x7FFF00];
      const confetti = this.add.circle(
        this.rng.between(0, 1280),
        this.rng.between(0, 720),
        this.rng.between(3, 8),
        colors[this.rng.between(0, 4)],
        0.6
      );
      confetti.setScrollFactor(0.5);

      // Slow falling animation
      this.tweens.add({
        targets: confetti,
        y: confetti.y + this.rng.between(100, 300),
        duration: this.rng.between(3000, 6000),
        repeat: -1,
        yoyo: true,
      });
    }

    // Circus tent stripes
    for (let i = 0; i < 10; i++) {
      const stripe = this.add.rectangle(
        i * 140 + 70,
        50,
        100,
        100,
        i % 2 === 0 ? 0xFF0000 : 0xFFFFFF,
        0.2
      );
      stripe.setOrigin(0.5, 0);
    }
  }

  createPlatforms() {
    this.levelData.platforms.forEach((platformData) => {
      const platform = this.add.rectangle(
        platformData.x + platformData.width / 2,
        platformData.y + platformData.height / 2,
        platformData.width,
        platformData.height,
        platformData.y > 650 ? 0x8B4513 : 0xFF1493 // Brown ground or hot pink platforms
      );
      this.platforms.add(platform);
    });
  }

  createInteractiveProps() {
    // Procedurally place props using seeded RNG
    const propPositions = [
      { x: 200, y: 500 },
      { x: 400, y: 450 },
      { x: 600, y: 400 },
      { x: 800, y: 450 },
      { x: 1000, y: 500 },
    ];

    propPositions.forEach((pos, index) => {
      const propType = ['trampoline', 'seesaw', 'bowtie', 'unicycle', 'clowncar'][
        this.rng.between(0, 4)
      ] as InteractiveProp['type'];

      this.createProp(pos.x, pos.y, propType);
    });
  }

  createProp(x: number, y: number, type: InteractiveProp['type']) {
    const prop = this.physics.add.sprite(x, y, '');

    switch (type) {
      case 'trampoline':
        // Trampoline visual
        const trampGraphics = this.add.graphics();
        trampGraphics.fillStyle(0x000000, 1);
        trampGraphics.fillRect(-30, -5, 60, 10);
        trampGraphics.fillStyle(0xFF0000, 1);
        trampGraphics.fillRect(-25, -8, 50, 6);
        trampGraphics.generateTexture('trampoline', 60, 20);
        trampGraphics.destroy();
        prop.setTexture('trampoline');
        break;

      case 'seesaw':
        // Seesaw visual
        const seesawGraphics = this.add.graphics();
        seesawGraphics.fillStyle(0x8B4513, 1);
        seesawGraphics.fillRect(-40, -3, 80, 6);
        seesawGraphics.fillStyle(0x654321, 1);
        seesawGraphics.fillCircle(0, 0, 8);
        seesawGraphics.generateTexture('seesaw', 80, 20);
        seesawGraphics.destroy();
        prop.setTexture('seesaw');
        break;

      case 'bowtie':
        // Spinning bowtie platform
        const bowtieGraphics = this.add.graphics();
        bowtieGraphics.fillStyle(0xFF1493, 1);
        bowtieGraphics.fillEllipse(-25, 0, 40, 20);
        bowtieGraphics.fillEllipse(25, 0, 40, 20);
        bowtieGraphics.fillRect(-10, -3, 20, 6);
        bowtieGraphics.generateTexture('bowtie', 80, 40);
        bowtieGraphics.destroy();
        prop.setTexture('bowtie');
        break;

      case 'unicycle':
        // Unicycle
        const unicycleGraphics = this.add.graphics();
        unicycleGraphics.strokeCircle(0, 10, 15);
        unicycleGraphics.lineStyle(3, 0x000000);
        unicycleGraphics.lineBetween(0, -5, 0, 25);
        unicycleGraphics.fillStyle(0xFF0000, 1);
        unicycleGraphics.fillRect(-10, -10, 20, 5);
        unicycleGraphics.generateTexture('unicycle', 40, 50);
        unicycleGraphics.destroy();
        prop.setTexture('unicycle');
        break;

      case 'clowncar':
        // Tiny clown car
        const carGraphics = this.add.graphics();
        carGraphics.fillStyle(0xFFFF00, 1);
        carGraphics.fillRect(-25, -15, 50, 30);
        carGraphics.fillStyle(0x00CED1, 1);
        carGraphics.fillRect(-15, -12, 15, 10);
        carGraphics.fillStyle(0x000000, 1);
        carGraphics.fillCircle(-15, 15, 6);
        carGraphics.fillCircle(15, 15, 6);
        carGraphics.generateTexture('clowncar', 60, 40);
        carGraphics.destroy();
        prop.setTexture('clowncar');
        break;
    }

    (prop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (prop.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    this.interactiveProps.push({ sprite: prop, type, data: {} });

    // Add animations for certain props
    if (type === 'bowtie') {
      this.tweens.add({
        targets: prop,
        angle: 360,
        duration: 3000,
        repeat: -1,
      });
    }
  }

  createFinishLine() {
    const finishX = this.levelData.finishLine.x;
    const finishY = this.levelData.finishLine.y;

    this.finishZone = this.add.rectangle(finishX, finishY, 50, 100, 0xFFD700);
    this.physics.add.existing(this.finishZone);
    (this.finishZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Finish flag
    this.add.text(finishX, finishY - 60, '🏁 FINISH', {
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  createPlayer() {
    const startX = this.levelData.startPoint.x;
    const startY = this.levelData.startPoint.y;

    this.player = this.physics.add.sprite(startX, startY, '');

    // Create clown performer visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00CED1, 1);
    graphics.fillCircle(0, 0, 16);
    // Add red nose
    graphics.fillStyle(0xFF0000, 1);
    graphics.fillCircle(0, 0, 6);
    graphics.generateTexture('clownPlayer', 32, 32);
    graphics.destroy();

    this.player.setTexture('clownPlayer');
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

    // Instructions
    const instructions = this.add.text(
      this.cameras.main.centerX,
      16,
      'Chaos Management! | E: Throw Item | Use Props for Speed! | ESC: Pause',
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

  spawnClownNPCs() {
    // Spawn several clown NPCs
    const spawnPositions = [
      { x: 300, y: 500 },
      { x: 600, y: 400 },
      { x: 900, y: 500 },
    ];

    spawnPositions.forEach((pos) => {
      this.createClownNPC(pos.x, pos.y);
    });
  }

  createClownNPC(x: number, y: number) {
    const clown = this.physics.add.sprite(x, y, '');

    // Create clown visual (different from player)
    const graphics = this.add.graphics();
    const colorChoices = [0xFF69B4, 0x7FFF00, 0xFF6347, 0x9370DB];
    graphics.fillStyle(colorChoices[this.rng.between(0, 3)], 1);
    graphics.fillCircle(0, 0, 14);
    graphics.fillStyle(0xFF0000, 1);
    graphics.fillCircle(0, 0, 5);
    graphics.generateTexture(`clownNPC_${Date.now()}_${Math.random()}`, 28, 28);
    graphics.destroy();

    clown.setTexture(`clownNPC_${Date.now()}_${Math.random()}`);
    (clown.body as Phaser.Physics.Arcade.Body).setSize(28, 28);
    (clown.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    this.clownNPCs.push({
      sprite: clown,
      state: 'walking',
      walkSpeed: 50 + this.rng.between(0, 50),
      direction: this.rng.between(0, 1) === 0 ? -1 : 1,
    });

    this.physics.add.collider(clown, this.platforms);
  }

  startChaosEvents() {
    // Spawn pies being thrown
    this.time.addEvent({
      delay: 2000 + this.rng.between(0, 2000),
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.throwPieFromClown();
        }
      },
      loop: true,
    });

    // Spawn throwable items
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.spawnThrowableItem();
        }
      },
      loop: true,
    });
  }

  throwPieFromClown() {
    const startX = this.rng.between(0, 1) === 0 ? 0 : 1280;
    const y = 200 + this.rng.between(0, 300);

    const pie = this.physics.add.sprite(startX, y, '');

    // Create pie visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFE4B5, 1);
    graphics.fillCircle(0, 0, 12);
    graphics.fillStyle(0xFFFFFF, 0.8);
    graphics.fillCircle(-3, -3, 4);
    graphics.generateTexture('pie', 24, 24);
    graphics.destroy();

    pie.setTexture('pie');
    (pie.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    (pie.body as Phaser.Physics.Arcade.Body).setVelocityX(startX === 0 ? 200 : -200);
    (pie.body as Phaser.Physics.Arcade.Body).setVelocityY(-100);

    this.obstacles.add(pie);

    // Destroy after time
    this.time.delayedCall(5000, () => {
      if (pie && pie.active) {
        pie.destroy();
      }
    });
  }

  spawnThrowableItem() {
    const x = 200 + this.rng.between(0, 880);
    const y = 300;

    const itemType = ['pie', 'ball', 'confetti'][this.rng.between(0, 2)] as ThrowableItem['type'];
    const item = this.physics.add.sprite(x, y, '');

    // Create item visual based on type
    const graphics = this.add.graphics();
    switch (itemType) {
      case 'pie':
        graphics.fillStyle(0xFFE4B5, 1);
        graphics.fillCircle(0, 0, 10);
        break;
      case 'ball':
        graphics.fillStyle(0xFF0000, 1);
        graphics.fillCircle(0, 0, 8);
        break;
      case 'confetti':
        graphics.fillStyle(0xFF69B4, 1);
        graphics.fillRect(-6, -6, 12, 12);
        break;
    }
    graphics.generateTexture(`item_${itemType}_${Date.now()}`, 20, 20);
    graphics.destroy();

    item.setTexture(`item_${itemType}_${Date.now()}`);
    (item.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    (item.body as Phaser.Physics.Arcade.Body).setBounce(0.5);

    this.throwableItems.push({ sprite: item, type: itemType });

    this.physics.add.collider(item, this.platforms);
  }

  showCountdown() {
    const countdownText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '3',
      {
        fontSize: '72px',
        color: '#FF1493',
        stroke: '#FFFF00',
        strokeThickness: 8,
        fontFamily: 'Impact',
      }
    );
    countdownText.setOrigin(0.5);
    countdownText.setDepth(1000);

    let count = 3;
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(count.toString());
        } else {
          countdownText.setText('GO CRAZY!');
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

    // Update performance system
    this.performanceSystem.update();

    // Update clown NPCs
    this.updateClownNPCs();

    // Check for item pickup
    this.checkItemPickup();

    // Check for prop interactions
    this.checkPropInteractions();

    // Performance tracking
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 50) {
      this.performanceSystem.noHesitation(delta);
    } else {
      this.performanceSystem.playerStopped(delta);
    }

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
    const speed = 200 * this.chainMultiplier;

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
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

    // Throw item
    if (Phaser.Input.Keyboard.JustDown(this.throwKey) && this.heldItem) {
      this.throwHeldItem();
    }
  }

  checkItemPickup() {
    if (this.heldItem) return; // Can only hold one item

    this.throwableItems.forEach((item, index) => {
      if (!item.sprite.active) return;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.sprite.x,
        item.sprite.y
      );

      if (distance < 40) {
        this.heldItem = item;
        item.sprite.setVisible(false);
        (item.sprite.body as Phaser.Physics.Arcade.Body).setEnable(false);
        this.performanceSystem.closeCall();
        this.showFloatingText('Picked up!', '#00FF00');
        this.throwableItems.splice(index, 1);
      }
    });
  }

  throwHeldItem() {
    if (!this.heldItem) return;

    const throwDirection = this.player.flipX ? -1 : 1;
    this.heldItem.sprite.setPosition(this.player.x + throwDirection * 30, this.player.y);
    this.heldItem.sprite.setVisible(true);
    (this.heldItem.sprite.body as Phaser.Physics.Arcade.Body).setEnable(true);
    (this.heldItem.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(
      throwDirection * 400,
      -200
    );

    // Check if it hits a clown
    this.time.delayedCall(100, () => {
      this.checkThrowableHit(this.heldItem!);
    });

    this.heldItem = null;
    this.performanceSystem.trickJump();
  }

  checkThrowableHit(item: ThrowableItem) {
    this.clownNPCs.forEach((clown) => {
      const distance = Phaser.Math.Distance.Between(
        item.sprite.x,
        item.sprite.y,
        clown.sprite.x,
        clown.sprite.y
      );

      if (distance < 50 && clown.state !== 'stunned') {
        // Stun the clown
        clown.state = 'stunned';
        clown.stunnedUntil = Date.now() + 3000;
        clown.sprite.setTint(0x888888);
        this.performanceSystem.perfectLanding();
        this.showFloatingText('Clown Stunned!', '#FFD700');

        // Chain reaction - drop juggling balls
        this.triggerChainReaction(clown.sprite.x, clown.sprite.y);
      }
    });
  }

  triggerChainReaction(x: number, y: number) {
    // Spawn bouncing balls as chain reaction
    for (let i = 0; i < 3; i++) {
      const ball = this.physics.add.sprite(x, y, '');

      const graphics = this.add.graphics();
      graphics.fillStyle(0xFF0000, 1);
      graphics.fillCircle(0, 0, 6);
      graphics.generateTexture(`reactionBall_${Date.now()}_${i}`, 12, 12);
      graphics.destroy();

      ball.setTexture(`reactionBall_${Date.now()}_${i}`);
      (ball.body as Phaser.Physics.Arcade.Body).setVelocity(
        this.rng.between(-200, 200),
        this.rng.between(-300, -100)
      );
      (ball.body as Phaser.Physics.Arcade.Body).setBounce(0.7);

      this.obstacles.add(ball);
      this.physics.add.collider(ball, this.platforms);

      this.time.delayedCall(5000, () => {
        if (ball.active) ball.destroy();
      });
    }

    this.performanceSystem.obstacleThreading();
  }

  checkPropInteractions() {
    this.interactiveProps.forEach((prop) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        prop.sprite.x,
        prop.sprite.y
      );

      const body = this.player.body as Phaser.Physics.Arcade.Body;

      if (distance < 50 && body.touching.down) {
        switch (prop.type) {
          case 'trampoline':
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
              // Variable bounce based on timing
              const bounceForce = -700 - this.trampolineChain * 50;
              this.player.setVelocityY(bounceForce);
              this.trampolineChain++;
              this.chainMultiplier = 1.0 + this.trampolineChain * 0.1;
              this.performanceSystem.trickJump();
              this.showFloatingText(`Chain ${this.trampolineChain}!`, '#FFD700');

              if (this.trampolineChain >= 5) {
                this.performanceSystem.perfectLanding();
                this.showFloatingText('PERFECT CHAIN!', '#FF00FF');
              }
            }
            break;

          case 'seesaw':
            // Tilt seesaw based on player position
            const tilt = (this.player.x - prop.sprite.x) / 40;
            prop.sprite.setAngle(Phaser.Math.Clamp(tilt * 15, -30, 30));
            break;
        }
      } else {
        // Reset chain if not on trampoline
        if (this.trampolineChain > 0 && body.touching.down) {
          this.trampolineChain = 0;
          this.chainMultiplier = 1.0;
        }
      }
    });
  }

  updateClownNPCs() {
    this.clownNPCs.forEach((clown) => {
      if (clown.state === 'stunned') {
        if (Date.now() > (clown.stunnedUntil || 0)) {
          clown.state = 'walking';
          clown.sprite.clearTint();
        }
        return;
      }

      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        clown.sprite.x,
        clown.sprite.y
      );

      if (this.heldItem && distanceToPlayer < 150) {
        // Flee from player with item
        clown.state = 'fleeing';
        const fleeDirection = this.player.x < clown.sprite.x ? 1 : -1;
        clown.sprite.setVelocityX(fleeDirection * clown.walkSpeed * 1.5);
      } else if (distanceToPlayer < 100) {
        // Walk away
        clown.state = 'walking';
        const walkDirection = this.player.x < clown.sprite.x ? 1 : -1;
        clown.sprite.setVelocityX(walkDirection * clown.walkSpeed);
      } else {
        // Random walking
        clown.state = 'walking';
        clown.sprite.setVelocityX(clown.direction * clown.walkSpeed);

        // Occasionally change direction
        if (this.rng.frac() < 0.01) {
          clown.direction *= -1;
        }
      }
    });
  }

  obscureVision() {
    this.visionObscured = true;
    this.pieOverlay.setVisible(true);

    // Draw cream splat overlay
    this.pieOverlay.clear();
    this.pieOverlay.fillStyle(0xFFFFFF, 0.7);
    this.pieOverlay.fillCircle(640, 360, 300);
    this.pieOverlay.fillStyle(0xFFE4B5, 0.5);
    this.pieOverlay.fillCircle(640, 360, 250);

    this.time.delayedCall(2000, () => {
      this.visionObscured = false;
      this.pieOverlay.setVisible(false);
    });
  }

  showFloatingText(text: string, color: string) {
    const floatText = this.add.text(this.player.x, this.player.y - 60, text, {
      fontSize: '18px',
      color: color,
      fontFamily: 'Impact',
      stroke: '#000000',
      strokeThickness: 3,
    });
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

  hitObstacle(_player: any, obstacle: any) {
    if (!this.gameFinished) {
      // Check if it's a pie
      if (obstacle.texture && obstacle.texture.key === 'pie') {
        this.obscureVision();
        this.performanceSystem.hitObstacle();
        obstacle.destroy();
        this.showFloatingText('PIE HIT!', '#FF0000');
      } else {
        this.performanceSystem.hitObstacle();
        this.respawnPlayer();
      }
    }
  }

  respawnPlayer() {
    this.performanceSystem.playerFell();
    this.player.setPosition(this.checkpointX, this.checkpointY);
    this.player.setVelocity(0, 0);
    this.trampolineChain = 0;
    this.chainMultiplier = 1.0;
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

      let bonusText = '';
      if (timeBonus > 0) {
        bonusText = `\nCrowd Bonus: -${(timeBonus / 1000).toFixed(2)}s!`;
      }

      const rank = this.performanceSystem.getStyleRank();
      const victoryText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        `🎪 CHAOS COMPLETE! 🎪\n${this.formatTime(finalTime)}\nStyle Rank: ${rank}${bonusText}`,
        {
          fontSize: '48px',
          color: '#FF1493',
          stroke: '#FFFF00',
          strokeThickness: 6,
          align: 'center',
          fontFamily: 'Impact',
        }
      );
      victoryText.setOrigin(0.5);
      victoryText.setDepth(1000);

      // Confetti explosion
      this.cameras.main.flash(500, 255, 105, 180);

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
