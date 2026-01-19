import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InsightsDashboard } from '@/components/insights/insights-dashboard';

// Mock fetch
global.fetch = vi.fn();

const mockInsightsData = {
  overview: {
    totalTasks: 42,
    completedTasks: 28,
    inProgressTasks: 8,
    pendingTasks: 4,
    cancelledTasks: 2,
    completionRate: 66.67,
    avgCompletionTimeSeconds: 86400,
    totalLogs: 156,
  },
  statusBreakdown: [
    { status: 'COMPLETED', count: 28, percentage: 66.67 },
    { status: 'IN_PROGRESS', count: 8, percentage: 19.05 },
    { status: 'PENDING', count: 4, percentage: 9.52 },
    { status: 'CANCELLED', count: 2, percentage: 4.76 },
  ],
  timeSeriesData: [
    { date: '2024-01-01', count: 3 },
    { date: '2024-01-02', count: 5 },
    { date: '2024-01-03', count: 4 },
  ],
  createdTimeSeries: [
    { date: '2024-01-01', count: 4 },
    { date: '2024-01-02', count: 6 },
    { date: '2024-01-03', count: 5 },
  ],
  modelUsage: [
    { model: 'claude-sonnet-4-5', count: 35, percentage: 70 },
    { model: 'claude-opus-4-5', count: 15, percentage: 30 },
  ],
  phaseStats: [
    { phase: 'Planning', avgDuration: 1800, minDuration: 600, maxDuration: 3600, count: 25 },
    { phase: 'Development', avgDuration: 7200, minDuration: 3600, maxDuration: 14400, count: 28 },
  ],
  productivityTrends: [
    { period: '2024-01-01', completed: 5, created: 8, completionRate: 62.5 },
    { period: '2024-01-08', completed: 7, created: 10, completionRate: 70 },
  ],
  priorityDistribution: {
    URGENT: 5,
    HIGH: 12,
    MEDIUM: 18,
    LOW: 7,
  },
};

describe('InsightsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { container } = render(<InsightsDashboard />);

    // Check for skeleton elements (they have data-slot="skeleton")
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display overview metrics correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('66.7%')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('28 completed')).toBeInTheDocument();
    });
  });

  it('should format duration correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      // 86400 seconds = 1 day
      expect(screen.getByText('1d')).toBeInTheDocument();
    });
  });

  it('should render all metric cards', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Completion Time')).toBeInTheDocument();
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });
  });

  it('should render chart sections', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tasks Over Time')).toBeInTheDocument();
      expect(screen.getByText('Task Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('AI Model Usage')).toBeInTheDocument();
      expect(screen.getByText('Phase Duration Analysis')).toBeInTheDocument();
      expect(screen.getByText('Weekly Productivity Trends')).toBeInTheDocument();
      expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
    });
  });

  it('should handle time range selection', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    const { rerender } = render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    });

    // Initial call should have default 30d timeRange
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('timeRange=30d')
    );
  });

  it('should filter by projectId when provided', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard projectId="project-123" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('projectId=project-123')
      );
    });
  });

  it('should display error state when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch insights')).toBeInTheDocument();
    });
  });

  it('should display error message from exception', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should render additional summary cards', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
      expect(screen.getByText('Active Development')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });
  });

  it('should calculate success rate correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      // Success rate = completed / (total - cancelled) = 28 / (42 - 2) = 70%
      expect(screen.getByText('70.0%')).toBeInTheDocument();
    });
  });

  it('should refetch data when projectId changes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockInsightsData,
    } as Response);

    const { rerender } = render(<InsightsDashboard projectId="project-1" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('projectId=project-1')
      );
    });

    vi.mocked(fetch).mockClear();

    rerender(<InsightsDashboard projectId="project-2" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('projectId=project-2')
      );
    });
  });

  it('should handle empty data gracefully', async () => {
    const emptyData = {
      overview: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        cancelledTasks: 0,
        completionRate: 0,
        avgCompletionTimeSeconds: 0,
        totalLogs: 0,
      },
      statusBreakdown: [],
      timeSeriesData: [],
      createdTimeSeries: [],
      modelUsage: [],
      phaseStats: [],
      productivityTrends: [],
      priorityDistribution: {},
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => emptyData,
    } as Response);

    render(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    });

    // Check that zero values are displayed
    const completionRateCard = screen.getByText('Completion Rate').closest('[data-slot="card"]');
    expect(completionRateCard).toBeInTheDocument();
  });
});
