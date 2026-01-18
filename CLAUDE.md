# Auto Claude

Next.js app for managing AI-driven development tasks with Claude Code. Manages terminal sessions, tracks tasks through AI workflows, and maintains project context.

**Status:** Pre-implementation. See `PRD.md` for full specification and 10-phase implementation plan.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Backend | Next.js API Routes, WebSocket Server |
| Database | PostgreSQL, Prisma ORM |
| Auth | Auth.js v5 |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Terminal | @xterm/xterm, node-pty |
| Git | simple-git |
| DnD | @dnd-kit/core |

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npm test                 # Tests
npm run lint             # Linting
npx prisma migrate dev   # Migrations
npx prisma studio        # DB browser
docker compose up -d     # Start PostgreSQL
```

## Architecture

```
src/app/
├── (auth)/           # Login, register, verify
├── (dashboard)/      # Kanban, terminals, roadmap, context, mcp, worktrees, github, settings
└── api/              # REST endpoints

src/components/
├── ui/               # shadcn/ui base
├── kanban/           # Board, columns, cards
├── terminal/         # Grid, pane, xterm wrapper
└── [feature]/        # Feature-specific components

server/               # WebSocket server for terminal I/O
```

### Task Flow

```
PENDING → PLANNING → IN_PROGRESS → AI_REVIEW → HUMAN_REVIEW → COMPLETED
                                                            ↘ CANCELLED
```

### Key Models

See `PRD.md` for full schema. Core models: User, Project, Task (with phases: Plan→Code→QA), Terminal, Worktree, Memory, McpConfig.

## Agents

Specialized agents in `.claude/agents/`:

| Agent | Purpose |
|-------|---------|
| `nextjs-setup` | Project initialization, routing |
| `prisma-database` | Schema, migrations |
| `auth-setup` | Auth.js, OAuth, sessions |
| `ui-components` | shadcn/ui, Tailwind |
| `kanban-dnd` | Drag-and-drop board |
| `terminal-manager` | xterm, WebSocket, pty |
| `git-worktree` | Git operations |
| `api-routes` | REST endpoints, Zod |
| `testing` | Vitest, Testing Library |

## Skills

Quick commands in `.claude/skills/`:

| Command | Purpose |
|---------|---------|
| `/prisma-migrate <name>` | Run migration |
| `/shadcn-add <components>` | Add UI components |
| `/git-commit` | Conventional commit |
| `/run-dev` | Start dev environment |
| `/db-seed` | Seed database |
| `/lint-fix` | Fix lint issues |

## Patterns

### API Routes
```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = schema.parse(await request.json());
  // implementation
}
```

### Prisma Queries
```typescript
const task = await prisma.task.findUnique({
  where: { id },
  include: { assignee: true, phases: true, _count: { select: { subtasks: true } } },
});
```

## Environment

Required `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auto_claude"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
GITHUB_ID=<client-id>
GITHUB_SECRET=<client-secret>
GOOGLE_ID=<client-id>
GOOGLE_SECRET=<client-secret>
```

## Standards

- TypeScript strict mode, no `any`
- Path alias: `@/` → `src/`
- Conventional commits
- Zod for API validation
- Server components by default
- Tailwind for styling
