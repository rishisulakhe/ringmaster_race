'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ArenaResponse } from '@/types/api';
import { CircusTent } from './CircusTent';
import { CurtainAnimation } from './CurtainAnimation';

interface FestivalMapProps {
  arenas: ArenaResponse[];
}

export function FestivalMapEnhanced({ arenas }: FestivalMapProps) {
  const router = useRouter();
  const [showCurtain, setShowCurtain] = useState(true);
  const [selectedArena, setSelectedArena] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleArenaClick = (arena: ArenaResponse) => {
    if (arena.isUnlocked) {
      setSelectedArena(arena.id);
      // Small delay for visual feedback
      setTimeout(() => {
        router.push(`/game/${arena.id}`);
      }, 300);
    }
  };

  const isWorldRecordHolder = (arena: ArenaResponse) => {
    return (
      arena.personalBest !== null &&
      arena.worldRecord !== null &&
      arena.personalBest === arena.worldRecord
    );
  };

  if (showCurtain) {
    return <CurtainAnimation onComplete={() => setShowCurtain(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Night Sky Background with Stars */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #0F1B4C 0%, #1E3A8A 50%, #2D5A9A 100%)',
        }}
      >
        {/* Twinkling Stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Ferris Wheel in Background */}
      <div className="fixed right-10 top-20 opacity-20 -z-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="text-9xl"
        >
          🎡
        </motion.div>
      </div>

      {/* Floating Balloons */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed text-4xl"
          style={{
            left: `${10 + i * 12}%`,
            top: '80%',
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(i) * 20, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          🎈
        </motion.div>
      ))}

      {/* Carnival Lights String */}
      <div className="fixed top-0 left-0 right-0 h-12 flex justify-around items-center bg-gradient-to-b from-black/40 to-transparent z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF1493', '#00CED1', '#32CD32'][i % 4],
              boxShadow: `0 0 10px ${['#FFD700', '#FF1493', '#00CED1', '#32CD32'][i % 4]}`,
            }}
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1
            className="text-7xl font-bold mb-4 relative inline-block"
            style={{
              fontFamily: 'var(--font-alfa-slab)',
              color: '#FFFDD0',
              textShadow: `
                3px 3px 0 #8B0000,
                6px 6px 0 #DC143C,
                9px 9px 20px rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            <span className="relative z-10">🎪 CIRCUS DASH 🎪</span>
            {/* Spotlight effect behind title */}
            <motion.div
              className="absolute inset-0 -z-10 blur-2xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
              }}
            />
          </h1>
          <motion.p
            className="text-3xl font-bold"
            style={{
              fontFamily: 'var(--font-righteous)',
              color: '#FFD700',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⭐ Street Rush: The Greatest Show on Earth ⭐
          </motion.p>
          <p className="text-xl mt-2 text-yellow-200" style={{ fontFamily: 'var(--font-righteous)' }}>
            Choose Your Arena and Show Your Skills!
          </p>
        </motion.div>

        {/* Arena Tents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-12">
          {arenas.map((arena) => (
            <CircusTent
              key={arena.id}
              arena={arena}
              onClick={() => handleArenaClick(arena)}
              formatTime={formatTime}
              isWorldRecordHolder={isWorldRecordHolder(arena)}
            />
          ))}
        </div>

        {/* Bottom Fairground Decorations */}
        <div className="flex justify-center gap-8 mt-16 text-6xl opacity-30">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            🎠
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            🎪
          </motion.div>
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            🎡
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          <motion.button
            onClick={() => router.push('/leaderboard')}
            className="circus-button px-8 py-4 rounded-lg font-bold text-xl text-red-900 shadow-lg"
            style={{ fontFamily: 'var(--font-bungee)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 Hall of Fame
          </motion.button>
          <motion.button
            onClick={() => router.push('/profile')}
            className="circus-button px-8 py-4 rounded-lg font-bold text-xl text-red-900 shadow-lg"
            style={{ fontFamily: 'var(--font-bungee)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            👤 Performer Card
          </motion.button>
        </motion.div>

        {/* Fog Effect at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 h-40 pointer-events-none">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(255,255,255,0.1) 0%, transparent 100%)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}
