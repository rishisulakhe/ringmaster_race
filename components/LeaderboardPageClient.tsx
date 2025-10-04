'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LeaderboardEnhanced } from './LeaderboardEnhanced';

interface LeaderboardPageClientProps {
  arenas: { id: string; name: string }[];
}

export function LeaderboardPageClient({ arenas }: LeaderboardPageClientProps) {
  const router = useRouter();

  return (
    <div
      className="min-h-screen p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0F1B4C 0%, #1E3A8A 50%, #663399 100%)',
      }}
    >
      {/* Animated stars */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-8xl font-bold mb-4"
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
            🏆 HALL OF FAME 🏆
          </h1>
          <motion.p
            className="text-3xl font-bold text-yellow-300"
            style={{ fontFamily: 'var(--font-righteous)' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            The Greatest Performers in the Circus!
          </motion.p>
        </motion.div>

        {/* Leaderboards */}
        <div className="space-y-12">
          {arenas.map((arena, index) => (
            <motion.div
              key={arena.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <LeaderboardEnhanced
                arenaId={arena.id}
                arenaName={arena.name}
              />
            </motion.div>
          ))}
        </div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex justify-center"
        >
          <motion.button
            onClick={() => router.push('/menu')}
            className="circus-button px-12 py-6 rounded-2xl font-bold text-3xl text-red-900 shadow-2xl"
            style={{ fontFamily: 'var(--font-bungee)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎪 BACK TO MAIN STAGE
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
