import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, DELETE } from '../[id]/route';
import * as authModule from '@/lib/auth';
import { prisma } from '@/lib/db';

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
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    worktree: {
      findUnique: vi.fn(),
    },
  },
}));

const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
  },
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
    description: 'Test Description',
    targetPath: '/path/to/project',
  },
  worktree: null,
};

const mockTerminalWithWorktree = {
  ...mockTerminal,
  worktreeId: 'worktree-1',
  worktree: {
    id: 'worktree-1',
    name: 'Feature Branch',
    path: '/path/to/worktree',
    branch: 'feature/test',
  },
};

describe('GET /api/terminals/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when terminal does not exist', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals/nonexistent-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'nonexistent-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Terminal not found');
  });

  it('returns 403 when user is not a project member', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(mockTerminal);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns terminal with project details', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(mockTerminal);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('terminal-1');
    expect(data.name).toBe('Main Terminal');
    expect(data.project).toBeDefined();
    expect(data.project.name).toBe('Test Project');
  });

  it('returns terminal with worktree details when available', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(mockTerminalWithWorktree);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.worktree).toBeDefined();
    expect(data.worktree.name).toBe('Feature Branch');
    expect(data.worktree.branch).toBe('feature/test');
  });

  it('includes all required project fields in response', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(mockTerminal);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(data.project).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        targetPath: expect.any(String),
      })
    );
  });

  it('includes all required worktree fields when present', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(mockTerminalWithWorktree);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(data.worktree).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        path: expect.any(String),
        branch: expect.any(String),
      })
    );
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockRejectedValue(new Error('DB Error'));

    const request = new NextRequest('http://localhost/api/terminals/terminal-1');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch terminal');
  });
});

describe('DELETE /api/terminals/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when terminal does not exist', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals/nonexistent-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'nonexistent-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Terminal not found');
  });

  it('returns 403 when user is not a project member', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 403 when user has VIEWER role', async () => {
    const viewerMembership = { ...mockProjectMembership, role: 'VIEWER' };
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(viewerMembership);

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Insufficient permissions');
  });

  it('allows ADMIN role to delete terminal', async () => {
    const adminMembership = { ...mockProjectMembership, role: 'ADMIN' };
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(adminMembership);
    vi.mocked(prisma.terminal.delete).mockResolvedValue({
      id: 'terminal-1',
      name: 'Main Terminal',
    });

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });

    expect(response.status).toBe(200);
  });

  it('allows MEMBER role to delete terminal', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.delete).mockResolvedValue({
      id: 'terminal-1',
      name: 'Main Terminal',
    });

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });

    expect(response.status).toBe(200);
  });

  it('allows OWNER role to delete terminal', async () => {
    const ownerMembership = { ...mockProjectMembership, role: 'OWNER' };
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(ownerMembership);
    vi.mocked(prisma.terminal.delete).mockResolvedValue({
      id: 'terminal-1',
      name: 'Main Terminal',
    });

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });

    expect(response.status).toBe(200);
  });

  it('deletes terminal successfully', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.delete).mockResolvedValue({
      id: 'terminal-1',
      name: 'Main Terminal',
    });

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('calls prisma.terminal.delete with correct ID', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockResolvedValue({
      id: 'terminal-1',
      projectId: 'project-1',
    });
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(mockProjectMembership);
    vi.mocked(prisma.terminal.delete).mockResolvedValue({
      id: 'terminal-1',
      name: 'Main Terminal',
    });

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });

    expect(vi.mocked(prisma.terminal.delete)).toHaveBeenCalledWith({
      where: { id: 'terminal-1' },
    });
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(authModule, 'auth').mockResolvedValue(mockSession as any);
    vi.mocked(prisma.terminal.findUnique).mockRejectedValue(new Error('DB Error'));

    const request = new NextRequest('http://localhost/api/terminals/terminal-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'terminal-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete terminal');
  });
});
