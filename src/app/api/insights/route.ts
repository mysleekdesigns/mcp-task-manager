import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TaskStatus, PhaseStatus } from '@prisma/client';

interface TimeSeriesData {
  date: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface ModelUsage {
  model: string;
  count: number;
  percentage: number;
}

interface PhaseDuration {
  phase: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  count: number;
}

interface ProductivityTrend {
  period: string;
  completed: number;
  created: number;
  completionRate: number;
}

/**
 * GET /api/insights
 * Get aggregated metrics for insights dashboard
 * Query params: projectId (optional), timeRange (7d, 30d, 90d, all)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Build base where clause
    const baseWhere: Record<string, unknown> = {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      createdAt: {
        gte: startDate,
      },
    };

    if (projectId) {
      baseWhere.projectId = projectId;
    }

    // Fetch all tasks for the period
    const tasks = await prisma.task.findMany({
      where: baseWhere,
      include: {
        phases: {
          include: {
            logs: true,
          },
        },
        logs: true,
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
    });

    // 1. Task completion metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const cancelledTasks = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 2. Status breakdown
    const statusBreakdown: StatusBreakdown[] = Object.values(TaskStatus).map(status => {
      const count = tasks.filter(t => t.status === status).length;
      return {
        status,
        count,
        percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0,
      };
    }).filter(s => s.count > 0);

    // 3. Time series data (tasks completed over time)
    const completedTasksByDate = tasks
      .filter(t => t.status === TaskStatus.COMPLETED)
      .reduce((acc: Record<string, number>, task) => {
        const date = task.updatedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    const timeSeriesData: TimeSeriesData[] = Object.entries(completedTasksByDate)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Tasks created over time
    const createdTasksByDate = tasks.reduce((acc: Record<string, number>, task) => {
      const date = task.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const createdTimeSeries: TimeSeriesData[] = Object.entries(createdTasksByDate)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Model usage stats
    const modelUsageMap = new Map<string, number>();
    let totalPhases = 0;

    tasks.forEach(task => {
      task.phases.forEach(phase => {
        if (phase.model) {
          modelUsageMap.set(phase.model, (modelUsageMap.get(phase.model) || 0) + 1);
          totalPhases++;
        }
      });
    });

    const modelUsage: ModelUsage[] = Array.from(modelUsageMap.entries())
      .map(([model, count]) => ({
        model,
        count,
        percentage: totalPhases > 0 ? (count / totalPhases) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Phase duration analysis
    const phaseDurations: Record<string, { durations: number[]; count: number }> = {};

    tasks.forEach(task => {
      task.phases
        .filter(p => p.startedAt && p.endedAt && p.status === PhaseStatus.COMPLETED)
        .forEach(phase => {
          const duration = phase.endedAt!.getTime() - phase.startedAt!.getTime();
          if (!phaseDurations[phase.name]) {
            phaseDurations[phase.name] = { durations: [], count: 0 };
          }
          phaseDurations[phase.name].durations.push(duration);
          phaseDurations[phase.name].count++;
        });
    });

    const phaseStats: PhaseDuration[] = Object.entries(phaseDurations).map(([phase, data]) => {
      const durations = data.durations;
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      return {
        phase,
        avgDuration: Math.round(avgDuration / 1000), // Convert to seconds
        minDuration: Math.round(Math.min(...durations) / 1000),
        maxDuration: Math.round(Math.max(...durations) / 1000),
        count: data.count,
      };
    });

    // 7. Productivity trends (weekly)
    const weeklyTrends: Record<string, { completed: number; created: number }> = {};

    tasks.forEach(task => {
      // Group by week
      const weekStart = new Date(task.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyTrends[weekKey]) {
        weeklyTrends[weekKey] = { completed: 0, created: 0 };
      }

      weeklyTrends[weekKey].created++;

      if (task.status === TaskStatus.COMPLETED) {
        weeklyTrends[weekKey].completed++;
      }
    });

    const productivityTrends: ProductivityTrend[] = Object.entries(weeklyTrends)
      .map(([period, data]) => ({
        period,
        completed: data.completed,
        created: data.created,
        completionRate: data.created > 0 ? (data.completed / data.created) * 100 : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // 8. Priority distribution
    const priorityDistribution = tasks.reduce((acc: Record<string, number>, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    // 9. Average task completion time
    const completedTasksWithTime = tasks.filter(
      t => t.status === TaskStatus.COMPLETED && t.createdAt && t.updatedAt
    );

    const avgCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => {
          return sum + (task.updatedAt.getTime() - task.createdAt.getTime());
        }, 0) / completedTasksWithTime.length
      : 0;

    // 10. Task logs activity
    const totalLogs = tasks.reduce((sum, task) => sum + task.logs.length, 0);

    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        cancelledTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        avgCompletionTimeSeconds: Math.round(avgCompletionTime / 1000),
        totalLogs,
      },
      statusBreakdown,
      timeSeriesData,
      createdTimeSeries,
      modelUsage,
      phaseStats,
      productivityTrends,
      priorityDistribution,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
