import { render, screen } from '@testing-library/react';
import { IssueCard } from '@/components/github/IssueCard';
import { GitHubIssue } from '@/types/github';

const mockIssue: GitHubIssue = {
  id: 1,
  number: 123,
  title: 'Test Issue',
  body: 'This is a test issue',
  state: 'open',
  labels: [
    {
      id: 1,
      name: 'bug',
      color: 'ff0000',
      description: 'Bug label',
    },
  ],
  assignees: [],
  user: {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.png',
    html_url: 'https://github.com/testuser',
    type: 'User',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  comments: 5,
  html_url: 'https://github.com/test/repo/issues/123',
};

describe('IssueCard', () => {
  it('renders issue title and number', () => {
    const onViewDetails = vi.fn();
    const onCreateTask = vi.fn();

    render(
      <IssueCard
        issue={mockIssue}
        onViewDetails={onViewDetails}
        onCreateTask={onCreateTask}
      />
    );

    expect(screen.getByText('Test Issue')).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
  });

  it('shows open badge for open issues', () => {
    const onViewDetails = vi.fn();
    const onCreateTask = vi.fn();

    render(
      <IssueCard
        issue={mockIssue}
        onViewDetails={onViewDetails}
        onCreateTask={onCreateTask}
      />
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays labels', () => {
    const onViewDetails = vi.fn();
    const onCreateTask = vi.fn();

    render(
      <IssueCard
        issue={mockIssue}
        onViewDetails={onViewDetails}
        onCreateTask={onCreateTask}
      />
    );

    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('shows comment count', () => {
    const onViewDetails = vi.fn();
    const onCreateTask = vi.fn();

    render(
      <IssueCard
        issue={mockIssue}
        onViewDetails={onViewDetails}
        onCreateTask={onCreateTask}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
