import { redirect } from 'next/navigation';
import { getCurrentPlayer, clearAuthCookie } from '@/lib/auth';
import { StatsDisplay } from '@/components/StatsDisplay';

export default async function ProfilePage() {
  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-5xl font-bold text-white mb-2">
            {currentPlayer.username}
          </h1>
          <p className="text-yellow-300 text-xl">Player Profile</p>
        </div>

        <div className="mb-8">
          <StatsDisplay />
        </div>

        <div className="flex justify-center gap-4">
          <a
            href="/menu"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            🏠 Back to Menu
          </a>
          <a
            href="/leaderboard"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            🏆 View Leaderboards
          </a>
          <form action={async () => {
            'use server';
            await clearAuthCookie();
            redirect('/');
          }}>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              🚪 Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}