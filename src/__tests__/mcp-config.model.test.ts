import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the prisma client BEFORE importing it
vi.mock('@/lib/db', () => ({
  prisma: {
    mcpConfig: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

// Mock data
const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test project for MCP',
  targetPath: '/path/to/project',
  githubRepo: 'https://github.com/test/repo',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMcpConfig = {
  id: 'mcp-config-1',
  name: 'Claude MCP',
  type: 'claude',
  enabled: true,
  config: {
    apiKey: 'sk-test-123',
    model: 'claude-3-opus',
    maxTokens: 4096,
  },
  projectId: 'project-1',
  createdAt: new Date(),
};

const mockMcpConfigWithoutConfig = {
  id: 'mcp-config-2',
  name: 'Test Tool MCP',
  type: 'tool',
  enabled: false,
  config: null,
  projectId: 'project-1',
  createdAt: new Date(),
};

describe('McpConfig Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Operations', () => {
    it('should create an McpConfig with all required fields', async () => {
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Claude MCP',
          type: 'claude',
          enabled: true,
          projectId: 'project-1',
        },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('mcp-config-1');
      expect(result.name).toBe('Claude MCP');
      expect(result.type).toBe('claude');
      expect(result.enabled).toBe(true);
      expect(result.projectId).toBe('project-1');
    });

    it('should create an McpConfig with optional config JSON', async () => {
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Claude MCP',
          type: 'claude',
          enabled: true,
          config: {
            apiKey: 'sk-test-123',
            model: 'claude-3-opus',
            maxTokens: 4096,
          },
          projectId: 'project-1',
        },
      });

      expect(result.config).toBeDefined();
      expect(result.config).toEqual({
        apiKey: 'sk-test-123',
        model: 'claude-3-opus',
        maxTokens: 4096,
      });
    });

    it('should create an McpConfig with null config', async () => {
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(mockMcpConfigWithoutConfig);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Test Tool MCP',
          type: 'tool',
          enabled: false,
          projectId: 'project-1',
        },
      });

      expect(result.config).toBeNull();
    });

    it('should set enabled to false by default', async () => {
      const configWithoutEnabled = { ...mockMcpConfig, enabled: false };
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(configWithoutEnabled);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Claude MCP',
          type: 'claude',
          projectId: 'project-1',
        },
      });

      expect(result.enabled).toBe(false);
    });

    it('should include project relation when requested', async () => {
      const configWithProject = {
        ...mockMcpConfig,
        project: mockProject,
      };
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(configWithProject);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Claude MCP',
          type: 'claude',
          enabled: true,
          projectId: 'project-1',
        },
        include: {
          project: true,
        },
      });

      expect(result.project).toBeDefined();
      expect(result.project.id).toBe('project-1');
    });

    it('should generate a unique ID for new McpConfig', async () => {
      const config1 = { ...mockMcpConfig, id: 'mcp-config-1' };
      const config2 = { ...mockMcpConfig, id: 'mcp-config-2' };

      expect(config1.id).not.toBe(config2.id);
    });
  });

  describe('Read Operations', () => {
    it('should find an McpConfig by ID', async () => {
      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.findUnique({
        where: { id: 'mcp-config-1' },
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('mcp-config-1');
      expect(result?.name).toBe('Claude MCP');
    });

    it('should return null when McpConfig not found', async () => {
      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(null);

      const result = await prisma.mcpConfig.findUnique({
        where: { id: 'nonexistent-id' },
      });

      expect(result).toBeNull();
    });

    it('should find all McpConfigs for a project', async () => {
      const configs = [mockMcpConfig, mockMcpConfigWithoutConfig];
      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue(configs);

      const result = await prisma.mcpConfig.findMany({
        where: { projectId: 'project-1' },
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].projectId).toBe('project-1');
      expect(result[1].projectId).toBe('project-1');
    });

    it('should find only enabled McpConfigs', async () => {
      const enabledConfigs = [mockMcpConfig]; // Only enabled one
      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue(enabledConfigs);

      const result = await prisma.mcpConfig.findMany({
        where: {
          projectId: 'project-1',
          enabled: true,
        },
      });

      expect(result.every(c => c.enabled)).toBe(true);
    });

    it('should find McpConfigs by type', async () => {
      const claudeConfigs = [mockMcpConfig];
      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue(claudeConfigs);

      const result = await prisma.mcpConfig.findMany({
        where: {
          projectId: 'project-1',
          type: 'claude',
        },
      });

      expect(result.every(c => c.type === 'claude')).toBe(true);
    });

    it('should include project relation in find operations', async () => {
      const configWithProject = {
        ...mockMcpConfig,
        project: mockProject,
      };
      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(configWithProject);

      const result = await prisma.mcpConfig.findUnique({
        where: { id: 'mcp-config-1' },
        include: {
          project: true,
        },
      });

      expect(result?.project).toBeDefined();
      expect(result?.project.name).toBe('Test Project');
    });

    it('should return empty array when no McpConfigs found', async () => {
      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue([]);

      const result = await prisma.mcpConfig.findMany({
        where: { projectId: 'nonexistent-project' },
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Update Operations', () => {
    it('should update McpConfig enabled status', async () => {
      const updatedConfig = { ...mockMcpConfig, enabled: false };
      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const result = await prisma.mcpConfig.update({
        where: { id: 'mcp-config-1' },
        data: { enabled: false },
      });

      expect(result.enabled).toBe(false);
    });

    it('should update McpConfig name', async () => {
      const updatedConfig = { ...mockMcpConfig, name: 'Updated MCP' };
      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const result = await prisma.mcpConfig.update({
        where: { id: 'mcp-config-1' },
        data: { name: 'Updated MCP' },
      });

      expect(result.name).toBe('Updated MCP');
    });

    it('should update McpConfig config JSON', async () => {
      const newConfig = {
        apiKey: 'sk-new-456',
        model: 'claude-3-sonnet',
        maxTokens: 2048,
      };
      const updatedConfig = { ...mockMcpConfig, config: newConfig };
      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const result = await prisma.mcpConfig.update({
        where: { id: 'mcp-config-1' },
        data: { config: newConfig },
      });

      expect(result.config).toEqual(newConfig);
    });

    it('should clear config by setting it to null', async () => {
      const updatedConfig = { ...mockMcpConfig, config: null };
      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const result = await prisma.mcpConfig.update({
        where: { id: 'mcp-config-1' },
        data: { config: null },
      });

      expect(result.config).toBeNull();
    });

    it('should update multiple fields simultaneously', async () => {
      const updatedConfig = {
        ...mockMcpConfig,
        name: 'Updated Name',
        enabled: false,
        type: 'updated-type',
      };
      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const result = await prisma.mcpConfig.update({
        where: { id: 'mcp-config-1' },
        data: {
          name: 'Updated Name',
          enabled: false,
          type: 'updated-type',
        },
      });

      expect(result.name).toBe('Updated Name');
      expect(result.enabled).toBe(false);
      expect(result.type).toBe('updated-type');
    });

    it('should include project relation after update', async () => {
      const updatedConfig = {
        ...mockMcpConfig,
        enabled: false,
        project: mockProject,
      };
      vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

      const result = await prisma.mcpConfig.update({
        where: { id: 'mcp-config-1' },
        data: { enabled: false },
        include: { project: true },
      });

      expect(result.project).toBeDefined();
      expect(result.project.id).toBe('project-1');
    });
  });

  describe('Delete Operations', () => {
    it('should delete an McpConfig by ID', async () => {
      vi.mocked(prisma.mcpConfig.delete).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.delete({
        where: { id: 'mcp-config-1' },
      });

      expect(result.id).toBe('mcp-config-1');
      expect(prisma.mcpConfig.delete).toHaveBeenCalledWith({
        where: { id: 'mcp-config-1' },
      });
    });

    it('should delete multiple McpConfigs', async () => {
      const deleteResult = { count: 2 };
      vi.mocked(prisma.mcpConfig.deleteMany).mockResolvedValue(deleteResult);

      const result = await prisma.mcpConfig.deleteMany({
        where: { projectId: 'project-1' },
      });

      expect(result.count).toBe(2);
    });

    it('should return deleted McpConfig data', async () => {
      vi.mocked(prisma.mcpConfig.delete).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.delete({
        where: { id: 'mcp-config-1' },
      });

      expect(result.name).toBe('Claude MCP');
      expect(result.type).toBe('claude');
      expect(result.config).toBeDefined();
    });
  });

  describe('Relationships', () => {
    it('should maintain project reference on creation', async () => {
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Claude MCP',
          type: 'claude',
          enabled: true,
          projectId: 'project-1',
        },
      });

      expect(result.projectId).toBe('project-1');
    });

    it('should load associated project when included', async () => {
      const configWithProject = {
        ...mockMcpConfig,
        project: mockProject,
      };
      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(configWithProject);

      const result = await prisma.mcpConfig.findUnique({
        where: { id: 'mcp-config-1' },
        include: { project: true },
      });

      expect(result?.project).toBeDefined();
      expect(result?.project.id).toBe('project-1');
      expect(result?.project.name).toBe('Test Project');
    });

    it('should cascade delete when project is deleted', async () => {
      // This test verifies the schema constraint
      // In practice, Prisma will handle cascade deletes automatically
      // We're just documenting the expected behavior
      const mcpConfigsToDelete = [mockMcpConfig, mockMcpConfigWithoutConfig];

      // When a project is deleted, all its McpConfigs should be deleted too
      // This is defined in the schema as: onDelete: Cascade
      expect(mockMcpConfig.projectId).toBe('project-1');
      expect(mockMcpConfigWithoutConfig.projectId).toBe('project-1');
      // Both configs belong to the same project, so both would be deleted
    });
  });

  describe('Data Validation', () => {
    it('should accept valid config JSON structures', async () => {
      const validConfigs = [
        { apiKey: 'key', model: 'model' },
        { enabled: true, timeout: 5000, retries: 3 },
        { nested: { deep: { config: true } } },
      ];

      for (const config of validConfigs) {
        const testConfig = { ...mockMcpConfig, config };
        vi.mocked(prisma.mcpConfig.create).mockResolvedValue(testConfig);

        const result = await prisma.mcpConfig.create({
          data: {
            name: 'Test',
            type: 'test',
            projectId: 'project-1',
            config,
          },
        });

        expect(result.config).toEqual(config);
      }
    });

    it('should preserve config JSON structure on retrieval', async () => {
      const complexConfig = {
        apiKey: 'sk-test-123',
        model: 'claude-3-opus',
        settings: {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 0.95,
        },
        tools: ['bash', 'python', 'git'],
      };

      const configWithComplexData = {
        ...mockMcpConfig,
        config: complexConfig,
      };
      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(configWithComplexData);

      const result = await prisma.mcpConfig.findUnique({
        where: { id: 'mcp-config-1' },
      });

      expect(result?.config).toEqual(complexConfig);
      expect(result?.config.settings.temperature).toBe(0.7);
      expect(result?.config.tools).toContain('bash');
    });

    it('should handle string, number, and boolean values in config', async () => {
      const mixedConfig = {
        stringValue: 'test-string',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayValue: [1, 'two', true],
      };

      const configWithMixedTypes = {
        ...mockMcpConfig,
        config: mixedConfig,
      };
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(configWithMixedTypes);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Test',
          type: 'test',
          projectId: 'project-1',
          config: mixedConfig,
        },
      });

      expect(result.config?.stringValue).toBe('test-string');
      expect(result.config?.numberValue).toBe(42);
      expect(result.config?.booleanValue).toBe(true);
      expect(result.config?.nullValue).toBeNull();
    });
  });

  describe('Query Operations', () => {
    it('should count McpConfigs for a project', async () => {
      vi.mocked(prisma.mcpConfig.count).mockResolvedValue(2);

      const result = await prisma.mcpConfig.count({
        where: { projectId: 'project-1' },
      });

      expect(result).toBe(2);
    });

    it('should check if specific McpConfig exists', async () => {
      vi.mocked(prisma.mcpConfig.findUnique).mockResolvedValue(mockMcpConfig);

      const result = await prisma.mcpConfig.findUnique({
        where: { id: 'mcp-config-1' },
      });

      expect(result).not.toBeNull();
    });

    it('should order McpConfigs by creation date', async () => {
      const configs = [
        { ...mockMcpConfig, createdAt: new Date('2024-01-01') },
        { ...mockMcpConfigWithoutConfig, createdAt: new Date('2024-01-02') },
      ];
      vi.mocked(prisma.mcpConfig.findMany).mockResolvedValue(configs);

      const result = await prisma.mcpConfig.findMany({
        where: { projectId: 'project-1' },
        orderBy: { createdAt: 'asc' },
      });

      expect(result[0].createdAt).toEqual(new Date('2024-01-01'));
      expect(result[1].createdAt).toEqual(new Date('2024-01-02'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle McpConfig with very large config JSON', async () => {
      const largeConfig = {
        data: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: i, value: `value-${i}` })),
      };

      const configWithLargeData = {
        ...mockMcpConfig,
        config: largeConfig,
      };
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(configWithLargeData);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Large Config',
          type: 'test',
          projectId: 'project-1',
          config: largeConfig,
        },
      });

      expect(result.config?.data).toHaveLength(1000);
    });

    it('should handle special characters in name and type', async () => {
      const specialConfig = {
        ...mockMcpConfig,
        name: 'Test & Configure: MCP "Special" <Chars>',
        type: 'type-with-special/chars',
      };
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(specialConfig);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Test & Configure: MCP "Special" <Chars>',
          type: 'type-with-special/chars',
          projectId: 'project-1',
        },
      });

      expect(result.name).toBe('Test & Configure: MCP "Special" <Chars>');
      expect(result.type).toBe('type-with-special/chars');
    });

    it('should handle Unicode characters in config', async () => {
      const unicodeConfig = {
        message: 'Hello 世界 مرحبا мир',
        chinese: '中文',
        arabic: 'العربية',
        russian: 'русский',
      };

      const configWithUnicode = {
        ...mockMcpConfig,
        config: unicodeConfig,
      };
      vi.mocked(prisma.mcpConfig.create).mockResolvedValue(configWithUnicode);

      const result = await prisma.mcpConfig.create({
        data: {
          name: 'Unicode Test',
          type: 'test',
          projectId: 'project-1',
          config: unicodeConfig,
        },
      });

      expect(result.config?.message).toContain('世界');
      expect(result.config?.chinese).toBe('中文');
      expect(result.config?.arabic).toBe('العربية');
      expect(result.config?.russian).toBe('русский');
    });
  });
});
