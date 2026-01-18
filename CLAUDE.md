# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Auto Claude** is a Next.js web application for managing AI-driven development tasks with Claude Code. It enables managing multiple Claude Code terminal sessions, tracking tasks through AI-assisted workflows, and maintaining project context across sessions.

**Status:** Pre-implementation. The PRD.md contains the complete specification. Follow the 10-phase implementation plan in order.

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19.2, TypeScript 5.9
- **Backend:** Next.js API Routes, WebSocket Server
- **Database:** PostgreSQL with Prisma ORM 7.2
- **Auth:** Auth.js (NextAuth) v5
- **Styling:** Tailwind CSS 4.1, shadcn/ui, Radix UI
- **Terminal:** @xterm/xterm 5.5+, node-pty 1.1.0
- **Git:** simple-git 3.30.0
- **Drag & Drop:** @dnd-kit/core 6.x

## Build Commands

Once initialized, the expected commands are:
```bash
npm run dev              # Start development server
npm run build            # Production build
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio
docker compose up -d     # Start PostgreSQL
npm test                 # Run tests
npm run lint             # Run ESLint
```

## Architecture

### Route Structure (Next.js 16 App Router)
- `src/app/(auth)/` - Authentication routes (login, register, verify)
- `src/app/(dashboard)/` - Main app routes (kanban, terminals, roadmap, context, mcp, worktrees, github, settings)
- `src/app/api/` - RESTful API endpoints
- `server/` - Custom WebSocket server for terminal I/O

### Key Database Models (see PRD.md for full schema)
- **User/Account/Session** - Auth.js authentication
- **Project/ProjectMember** - Project management with roles (OWNER, ADMIN, MEMBER, VIEWER)
- **Task/TaskPhase/TaskLog/TaskFile** - Task tracking with phase workflow (Plan → Code → QA)
- **Terminal/Worktree** - Terminal sessions and git worktree management
- **Phase/Feature/Milestone** - Roadmap planning with MoSCoW priorities
- **Memory** - Context storage for sessions, PR reviews, patterns, gotchas
- **McpConfig** - MCP server configurations

### Task Status Flow
PENDING → PLANNING → IN_PROGRESS → AI_REVIEW → HUMAN_REVIEW → COMPLETED/CANCELLED

### Component Organization
Components are organized by feature area under `src/components/`:
- `ui/` - shadcn/ui base components
- `kanban/` - Kanban board components (KanbanBoard, KanbanColumn, TaskCard)
- `terminal/` - Terminal and xterm components (TerminalGrid, TerminalPane, XTermWrapper)
- `task/` - Task modal and card components
- Each feature area (roadmap, memory, mcp, github, worktree) has its own directory

## Implementation Phases

1. **Foundation & Authentication** - Next.js setup, Auth.js, base layout with sidebar
2. **Project Management** - Project CRUD, team members
3. **Task Management Core** - Kanban board, task modal with tabs, drag-and-drop
4. **Terminal Management** - WebSocket server, node-pty, xterm integration, "Invoke Claude All"
5. **Git Worktree Management** - simple-git operations, worktree CRUD
6. **Roadmap & Planning** - Phases, features, milestones with MoSCoW priorities
7. **Context & Memory** - Session insights, memory browser
8. **MCP Integration** - MCP server configuration UI
9. **GitHub Integration** - Issues and PRs sync
10. **Polish** - Insights dashboard, ideation, changelog, settings, themes

## Available Subagents

Specialized agents for specific development tasks (see `.claude/agents/`):

| Agent | Description | Use When |
|-------|-------------|----------|
| `nextjs-setup` | Next.js 16 project initialization | Setting up project, configuring routing |
| `prisma-database` | Prisma schema and migrations | Creating models, running migrations |
| `auth-setup` | Auth.js v5 authentication | Implementing login, OAuth, sessions |
| `ui-components` | shadcn/ui with Tailwind CSS v4 | Building UI components, layouts |
| `kanban-dnd` | @dnd-kit drag-and-drop | Kanban board, task sorting |
| `terminal-manager` | xterm.js and node-pty | Terminal UI, WebSocket, processes |
| `git-worktree` | simple-git worktree ops | Git operations, branch management |
| `api-routes` | Next.js API routes | REST endpoints, validation |
| `testing` | Vitest and Testing Library | Writing and running tests |

## Available Skills

Quick commands for common operations (see `.claude/skills/`):

| Skill | Description | Command |
|-------|-------------|---------|
| `prisma-migrate` | Run database migrations | `/prisma-migrate add_user_model` |
| `shadcn-add` | Add shadcn/ui components | `/shadcn-add button card dialog` |
| `git-commit` | Conventional commits | `/git-commit` |
| `run-dev` | Start dev environment | `/run-dev` |
| `db-seed` | Seed database | `/db-seed` |
| `lint-fix` | Fix linting issues | `/lint-fix` |

## Key Patterns

### API Route Pattern
```typescript
// Always validate with Zod, check auth, return consistent errors
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data = schema.parse(body);
  // ... implementation
}
```

### Component Pattern
```tsx
// Use shadcn/ui components, server components by default
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export function FeatureCard({ data }) {
  return (
    <Card>
      <CardHeader>{data.title}</CardHeader>
      <CardContent>{data.content}</CardContent>
    </Card>
  )
}
```

### Database Pattern
```typescript
// Use Prisma with includes for relations
const task = await prisma.task.findUnique({
  where: { id },
  include: {
    assignee: { select: { id: true, name: true, image: true } },
    phases: true,
    _count: { select: { subtasks: true } },
  },
});
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auto_claude?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
GITHUB_ID=<github-oauth-client-id>
GITHUB_SECRET=<github-oauth-client-secret>
GOOGLE_ID=<google-oauth-client-id>
GOOGLE_SECRET=<google-oauth-client-secret>
```

## Coding Standards

- Use TypeScript strict mode, avoid `any`
- Use path aliases (`@/` for `src/`)
- Follow conventional commits (feat, fix, docs, etc.)
- Use Zod for API validation
- Use server components by default
- Colocate styles with Tailwind classes
