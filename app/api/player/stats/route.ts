import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentPlayer } from '@/lib/auth';
import type { PlayerStats } from '@/types/api';

export async function GET() {
  try {
    const currentPlayer = await getCurrentPlayer();

    if (!currentPlayer) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get total runs
    const totalRuns = await prisma.soloRun.count({
      where: { playerId: currentPlayer.playerId },
    });

    // Get all arenas
    const arenas = await prisma.arena.findMany({
      orderBy: { difficulty: 'asc' },
    });

    // Get best times per arena
    const bestTimes = await prisma.soloRun.groupBy({
      by: ['arenaId'],
      where: { playerId: currentPlayer.playerId },
      _min: { timeMs: true },
    });

    const bestTimeMap = new Map(
      bestTimes.map((bt) => [bt.arenaId, bt._min.timeMs])
    );

    // Build best times array
    const bestTimesArray = arenas.map((arena) => ({
      arenaId: arena.id,
      arenaName: arena.name,
      bestTime: bestTimeMap.get(arena.id) || null,
    }));

    // Count completed arenas (arenas with at least one run)
    const completedArenas = bestTimes.length;

    const response: PlayerStats = {
      totalRuns,
      bestTimes: bestTimesArray,
      completedArenas,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get player stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}