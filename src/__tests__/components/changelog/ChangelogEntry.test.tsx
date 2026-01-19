import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangelogEntry } from '@/components/changelog/ChangelogEntry';
import { ChangelogType } from '@prisma/client';

describe('ChangelogEntry', () => {
  const baseEntry = {
    id: '1',
    title: 'Add dark mode support',
    description: 'Implemented dark mode theme switching',
    version: '1.0.0',
    type: ChangelogType.FEATURE,
    taskId: 'task1',
    projectId: 'project1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    task: {
      id: 'task1',
      title: 'Dark Mode Task',
      status: 'COMPLETED',
    },
    project: {
      id: 'project1',
      name: 'Test Project',
    },
  };

  it('renders feature entry correctly', () => {
    render(<ChangelogEntry entry={baseEntry} />);

    expect(screen.getByText('Add dark mode support')).toBeInTheDocument();
    expect(screen.getByText('Implemented dark mode theme switching')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
  });

  it('renders fix entry with correct badge', () => {
    const fixEntry = {
      ...baseEntry,
      type: ChangelogType.FIX,
      title: 'Fix login bug',
    };

    render(<ChangelogEntry entry={fixEntry} />);

    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    expect(screen.getByText('Fix')).toBeInTheDocument();
  });

  it('renders improvement entry with correct badge', () => {
    const improvementEntry = {
      ...baseEntry,
      type: ChangelogType.IMPROVEMENT,
      title: 'Improve performance',
    };

    render(<ChangelogEntry entry={improvementEntry} />);

    expect(screen.getByText('Improve performance')).toBeInTheDocument();
    expect(screen.getByText('Improvement')).toBeInTheDocument();
  });

  it('renders breaking change entry with correct badge', () => {
    const breakingEntry = {
      ...baseEntry,
      type: ChangelogType.BREAKING,
      title: 'Update API endpoints',
    };

    render(<ChangelogEntry entry={breakingEntry} />);

    expect(screen.getByText('Update API endpoints')).toBeInTheDocument();
    expect(screen.getByText('Breaking')).toBeInTheDocument();
  });

  it('renders without version badge when version is null', () => {
    const entryWithoutVersion = {
      ...baseEntry,
      version: null,
    };

    render(<ChangelogEntry entry={entryWithoutVersion} />);

    expect(screen.queryByText(/^v/)).not.toBeInTheDocument();
  });

  it('renders without task link when task is null', () => {
    const entryWithoutTask = {
      ...baseEntry,
      task: null,
      taskId: null,
    };

    render(<ChangelogEntry entry={entryWithoutTask} />);

    expect(screen.queryByText(/Related task:/)).not.toBeInTheDocument();
  });

  it('renders project name when showProject is true', () => {
    render(<ChangelogEntry entry={baseEntry} showProject={true} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('does not render project name when showProject is false', () => {
    render(<ChangelogEntry entry={baseEntry} showProject={false} />);

    expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
  });

  it('renders task link with correct href', () => {
    render(<ChangelogEntry entry={baseEntry} />);

    const link = screen.getByRole('link', { name: /Related task:/ });
    expect(link).toHaveAttribute('href', '/dashboard/kanban?task=task1');
  });
});
