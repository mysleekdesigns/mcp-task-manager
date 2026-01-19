/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/changelog/generate/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';

// Mock the database and auth modules
vi.mock('@/lib/db', () => ({
  prisma: {
    projectMember: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
    changelogEntry: {
      create: vi.fn(),
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

describe('Generate Changelog API Route', () => {
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

  describe('POST /api/changelog/generate', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/changelog/generate', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'project1' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('generates changelog entries from completed tasks', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const task1Id = generateCUID();
      const task2Id = generateCUID();

      const completedTasks = [
        {
          id: task1Id,
          title: 'Add new feature',
          description: 'Feature description',
          tags: ['feature'],
          updatedAt: new Date(),
        },
        {
          id: task2Id,
          title: 'Fix critical bug',
          description: 'Bug fix description',
          tags: ['bug'],
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValueOnce(completedTasks as any);

      const mockCreatedEntry = {
        id: generateCUID(),
        title: 'Add new feature',
        description: 'Feature description',
        version: '1.0.0',
        type: 'FEATURE',
        taskId: task1Id,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        task: {
          id: task1Id,
          title: 'Add new feature',
          status: 'COMPLETED',
        },
        project: {
          id: projectId,
          name: 'Project 1',
        },
      };

      vi.mocked(prisma.changelogEntry.create).mockResolvedValue(mockCreatedEntry as any);

      const request = new NextRequest('http://localhost/api/changelog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          version: '1.0.0',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.count).toBe(2);
      expect(data.entries).toHaveLength(2);
      expect(prisma.changelogEntry.create).toHaveBeenCalledTimes(2);
    });

    it('returns message when no tasks found', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost/api/changelog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(0);
      expect(data.message).toContain('No completed tasks');
    });
  });
});
