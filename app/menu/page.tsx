import { redirect } from 'next/navigation';
import { FestivalMapEnhanced } from '@/components/FestivalMapEnhanced';
import { getCurrentPlayer } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ArenaResponse } from '@/types/api';

export default async function MenuPage() {
  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    redirect('/');
  }

  // Get all arenas
  const arenas = await prisma.arena.findMany({
    orderBy: { difficulty: 'asc' },
  });

  // Get player's completed arenas
  const completedArenas = await prisma.soloRun.findMany({
    where: { playerId: currentPlayer.playerId },
    select: { arenaId: true },
    distinct: ['arenaId'],
  });

  const completedArenaIds = new Set(
    completedArenas.map((run) => run.arenaId)
  );

  // Get personal bests for all arenas
  const personalBests = await prisma.soloRun.groupBy({
    by: ['arenaId'],
    where: { playerId: currentPlayer.playerId },
    _min: { timeMs: true },
  });

  const personalBestMap = new Map(
    personalBests.map((pb) => [pb.arenaId, pb._min.timeMs])
  );

  // Get world records for all arenas
  const worldRecords = await prisma.soloRun.groupBy({
    by: ['arenaId'],
    _min: { timeMs: true },
  });

  const worldRecordMap = new Map(
    worldRecords.map((wr) => [wr.arenaId, wr._min.timeMs])
  );

  // Build arena data
  const arenaData: ArenaResponse[] = arenas.map((arena) => {
    const isUnlocked =
      !arena.unlockAfter || completedArenaIds.has(arena.unlockAfter);

    return {
      id: arena.id,
      name: arena.name,
      difficulty: arena.difficulty,
      description: arena.description,
      isUnlocked,
      personalBest: personalBestMap.get(arena.id) || null,
      worldRecord: worldRecordMap.get(arena.id) || null,
    };
  });

  return <FestivalMapEnhanced arenas={arenaData} />;
}