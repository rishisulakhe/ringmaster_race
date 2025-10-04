'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export function AuthFormEnhanced() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Authentication failed');
        return;
      }

      // Success - redirect to menu
      router.push('/menu');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0F1B4C 0%, #1E3A8A 50%, #663399 100%)',
      }}
    >
      {/* Animated Stars */}
      {[...Array(30)].map((_, i) => (
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

      {/* Floating Circus Elements */}
      <motion.div
        className="absolute top-10 left-10 text-6xl opacity-20"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      >
        🎪
      </motion.div>
      <motion.div
        className="absolute bottom-10 right-10 text-6xl opacity-20"
        animate={{ rotate: -360, y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      >
        🎡
      </motion.div>
      <motion.div
        className="absolute top-1/3 right-20 text-4xl opacity-20"
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        🎈
      </motion.div>

      {/* Main Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 circus-card rounded-3xl p-10 w-full max-w-md shadow-2xl"
      >
        {/* Decorative Corners */}
        <div className="absolute top-2 left-2 text-3xl">🎭</div>
        <div className="absolute top-2 right-2 text-3xl">🎭</div>
        <div className="absolute bottom-2 left-2 text-3xl">⭐</div>
        <div className="absolute bottom-2 right-2 text-3xl">⭐</div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="text-8xl mb-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🎪
          </motion.div>
          <h1
            className="text-5xl font-bold mb-2"
            style={{
              fontFamily: 'var(--font-alfa-slab)',
              color: '#8B0000',
              textShadow: '2px 2px 0 #FFD700',
            }}
          >
            CIRCUS DASH
          </h1>
          <p
            className="text-xl font-semibold"
            style={{
              fontFamily: 'var(--font-righteous)',
              color: '#663399',
            }}
          >
            Street Rush - Solo Mode
          </p>
          <div className="mt-2 flex justify-center gap-2 text-2xl">
            <span>🌟</span>
            <span>🎯</span>
            <span>🏆</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 rounded-lg p-1 relative" style={{ background: 'rgba(139, 0, 0, 0.1)' }}>
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg circus-button"
            initial={false}
            animate={{
              left: isLogin ? '4px' : 'calc(50% + 4px)',
              width: 'calc(50% - 8px)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg font-bold transition-colors relative z-10 ${
              isLogin ? 'text-red-900' : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{ fontFamily: 'var(--font-bungee)' }}
          >
            LOGIN
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg font-bold transition-colors relative z-10 ${
              !isLogin ? 'text-red-900' : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{ fontFamily: 'var(--font-bungee)' }}
          >
            REGISTER
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block font-bold mb-2 text-red-900"
              style={{ fontFamily: 'var(--font-righteous)' }}
            >
              🎭 Performer Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-3 border-red-900 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 text-gray-800 bg-white font-semibold"
              placeholder="Enter your stage name"
              required
              minLength={3}
              maxLength={20}
              style={{ fontFamily: 'var(--font-righteous)' }}
            />
          </div>

          <div>
            <label
              className="block font-bold mb-2 text-red-900"
              style={{ fontFamily: 'var(--font-righteous)' }}
            >
              🔑 Secret Code
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-3 border-red-900 rounded-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 text-gray-800 bg-white font-semibold"
              placeholder="Enter your secret code"
              required
              minLength={6}
              style={{ fontFamily: 'var(--font-righteous)' }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-600 border-3 border-red-900 text-white px-4 py-3 rounded-lg font-bold text-center"
              style={{ fontFamily: 'var(--font-righteous)' }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full circus-button font-bold py-4 rounded-lg text-xl text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-bungee)' }}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? '🎪 PROCESSING...' : isLogin ? '🎯 ENTER THE SHOW' : '⭐ JOIN THE CIRCUS'}
          </motion.button>
        </form>

        {!isLogin && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-gray-700 text-center font-semibold"
            style={{ fontFamily: 'var(--font-righteous)' }}
          >
            Stage Name: 3-20 characters<br />
            Secret Code: minimum 6 characters
          </motion.p>
        )}

        {/* Decorative Bottom Border */}
        <div className="mt-6 pt-6 border-t-4 border-red-900 text-center">
          <p className="text-sm font-bold text-gray-700" style={{ fontFamily: 'var(--font-righteous)' }}>
            🎪 The Greatest Show on Earth Awaits! 🎪
          </p>
        </div>
      </motion.div>
    </div>
  );
}
