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

describe('Generate Changelog API Route', () => {
  const mockSession = {
    user: {
      id: 'user1',
      email: 'test@example.com',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  const mockMembership = {
    id: 'member1',
    userId: 'user1',
    projectId: 'project1',
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

      const completedTasks = [
        {
          id: 'task1',
          title: 'Add new feature',
          description: 'Feature description',
          tags: ['feature'],
          updatedAt: new Date(),
        },
        {
          id: 'task2',
          title: 'Fix critical bug',
          description: 'Bug fix description',
          tags: ['bug'],
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValueOnce(completedTasks as any);

      const mockCreatedEntry = {
        id: '1',
        title: 'Add new feature',
        description: 'Feature description',
        version: '1.0.0',
        type: 'FEATURE',
        taskId: 'task1',
        projectId: 'project1',
        createdAt: new Date(),
        updatedAt: new Date(),
        task: {
          id: 'task1',
          title: 'Add new feature',
          status: 'COMPLETED',
        },
        project: {
          id: 'project1',
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
          projectId: 'project1',
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
        body: JSON.stringify({ projectId: 'project1' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(0);
      expect(data.message).toContain('No completed tasks');
    });
  });
});
