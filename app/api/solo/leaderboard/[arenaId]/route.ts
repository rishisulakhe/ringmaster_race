import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentPlayer } from '@/lib/auth';
import type { LeaderboardEntry } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ arenaId: string }> }
) {
  try {
    const { arenaId } = await params;
    const currentPlayer = await getCurrentPlayer();

    if (!currentPlayer) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify arena exists
    const arena = await prisma.arena.findUnique({
      where: { id: arenaId },
    });

    if (!arena) {
      return NextResponse.json(
        { success: false, message: 'Arena not found' },
        { status: 404 }
      );
    }

    // Get all runs for this arena
    const runs = await prisma.soloRun.findMany({
      where: { arenaId },
      include: {
        player: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { timeMs: 'asc' },
    });

    // Group by player and get their best time
    const playerBestTimes = new Map<
      string,
      { username: string; timeMs: number; completedAt: Date }
    >();

    for (const run of runs) {
      const existing = playerBestTimes.get(run.playerId);
      if (!existing || run.timeMs < existing.timeMs) {
        playerBestTimes.set(run.playerId, {
          username: run.player.username,
          timeMs: run.timeMs,
          completedAt: run.completedAt,
        });
      }
    }

    // Convert to array and sort
    const sortedLeaderboard = Array.from(playerBestTimes.entries())
      .map(([playerId, data]) => ({
        playerId,
        ...data,
      }))
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, 10); // Top 10

    // Build response
    const response: LeaderboardEntry[] = sortedLeaderboard.map(
      (entry, index) => ({
        rank: index + 1,
        username: entry.username,
        timeMs: entry.timeMs,
        completedAt: entry.completedAt.toISOString(),
        isCurrentPlayer: entry.playerId === currentPlayer.playerId,
      })
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}