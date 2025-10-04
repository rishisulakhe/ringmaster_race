'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface CurtainAnimationProps {
  onComplete: () => void;
  autoStart?: boolean;
}

export function CurtainAnimation({ onComplete, autoStart = false }: CurtainAnimationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(!autoStart);

  useEffect(() => {
    if (autoStart) {
      // Auto-open after a brief delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  const handleEnter = () => {
    setShowButton(false);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      // Complete after curtains are fully open
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {!isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Left Curtain */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: isOpen ? '-100%' : 0 }}
            transition={{ duration: 2, ease: [0.65, 0, 0.35, 1] }}
            className="absolute left-0 top-0 bottom-0 w-1/2 origin-left"
            style={{
              background: 'linear-gradient(90deg, #8B0000 0%, #A52A2A 50%, #DC143C 100%)',
            }}
          >
            {/* Curtain texture - vertical pleats */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[5%] bg-gradient-to-r from-black/30 to-transparent"
                  style={{ left: `${i * 5}%` }}
                />
              ))}
            </div>

            {/* Gold tassels */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-amber-600 to-yellow-500">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute right-0 w-8 h-16 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-b-full"
                  style={{ top: `${i * 8.33}%` }}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-amber-700" />
                </div>
              ))}
            </div>

            {/* Velvet texture effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
          </motion.div>

          {/* Right Curtain */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: isOpen ? '100%' : 0 }}
            transition={{ duration: 2, ease: [0.65, 0, 0.35, 1] }}
            className="absolute right-0 top-0 bottom-0 w-1/2 origin-right"
            style={{
              background: 'linear-gradient(90deg, #DC143C 0%, #A52A2A 50%, #8B0000 100%)',
            }}
          >
            {/* Curtain texture - vertical pleats */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[5%] bg-gradient-to-r from-transparent to-black/30"
                  style={{ left: `${i * 5}%` }}
                />
              ))}
            </div>

            {/* Gold tassels */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-l from-amber-600 to-yellow-500">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-8 h-16 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-b-full"
                  style={{ top: `${i * 8.33}%` }}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-amber-700" />
                </div>
              ))}
            </div>

            {/* Velvet texture effect */}
            <div className="absolute inset-0 bg-gradient-to-bl from-white/5 via-transparent to-black/20" />
          </motion.div>

          {/* Spotlight scanning effect */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={
              !isOpen
                ? {
                    x: ['0%', '100%'],
                    opacity: [0, 0.3, 0.3, 0],
                  }
                : { opacity: 0 }
            }
            transition={{
              duration: 3,
              repeat: isOpen ? 0 : Infinity,
              ease: 'linear',
            }}
            className="absolute top-0 left-0 w-32 h-full pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              filter: 'blur(20px)',
            }}
          />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {showButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="pointer-events-auto"
              >
                <button
                  onClick={handleEnter}
                  className="relative group px-12 py-6 text-3xl font-bold rounded-full overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-700">
                    🎪 Enter the Show 🎪
                  </span>
                </button>
              </motion.div>
            )}

            {/* Drumroll text when opening */}
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-6xl font-bold text-yellow-300 pointer-events-none"
                style={{
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)',
                  fontFamily: '"Alfa Slab One", sans-serif',
                }}
              >
                Presenting...
              </motion.div>
            )}
          </div>

          {/* Top decorative border */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-amber-600 to-yellow-500 z-10">
            <div className="absolute inset-0 flex justify-around">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-1 h-full bg-amber-800" />
              ))}
            </div>
          </div>

          {/* Silhouettes behind curtain (subtle) */}
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.1, 0.05, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: -1 }}
            >
              <div className="text-9xl opacity-20 blur-sm">🎪</div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
