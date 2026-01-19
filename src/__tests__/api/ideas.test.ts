import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getIdeas, POST as createIdea } from '@/app/api/ideas/route';
import { PUT as updateIdea, DELETE as deleteIdea } from '@/app/api/ideas/[id]/route';
import { POST as voteOnIdea } from '@/app/api/ideas/[id]/vote/route';
import { POST as convertIdea } from '@/app/api/ideas/[id]/convert/route';
import type { Idea, ProjectMember, Feature, User } from '@prisma/client';
import type { Session } from 'next-auth';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    idea: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
    feature: {
      create: vi.fn(),
    },
    phase: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('Ideas API', () => {
  const mockSession: Session = {
    user: {
      id: 'clh1234567890abcdefghib',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  const mockProjectMember: ProjectMember = {
    id: 'clh1234567890abcdefghia',
    userId: 'clh1234567890abcdefghib',
    projectId: 'clh1234567890abcdefghij',
    role: 'MEMBER',
    createdAt: new Date(),
  };

  const mockUser: User = {
    id: 'clh1234567890abcdefghib',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: null,
    image: null,
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIdea: Idea = {
    id: 'clh1234567890abcdefghik',
    title: 'Test Idea',
    description: 'Test Description',
    votes: 5,
    status: 'PENDING',
    projectId: 'clh1234567890abcdefghij',
    createdById: 'clh1234567890abcdefghib',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIdeaWithUser = {
    ...mockIdea,
    createdBy: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/ideas', () => {
    it('should return ideas for a project', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.findMany as vi.Mock).mockResolvedValue([mockIdeaWithUser]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ideas?projectId=clh1234567890abcdefghij')
      );

      const response = await getIdeas(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(mockIdea.id);
      expect(data[0].title).toBe(mockIdea.title);
      expect(prisma.idea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'clh1234567890abcdefghij' },
          include: expect.any(Object),
          orderBy: expect.any(Object),
        })
      );
    });

    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ideas?projectId=clh1234567890abcdefghij')
      );

      const response = await getIdeas(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not a project member', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ideas?projectId=clh1234567890abcdefghij')
      );

      const response = await getIdeas(request);

      expect(response.status).toBe(403);
    });

    it('should filter by status', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.findMany as vi.Mock).mockResolvedValue([mockIdeaWithUser]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ideas?projectId=clh1234567890abcdefghij&status=PENDING')
      );

      await getIdeas(request);

      expect(prisma.idea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'clh1234567890abcdefghij', status: 'PENDING' },
        })
      );
    });
  });

  describe('POST /api/ideas', () => {
    it('should create a new idea', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.create as vi.Mock).mockResolvedValue(mockIdeaWithUser);

      const request = new NextRequest('http://localhost:3000/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Idea',
          description: 'Test Description',
          projectId: 'clh1234567890abcdefghij',
        }),
      });

      const response = await createIdea(request);
      const data = await response.json();

      if (response.status !== 201) {
        console.error('Unexpected error:', data);
      }

      expect(response.status).toBe(201);
      expect(data.id).toBe(mockIdea.id);
      expect(data.title).toBe(mockIdea.title);
      expect(prisma.idea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test Idea',
            description: 'Test Description',
            projectId: 'clh1234567890abcdefghij',
            createdById: 'clh1234567890abcdefghib',
          }),
        })
      );
    });

    it('should return 400 for invalid data', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/ideas', {
        method: 'POST',
        body: JSON.stringify({
          title: '',
          projectId: 'invalid-id',
        }),
      });

      const response = await createIdea(request);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/ideas/[id]', () => {
    it('should update an idea', async () => {
      const updatedIdea: Idea = { ...mockIdea, title: 'Updated Title' };
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(mockIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.update as vi.Mock).mockResolvedValue(updatedIdea);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const response = await updateIdea(request, { params: { id: 'idea-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
    });

    it('should return 403 if user is not creator or admin', async () => {
      const otherUserIdea: Idea = { ...mockIdea, createdById: 'other-user' };
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(otherUserIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const response = await updateIdea(request, { params: { id: 'idea-1' } });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/ideas/[id]', () => {
    it('should delete an idea', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(mockIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.delete as vi.Mock).mockResolvedValue(mockIdea);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1', {
        method: 'DELETE',
      });

      const response = await deleteIdea(request, { params: { id: 'idea-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/ideas/[id]/vote', () => {
    it('should upvote an idea', async () => {
      const upvotedIdea: Idea = { ...mockIdea, votes: 6 };
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(mockIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.update as vi.Mock).mockResolvedValue(upvotedIdea);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1/vote', {
        method: 'POST',
        body: JSON.stringify({ action: 'upvote' }),
      });

      const response = await voteOnIdea(request, { params: { id: 'idea-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.votes).toBe(6);
    });

    it('should downvote an idea', async () => {
      const downvotedIdea: Idea = { ...mockIdea, votes: 4 };
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(mockIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);
      vi.mocked(prisma.idea.update as vi.Mock).mockResolvedValue(downvotedIdea);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1/vote', {
        method: 'POST',
        body: JSON.stringify({ action: 'downvote' }),
      });

      const response = await voteOnIdea(request, { params: { id: 'idea-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.votes).toBe(4);
    });
  });

  describe('POST /api/ideas/[id]/convert', () => {
    it('should convert an idea to a feature', async () => {
      const convertedIdea: Idea = { ...mockIdea, status: 'CONVERTED' };
      const mockFeature: Feature = {
        id: 'feature-1',
        title: 'Test Idea',
        description: 'Test Description',
        priority: 'SHOULD',
        status: 'planned',
        projectId: 'clh1234567890abcdefghij',
        phaseId: null,
        createdAt: new Date(),
      };

      const adminProjectMember: ProjectMember = { ...mockProjectMember, role: 'ADMIN' };

      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(mockIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(adminProjectMember);
      vi.mocked(prisma.$transaction as vi.Mock).mockResolvedValue([mockFeature, convertedIdea]);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1/convert', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await convertIdea(request, { params: { id: 'idea-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.idea.status).toBe('CONVERTED');
      expect(data.feature).toBeDefined();
    });

    it('should return 403 if user is not admin or owner', async () => {
      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(mockIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(mockProjectMember);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1/convert', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await convertIdea(request, { params: { id: 'idea-1' } });

      expect(response.status).toBe(403);
    });

    it('should return 400 if idea is already converted', async () => {
      const convertedIdea: Idea = { ...mockIdea, status: 'CONVERTED' };
      const adminProjectMember: ProjectMember = { ...mockProjectMember, role: 'ADMIN' };

      vi.mocked(auth as vi.Mock).mockResolvedValue(mockSession);
      vi.mocked(prisma.idea.findUnique as vi.Mock).mockResolvedValue(convertedIdea);
      vi.mocked(prisma.projectMember.findUnique as vi.Mock).mockResolvedValue(adminProjectMember);

      const request = new NextRequest('http://localhost:3000/api/ideas/idea-1/convert', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await convertIdea(request, { params: { id: 'idea-1' } });

      expect(response.status).toBe(400);
    });
  });
});
