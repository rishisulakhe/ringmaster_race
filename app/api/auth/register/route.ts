import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import type { RegisterRequest, AuthResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username must be 3-20 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { username },
    });

    if (existingPlayer) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create new player
    const hashedPassword = await hashPassword(password);
    const player = await prisma.player.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

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
    console.error('Registration error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}