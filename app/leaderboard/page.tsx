import { redirect } from 'next/navigation';
import { getCurrentPlayer } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Leaderboard } from '@/components/Leaderboard';

export default async function LeaderboardPage() {
  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    redirect('/');
  }

  // Get all arenas
  const arenas = await prisma.arena.findMany({
    orderBy: { difficulty: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏆 Leaderboards 🏆
          </h1>
          <p className="text-yellow-300 text-xl">
            See where you rank against other players!
          </p>
        </div>

        <div className="space-y-8">
          {arenas.map((arena) => (
            <Leaderboard
              key={arena.id}
              arenaId={arena.id}
              arenaName={arena.name}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/menu"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors"
          >
            🏠 Back to Arena Selection
          </a>
        </div>
      </div>
    </div>
  );
}