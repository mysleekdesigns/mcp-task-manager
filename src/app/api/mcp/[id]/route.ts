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

// Validation schema for updating an MCP config
const updateMcpConfigSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(MCP_SERVER_TYPES).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional().nullable(),
});

/**
 * GET /api/mcp/[id]
 * Get a single MCP configuration by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch MCP config and verify project membership
  const mcpConfig = await prisma.mcpConfig.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  });

  if (!mcpConfig) {
    return NextResponse.json({ error: 'MCP configuration not found' }, { status: 404 });
  }

  // Verify user is a member of the project
  if (mcpConfig.project.members.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(mcpConfig);
}

/**
 * PUT /api/mcp/[id]
 * Update an MCP configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateMcpConfigSchema.parse(body);

    // Fetch MCP config and verify membership
    const mcpConfig = await prisma.mcpConfig.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!mcpConfig) {
      return NextResponse.json({ error: 'MCP configuration not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = mcpConfig.project.members[0];
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot update MCP configs
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update MCP configurations' },
        { status: 403 }
      );
    }

    const updatedMcpConfig = await prisma.mcpConfig.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.config !== undefined && { config: data.config ?? Prisma.JsonNull }),
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

    return NextResponse.json(updatedMcpConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/mcp/[id]
 * Delete an MCP configuration by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch MCP config and verify membership
  const mcpConfig = await prisma.mcpConfig.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  });

  if (!mcpConfig) {
    return NextResponse.json({ error: 'MCP configuration not found' }, { status: 404 });
  }

  // Verify user is a member of the project
  const membership = mcpConfig.project.members[0];
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only OWNER, ADMIN, and MEMBER can delete MCP configs
  if (membership.role === 'VIEWER') {
    return NextResponse.json(
      { error: 'Insufficient permissions to delete MCP configurations' },
      { status: 403 }
    );
  }

  await prisma.mcpConfig.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
