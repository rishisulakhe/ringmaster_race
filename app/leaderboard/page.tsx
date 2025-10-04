import { redirect } from 'next/navigation';
import { getCurrentPlayer } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LeaderboardPageClient } from '@/components/LeaderboardPageClient';

export default async function LeaderboardPage() {
  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    redirect('/');
  }

  // Get all arenas
  const arenas = await prisma.arena.findMany({
    orderBy: { difficulty: 'asc' },
    select: { id: true, name: true },
  });

  return <LeaderboardPageClient arenas={arenas} />;
}
