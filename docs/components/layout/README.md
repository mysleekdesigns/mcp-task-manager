# Layout Components

Layout components for the Claude Tasks dashboard interface.

## Sidebar

The main navigation sidebar for the Claude Tasks application.

### Features

- **App Branding**: Displays "Claude Tasks" logo with Sparkles icon
- **Navigation Items**: 11 project-related navigation links with icons and keyboard shortcuts
- **Active State**: Visual indication with glow effect and left border indicator
- **Hover States**: Smooth transitions and background changes on hover
- **Keyboard Shortcuts**: Each nav item shows its keyboard shortcut badge
- **Claude Code Link**: Highlighted special link with gradient and glow effects
- **Settings**: Standard settings link with rotating gear icon on hover
- **New Task Button**: Prominent CTA button at the bottom with scale effects
- **Responsive**: Prepared for mobile collapse functionality (TODO)
- **Theme Support**: Uses sidebar-specific theme colors from globals.css

### Navigation Structure

| Item | Route | Icon | Shortcut |
|------|-------|------|----------|
| Kanban Board | `/dashboard/kanban` | LayoutGrid | K |
| Agent Terminals | `/dashboard/terminals` | Terminal | A |
| Insights | `/dashboard/insights` | Sparkles | N |
| Roadmap | `/dashboard/roadmap` | Map | D |
| Ideation | `/dashboard/ideation` | Lightbulb | I |
| Changelog | `/dashboard/changelog` | FileText | L |
| Context | `/dashboard/context` | Brain | C |
| MCP Overview | `/dashboard/mcp` | Wrench | M |
| Worktrees | `/dashboard/worktrees` | GitBranch | W |
| GitHub Issues | `/dashboard/github/issues` | CircleDot | G |
| GitHub PRs | `/dashboard/github/prs` | GitPullRequest | P |

### Usage

```tsx
import { Sidebar } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleNewTask = () => {
    // Open new task modal
  };

  return (
    <div className="flex h-screen">
      <Sidebar onNewTask={handleNewTask} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

### Props

```typescript
interface SidebarProps {
  onNewTask?: () => void;  // Callback when "New Task" button is clicked
  className?: string;       // Additional CSS classes
}
```

### Styling

The component uses theme colors defined in `globals.css`:

- `--sidebar`: Background color
- `--sidebar-foreground`: Text color
- `--sidebar-primary`: Primary accent color (used for active states)
- `--sidebar-accent`: Hover state background
- `--sidebar-border`: Border color
- `--sidebar-ring`: Focus ring color

All colors support both light and dark modes automatically.

### Active State Indicators

When a navigation item is active:
- Background changes to `sidebar-accent`
- Icon color changes to `sidebar-primary`
- Subtle glow shadow effect
- Left border indicator appears
- Keyboard shortcut badge gets primary color tint

### Interactive Effects

- **Hover**: Background transitions smoothly, icons remain stable
- **Focus**: Outline ring appears for keyboard navigation
- **Active/Click**: Button scales down slightly for tactile feedback
- **Claude Code Link**: Icon rotates and scales on hover
- **Settings Icon**: Rotates 90 degrees on hover
- **New Task Button**: Scales up on hover, down on click

### Accessibility

- Semantic HTML5 elements (`<aside>`, `<nav>`)
- Keyboard navigation support with focus indicators
- ARIA-compliant through Next.js Link components
- External link (Claude Code) has proper `rel` attributes

### Future Enhancements

- [ ] Mobile collapse/expand functionality
- [ ] Keyboard shortcut event handlers
- [ ] Drag-to-reorder navigation items
- [ ] Customizable navigation item visibility
- [ ] Notification badges on navigation items
- [ ] Search functionality for navigation
