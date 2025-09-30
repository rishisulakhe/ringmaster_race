import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentPlayer } from '@/lib/auth';
import type { ArenaResponse } from '@/types/api';

export async function GET() {
  try {
    const currentPlayer = await getCurrentPlayer();

    if (!currentPlayer) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
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

    // Build response
    const response: ArenaResponse[] = arenas.map((arena) => {
      // Arena is unlocked if:
      // 1. It has no unlock requirement (first arena)
      // 2. The required arena has been completed
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get arenas error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}