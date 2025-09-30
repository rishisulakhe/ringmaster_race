import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import type { LoginRequest, AuthResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find player
    const player = await prisma.player.findUnique({
      where: { username },
    });

    if (!player) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, player.password);

    if (!isValidPassword) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      playerId: player.id,
      username: player.username,
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json<AuthResponse>({
      success: true,
      player: {
        id: player.id,
        username: player.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}