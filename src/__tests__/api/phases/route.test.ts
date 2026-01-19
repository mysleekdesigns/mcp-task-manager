/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/phases/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';

// Mock the database and auth modules
vi.mock('@/lib/db', () => ({
  prisma: {
    phase: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Helper function to generate a valid CUID
function generateCUID(): string {
  return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

describe('Phases API Routes', () => {
  const userId = generateCUID();
  const projectId = generateCUID();
  const memberId = generateCUID();

  const mockSession = {
    user: {
      id: userId,
      email: 'test@example.com',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  const mockMembership = {
    id: memberId,
    userId,
    projectId,
    role: 'OWNER',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/phases', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/phases?projectId=test');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when projectId is missing', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);

      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('projectId');
    });

    it('returns 403 when user is not a member of the project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(`http://localhost/api/phases?projectId=${projectId}`);
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('fetches phases for a project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const phaseId = generateCUID();
      const mockPhases = [
        {
          id: phaseId,
          name: 'Phase 1',
          description: 'Initial phase',
          order: 0,
          projectId,
          createdAt: new Date(),
          updatedAt: new Date(),
          features: [],
          milestones: [],
          _count: {
            features: 0,
            milestones: 0,
          },
        },
      ];

      vi.mocked(prisma.phase.findMany).mockResolvedValueOnce(mockPhases as any);

      const request = new NextRequest(`http://localhost/api/phases?projectId=${projectId}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Phase 1');
    });
  });

  describe('POST /api/phases', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/phases', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 when user is not a member of the project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/phases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Phase',
          projectId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should create phase without project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);
      vi.mocked(prisma.phase.findFirst).mockResolvedValueOnce(null);

      const phaseId = generateCUID();
      const newPhase = {
        id: phaseId,
        name: 'New Phase',
        description: 'Phase description',
        order: 0,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        features: [],
        milestones: [],
        _count: {
          features: 0,
          milestones: 0,
        },
      };

      vi.mocked(prisma.phase.create).mockResolvedValueOnce(newPhase as any);

      const request = new NextRequest('http://localhost/api/phases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Phase',
          description: 'Phase description',
          projectId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('New Phase');
      expect(data.projectId).toBe(projectId);
    });

    it('creates phase with correct order', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const existingPhase = {
        id: generateCUID(),
        order: 2,
      };
      vi.mocked(prisma.phase.findFirst).mockResolvedValueOnce(existingPhase as any);

      const phaseId = generateCUID();
      const newPhase = {
        id: phaseId,
        name: 'New Phase',
        description: null,
        order: 3,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        features: [],
        milestones: [],
        _count: {
          features: 0,
          milestones: 0,
        },
      };

      vi.mocked(prisma.phase.create).mockResolvedValueOnce(newPhase as any);

      const request = new NextRequest('http://localhost/api/phases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Phase',
          projectId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.order).toBe(3);
      expect(vi.mocked(prisma.phase.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 3,
          }),
        })
      );
    });
  });
});
