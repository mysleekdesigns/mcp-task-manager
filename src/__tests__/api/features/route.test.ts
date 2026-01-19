/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/features/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';

// Mock the database and auth modules
vi.mock('@/lib/db', () => ({
  prisma: {
    feature: {
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

describe('Features API Routes', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/features', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/features?projectId=test');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when projectId is missing', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);

      const request = new NextRequest('http://localhost/api/features');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('projectId');
    });

    it('fetches features for a project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const featureId = generateCUID();
      const mockFeatures = [
        {
          id: featureId,
          title: 'User Dashboard',
          description: 'Create a user dashboard',
          priority: 'MUST',
          status: 'planned',
          projectId,
          phaseId,
          createdAt: new Date(),
          updatedAt: new Date(),
          phase: {
            id: phaseId,
            name: 'Phase 1',
            order: 0,
          },
          project: {
            id: projectId,
            name: 'Project 1',
          },
        },
      ];

      vi.mocked(prisma.feature.findMany).mockResolvedValueOnce(mockFeatures as any);

      const request = new NextRequest(`http://localhost/api/features?projectId=${projectId}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('User Dashboard');
    });

    it('filters features by phaseId', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const mockFeatures: any[] = [];
      vi.mocked(prisma.feature.findMany).mockResolvedValueOnce(mockFeatures);

      const request = new NextRequest(`http://localhost/api/features?projectId=${projectId}&phaseId=${phaseId}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.feature.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId,
            phaseId,
          }),
        })
      );
    });
  });

  describe('POST /api/features', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/features', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 when user is not a member of the project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Feature',
          priority: 'MUST',
          projectId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should create feature without phase', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const featureId = generateCUID();
      const newFeature = {
        id: featureId,
        title: 'New Feature',
        description: 'Feature description',
        priority: 'MUST',
        status: 'planned',
        projectId,
        phaseId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        phase: null,
        project: {
          id: projectId,
          name: 'Project 1',
        },
      };

      vi.mocked(prisma.feature.create).mockResolvedValueOnce(newFeature as any);

      const request = new NextRequest('http://localhost/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Feature',
          description: 'Feature description',
          priority: 'MUST',
          projectId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('New Feature');
      expect(data.phaseId).toBeNull();
    });

    it('should create feature with phase', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const phase = {
        id: phaseId,
        projectId,
      };
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(phase as any);

      const featureId = generateCUID();
      const newFeature = {
        id: featureId,
        title: 'New Feature',
        description: 'Feature description',
        priority: 'MUST',
        status: 'planned',
        projectId,
        phaseId,
        createdAt: new Date(),
        updatedAt: new Date(),
        phase: {
          id: phaseId,
          name: 'Phase 1',
          order: 0,
        },
        project: {
          id: projectId,
          name: 'Project 1',
        },
      };

      vi.mocked(prisma.feature.create).mockResolvedValueOnce(newFeature as any);

      const request = new NextRequest('http://localhost/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Feature',
          description: 'Feature description',
          priority: 'MUST',
          projectId,
          phaseId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('New Feature');
      expect(data.phaseId).toBe(phaseId);
    });

    it('returns 404 when phase is not found', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Feature',
          priority: 'MUST',
          projectId,
          phaseId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('returns 400 when phase belongs to different project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const differentProjectId = generateCUID();
      const phase = {
        id: phaseId,
        projectId: differentProjectId,
      };
      vi.mocked(prisma.phase.findUnique).mockResolvedValueOnce(phase as any);

      const request = new NextRequest('http://localhost/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Feature',
          priority: 'MUST',
          projectId,
          phaseId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
