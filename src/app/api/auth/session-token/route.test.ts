import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock the auth-validator
vi.mock('../../../../../server/auth-validator', () => ({
  createWebSocketToken: vi.fn(() => 'mock-ws-token-123'),
}));

import { auth } from '@/lib/auth';

describe('GET /api/auth/session-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if session has no user id', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any);

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return a WebSocket token for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBe('mock-ws-token-123');
    expect(data.userId).toBe('user-123');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(auth).mockRejectedValue(new Error('Auth error'));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to get session token');
  });
});
