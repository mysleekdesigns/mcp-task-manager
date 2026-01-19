# GitHub Components

React components for GitHub integration features.

## Components

### Issues

#### IssueCard
Displays an issue in a card format with:
- Issue title and number (#123)
- State indicator (open/closed)
- Labels as colored badges
- Assignees as avatars
- Comment count
- Creation date
- "Create Task" button

#### IssuesList
Manages a list of issue cards with:
- State filtering (all/open/closed)
- Loading states with skeletons
- Empty states with helpful messaging
- Error handling with retry
- Auto-fetches from API
- Shows issue count

#### IssueDetailModal
Full detail modal for an issue showing:
- Complete issue information
- Author with avatar
- Full description (markdown rendered)
- All labels and assignees
- Comments (lazy-loaded)
- External GitHub link
- "Create Task from Issue" button

### Pull Requests

#### PrCard
Displays a pull request in a card format with:
- PR title and number
- State indicator (open/closed/merged)
- Branch information
- Review status
- Author and creation date
- Labels

### PrList
Manages a list of PR cards with:
- State filtering (all/open/closed/merged)
- Loading states with skeletons
- Empty states
- Error handling
- Click handler to open detail modal

### PrDetailModal
Full detail modal for a pull request showing:
- Complete PR information
- Branch details
- Description (markdown rendered)
- Labels, assignees, and reviewers
- Changed files summary
- Reviews with status

## Types

All GitHub-related TypeScript types are defined in `src/types/github.ts`:

### Issues
- `GitHubIssue` - Complete issue data structure
- `GitHubComment` - Issue comment data
- `IssueFilter` - Filter type (all/open/closed)

### Pull Requests
- `GitHubPullRequest` - Full PR data
- `GitHubReview` - Review information

### Common
- `GitHubUser` - User/author information
- `GitHubLabel` - Label data with colors
- `GitHubMilestone` - Milestone information
- `GitHubRepository` - Repository data

## Usage

### Issues Page

```tsx
import { IssuesList, IssueDetailModal } from '@/components/github';
import { GitHubIssue } from '@/types/github';

export default function IssuesPage() {
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  return (
    <>
      <IssuesList
        projectId="project-id"
        githubRepo="owner/repo"
        onViewDetails={(issue) => {
          setSelectedIssue(issue);
          setIsDetailModalOpen(true);
        }}
        onCreateTask={(issue) => {
          // Handle task creation
        }}
      />
      <IssueDetailModal
        issue={selectedIssue}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onCreateTask={(issue) => {
          // Handle task creation
        }}
      />
    </>
  );
}
```

### Pull Requests Page

```tsx
import { PrList } from '@/components/github';

export default function PRsPage() {
  const [prs, setPrs] = useState<GitHubPullRequest[]>([]);

  return <PrList prs={prs} loading={false} error={null} />;
}
```

## API Integration

PRs are fetched from `/api/github/prs` which:
1. Validates user authentication
2. Checks project access
3. Fetches PRs from linked GitHub repository
4. Enriches with review data
5. Returns formatted PR data

## Styling

Components use:
- shadcn/ui base components (Card, Badge, Avatar, Dialog)
- Tailwind CSS for styling
- lucide-react for icons
- Responsive design patterns
