'use client';

import { motion } from 'framer-motion';
import type { ArenaResponse } from '@/types/api';

interface CircusTentProps {
  arena: ArenaResponse;
  onClick: () => void;
  formatTime: (ms: number) => string;
  isWorldRecordHolder: boolean;
}

export function CircusTent({ arena, onClick, formatTime, isWorldRecordHolder }: CircusTentProps) {
  const getTentStyle = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return {
          stripeClass: 'tent-stripes-red',
          icon: '🎪',
          color: '#DC143C',
        };
      case 2:
        return {
          stripeClass: 'tent-stripes-purple',
          icon: '🤡',
          color: '#663399',
        };
      case 3:
        return {
          stripeClass: 'tent-stripes-blue',
          icon: '🎯',
          color: '#0F52BA',
        };
      default:
        return {
          stripeClass: 'tent-stripes-red',
          icon: '🎪',
          color: '#DC143C',
        };
    }
  };

  const tentStyle = getTentStyle(arena.difficulty);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: arena.difficulty * 0.15 }}
    >
      <button
        onClick={onClick}
        disabled={!arena.isUnlocked}
        className={`
          relative w-full group
          ${arena.isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
        `}
      >
        {/* Tent Container */}
        <motion.div
          whileHover={arena.isUnlocked ? { scale: 1.05, y: -10 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative"
        >
          {/* World Record Crown */}
          {isWorldRecordHolder && (
            <motion.div
              initial={{ rotate: -20, y: -10 }}
              animate={{ rotate: 0, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-6 -right-6 z-20"
            >
              <div className="relative">
                <div className="text-6xl carnival-lights">👑</div>
                <div
                  className="absolute inset-0 blur-xl"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)',
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Completion Trophy */}
          {arena.personalBest !== null && arena.isUnlocked && !isWorldRecordHolder && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -top-4 -left-4 z-20 text-5xl"
            >
              🏆
            </motion.div>
          )}

          {/* Tent Structure */}
          <div className="relative">
            {/* Tent Top (Triangle) */}
            <div className="relative">
              <svg
                viewBox="0 0 200 120"
                className="w-full h-auto drop-shadow-2xl"
                style={{
                  filter: arena.isUnlocked
                    ? 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.4))'
                    : 'drop-shadow(0 5px 20px rgba(0, 0, 0, 0.2))',
                }}
              >
                {/* Tent canopy with stripes */}
                <defs>
                  <pattern
                    id={`stripes-${arena.id}`}
                    patternUnits="userSpaceOnUse"
                    width="40"
                    height="40"
                    patternTransform="rotate(-45)"
                  >
                    <rect width="20" height="40" fill={tentStyle.color} />
                    <rect x="20" width="20" height="40" fill="#FFFFFF" />
                  </pattern>
                  <linearGradient id={`shadow-${arena.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
                  </linearGradient>
                </defs>

                {/* Main tent triangle */}
                <polygon
                  points="100,10 10,110 190,110"
                  fill={`url(#stripes-${arena.id})`}
                  stroke="#000"
                  strokeWidth="2"
                  opacity={arena.isUnlocked ? 1 : 0.4}
                />

                {/* Shading overlay */}
                <polygon
                  points="100,10 10,110 190,110"
                  fill={`url(#shadow-${arena.id})`}
                  opacity="0.3"
                />

                {/* Tent pole */}
                <rect x="98" y="10" width="4" height="100" fill="#8B4513" />

                {/* Gold trim at top */}
                <circle cx="100" cy="10" r="8" fill="#FFD700" stroke="#8B4513" strokeWidth="2" />
              </svg>

              {/* Tent Flag */}
              <motion.div
                className="absolute top-2 left-1/2 -translate-x-1/2 origin-bottom"
                animate={
                  arena.isUnlocked
                    ? {
                        rotate: [0, 5, -5, 0],
                      }
                    : {}
                }
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="text-3xl">{tentStyle.icon}</div>
              </motion.div>
            </div>

            {/* Tent Entrance (Bottom Rectangle) */}
            <div
              className={`
                relative -mt-2 mx-auto w-3/4 h-24 rounded-b-lg
                ${arena.isUnlocked ? tentStyle.stripeClass : 'bg-gray-600'}
                border-2 border-black
              `}
              style={{ opacity: arena.isUnlocked ? 1 : 0.4 }}
            >
              {/* Entrance Flaps */}
              {arena.isUnlocked ? (
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-black/20 to-black/40 rounded-bl-lg" />
                  <div className="w-1/3 h-full bg-gradient-to-l from-transparent via-black/20 to-black/40 rounded-br-lg" />
                </div>
              ) : (
                // Padlock for locked arenas
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl">🔒</div>
                </div>
              )}

              {/* Gold rope decoration */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />
            </div>
          </div>

          {/* Arena Name Banner */}
          <motion.div
            className="relative mt-4 mx-auto w-11/12 circus-card rounded-lg p-4"
            whileHover={arena.isUnlocked ? { boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)' } : {}}
          >
            <h3
              className="text-2xl font-bold text-center text-red-900 mb-1"
              style={{ fontFamily: 'var(--font-alfa-slab)' }}
            >
              {arena.name}
            </h3>

            {/* Description */}
            {arena.description && (
              <p className="text-sm text-center text-gray-700 mb-3" style={{ fontFamily: 'var(--font-righteous)' }}>
                {arena.description}
              </p>
            )}

            {/* Stats Display */}
            {arena.isUnlocked && (
              <div className="space-y-2 bg-white/40 rounded-md p-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-800 font-semibold">Your Best:</span>
                  <span className="font-mono font-bold text-green-800">
                    {arena.personalBest ? formatTime(arena.personalBest) : '--:--:---'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-800 font-semibold">World Record:</span>
                  <span className="font-mono font-bold text-purple-800">
                    {arena.worldRecord ? formatTime(arena.worldRecord) : '--:--:---'}
                  </span>
                </div>
              </div>
            )}

            {!arena.isUnlocked && (
              <p className="text-center text-sm text-red-800 font-semibold mt-2">
                Complete previous arena to unlock
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* Hover glow effect */}
        {arena.isUnlocked && (
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${tentStyle.color}40 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
        )}
      </button>
    </motion.div>
  );
}
