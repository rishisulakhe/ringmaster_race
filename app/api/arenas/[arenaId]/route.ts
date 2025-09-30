import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentPlayer } from '@/lib/auth';
import type { ArenaResponse } from '@/types/api';

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

    // Get arena
    const arena = await prisma.arena.findUnique({
      where: { id: arenaId },
    });

    if (!arena) {
      return NextResponse.json(
        { success: false, message: 'Arena not found' },
        { status: 404 }
      );
    }

    // Check if unlocked
    let isUnlocked = true;
    if (arena.unlockAfter) {
      const hasCompletedPrevious = await prisma.soloRun.findFirst({
        where: {
          playerId: currentPlayer.playerId,
          arenaId: arena.unlockAfter,
        },
      });
      isUnlocked = !!hasCompletedPrevious;
    }

    // Get personal best
    const personalBest = await prisma.soloRun.findFirst({
      where: {
        playerId: currentPlayer.playerId,
        arenaId: arena.id,
      },
      orderBy: { timeMs: 'asc' },
    });

    // Get world record
    const worldRecord = await prisma.soloRun.findFirst({
      where: { arenaId: arena.id },
      orderBy: { timeMs: 'asc' },
    });

    const response: ArenaResponse = {
      id: arena.id,
      name: arena.name,
      difficulty: arena.difficulty,
      description: arena.description,
      isUnlocked,
      personalBest: personalBest?.timeMs || null,
      worldRecord: worldRecord?.timeMs || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get arena error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}