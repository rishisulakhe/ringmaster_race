import { NextResponse } from 'next/server';
import { getCurrentPlayer } from '@/lib/auth';
import type { AuthResponse } from '@/types/api';

export async function GET() {
  try {
    const currentPlayer = await getCurrentPlayer();

    if (!currentPlayer) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json<AuthResponse>({
      success: true,
      player: {
        id: currentPlayer.playerId,
        username: currentPlayer.username,
      },
    });
  } catch (error) {
    console.error('Get current player error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}