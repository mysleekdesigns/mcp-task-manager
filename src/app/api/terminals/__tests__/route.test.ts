import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as GET_LIST, POST } from '../route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/auth');
vi.mock('@/lib/db');

const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
  },
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
};

const mockProjectMembership = {
  id: 'member-1',
  userId: 'user-1',
  projectId: 'project-1',
  role: 'MEMBER',
  createdAt: new Date(),
};

const mockTerminal = {
  id: 'terminal-1',
  name: 'Main Terminal',
  status: 'idle',
  pid: null,
  projectId: 'project-1',
  worktreeId: null,
  createdAt: new Date(),
  project: {
    id: 'project-1',
    name: 'Test Project',
  },
};

const mockWorktree = {
  id: 'worktree-1',
  name: 'Feature Branch',
  path: '/path/to/worktree',
  branch: 'feature/test',
  projectId: 'project-1',
};

describe('GET /api/terminals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when projectId query parameter is missing', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost/api/terminals');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('projectId');
  });

  it('returns 403 when user is not a project member', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals?projectId=project-1');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns list of terminals for a project', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.findMany).mockResolvedValue([mockTerminal]);

    const request = new NextRequest('http://localhost/api/terminals?projectId=project-1');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe('terminal-1');
    expect(data[0].name).toBe('Main Terminal');
  });

  it('filters terminals by projectId', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.findMany).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/terminals?projectId=project-1');
    await GET_LIST(request);

    expect(prisma.terminal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'project-1' },
      })
    );
  });

  it('includes project details in the response', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.findMany).mockResolvedValue([mockTerminal]);

    const request = new NextRequest('http://localhost/api/terminals?projectId=project-1');
    await GET_LIST(request);

    expect(prisma.terminal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          project: expect.any(Object),
        }),
      })
    );
  });

  it('returns 500 on database error', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockRejectedValue(new Error('DB Error'));

    const request = new NextRequest('http://localhost/api/terminals?projectId=project-1');
    const response = await GET_LIST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch terminals');
  });
});

describe('POST /api/terminals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
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
    vi.mocked(auth).mockResolvedValue(mockSession);

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
    vi.mocked(auth).mockResolvedValue(mockSession);

    const body = {
      name: 'New Terminal',
      projectId: 'invalid-id',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('returns 403 when user is not a project member', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
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
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(viewerMembership);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
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
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.worktree.findUnique).mockResolvedValue(null);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
      worktreeId: 'nonexistent-1',
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
    const differentProjectWorktree = { ...mockWorktree, projectId: 'project-2' };
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.worktree.findUnique).mockResolvedValue(differentProjectWorktree);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
      worktreeId: 'worktree-1',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('same project');
  });

  it('creates a terminal successfully', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.create).mockResolvedValue(mockTerminal);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('terminal-1');
    expect(data.name).toBe('Main Terminal');
  });

  it('creates terminal with worktreeId when provided', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.worktree.findUnique).mockResolvedValue(mockWorktree);
    vi.mocked(prisma.terminal.create).mockResolvedValue(mockTerminal);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
      worktreeId: 'worktree-1',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('terminal-1');
  });

  it('includes project details in created terminal response', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.create).mockResolvedValue(mockTerminal);

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    await POST(request);

    expect(prisma.terminal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          project: expect.any(Object),
        }),
      })
    );
  });

  it('returns 500 on database error during creation', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.create).mockRejectedValue(new Error('DB Error'));

    const body = {
      name: 'New Terminal',
      projectId: 'project-1',
    };

    const request = new NextRequest('http://localhost/api/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete terminal');
  });
});
