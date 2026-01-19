import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as GET_LIST, POST } from '../route';
import * as authModule from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Session } from 'next-auth';
import type { Worktree } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  prisma: {
    projectMember: {
      findUnique: vi.fn(),
    },
    terminal: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    worktree: {
      findUnique: vi.fn(),
    },
  },
}));

// Helper function to generate a valid CUID
function generateCUID(): string {
  return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const userId = generateCUID();
const projectId = generateCUID();
const terminalId = generateCUID();
const memberId = generateCUID();

const mockSession = {
  user: {
    id: userId,
    email: 'test@example.com',
  },
};

const mockProjectMembership = {
  id: memberId,
  userId,
  projectId,
  role: 'MEMBER',
  createdAt: new Date(),
};

const mockTerminal = {
  id: terminalId,
  name: 'Main Terminal',
  status: 'idle',
  pid: null,
  projectId,
  worktreeId: null,
  createdAt: new Date(),
  project: {
    id: projectId,
    name: 'Test Project',
  },
};

describe('GET /api/terminals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when projectId query parameter is missing', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);

    const request = new NextRequest('http://localhost/api/terminals');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('projectId');
  });

  it('returns 403 when user is not a project member', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/terminals?projectId=${projectId}`);
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns list of terminals for a project', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.findMany).mockResolvedValue([mockTerminal]);

    const request = new NextRequest(`http://localhost/api/terminals?projectId=${projectId}`);
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe(terminalId);
    expect(data[0].name).toBe(mockTerminal.name);
  });

  it('filters terminals by projectId', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.findMany).mockResolvedValue([]);

    const request = new NextRequest(`http://localhost/api/terminals?projectId=${projectId}`);
    await GET_LIST(request);

    expect(vi.mocked(prisma.terminal.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId },
      })
    );
  });

  it('includes project details in the response', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.findMany).mockResolvedValue([mockTerminal]);

    const request = new NextRequest(`http://localhost/api/terminals?projectId=${projectId}`);
    await GET_LIST(request);

    expect(vi.mocked(prisma.terminal.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          project: expect.any(Object),
        }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockRejectedValue(new Error('DB Error'));

    const request = new NextRequest(`http://localhost/api/terminals?projectId=${projectId}`);
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch terminals');
  });
});

describe('POST /api/terminals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock return values
    vi.mocked(prisma.projectMember.findUnique).mockReset();
    vi.mocked(prisma.terminal.create).mockReset();
    vi.mocked(prisma.worktree.findUnique).mockReset();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(null);

    const body = {
      name: 'New Terminal',
      projectId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when validation fails', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);

    const body = {
      name: '', // Invalid: empty name
      projectId: 'project-1',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(Array.isArray(data.error)).toBe(true);
  });

  it('returns 400 when projectId is not a valid CUID', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);

    const body = {
      name: 'New Terminal',
      projectId: 'invalid-id',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 403 when user is not a project member', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const body = {
      name: 'New Terminal',
      projectId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 403 when user has VIEWER role', async () => {
    const viewerMembership = { ...mockProjectMembership, role: 'VIEWER' };
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(viewerMembership);

    const body = {
      name: 'New Terminal',
      projectId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Insufficient permissions');
  });

  it('returns 404 when worktreeId is provided but worktree does not exist', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.worktree.findUnique).mockResolvedValue(null);

    const body = {
      name: 'New Terminal',
      projectId,
      worktreeId: generateCUID(),
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Worktree not found');
  });

  it('returns 400 when worktree belongs to different project', async () => {
    const differentProjectWorktree = { projectId: generateCUID() };
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.worktree.findUnique).mockResolvedValue(differentProjectWorktree as Partial<Worktree>);

    const body = {
      name: 'New Terminal',
      projectId,
      worktreeId: generateCUID(),
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Worktree must belong to the same project');
  });

  it('creates a terminal successfully', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.create).mockResolvedValue(mockTerminal);

    const body = {
      name: 'New Terminal',
      projectId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(terminalId);
    expect(data.name).toBe('Main Terminal');
  });

  it('creates terminal with worktreeId when provided', async () => {
    const testWorktreeId = generateCUID();
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.worktree.findUnique).mockResolvedValue({ projectId } as Partial<Worktree>);
    vi.mocked(prisma.terminal.create).mockResolvedValue(mockTerminal);

    const body = {
      name: 'New Terminal',
      projectId,
      worktreeId: testWorktreeId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(terminalId);
  });

  it('includes project details in created terminal response', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.create).mockResolvedValue(mockTerminal);

    const body = {
      name: 'New Terminal',
      projectId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    await POST(request);

    expect(vi.mocked(prisma.terminal.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          project: expect.any(Object),
        }),
      })
    );
  });

  it('returns 500 on database error during creation', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as Session);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.create).mockRejectedValue(new Error('DB Error'));

    const body = {
      name: 'New Terminal',
      projectId,
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});
