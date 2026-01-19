/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/milestones/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';

// Mock the database and auth modules
vi.mock('@/lib/db', () => ({
  prisma: {
    milestone: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
    phase: {
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

describe('Milestones API Routes', () => {
  const userId = generateCUID();
  const projectId = generateCUID();
  const memberId = generateCUID();
  const phaseId = generateCUID();

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

  const mockPhase = {
    id: phaseId,
    projectId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/milestones', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/milestones?phaseId=test');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when phaseId is missing', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);

      const request = new NextRequest('http://localhost/api/milestones');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('phaseId');
    });

    it('returns 404 when phase is not found', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(`http://localhost/api/milestones?phaseId=${phaseId}`);
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it('fetches milestones for a phase', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(mockPhase as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const milestoneId = generateCUID();
      const mockMilestones = [
        {
          id: milestoneId,
          title: 'MVP Release',
          phaseId,
          createdAt: new Date(),
          updatedAt: new Date(),
          phase: {
            id: phaseId,
            name: 'Phase 1',
            order: 0,
          },
        },
      ];

      vi.mocked(prisma.milestone.findMany).mockResolvedValueOnce(mockMilestones as any);

      const request = new NextRequest(`http://localhost/api/milestones?phaseId=${phaseId}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('MVP Release');
    });
  });

  describe('POST /api/milestones', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/milestones', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 404 when phase is not found', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Milestone',
          phaseId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('returns 403 when user is not a member of the project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(mockPhase as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Milestone',
          phaseId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should create milestone without phase', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(mockPhase as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const milestoneId = generateCUID();
      const newMilestone = {
        id: milestoneId,
        title: 'New Milestone',
        phaseId,
        createdAt: new Date(),
        updatedAt: new Date(),
        phase: {
          id: phaseId,
          name: 'Phase 1',
          order: 0,
        },
      };

      vi.mocked(prisma.milestone.create).mockResolvedValueOnce(newMilestone as any);

      const request = new NextRequest('http://localhost/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Milestone',
          phaseId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('New Milestone');
      expect(data.phaseId).toBe(phaseId);
    });
  });
});
