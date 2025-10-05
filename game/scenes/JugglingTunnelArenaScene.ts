import * as Phaser from 'phaser';
import type { LevelData } from '@/types/game';
import { ARENA_THEMES } from '@/lib/circus-theme';
import { PerformanceSystem } from '@/game/systems/PerformanceSystem';

/**
 * Arena 3: Juggling Tunnel
 * Theme: Rhythm-based gameplay with rotating tunnel
 * Mechanics: Beat synchronization, pattern recognition, gravity shifts
 */

interface JugglingObject {
  sprite: Phaser.GameObjects.Sprite;
  type: 'pin' | 'ball' | 'knife' | 'torch';
  pattern: 'cascade' | 'fountain' | 'shower';
  phase: number; // Position in pattern cycle
  depth: number; // Foreground (1.0) to background (0.5)
  speed: number;
}

interface TunnelSection {
  name: string;
  startX: number;
  endX: number;
  type: 'knife' | 'fire' | 'mirror' | 'speed';
  active: boolean;
}

export class JugglingTunnelArenaScene extends Phaser.Scene {
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

  // Juggling Tunnel specific
  private bpm: number = 130; // Beats per minute
  private beatInterval: number = 0; // Milliseconds between beats
  private lastBeatTime: number = 0;
  private beatCount: number = 0;
  private currentBar: number = 0; // 4 beats per bar

  // Rhythm system
  private rhythmCombo: number = 0;
  private maxRhythmCombo: number = 0;
  private onBeatWindow: number = 150; // ms tolerance for "on beat"
  private lastJumpTime: number = 0;
  private speedBoostUntil: number = 0;

  // Tunnel rotation
  private tunnelRotation: number = 0; // 0-360 degrees
  private rotationSpeed: number = 0; // Degrees per second
  private gravityAngle: number = 90; // Down is 90°
  private tunnelWalls: Phaser.GameObjects.Graphics[] = [];

  // Juggling objects
  private jugglingObjects: JugglingObject[] = [];
  private objectPatternTimer!: Phaser.Time.TimerEvent;
  private patternPhase: number = 0; // 0-7 (8 bars per pattern)

  // Tunnel sections
  private currentSection: TunnelSection | null = null;
  private sections: TunnelSection[] = [];

  // Visual elements
  private metronomeBorder!: Phaser.GameObjects.Graphics;
  private beatPulse: number = 0;
  private comboText!: Phaser.GameObjects.Text;
  private sectionText!: Phaser.GameObjects.Text;
  private mirrorEffect: boolean = false;

  // Performance system
  private performanceSystem!: PerformanceSystem;

  constructor() {
    super({ key: 'JugglingTunnelArenaScene' });
  }

  init(data: { levelData: LevelData; onComplete: (timeMs: number) => void }) {
    this.levelData = data.levelData;
    this.onComplete = data.onComplete;
    this.beatInterval = (60 / this.bpm) * 1000; // Convert BPM to ms
  }

  create() {
    const theme = ARENA_THEMES[3];

    // Set background
    this.cameras.main.setBackgroundColor(theme.backgroundColor);

    // Create tunnel atmosphere
    this.createTunnelAtmosphere();

    // Create physics groups
    this.platforms = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.group();

    // Create tunnel sections
    this.createTunnelSections();

    // Create platforms
    this.createPlatforms();
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

    // Create metronome border
    this.createMetronome();

    // Create performance system
    this.performanceSystem = new PerformanceSystem(this);

    // Set checkpoint
    this.checkpointX = this.levelData.startPoint.x;
    this.checkpointY = this.levelData.startPoint.y;

    // Start rhythm events
    this.startRhythmSystem();

    // Show countdown
    this.showCountdown();
  }

  createTunnelAtmosphere() {
    // Create tunnel walls with perspective effect
    for (let i = 0; i < 4; i++) {
      const wall = this.add.graphics();
      wall.setDepth(-10 + i);
      this.tunnelWalls.push(wall);
    }

    // Draw initial tunnel
    this.updateTunnelVisuals();

    // Depth particles
    for (let i = 0; i < 30; i++) {
      const depth = 0.3 + Math.random() * 0.7;
      const particle = this.add.circle(
        Math.random() * 1280,
        Math.random() * 720,
        2 * depth,
        0xFFD700,
        0.6 * depth
      );
      particle.setDepth(-5);

      // Parallax movement
      particle.setScrollFactor(depth);
    }
  }

  updateTunnelVisuals() {
    this.tunnelWalls.forEach((wall, index) => {
      wall.clear();

      // Draw tunnel segments with rotation
      const segments = 8;
      const angleStep = 360 / segments;

      for (let i = 0; i < segments; i++) {
        const angle = (i * angleStep + this.tunnelRotation) % 360;
        const nextAngle = ((i + 1) * angleStep + this.tunnelRotation) % 360;

        // Color based on position and current section
        let color = 0x4B0082; // Default indigo
        if (this.currentSection?.type === 'fire') {
          color = 0xFF4500;
        } else if (this.currentSection?.type === 'knife') {
          color = 0x2F4F4F;
        } else if (this.currentSection?.type === 'mirror') {
          color = 0xB0C4DE;
        } else if (this.currentSection?.type === 'speed') {
          color = 0xFF1493;
        }

        // Alternate segments for visual variety
        if (i % 2 === 0) {
          wall.fillStyle(color, 0.3 + index * 0.1);
        } else {
          wall.fillStyle(0x000000, 0.2 + index * 0.1);
        }

        // Draw segment (simplified as rectangles)
        const x1 = 640 + Math.cos((angle * Math.PI) / 180) * (200 + index * 50);
        const y1 = 360 + Math.sin((angle * Math.PI) / 180) * (200 + index * 50);
        const x2 = 640 + Math.cos((nextAngle * Math.PI) / 180) * (200 + index * 50);
        const y2 = 360 + Math.sin((nextAngle * Math.PI) / 180) * (200 + index * 50);

        wall.fillTriangle(640, 360, x1, y1, x2, y2);
      }
    });
  }

  createTunnelSections() {
    this.sections = [
      { name: 'Knife Thrower', startX: 200, endX: 400, type: 'knife', active: false },
      { name: 'Fire Rings', startX: 500, endX: 700, type: 'fire', active: false },
      { name: 'Mirror Maze', startX: 800, endX: 950, type: 'mirror', active: false },
      { name: 'Speed Tunnel', startX: 1000, endX: 1150, type: 'speed', active: false },
    ];
  }

  createPlatforms() {
    // Create curved tunnel floor (multiple small platforms)
    for (let i = 0; i < 20; i++) {
      const x = i * 70;
      const y = 600 + Math.sin(i * 0.5) * 30; // Wavy floor

      const platform = this.add.rectangle(x, y, 80, 20, 0x4B0082);
      this.platforms.add(platform);
    }

    // Ground platform
    const ground = this.add.rectangle(640, 700, 1280, 20, 0x2F4F4F);
    this.platforms.add(ground);
  }

  createFinishLine() {
    const finishX = this.levelData.finishLine.x;
    const finishY = this.levelData.finishLine.y;

    this.finishZone = this.add.rectangle(finishX, finishY, 50, 100, 0xFFD700);
    this.physics.add.existing(this.finishZone);
    (this.finishZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

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

    // Create juggler performer visual
    const graphics = this.add.graphics();
    graphics.fillStyle(0x9370DB, 1); // Purple outfit
    graphics.fillCircle(0, 0, 16);
    // Add stars
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      graphics.fillStyle(0xFFD700, 0.8);
      graphics.fillCircle(Math.cos(angle) * 12, Math.sin(angle) * 12, 3);
    }
    graphics.generateTexture('jugglerPlayer', 32, 32);
    graphics.destroy();

    this.player.setTexture('jugglerPlayer');
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

    // Rhythm combo
    this.comboText = this.add.text(16, 50, '', {
      fontSize: '20px',
      color: '#00FF00',
      fontFamily: 'Impact',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.comboText.setScrollFactor(0);
    this.comboText.setDepth(100);

    // Section indicator
    this.sectionText = this.add.text(640, 16, '', {
      fontSize: '18px',
      color: '#FF1493',
      fontFamily: 'Impact',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.sectionText.setOrigin(0.5, 0);
    this.sectionText.setScrollFactor(0);
    this.sectionText.setDepth(100);

    // Instructions
    const instructions = this.add.text(
      640,
      680,
      'Jump On Beat! | Follow the Rhythm | Watch the Colors!',
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

  createMetronome() {
    this.metronomeBorder = this.add.graphics();
    this.metronomeBorder.setScrollFactor(0);
    this.metronomeBorder.setDepth(99);
  }

  updateMetronome() {
    this.metronomeBorder.clear();

    // Pulsing border on beat
    const timeSinceBeat = Date.now() - this.lastBeatTime;
    const beatProgress = timeSinceBeat / this.beatInterval;

    // Pulse intensity (0-1, peaks at beat)
    this.beatPulse = Math.max(0, 1 - beatProgress * 4);

    const pulseWidth = 5 + this.beatPulse * 10;
    const pulseAlpha = 0.3 + this.beatPulse * 0.7;

    // Color based on rhythm combo
    let color = 0xFFD700; // Gold
    if (this.rhythmCombo >= 20) {
      color = 0xFF00FF; // Purple for high combo
    } else if (this.rhythmCombo >= 10) {
      color = 0x00FFFF; // Cyan for medium combo
    }

    this.metronomeBorder.lineStyle(pulseWidth, color, pulseAlpha);
    this.metronomeBorder.strokeRect(0, 0, 1280, 720);

    // Beat indicator dots
    for (let i = 0; i < 4; i++) {
      const beatInBar = this.beatCount % 4;
      const dotX = 640 - 60 + i * 40;
      const dotY = 700;

      if (i === beatInBar) {
        this.metronomeBorder.fillStyle(color, 1);
        this.metronomeBorder.fillCircle(dotX, dotY, 8 + this.beatPulse * 4);
      } else {
        this.metronomeBorder.fillStyle(0x888888, 0.5);
        this.metronomeBorder.fillCircle(dotX, dotY, 6);
      }
    }
  }

  startRhythmSystem() {
    // Beat timer
    this.time.addEvent({
      delay: this.beatInterval,
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.onBeat();
        }
      },
      loop: true,
    });

    // Spawn juggling objects on beat
    this.objectPatternTimer = this.time.addEvent({
      delay: this.beatInterval * 2, // Every 2 beats
      callback: () => {
        if (!this.gameFinished && this.gameStarted && !this.gamePaused) {
          this.spawnJugglingPattern();
        }
      },
      loop: true,
    });
  }

  onBeat() {
    this.lastBeatTime = Date.now();
    this.beatCount++;

    // Update bar count (4 beats per bar)
    if (this.beatCount % 4 === 0) {
      this.currentBar++;
      this.patternPhase = this.currentBar % 8; // 8-bar pattern cycle
    }

    // Camera pulse on beat
    this.cameras.main.flash(50, 138, 43, 226, false, undefined, 0.1);

    // Rotate tunnel on beat
    if (this.currentSection?.type !== 'speed') {
      this.rotationSpeed = 10; // Degrees per second
    }
  }

  spawnJugglingPattern() {
    const patterns: JugglingObject['pattern'][] = ['cascade', 'fountain', 'shower'];
    const pattern = patterns[Math.floor(this.patternPhase / 3) % 3];

    // Number of objects increases with pattern phase
    const objectCount = Math.min(3 + Math.floor(this.patternPhase / 2), 7);

    for (let i = 0; i < objectCount; i++) {
      this.createJugglingObject(pattern, i, objectCount);
    }
  }

  createJugglingObject(pattern: JugglingObject['pattern'], index: number, total: number) {
    const types: JugglingObject['type'][] = ['pin', 'ball', 'knife', 'torch'];
    const type = this.currentSection?.type === 'knife' ? 'knife' :
                 this.currentSection?.type === 'fire' ? 'torch' :
                 types[Math.floor(Math.random() * 2)]; // Mostly pins and balls

    const startX = 1400 + index * 50;
    const startY = 200 + Math.random() * 300;

    const sprite = this.add.sprite(startX, startY, '');

    // Create visual based on type
    const graphics = this.add.graphics();
    switch (type) {
      case 'pin':
        graphics.fillStyle(0xFF6347, 1);
        graphics.fillRect(-4, -15, 8, 30);
        graphics.fillCircle(0, -15, 6);
        graphics.fillCircle(0, 15, 6);
        break;
      case 'ball':
        graphics.fillStyle(0x00BFFF, 1);
        graphics.fillCircle(0, 0, 10);
        graphics.fillStyle(0xFFFFFF, 0.5);
        graphics.fillCircle(-3, -3, 4);
        break;
      case 'knife':
        graphics.fillStyle(0xC0C0C0, 1);
        graphics.fillTriangle(-5, 15, 5, 15, 0, -15);
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(-3, 10, 6, 10);
        break;
      case 'torch':
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(-3, 0, 6, 20);
        graphics.fillStyle(0xFF4500, 1);
        graphics.fillCircle(0, -5, 8);
        graphics.fillStyle(0xFFD700, 0.8);
        graphics.fillCircle(0, -5, 5);
        break;
    }
    graphics.generateTexture(`juggling_${type}_${Date.now()}_${index}`, 30, 40);
    graphics.destroy();

    sprite.setTexture(`juggling_${type}_${Date.now()}_${index}`);

    // Depth (distance) for parallax
    const depth = 0.5 + (index / total) * 0.5;
    sprite.setScale(depth);
    sprite.setDepth(depth * 10);
    sprite.setAlpha(0.7 + depth * 0.3);

    // Add to physics
    this.physics.add.existing(sprite);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (sprite.body as Phaser.Physics.Arcade.Body).setSize(20, 20);

    const obj: JugglingObject = {
      sprite,
      type,
      pattern,
      phase: (index / total) * Math.PI * 2, // Spread around pattern
      depth,
      speed: 150 * depth, // Closer objects move faster
    };

    this.jugglingObjects.push(obj);
    this.obstacles.add(sprite);

    // Animate based on pattern
    this.animateJugglingObject(obj);
  }

  animateJugglingObject(obj: JugglingObject) {
    const duration = 4000 / obj.depth; // Closer = faster

    switch (obj.pattern) {
      case 'cascade':
        // Classic juggling arc
        this.tweens.add({
          targets: obj.sprite,
          x: obj.sprite.x - 1600,
          y: 360 + Math.sin(obj.phase) * 150,
          duration,
          ease: 'Linear',
          onComplete: () => this.destroyJugglingObject(obj),
        });

        // Rotation
        this.tweens.add({
          targets: obj.sprite,
          angle: 720,
          duration,
          ease: 'Linear',
        });
        break;

      case 'fountain':
        // Symmetric up-down pattern
        this.tweens.add({
          targets: obj.sprite,
          x: obj.sprite.x - 1600,
          duration,
          ease: 'Linear',
          onComplete: () => this.destroyJugglingObject(obj),
        });

        this.tweens.add({
          targets: obj.sprite,
          y: obj.sprite.y - 200,
          duration: duration / 2,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
        break;

      case 'shower':
        // Circular pattern
        this.tweens.add({
          targets: obj.sprite,
          x: obj.sprite.x - 1600,
          duration,
          ease: 'Linear',
          onComplete: () => this.destroyJugglingObject(obj),
        });

        // Circular motion
        const circleRadius = 100;
        const circleSpeed = duration;
        this.tweens.add({
          targets: obj.sprite,
          y: obj.sprite.y + circleRadius * Math.sin(obj.phase + Math.PI * 4),
          duration: circleSpeed,
          ease: 'Sine.inOut',
        });
        break;
    }
  }

  destroyJugglingObject(obj: JugglingObject) {
    const index = this.jugglingObjects.indexOf(obj);
    if (index > -1) {
      this.jugglingObjects.splice(index, 1);
    }
    obj.sprite.destroy();
  }

  updateColorCoding() {
    // Update color of juggling objects based on time to collision
    this.jugglingObjects.forEach((obj) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        obj.sprite.x,
        obj.sprite.y
      );

      const timeToCollision = distance / obj.speed;

      // Color coding
      if (timeToCollision < 1) {
        // Red - immediate danger
        obj.sprite.setTint(0xFF0000);
      } else if (timeToCollision < 2) {
        // Yellow - coming soon
        obj.sprite.setTint(0xFFFF00);
      } else {
        // Green - safe for now
        obj.sprite.setTint(0x00FF00);
      }
    });
  }

  showCountdown() {
    const countdownText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '3',
      {
        fontSize: '72px',
        color: '#9370DB',
        stroke: '#FFD700',
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
          countdownText.setText('FEEL THE RHYTHM!');
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
    this.lastBeatTime = Date.now();
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

    // Update tunnel rotation
    this.updateTunnelRotation(delta);

    // Update metronome
    this.updateMetronome();

    // Update color coding
    this.updateColorCoding();

    // Update tunnel visuals
    this.updateTunnelVisuals();

    // Check current section
    this.updateCurrentSection();

    // Update performance system
    this.performanceSystem.update();

    // Performance tracking
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 50) {
      this.performanceSystem.noHesitation(delta);
    } else {
      this.performanceSystem.playerStopped(delta);
    }

    // Speed boost indicator
    if (Date.now() < this.speedBoostUntil) {
      // Visual effect for speed boost
      if (Math.floor(_time / 100) % 2 === 0) {
        this.player.setTint(0x00FFFF);
      } else {
        this.player.clearTint();
      }
    } else {
      if (this.mirrorEffect) {
        this.player.setTint(0xB0C4DE);
      } else {
        this.player.clearTint();
      }
    }

    // Update combo text
    if (this.rhythmCombo > 0) {
      this.comboText.setText(`🎵 ${this.rhythmCombo}x RHYTHM COMBO`);
      this.comboText.setVisible(true);

      // Color based on combo
      if (this.rhythmCombo >= 20) {
        this.comboText.setColor('#FF00FF');
      } else if (this.rhythmCombo >= 10) {
        this.comboText.setColor('#00FFFF');
      } else {
        this.comboText.setColor('#00FF00');
      }
    } else {
      this.comboText.setVisible(false);
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

    // Speed multiplier from combo + section
    let speed = 200;
    if (Date.now() < this.speedBoostUntil) {
      speed *= 1.5;
    }
    if (this.currentSection?.type === 'speed') {
      speed *= 2;
    }

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump with rhythm detection
    if (
      (Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      body.touching.down
    ) {
      this.lastJumpTime = Date.now();
      const timeSinceBeat = Math.abs(this.lastJumpTime - this.lastBeatTime);

      // Check if jump is on beat
      if (timeSinceBeat < this.onBeatWindow || timeSinceBeat > (this.beatInterval - this.onBeatWindow)) {
        // On beat!
        this.player.setVelocityY(-550); // Slightly higher jump
        this.rhythmCombo++;

        if (this.rhythmCombo > this.maxRhythmCombo) {
          this.maxRhythmCombo = this.rhythmCombo;
        }

        this.performanceSystem.perfectLanding();
        this.showFloatingText('ON BEAT!', '#00FF00');

        // Every 10 on-beat jumps, speed boost
        if (this.rhythmCombo > 0 && this.rhythmCombo % 10 === 0) {
          this.speedBoostUntil = Date.now() + 3000;
          this.performanceSystem.trickJump();
          this.showFloatingText('SPEED BOOST!', '#00FFFF');
          this.cameras.main.flash(200, 0, 255, 255);
        }

        // Crowd meter bonus
        if (this.rhythmCombo % 5 === 0) {
          this.performanceSystem.closeCall();
        }
      } else {
        // Off beat
        this.player.setVelocityY(-500);
        this.rhythmCombo = 0;
        this.showFloatingText('Off Beat', '#FF6347');
      }
    }
  }

  updateTunnelRotation(delta: number) {
    // Slow down rotation over time
    this.rotationSpeed *= 0.95;

    // Apply rotation
    this.tunnelRotation += this.rotationSpeed * (delta / 1000);
    this.tunnelRotation %= 360;

    // Update gravity angle based on player position and tunnel rotation
    // For now, keep gravity down (could add wall-walking mechanics)
    this.gravityAngle = 90 + this.tunnelRotation;
  }

  updateCurrentSection() {
    const playerX = this.player.x;

    let newSection: TunnelSection | null = null;
    for (const section of this.sections) {
      if (playerX >= section.startX && playerX <= section.endX) {
        newSection = section;
        break;
      }
    }

    if (newSection !== this.currentSection) {
      this.currentSection = newSection;

      if (newSection) {
        this.sectionText.setText(`⚡ ${newSection.name} ⚡`);
        this.enterSection(newSection);
      } else {
        this.sectionText.setText('');
        this.exitSection();
      }
    }
  }

  enterSection(section: TunnelSection) {
    this.cameras.main.flash(300, 255, 105, 180);

    switch (section.type) {
      case 'knife':
        // Spawn knives sticking out of walls
        this.spawnKnifePattern();
        break;
      case 'fire':
        // Create spinning fire rings
        this.spawnFireRings();
        break;
      case 'mirror':
        // Enable mirror effect
        this.mirrorEffect = true;
        this.cameras.main.setAlpha(0.7);
        break;
      case 'speed':
        // Everything speeds up
        this.rotationSpeed = 30;
        this.beatInterval *= 0.5;
        break;
    }
  }

  exitSection() {
    this.mirrorEffect = false;
    this.cameras.main.setAlpha(1);
    this.beatInterval = (60 / this.bpm) * 1000; // Reset BPM
  }

  spawnKnifePattern() {
    // Knives stuck in walls in patterns
    for (let i = 0; i < 5; i++) {
      const x = this.currentSection!.startX + i * 50;
      const y = 400 + Math.sin(i) * 100;

      const knife = this.physics.add.sprite(x, y, '');

      const graphics = this.add.graphics();
      graphics.fillStyle(0xC0C0C0, 1);
      graphics.fillTriangle(-8, 25, 8, 25, 0, -25);
      graphics.generateTexture(`wallKnife_${i}`, 20, 50);
      graphics.destroy();

      knife.setTexture(`wallKnife_${i}`);
      (knife.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      (knife.body as Phaser.Physics.Arcade.Body).setImmovable(true);

      this.obstacles.add(knife);
    }
  }

  spawnFireRings() {
    const ringX = this.currentSection!.startX + 100;

    const ring = this.add.sprite(ringX, 360, '');

    const graphics = this.add.graphics();
    graphics.lineStyle(8, 0xFF4500, 1);
    graphics.strokeCircle(0, 0, 60);
    graphics.lineStyle(4, 0xFFD700, 0.8);
    graphics.strokeCircle(0, 0, 55);
    graphics.generateTexture('fireRing', 130, 130);
    graphics.destroy();

    ring.setTexture('fireRing');
    this.physics.add.existing(ring);
    (ring.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (ring.body as Phaser.Physics.Arcade.Body).setCircle(60);

    this.obstacles.add(ring);

    // Spin the ring
    this.tweens.add({
      targets: ring,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });
  }

  showFloatingText(text: string, color: string) {
    const floatText = this.add.text(this.player.x, this.player.y - 60, text, {
      fontSize: '16px',
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
      duration: 1000,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });
  }

  hitObstacle() {
    if (!this.gameFinished) {
      this.performanceSystem.hitObstacle();
      this.rhythmCombo = 0;
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    this.performanceSystem.playerFell();
    this.player.setPosition(this.checkpointX, this.checkpointY);
    this.player.setVelocity(0, 0);
    this.rhythmCombo = 0;
    this.cameras.main.flash(200, 255, 0, 0);
  }

  reachFinish() {
    if (!this.gameFinished) {
      this.gameFinished = true;
      const baseTime = Date.now() - this.startTime;

      // Rhythm bonus (10ms per combo point)
      const rhythmBonus = this.maxRhythmCombo * 10;
      const timeBonus = this.performanceSystem.getTimeBonus() + rhythmBonus;
      const finalTime = Math.max(0, baseTime - timeBonus);

      this.player.setVelocity(0, 0);

      let bonusText = '';
      if (timeBonus > 0) {
        bonusText = `\nCrowd Bonus: -${(this.performanceSystem.getTimeBonus() / 1000).toFixed(2)}s!`;
        bonusText += `\nRhythm Bonus: -${(rhythmBonus / 1000).toFixed(2)}s!`;
      }

      const rank = this.performanceSystem.getStyleRank();
      const victoryText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        `🎪 RHYTHM MASTER! 🎪\n${this.formatTime(finalTime)}\nStyle Rank: ${rank}\nMax Combo: ${this.maxRhythmCombo}${bonusText}`,
        {
          fontSize: '42px',
          color: '#9370DB',
          stroke: '#FFD700',
          strokeThickness: 6,
          align: 'center',
          fontFamily: 'Impact',
        }
      );
      victoryText.setOrigin(0.5);
      victoryText.setDepth(1000);

      this.cameras.main.flash(500, 147, 112, 219);

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
      if (this.objectPatternTimer) {
        this.objectPatternTimer.paused = true;
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
      if (this.objectPatternTimer) {
        this.objectPatternTimer.paused = false;
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
