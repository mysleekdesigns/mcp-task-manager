/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/changelog/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';

// Mock the database and auth modules
vi.mock('@/lib/db', () => ({
  prisma: {
    changelogEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Changelog API Routes', () => {
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

  describe('GET /api/changelog', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/changelog');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('fetches changelog entries for a project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);

      const mockEntries = [
        {
          id: '1',
          title: 'Add feature',
          description: 'Feature description',
          version: '1.0.0',
          type: 'FEATURE',
          taskId: 'task1',
          projectId: 'project1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          task: {
            id: 'task1',
            title: 'Task 1',
            status: 'COMPLETED',
          },
          project: {
            id: 'project1',
            name: 'Project 1',
          },
        },
      ];

      vi.mocked(prisma.changelogEntry.findMany).mockResolvedValueOnce(mockEntries as any);

      const request = new NextRequest('http://localhost/api/changelog?projectId=project1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Add feature');
    });

    it('groups entries by date when groupBy=date', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);

      const mockEntries = [
        {
          id: '1',
          title: 'Entry 1',
          createdAt: new Date('2024-01-01'),
          project: { id: 'project1', name: 'Project 1' },
        },
        {
          id: '2',
          title: 'Entry 2',
          createdAt: new Date('2024-01-01'),
          project: { id: 'project1', name: 'Project 1' },
        },
      ];

      vi.mocked(prisma.changelogEntry.findMany).mockResolvedValueOnce(mockEntries as any);

      const request = new NextRequest('http://localhost/api/changelog?projectId=project1&groupBy=date');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.grouped).toBeDefined();
      expect(Array.isArray(data.grouped)).toBe(true);
      expect(data.grouped[0].date).toBe('2024-01-01');
      expect(data.grouped[0].entries).toHaveLength(2);
    });
  });

  describe('POST /api/changelog', () => {
    it('returns 401 when not authenticated', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/changelog', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 when user is not a member of the project', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Entry',
          projectId: 'project1',
          type: 'FEATURE',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('creates a changelog entry successfully', async () => {
      vi.spyOn(authModule, 'auth').mockResolvedValueOnce(mockSession as any);
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValueOnce(mockMembership as any);

      const newEntry = {
        id: '1',
        title: 'New Feature',
        description: 'Feature description',
        version: '1.0.0',
        type: 'FEATURE',
        taskId: null,
        projectId: 'project1',
        createdAt: new Date(),
        updatedAt: new Date(),
        task: null,
        project: {
          id: 'project1',
          name: 'Project 1',
        },
      };

      vi.mocked(prisma.changelogEntry.create).mockResolvedValueOnce(newEntry as any);

      const request = new NextRequest('http://localhost/api/changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Feature',
          description: 'Feature description',
          version: '1.0.0',
          type: 'FEATURE',
          projectId: 'project1',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('New Feature');
    });
  });
});
