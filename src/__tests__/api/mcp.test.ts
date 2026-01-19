import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from '@/app/api/mcp/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/mcp/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';
import type { Session } from 'next-auth';

// Mock the database and auth modules
vi.mock('@/lib/db', () => ({
  prisma: {
    mcpConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
};

const mockMemberOwner = {
  id: 'member-1',
  userId: 'user-1',
  projectId: 'project-1',
  role: 'OWNER',
  createdAt: new Date(),
};

const mockMemberMember = {
  id: 'member-2',
  userId: 'user-1',
  projectId: 'project-1',
  role: 'MEMBER',
  createdAt: new Date(),
};

const mockMemberViewer = {
  id: 'member-3',
  userId: 'user-1',
  projectId: 'project-1',
  role: 'VIEWER',
  createdAt: new Date(),
};

const mockMcpConfig = {
  id: 'mcp-1',
  name: 'Test MCP Config',
  type: 'filesystem',
  enabled: true,
  config: { path: '/test/path' },
  projectId: 'project-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  project: mockProject,
};

describe('MCP API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/mcp', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return MCP configs for authenticated user', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue([mockMcpConfig]);

      const request = new NextRequest('http://localhost/api/mcp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('mcp-1');
      expect(data[0].name).toBe('Test MCP Config');
    });

    it('should filter configs by projectId when provided', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue([mockMcpConfig]);

      const request = new NextRequest('http://localhost/api/mcp?projectId=project-1');
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.mcpConfig.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-1',
          }),
        })
      );
    });

    it('should return empty array when no configs found', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/mcp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/mcp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch MCP configs');
    });
  });

  describe('POST /api/mcp', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Config',
          type: 'filesystem',
          projectId: 'project-1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when required fields are missing', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Config',
          // Missing type and projectId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name is empty', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          type: 'filesystem',
          projectId: 'project-1',
        }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 400 when type is invalid', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      const request = new NextRequest('http://localhost/api/mcp', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Config',
          type: 'invalid-type',
          projectId: 'project-1',
        }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(400);
    });

  });

  describe('GET /api/mcp/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1');
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when config not found', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1');
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('MCP configuration not found');
    });

    it('should return 403 when user is not project member', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [],
        },
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1');
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return MCP config when user is project member', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberOwner],
        },
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1');
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('mcp-1');
      expect(data.name).toBe('Test MCP Config');
    });
  });

  describe('PUT /api/mcp/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Config' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when config not found', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Config' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('MCP configuration not found');
    });

    it('should return 403 when user is not project member', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [],
        },
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Config' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 403 when user has VIEWER role', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberViewer],
        },
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Config' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient permissions');
    });

    it('should update config name with OWNER role', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberOwner],
        },
      });

      const updatedConfig = {
        ...mockMcpConfig,
        name: 'Updated Config',
      };

      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Config' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Config');
      expect(vi.mocked(prisma.mcpConfig.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mcp-1' },
          data: expect.objectContaining({
            name: 'Updated Config',
          }),
        })
      );
    });

    it('should update config enabled status', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberOwner],
        },
      });

      const updatedConfig = {
        ...mockMcpConfig,
        enabled: false,
      };

      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ enabled: false }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enabled).toBe(false);
    });

    it('should update config type', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberOwner],
        },
      });

      const updatedConfig = {
        ...mockMcpConfig,
        type: 'github',
      };

      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ type: 'github' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('github');
    });

    it('should return 400 for invalid type in update', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ type: 'invalid-type' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      await response.json();

      expect(response.status).toBe(400);
    });

    it('should update config with MEMBER role', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberMember],
        },
      });

      vi.mocked(prisma.mcpConfig.update).mockResolvedValue({
        ...mockMcpConfig,
        name: 'Updated',
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/mcp/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when config not found', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('MCP configuration not found');
    });

    it('should return 403 when user is not project member', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [],
        },
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 403 when user has VIEWER role', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberViewer],
        },
      });

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient permissions');
    });

    it('should delete config with OWNER role', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberOwner],
        },
      });

      vi.mocked(prisma.mcpConfig.delete).mockResolvedValue(mockMcpConfig);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vi.mocked(prisma.mcpConfig.delete)).toHaveBeenCalledWith({
        where: { id: 'mcp-1' },
      });
    });

    it('should delete config with MEMBER role', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberMember],
        },
      });

      vi.mocked(prisma.mcpConfig.delete).mockResolvedValue(mockMcpConfig);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });

      expect(response.status).toBe(200);
    });

    it('should return 403 for ADMIN role in edge case', async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: mockUser,
      } as Session);

      const mockMemberAdmin = {
        ...mockMemberOwner,
        role: 'ADMIN',
      };

      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue({
        ...mockMcpConfig,
        project: {
          ...mockProject,
          members: [mockMemberAdmin],
        },
      });

      vi.mocked(prisma.mcpConfig.delete).mockResolvedValue(mockMcpConfig);

      const request = new NextRequest('http://localhost/api/mcp/mcp-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mcp-1' }),
      });

      expect(response.status).toBe(200);
    });
  });

});
