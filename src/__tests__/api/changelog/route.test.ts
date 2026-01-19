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

// Helper function to generate a valid CUID
function generateCUID(): string {
  return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

describe('Changelog API Routes', () => {
  const userId = generateCUID();
  const projectId = generateCUID();
  const memberId = generateCUID();
  const taskId = generateCUID();

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

      const entryId = generateCUID();

      const mockEntries = [
        {
          id: entryId,
          title: 'Add feature',
          description: 'Feature description',
          version: '1.0.0',
          type: 'FEATURE',
          taskId,
          projectId,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          task: {
            id: taskId,
            title: 'Task 1',
            status: 'COMPLETED',
          },
          project: {
            id: projectId,
            name: 'Project 1',
          },
        },
      ];

      vi.mocked(prisma.changelogEntry.findMany).mockResolvedValueOnce(mockEntries as any);

      const request = new NextRequest(`http://localhost/api/changelog?projectId=${projectId}`);
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
          id: generateCUID(),
          title: 'Entry 1',
          createdAt: new Date('2024-01-01'),
          project: { id: projectId, name: 'Project 1' },
        },
        {
          id: generateCUID(),
          title: 'Entry 2',
          createdAt: new Date('2024-01-01'),
          project: { id: projectId, name: 'Project 1' },
        },
      ];

      vi.mocked(prisma.changelogEntry.findMany).mockResolvedValueOnce(mockEntries as any);

      const request = new NextRequest(`http://localhost/api/changelog?projectId=${projectId}&groupBy=date`);
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
          projectId,
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
        id: generateCUID(),
        title: 'New Feature',
        description: 'Feature description',
        version: '1.0.0',
        type: 'FEATURE',
        taskId: null,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        task: null,
        project: {
          id: projectId,
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
          projectId,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('New Feature');
    });
  });
});
