import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createWebSocketToken } from '../../../../../server/auth-validator';

/**
 * GET /api/auth/session-token
 * Returns a temporary WebSocket auth token for the current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a temporary token for WebSocket authentication
    const token = createWebSocketToken(session.user.id);

    return NextResponse.json({
      token,
      userId: session.user.id,
    });
  } catch (error) {
    console.error('Error getting session token:', error);
    return NextResponse.json(
      { error: 'Failed to get session token' },
      { status: 500 }
    );
  }
}
