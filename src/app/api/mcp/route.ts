import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// MCP server types
const MCP_SERVER_TYPES = [
  'filesystem',
  'git',
  'github',
  'postgres',
  'memory',
  'browser',
  'custom',
] as const;

// Validation schema for creating an MCP config
const createMcpConfigSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(MCP_SERVER_TYPES),
  enabled: z.boolean().default(false),
  config: z.record(z.string(), z.any()).optional().nullable(),
  projectId: z.string().cuid(),
});

/**
 * GET /api/mcp
 * List MCP configurations with optional projectId filter
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Build where clause
    const where: Prisma.McpConfigWhereInput = {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const mcpConfigs = await prisma.mcpConfig.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(mcpConfigs);
  } catch (error) {
    console.error('Error fetching MCP configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP configs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp
 * Create a new MCP configuration
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createMcpConfigSchema.parse(body);

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: data.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot create MCP configs
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create MCP configurations' },
        { status: 403 }
      );
    }

    const mcpConfig = await prisma.mcpConfig.create({
      data: {
        name: data.name,
        type: data.type,
        enabled: data.enabled,
        config: data.config ?? Prisma.JsonNull,
        projectId: data.projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(mcpConfig, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
