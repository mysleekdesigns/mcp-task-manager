import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  parseTerminalOutput,
  generateSessionSummary,
  formatMemoryContent,
  generateMemoryTitle,
} from '@/lib/session-insights';

/**
 * Validation schema for session capture request
 */
const captureSessionSchema = z.object({
  terminalId: z.string().cuid(),
  terminalName: z.string().min(1),
  projectId: z.string().cuid(),
  outputBuffer: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  commandCount: z.number().int().min(0),
  worktreeId: z.string().cuid().optional(),
  cwd: z.string().optional(),
});

/**
 * POST /api/memories/capture-session
 * Capture insights from a terminal session and create a memory entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = captureSessionSchema.parse(body);

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

    // VIEWER role cannot create memories
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create memories' },
        { status: 403 }
      );
    }

    // Parse terminal output for insights
    const insights = parseTerminalOutput(data.outputBuffer);

    // Skip creating memory if no meaningful insights were found
    // (less than 3 insights and no commands)
    if (insights.length < 3 && data.commandCount === 0) {
      return NextResponse.json({
        skipped: true,
        message: 'Session too brief or no meaningful activity detected',
      });
    }

    // Generate session summary
    const summary = generateSessionSummary(
      insights,
      new Date(data.startTime),
      new Date(data.endTime)
    );

    // Format content and title
    const content = formatMemoryContent(summary, data.terminalId);
    const title = generateMemoryTitle(summary, data.terminalName);

    // Create metadata object
    const metadata = {
      terminalId: data.terminalId,
      terminalName: data.terminalName,
      worktreeId: data.worktreeId,
      cwd: data.cwd,
      duration: summary.duration,
      commandCount: summary.commandCount,
      errorCount: summary.errorCount,
      successCount: summary.successCount,
      keyTopics: summary.keyTopics,
      startTime: data.startTime,
      endTime: data.endTime,
    };

    // Create memory entry
    const memory = await prisma.memory.create({
      data: {
        type: 'session',
        title,
        content,
        projectId: data.projectId,
        metadata,
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

    return NextResponse.json(
      {
        memory,
        summary: {
          insightCount: insights.length,
          duration: summary.duration,
          keyTopics: summary.keyTopics,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error capturing session insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to capture session insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
