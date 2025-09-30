import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentPlayer } from '@/lib/auth';
import type { CompleteRunRequest, CompleteRunResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const currentPlayer = await getCurrentPlayer();

    if (!currentPlayer) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: CompleteRunRequest = await request.json();
    const { arenaId, timeMs } = body;

    // Validate input
    if (!arenaId || !timeMs || timeMs <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid run data' },
        { status: 400 }
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

    // Check if arena is unlocked
    if (arena.unlockAfter) {
      const hasCompletedPrevious = await prisma.soloRun.findFirst({
        where: {
          playerId: currentPlayer.playerId,
          arenaId: arena.unlockAfter,
        },
      });

      if (!hasCompletedPrevious) {
        return NextResponse.json(
          { success: false, message: 'Arena is locked' },
          { status: 403 }
        );
      }
    }

    // Get previous personal best
    const previousBest = await prisma.soloRun.findFirst({
      where: {
        playerId: currentPlayer.playerId,
        arenaId,
      },
      orderBy: { timeMs: 'asc' },
    });

    // Get previous world record
    const previousWorldRecord = await prisma.soloRun.findFirst({
      where: { arenaId },
      orderBy: { timeMs: 'asc' },
    });

    // Save the run
    const run = await prisma.soloRun.create({
      data: {
        playerId: currentPlayer.playerId,
        arenaId,
        timeMs,
      },
    });

    // Calculate new personal best
    const personalBest = !previousBest
      ? timeMs
      : Math.min(previousBest.timeMs, timeMs);

    const isNewRecord = !previousBest || timeMs < previousBest.timeMs;

    // Check if this is a new world record
    const isWorldRecord =
      !previousWorldRecord || timeMs < previousWorldRecord.timeMs;

    // Get rank (how many players have a better time)
    const betterRuns = await prisma.soloRun.groupBy({
      by: ['playerId'],
      where: {
        arenaId,
      },
      _min: {
        timeMs: true,
      },
      having: {
        timeMs: {
          _min: {
            lt: timeMs,
          },
        },
      },
    });

    const rank = betterRuns.length + 1;

    const response: CompleteRunResponse = {
      success: true,
      run: {
        id: run.id,
        timeMs: run.timeMs,
        rank,
      },
      isNewRecord,
      previousRecord: previousBest?.timeMs || null,
      personalBest,
      isWorldRecord,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Complete run error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}