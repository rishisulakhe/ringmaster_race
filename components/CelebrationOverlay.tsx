'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CelebrationOverlayProps {
  isWorldRecord: boolean;
  isPersonalBest: boolean;
  timeMs: number;
  onComplete: () => void;
}

export function CelebrationOverlay({
  isWorldRecord,
  isPersonalBest,
  timeMs,
  onComplete,
}: CelebrationOverlayProps) {
  const [phase, setPhase] = useState<'drumroll' | 'explosion' | 'complete'>('drumroll');

  useEffect(() => {
    if (isWorldRecord) {
      // Drumroll phase
      const drumrollTimer = setTimeout(() => {
        setPhase('explosion');
      }, 3000);

      // Explosion phase
      const explosionTimer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 8000);

      return () => {
        clearTimeout(drumrollTimer);
        clearTimeout(explosionTimer);
      };
    } else {
      // Skip straight to complete for non-world records
      const timer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isWorldRecord, onComplete]);

  if (!isWorldRecord && !isPersonalBest) {
    return null;
  }

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
          }}
        >
          {/* World Record Celebration */}
          {isWorldRecord && phase === 'drumroll' && (
            <motion.div className="text-center">
              {/* Dimmed screen with spotlight on center */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.95) 70%)',
                }}
              />

              {/* Spotlight */}
              <motion.div
                className="absolute top-0 left-1/2 w-64 h-64 -translate-x-1/2"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  background: 'radial-gradient(ellipse, rgba(255,215,0,0.4) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />

              {/* Drumroll text */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                <div className="text-8xl mb-8">🥁</div>
                <div
                  className="text-6xl font-bold text-yellow-300 mb-4"
                  style={{
                    fontFamily: 'var(--font-alfa-slab)',
                    textShadow: '0 0 30px rgba(255,215,0,0.8)',
                  }}
                >
                  DRUMROLL...
                </div>
                <motion.div
                  className="text-2xl text-white"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  Something extraordinary happened...
                </motion.div>
              </motion.div>

              {/* Pulsing rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-500"
                  initial={{ width: 0, height: 0, opacity: 0.8 }}
                  animate={{
                    width: [0, 600],
                    height: [0, 600],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* World Record Explosion */}
          {isWorldRecord && phase === 'explosion' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative text-center"
            >
              {/* Flash of light */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 bg-white"
              />

              {/* Fireworks */}
              {[...Array(20)].map((_, i) => {
                const angle = (i * Math.PI * 2) / 20;
                const distance = 200 + Math.random() * 200;

                return (
                  <motion.div
                    key={i}
                    className="absolute text-6xl"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 0,
                      scale: [0, 1.5, 0],
                    }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  >
                    {['🎆', '🎇', '✨', '⭐', '💫'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                );
              })}

              {/* Golden confetti rain */}
              {[...Array(100)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute text-2xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-50px',
                  }}
                  initial={{ y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    y: window.innerHeight + 100,
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 720,
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 1,
                    ease: 'linear',
                  }}
                >
                  {['🎊', '🎉', '⭐', '✨'][Math.floor(Math.random() * 4)]}
                </motion.div>
              ))}

              {/* Main celebration text */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative z-10"
              >
                <div className="text-9xl mb-6 animate-bounce">👑</div>
                <motion.div
                  className="text-8xl font-bold mb-4"
                  style={{
                    fontFamily: 'var(--font-alfa-slab)',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 60px rgba(255,215,0,0.8)',
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  NEW WORLD
                  <br />
                  RECORD!
                </motion.div>

                {/* Ticker tape */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-r from-transparent via-yellow-400 to-transparent h-2 w-full mb-4"
                />

                <div
                  className="text-4xl text-yellow-200 font-bold"
                  style={{ fontFamily: 'var(--font-righteous)' }}
                >
                  You're the Champion!
                </div>
              </motion.div>

              {/* Spotlight beams */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`beam-${i}`}
                  className="absolute bottom-0 left-1/2 origin-bottom"
                  style={{
                    width: '80px',
                    height: '100vh',
                    background: 'linear-gradient(to top, rgba(255,215,0,0.3), transparent)',
                    transform: `translateX(-50%) rotate(${(i * 45) - 180}deg)`,
                    filter: 'blur(10px)',
                  }}
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          )}

          {/* Personal Best Celebration */}
          {isPersonalBest && !isWorldRecord && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center relative z-10"
            >
              {/* Confetti */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  style={{
                    left: `${50 + (Math.random() - 0.5) * 100}%`,
                    top: `${50 + (Math.random() - 0.5) * 100}%`,
                  }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    rotate: Math.random() * 360,
                    y: [0, -100, 100],
                  }}
                  transition={{ duration: 2, delay: Math.random() * 0.5 }}
                >
                  {['🌟', '⭐', '✨', '💫'][Math.floor(Math.random() * 4)]}
                </motion.div>
              ))}

              <div className="text-8xl mb-4">⭐</div>
              <motion.div
                className="text-7xl font-bold text-green-400 mb-4"
                style={{
                  fontFamily: 'var(--font-alfa-slab)',
                  textShadow: '0 0 20px rgba(0,255,0,0.6)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                PERSONAL BEST!
              </motion.div>
              <div className="text-2xl text-white" style={{ fontFamily: 'var(--font-righteous)' }}>
                You're improving! Keep it up!
              </div>

              {/* Bell ring effect */}
              <motion.div
                className="text-6xl mt-8"
                animate={{
                  rotate: [-20, 20, -20],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                🔔
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
