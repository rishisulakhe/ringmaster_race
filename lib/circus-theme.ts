// Circus Theme Design System

export const CIRCUS_COLORS = {
  // Primary palette
  deepRed: '#8B0000',
  cream: '#FFFDD0',
  gold: '#FFD700',

  // Secondary palette
  royalPurple: '#663399',
  emeraldGreen: '#50C878',
  sapphireBlue: '#0F52BA',

  // Accents
  white: '#FFFFFF',
  black: '#000000',

  // Gradients
  curtainGradient: 'linear-gradient(90deg, #8B0000 0%, #A52A2A 50%, #8B0000 100%)',
  fairgroundSky: 'linear-gradient(180deg, #0F1B4C 0%, #1E3A8A 50%, #2D5A9A 100%)',
  tentStripes: {
    arena1: { primary: '#DC143C', secondary: '#FFFFFF' },
    arena2: { primary: '#663399', secondary: '#FFD700' },
    arena3: { primary: '#0F52BA', secondary: '#C0C0C0' },
  },
};

export const CIRCUS_FONTS = {
  header: '"Alfa Slab One", "Arial Black", sans-serif',
  display: '"Righteous", "Impact", sans-serif',
  accent: '"Bungee", "Arial Black", sans-serif',
  body: '"Courier New", "Courier", monospace',
  timer: '"Orbitron", "Courier New", monospace',
};

export const CIRCUS_EFFECTS = {
  spotlight: {
    glow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4)',
    worldRecord: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6), 0 0 90px rgba(255, 215, 0, 0.4)',
  },
  shadow: {
    card: '0 10px 30px rgba(0, 0, 0, 0.3)',
    elevated: '0 20px 50px rgba(0, 0, 0, 0.5)',
    tent: '0 15px 40px rgba(0, 0, 0, 0.4)',
  },
  animation: {
    curtainDuration: 2000,
    tentHoverScale: 1.05,
    confettiDuration: 3000,
  },
};

export const ARENA_THEMES = {
  1: {
    name: 'Tightrope Walkway',
    icon: '🎪',
    color: CIRCUS_COLORS.deepRed,
    description: 'Balance high above the crowd on a tightrope',
    stripes: CIRCUS_COLORS.tentStripes.arena1,
    backgroundColor: '#1a0a0a',
    platformColor: '#8B4513',
    playerColor: '#FF69B4',
  },
  2: {
    name: 'Clown Alley',
    icon: '🤡',
    color: CIRCUS_COLORS.royalPurple,
    description: 'Navigate the chaotic world of circus clowns',
    stripes: CIRCUS_COLORS.tentStripes.arena2,
    backgroundColor: '#2D1B4E',
    platformColor: '#FF6B6B',
    playerColor: '#FFE66D',
  },
  3: {
    name: 'Juggling Tunnel',
    icon: '🎯',
    color: CIRCUS_COLORS.sapphireBlue,
    description: 'Master the spinning tunnel of juggling pins',
    stripes: CIRCUS_COLORS.tentStripes.arena3,
    backgroundColor: '#0A1628',
    platformColor: '#4ECDC4',
    playerColor: '#C0C0C0',
  },
};

export const CELEBRATION_CONFIG = {
  confetti: {
    count: 150,
    spread: 360,
    startVelocity: 45,
    decay: 0.9,
    scalar: 1.2,
  },
  worldRecord: {
    confettiCount: 300,
    fireworksCount: 5,
    spotlightDuration: 10000,
    drumrollDuration: 3000,
  },
  personalBest: {
    confettiCount: 100,
    bellSound: true,
    bannerDuration: 2000,
  },
};
