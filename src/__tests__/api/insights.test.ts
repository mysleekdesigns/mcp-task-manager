import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/insights/route';
import { NextRequest } from 'next/server';
import { TaskStatus, PhaseStatus, Priority } from '@prisma/client';
import { prisma } from '@/lib/db';
import * as authModule from '@/lib/auth';

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface ModelUsage {
  model: string;
  count: number;
}

interface PhaseStats {
  phase: string;
  avgDuration: number;
  count: number;
}

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('GET /api/insights', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  const baseDate = new Date('2024-01-15T12:00:00Z');
  const weekAgo = new Date('2024-01-08T12:00:00Z');

  const mockTasks = [
    {
      id: 'task-1',
      title: 'Task 1',
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      createdAt: weekAgo,
      updatedAt: baseDate,
      phases: [
        {
          id: 'phase-1',
          name: 'Planning',
          status: PhaseStatus.COMPLETED,
          model: 'claude-sonnet-4-5',
          startedAt: weekAgo,
          endedAt: new Date('2024-01-08T12:30:00Z'),
          logs: [],
        },
      ],
      logs: [
        { id: 'log-1', type: 'status_change', message: 'Started' },
        { id: 'log-2', type: 'status_change', message: 'Completed' },
      ],
      _count: { subtasks: 0 },
    },
    {
      id: 'task-2',
      title: 'Task 2',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      createdAt: new Date('2024-01-10T12:00:00Z'),
      updatedAt: new Date('2024-01-10T12:00:00Z'),
      phases: [
        {
          id: 'phase-2',
          name: 'Development',
          status: PhaseStatus.RUNNING,
          model: 'claude-opus-4-5',
          startedAt: new Date('2024-01-10T12:00:00Z'),
          endedAt: null,
          logs: [],
        },
      ],
      logs: [{ id: 'log-3', type: 'status_change', message: 'Started' }],
      _count: { subtasks: 2 },
    },
    {
      id: 'task-3',
      title: 'Task 3',
      status: TaskStatus.PENDING,
      priority: Priority.LOW,
      createdAt: new Date('2024-01-12T12:00:00Z'),
      updatedAt: new Date('2024-01-12T12:00:00Z'),
      phases: [],
      logs: [],
      _count: { subtasks: 0 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return insights data for authenticated user', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights?timeRange=30d');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    // Check overview metrics
    expect(data.overview).toBeDefined();
    expect(data.overview.totalTasks).toBe(3);
    expect(data.overview.completedTasks).toBe(1);
    expect(data.overview.inProgressTasks).toBe(1);
    expect(data.overview.pendingTasks).toBe(1);
    expect(data.overview.completionRate).toBeGreaterThan(0);
    expect(data.overview.totalLogs).toBe(3);
  });

  it('should calculate status breakdown correctly', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    const data = await response.json();
    const statusBreakdown = data.statusBreakdown as StatusBreakdown[];

    expect(statusBreakdown).toBeDefined();
    expect(statusBreakdown.length).toBeGreaterThan(0);

    const completedStatus = statusBreakdown.find((s: StatusBreakdown) => s.status === 'COMPLETED');
    expect(completedStatus).toBeDefined();
    expect(completedStatus.count).toBe(1);
    expect(completedStatus.percentage).toBeCloseTo(33.33, 1);
  });

  it('should track model usage correctly', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    const data = await response.json();
    const modelUsage = data.modelUsage as ModelUsage[];

    expect(modelUsage).toBeDefined();
    expect(modelUsage.length).toBe(2);

    const sonnetUsage = modelUsage.find((m: ModelUsage) => m.model === 'claude-sonnet-4-5');
    expect(sonnetUsage).toBeDefined();
    expect(sonnetUsage.count).toBe(1);

    const opusUsage = modelUsage.find((m: ModelUsage) => m.model === 'claude-opus-4-5');
    expect(opusUsage).toBeDefined();
    expect(opusUsage.count).toBe(1);
  });

  it('should calculate phase durations correctly', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    const data = await response.json();
    const phaseStats = data.phaseStats as PhaseStats[];

    expect(phaseStats).toBeDefined();
    expect(phaseStats.length).toBeGreaterThan(0);

    const planningPhase = phaseStats.find((p: PhaseStats) => p.phase === 'Planning');
    expect(planningPhase).toBeDefined();
    expect(planningPhase.avgDuration).toBeGreaterThan(0);
    expect(planningPhase.count).toBe(1);
  });

  it('should filter by projectId when provided', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights?projectId=project-1');
    await GET(request);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: 'project-1',
        }),
      })
    );
  });

  it('should respect time range parameter', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights?timeRange=7d');
    await GET(request);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('should handle empty task list', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.task.findMany).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.overview.totalTasks).toBe(0);
    expect(data.overview.completionRate).toBe(0);
    expect(data.statusBreakdown).toEqual([]);
    expect(data.modelUsage).toEqual([]);
  });

  it('should calculate productivity trends correctly', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    const data = await response.json();
    const productivityTrends = data.productivityTrends;

    expect(productivityTrends).toBeDefined();
    expect(Array.isArray(productivityTrends)).toBe(true);
  });

  it('should calculate priority distribution correctly', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    (vi.mocked(prisma.task.findMany) as vi.Mock).mockResolvedValue(mockTasks);

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    const data = await response.json();
    const priorityDistribution = data.priorityDistribution;

    expect(priorityDistribution).toBeDefined();
    expect(priorityDistribution.HIGH).toBe(1);
    expect(priorityDistribution.MEDIUM).toBe(1);
    expect(priorityDistribution.LOW).toBe(1);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(mockSession);
    vi.mocked(prisma.task.findMany).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/insights');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch insights');
  });
});
