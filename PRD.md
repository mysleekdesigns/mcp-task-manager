# Auto Claude - MCP Task Manager
## Product Requirements Document

---

## Implementation Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Authentication | **Complete** |
| 2 | Project Management | Pending |
| 3 | Task Management Core | Pending |
| 4 | Terminal Management | Pending |
| 5 | Git Worktree Management | Pending |
| 6 | Roadmap & Planning | Pending |
| 7 | Context & Memory | Pending |
| 8 | MCP Integration | Pending |
| 9 | GitHub Integration | Pending |
| 10 | Polish & Additional Features | Pending |

**Current Status:** Phase 1 complete. Ready to begin Phase 2 (Project Management).

---

## Overview

**Product Name:** Auto Claude
**Description:** A comprehensive MCP task manager web application for managing AI-driven development tasks with Claude Code. Enables teams to manage multiple Claude Code terminal sessions, track tasks through AI-assisted workflows, and maintain project context across sessions.

**Target Users:** Developers and teams using Claude Code for AI-assisted development

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Frontend | Next.js (App Router) | 16.x |
| Frontend | React | 19.2 |
| Frontend | TypeScript | 5.9 |
| Backend | Next.js API Routes, WebSocket Server | - |
| Database | PostgreSQL with Prisma ORM | Prisma 7.2 |
| Authentication | Auth.js (formerly NextAuth.js) | v5 |
| Styling | Tailwind CSS | 4.1 |
| Styling | shadcn/ui | latest |
| Styling | Radix UI Primitives | latest |
| Terminal | @xterm/xterm | 5.5+ |
| Terminal | node-pty | 1.1.0 |
| Git Operations | simple-git | 3.30.0 |
| Drag & Drop | @dnd-kit/core | 6.x |

---

## Phase 1: Foundation & Authentication

### 1.1 Project Setup
- [x] Initialize Next.js 16 project with TypeScript 5.9
- [x] Configure ESLint and Prettier
- [x] Set up Tailwind CSS v4
- [x] Initialize shadcn/ui and install base components
- [x] Create docker-compose.yml for PostgreSQL
- [x] Configure environment variables (.env.example)

### 1.2 Database Setup
- [x] Initialize Prisma 7.x with PostgreSQL
- [x] Create User model (id, name, email, emailVerified, image, password)
- [x] Create Account model (OAuth providers)
- [x] Create Session model
- [x] Create VerificationToken model
- [x] Run initial migration

### 1.3 Authentication
- [x] Install and configure Auth.js v5 (next-auth@5)
- [x] Set up Email provider (magic link or credentials)
- [x] Configure GitHub OAuth provider
- [x] Configure Google OAuth provider
- [x] Create `/login` page with provider buttons
- [x] Create `/register` page for email signup
- [x] Create `/verify` page for email verification
- [x] Add protected route middleware
- [x] Create auth context/hooks

### 1.4 Base Layout
- [x] Create root layout with theme provider
- [x] Build Sidebar component with navigation items:
  - [x] Kanban Board (K)
  - [x] Agent Terminals (A)
  - [x] Insights (N)
  - [x] Roadmap (D)
  - [x] Ideation (I)
  - [x] Changelog (L)
  - [x] Context (C)
  - [x] MCP Overview (M)
  - [x] Worktrees (W)
  - [x] GitHub Issues (G)
  - [x] GitHub PRs (P)
- [x] Add Claude Code link in sidebar
- [x] Add Settings link in sidebar
- [x] Create "+ New Task" button
- [x] Build Header component with project selector
- [x] Create ProjectSelector dropdown component
- [x] Build Dashboard layout with protected routes
- [x] Create UserMenu component with avatar
- [x] Create placeholder pages for all dashboard routes:
  - [x] /dashboard/kanban
  - [x] /dashboard/terminals
  - [x] /dashboard/insights
  - [x] /dashboard/roadmap
  - [x] /dashboard/ideation
  - [x] /dashboard/changelog
  - [x] /dashboard/context
  - [x] /dashboard/mcp
  - [x] /dashboard/worktrees
  - [x] /dashboard/settings
  - [x] /dashboard/github/issues
  - [x] /dashboard/github/prs

**Phase 1 Complete** - Foundation & Authentication fully implemented.

---

## Phase 2: Project Management

### 2.1 Database Models
- [ ] Create Project model (id, name, description, targetPath, githubRepo)
- [ ] Create ProjectMember model with roles (OWNER, ADMIN, MEMBER, VIEWER)
- [ ] Add project relations to User model
- [ ] Run migration

### 2.2 Project CRUD
- [ ] Create `/api/projects` route (GET, POST)
- [ ] Create `/api/projects/[id]` route (GET, PUT, DELETE)
- [ ] Create `/api/projects/[id]/members` route for team management

### 2.3 Project UI
- [ ] Build "Create Project" modal/page
  - [ ] Local directory selector input
  - [ ] GitHub repo URL input with clone option
  - [ ] Project name and description fields
- [ ] Create project dashboard/home page
- [ ] Build project settings page
  - [ ] Edit name/description
  - [ ] Update paths
  - [ ] Danger zone (delete)
- [ ] Create team member management UI
  - [ ] Invite by email
  - [ ] Role assignment dropdown
  - [ ] Remove member

---

## Phase 3: Task Management Core

### 3.1 Database Models
- [ ] Create Task model (id, title, description, branchName, status, priority, tags)
- [ ] Create TaskStatus enum (PENDING, PLANNING, IN_PROGRESS, AI_REVIEW, HUMAN_REVIEW, COMPLETED, CANCELLED)
- [ ] Create Priority enum (LOW, MEDIUM, HIGH, URGENT)
- [ ] Create TaskPhase model (id, name, status, model, startedAt, endedAt)
- [ ] Create PhaseStatus enum (PENDING, RUNNING, COMPLETED, FAILED)
- [ ] Create TaskLog model (id, type, message, metadata, createdAt)
- [ ] Create TaskFile model (id, path, action)
- [ ] Add subtask self-relation on Task
- [ ] Add assignee relation to User
- [ ] Run migration

### 3.2 Task API
- [ ] Create `/api/tasks` route (GET with filters, POST)
- [ ] Create `/api/tasks/[id]` route (GET, PUT, DELETE)
- [ ] Create `/api/tasks/[id]/phases` route
- [ ] Create `/api/tasks/[id]/logs` route
- [ ] Create `/api/tasks/[id]/subtasks` route

### 3.3 Kanban Board
- [ ] Create `/kanban` page
- [ ] Build KanbanBoard component with columns:
  - [ ] Planning
  - [ ] In Progress
  - [ ] AI Review
  - [ ] Human Review
  - [ ] (Completed - optional/collapsible)
- [ ] Implement drag-and-drop with @dnd-kit/core
- [ ] Build KanbanColumn component
  - [ ] Column header with count
  - [ ] "+ Add" button
  - [ ] Droppable area
- [ ] Build TaskCard component
  - [ ] Title and description preview
  - [ ] Status badge (Pending, Running)
  - [ ] Tag badges (Feature, Bug, Trivial)
  - [ ] Phase progress indicator (Plan → Code → QA)
  - [ ] Time ago indicator
  - [ ] Start/Stop button
  - [ ] Menu button (⋮)
- [ ] Add "Refresh Tasks" button

### 3.4 Task Detail Modal
- [ ] Build TaskModal component
- [ ] Create modal header:
  - [ ] Editable title
  - [ ] Branch name badge
  - [ ] Status badge
  - [ ] Edit (pencil) button
  - [ ] Close (X) button
- [ ] Create tab navigation:
  - [ ] Overview tab
  - [ ] Subtasks tab with count
  - [ ] Logs tab
  - [ ] Files tab
- [ ] Build Overview tab content:
  - [ ] Description editor
  - [ ] Assignee selector
  - [ ] Priority selector
  - [ ] Tags input
- [ ] Build Subtasks tab:
  - [ ] Subtask list
  - [ ] Add subtask form
- [ ] Build Logs tab:
  - [ ] Collapsible phase sections (Planning, Coding, Validation)
  - [ ] Phase header with entry count, model badge, status
  - [ ] Log entries with timestamps
  - [ ] Log entry types (phase_start, file_read, ai_response, etc.)
  - [ ] "Show output" expandable sections
- [ ] Build Files tab:
  - [ ] List of modified files
  - [ ] File action indicators (created, modified, deleted)
- [ ] Add action buttons:
  - [ ] Delete Task
  - [ ] Stop Task (when running)
  - [ ] Close

### 3.5 New Task Flow
- [ ] Create "New Task" modal/drawer
- [ ] Add title input
- [ ] Add description textarea
- [ ] Add priority selector
- [ ] Add tags input
- [ ] Add "Create and Start" vs "Create" options

---

## Phase 4: Terminal Management

### 4.1 WebSocket Server
- [ ] Create custom server entry (`server/index.ts`)
- [ ] Implement WebSocket server (`server/ws.ts`)
- [ ] Define terminal message protocol (create, input, resize, close)
- [ ] Add authentication to WebSocket connections
- [ ] Implement terminal session management

### 4.2 Process Management
- [ ] Install node-pty (handle native compilation)
- [ ] Create TerminalManager class
- [ ] Implement spawn method for Claude CLI
- [ ] Handle input/output streaming
- [ ] Implement process cleanup on disconnect
- [ ] Add terminal resize handling

### 4.3 Database Models
- [ ] Create Terminal model (id, name, status, pid, projectId, worktreeId)
- [ ] Run migration

### 4.4 Terminal API
- [ ] Create `/api/terminals` route (GET, POST)
- [ ] Create `/api/terminals/[id]` route (GET, DELETE)

### 4.5 Terminal UI
- [ ] Create `/terminals` page
- [ ] Build TerminalGrid component
  - [ ] 2x2 default layout
  - [ ] Support for 3x4 (12 terminals)
  - [ ] Responsive grid
- [ ] Build TerminalPane component
  - [ ] Header with terminal name
  - [ ] "Claude" button/indicator
  - [ ] Worktree selector dropdown
  - [ ] Expand button
  - [ ] Close (X) button
  - [ ] Status indicator (green dot)
- [ ] Integrate @xterm/xterm
  - [ ] Install @xterm/xterm and @xterm/addon-fit
  - [ ] Create XTerm wrapper component
  - [ ] Connect to WebSocket
  - [ ] Handle resize events
- [ ] Build terminal controls bar:
  - [ ] Terminal count indicator (e.g., "4 / 12 terminals")
  - [ ] "Invoke Claude All" button
  - [ ] "+ New Terminal" button
  - [ ] "Files" toggle/button

### 4.6 Invoke Claude All
- [ ] Create command input modal/bar
- [ ] Implement broadcast to all active terminals
- [ ] Show execution status per terminal

---

## Phase 5: Git Worktree Management

### 5.1 Database Models
- [ ] Create Worktree model (id, name, path, branch, isMain, projectId)
- [ ] Add worktree relation to Terminal
- [ ] Run migration

### 5.2 Git Operations
- [ ] Create `lib/git.ts` utility
- [ ] Implement worktree list function
- [ ] Implement worktree add function
- [ ] Implement worktree remove function
- [ ] Add branch listing function
- [ ] Handle git errors gracefully

### 5.3 Worktree API
- [ ] Create `/api/worktrees` route (GET, POST)
- [ ] Create `/api/worktrees/[id]` route (GET, DELETE)
- [ ] Create `/api/projects/[id]/branches` route

### 5.4 Worktree UI
- [ ] Create `/worktrees` page
- [ ] Build WorktreeList component
  - [ ] Table/card view of worktrees
  - [ ] Branch name
  - [ ] Path
  - [ ] Main indicator
  - [ ] Terminal count using this worktree
- [ ] Build WorktreeForm component
  - [ ] Branch selector
  - [ ] Custom path input
  - [ ] Create button
- [ ] Add worktree deletion with confirmation
- [ ] Build worktree selector for terminals (dropdown)

---

## Phase 6: Roadmap & Planning

### 6.1 Database Models
- [ ] Create Phase model (id, name, description, order, status, projectId)
- [ ] Create Feature model (id, title, description, priority, status)
- [ ] Create MoscowPriority enum (MUST, SHOULD, COULD, WONT)
- [ ] Create Milestone model (id, title, completed, phaseId)
- [ ] Run migration

### 6.2 Roadmap API
- [ ] Create `/api/phases` route (GET, POST)
- [ ] Create `/api/phases/[id]` route (GET, PUT, DELETE)
- [ ] Create `/api/features` route (GET, POST)
- [ ] Create `/api/features/[id]` route (GET, PUT, DELETE)
- [ ] Create `/api/milestones` route

### 6.3 Roadmap UI
- [ ] Create `/roadmap` page
- [ ] Build project header:
  - [ ] Project name with status badge
  - [ ] Competitor analysis link
  - [ ] Description
  - [ ] Target audience
  - [ ] Stats (features, phases, priority breakdown)
- [ ] Build view tabs:
  - [ ] Kanban
  - [ ] Phases (default)
  - [ ] All Features
  - [ ] By Priority
- [ ] Build PhaseCard component:
  - [ ] Phase number and name
  - [ ] Description
  - [ ] Status badge (planned, active, completed)
  - [ ] Progress bar
  - [ ] Milestones section with checkboxes
  - [ ] Features list
- [ ] Build FeatureItem component:
  - [ ] MoSCoW priority badge (must, should, could, won't)
  - [ ] Feature title
  - [ ] "Build" button to create task
- [ ] Add "+ Add Feature" button

---

## Phase 7: Context & Memory

### 7.1 Database Models
- [ ] Create Memory model (id, type, title, content, metadata, projectId, createdAt)
- [ ] Define memory types (session, pr_review, codebase, pattern, gotcha)
- [ ] Run migration

### 7.2 Memory API
- [ ] Create `/api/memories` route (GET with filters, POST)
- [ ] Create `/api/memories/[id]` route (GET, DELETE)
- [ ] Create `/api/memories/search` route

### 7.3 Context UI
- [ ] Create `/context` page
- [ ] Build tab navigation:
  - [ ] Project Index
  - [ ] Memories
- [ ] Build Project Index tab (TBD - codebase overview)
- [ ] Build Memories tab:
  - [ ] Graph Memory Status card (Graphiti integration placeholder)
  - [ ] Search Memories input
  - [ ] Memory Browser with filter chips:
    - [ ] All
    - [ ] PR Reviews
    - [ ] Sessions
    - [ ] Codebase
    - [ ] Patterns
    - [ ] Gotchas
  - [ ] Memory count indicator
- [ ] Build MemoryCard component:
  - [ ] Type badge (Session Insight, etc.)
  - [ ] Title
  - [ ] Timestamp
  - [ ] Expand/collapse button
  - [ ] Content preview / full content

### 7.4 Session Insight Capture
- [ ] Hook into terminal session end
- [ ] Parse Claude conversation for insights
- [ ] Auto-create memory entries
- [ ] Tag with session metadata

---

## Phase 8: MCP Integration

### 8.1 Database Models
- [ ] Create McpConfig model (id, name, type, enabled, config, projectId)
- [ ] Run migration

### 8.2 MCP API
- [ ] Create `/api/mcp` route (GET, POST)
- [ ] Create `/api/mcp/[id]` route (PUT, DELETE)

### 8.3 MCP UI
- [ ] Create `/mcp` page
- [ ] Build MCP Server Overview header:
  - [ ] Project name
  - [ ] Enabled server count
  - [ ] Description
- [ ] Build McpServerList component with categories:
  - [ ] Documentation (Context7)
  - [ ] Knowledge graphs (Graphiti Memory)
  - [ ] Integrations (Linear)
  - [ ] Browser Automation (Electron, Puppeteer)
  - [ ] Built-in (Auto-Claude Tools)
- [ ] Build McpServerItem component:
  - [ ] Icon
  - [ ] Name
  - [ ] Description
  - [ ] Toggle switch
- [ ] Build Custom Servers section:
  - [ ] List of custom servers
  - [ ] "+ Add Custom Server" button
- [ ] Create Add/Edit Custom Server modal:
  - [ ] Name input
  - [ ] Type selector
  - [ ] Configuration JSON editor
  - [ ] Save/Cancel buttons

---

## Phase 9: GitHub Integration

### 9.1 GitHub API Setup
- [ ] Create `lib/github.ts` utility
- [ ] Use GitHub OAuth token from NextAuth
- [ ] Implement issues fetch
- [ ] Implement PRs fetch
- [ ] Implement issue/PR detail fetch

### 9.2 GitHub Issues UI
- [ ] Create `/github/issues` page
- [ ] Build IssuesList component
- [ ] Build IssueCard component:
  - [ ] Title
  - [ ] Issue number
  - [ ] State (open/closed)
  - [ ] Labels
  - [ ] Assignees
  - [ ] Created date
- [ ] Add "Create Task from Issue" action
- [ ] Build IssueDetail modal/page

### 9.3 GitHub PRs UI
- [ ] Create `/github/prs` page
- [ ] Build PrList component
- [ ] Build PrCard component:
  - [ ] Title
  - [ ] PR number
  - [ ] State (open/merged/closed)
  - [ ] Branch info
  - [ ] Review status
  - [ ] Created date
- [ ] Build PrDetail modal/page

---

## Phase 10: Polish & Additional Features

### 10.1 Insights Dashboard
- [ ] Create `/insights` page
- [ ] Build task completion metrics
- [ ] Add time tracking visualizations
- [ ] Show productivity trends
- [ ] Display model usage stats

### 10.2 Ideation Board
- [ ] Create `/ideation` page
- [ ] Build simple idea capture interface
- [ ] Add idea to feature conversion
- [ ] Implement idea voting/prioritization

### 10.3 Changelog
- [ ] Create `/changelog` page
- [ ] Auto-generate from completed tasks
- [ ] Group by date/version
- [ ] Support manual entries

### 10.4 Settings
- [ ] Create `/settings` page
- [ ] Build User Profile section:
  - [ ] Avatar
  - [ ] Name
  - [ ] Email
- [ ] Build API Keys section:
  - [ ] Claude API key (encrypted storage)
  - [ ] GitHub token management
- [ ] Build Preferences section:
  - [ ] Default terminal count
  - [ ] Theme preference
  - [ ] Keyboard shortcuts

### 10.5 Theme Support
- [ ] Implement dark/light mode toggle
- [ ] Persist theme preference
- [ ] Apply theme to all components
- [ ] Ensure proper contrast ratios

---

## File Structure

```
mcp-task-manager/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   └── _actions/auth-actions.ts
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── kanban/page.tsx
│   │   │   ├── terminals/page.tsx
│   │   │   ├── roadmap/page.tsx
│   │   │   ├── context/page.tsx
│   │   │   ├── mcp/page.tsx
│   │   │   ├── worktrees/page.tsx
│   │   │   ├── insights/page.tsx
│   │   │   ├── ideation/page.tsx
│   │   │   ├── changelog/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── github/
│   │   │       ├── issues/page.tsx
│   │   │       └── prs/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── tasks/route.ts
│   │       ├── projects/route.ts
│   │       ├── terminals/route.ts
│   │       ├── worktrees/route.ts
│   │       ├── phases/route.ts
│   │       ├── features/route.ts
│   │       ├── memories/route.ts
│   │       └── mcp/route.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── layout/              # Sidebar, Header, ProjectSelector, UserMenu
│   │   └── providers/           # AuthProvider, ThemeProvider
│   ├── lib/
│   │   ├── auth.ts              # Auth.js configuration with providers
│   │   ├── auth.config.ts       # Edge-compatible auth config
│   │   ├── db.ts                # Prisma client instance
│   │   └── utils.ts             # Utility functions (cn, etc.)
│   ├── hooks/
│   │   ├── index.ts
│   │   └── use-auth.ts          # Auth hooks
│   └── types/
│       ├── index.ts
│       └── next-auth.d.ts       # Auth.js type extensions
├── prisma/
│   ├── schema.prisma
│   ├── prisma.config.ts
│   └── migrations/
├── public/
├── .env.example
├── package.json
├── docker-compose.yml
└── README.md
```

---

## Database Schema

```prisma
// Authentication
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]
  projects      ProjectMember[]
  assignedTasks Task[]    @relation("AssignedTasks")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// Projects
model Project {
  id          String          @id @default(cuid())
  name        String
  description String?
  targetPath  String?
  githubRepo  String?
  members     ProjectMember[]
  tasks       Task[]
  features    Feature[]
  phases      Phase[]
  terminals   Terminal[]
  memories    Memory[]
  mcpConfigs  McpConfig[]
  worktrees   Worktree[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model ProjectMember {
  id        String      @id @default(cuid())
  role      ProjectRole @default(MEMBER)
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  projectId String
  project   Project     @relation(fields: [projectId], references: [id])
  createdAt DateTime    @default(now())
  @@unique([userId, projectId])
}

enum ProjectRole { OWNER ADMIN MEMBER VIEWER }

// Git Worktrees
model Worktree {
  id        String     @id @default(cuid())
  name      String
  path      String
  branch    String
  isMain    Boolean    @default(false)
  projectId String
  project   Project    @relation(fields: [projectId], references: [id])
  terminals Terminal[]
  createdAt DateTime   @default(now())
}

// Tasks
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  branchName  String?
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  tags        String[]
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id])
  assigneeId  String?
  assignee    User?      @relation("AssignedTasks", fields: [assigneeId], references: [id])
  phases      TaskPhase[]
  logs        TaskLog[]
  files       TaskFile[]
  subtasks    Task[]     @relation("Subtasks")
  parentId    String?
  parent      Task?      @relation("Subtasks", fields: [parentId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus { PENDING PLANNING IN_PROGRESS AI_REVIEW HUMAN_REVIEW COMPLETED CANCELLED }
enum Priority { LOW MEDIUM HIGH URGENT }

model TaskPhase {
  id        String      @id @default(cuid())
  name      String
  status    PhaseStatus @default(PENDING)
  model     String?
  taskId    String
  task      Task        @relation(fields: [taskId], references: [id])
  logs      TaskLog[]
  startedAt DateTime?
  endedAt   DateTime?
}

enum PhaseStatus { PENDING RUNNING COMPLETED FAILED }

model TaskLog {
  id        String     @id @default(cuid())
  type      String
  message   String
  metadata  Json?
  taskId    String
  task      Task       @relation(fields: [taskId], references: [id])
  phaseId   String?
  phase     TaskPhase? @relation(fields: [phaseId], references: [id])
  createdAt DateTime   @default(now())
}

model TaskFile {
  id        String   @id @default(cuid())
  path      String
  action    String
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  createdAt DateTime @default(now())
}

// Terminals
model Terminal {
  id         String    @id @default(cuid())
  name       String
  status     String    @default("idle")
  pid        Int?
  projectId  String
  project    Project   @relation(fields: [projectId], references: [id])
  worktreeId String?
  worktree   Worktree? @relation(fields: [worktreeId], references: [id])
  createdAt  DateTime  @default(now())
}

// Roadmap
model Phase {
  id          String      @id @default(cuid())
  name        String
  description String?
  order       Int
  status      String      @default("planned")
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id])
  features    Feature[]
  milestones  Milestone[]
}

model Feature {
  id          String         @id @default(cuid())
  title       String
  description String?
  priority    MoscowPriority
  status      String         @default("planned")
  projectId   String
  project     Project        @relation(fields: [projectId], references: [id])
  phaseId     String?
  phase       Phase?         @relation(fields: [phaseId], references: [id])
  createdAt   DateTime       @default(now())
}

enum MoscowPriority { MUST SHOULD COULD WONT }

model Milestone {
  id        String  @id @default(cuid())
  title     String
  completed Boolean @default(false)
  phaseId   String
  phase     Phase   @relation(fields: [phaseId], references: [id])
}

// Memory
model Memory {
  id        String   @id @default(cuid())
  type      String
  title     String
  content   String
  metadata  Json?
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  createdAt DateTime @default(now())
}

// MCP
model McpConfig {
  id        String  @id @default(cuid())
  name      String
  type      String
  enabled   Boolean @default(false)
  config    Json?
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
}
```

---

## Verification Checklist

### Phase 1 - Foundation (Complete)
- [x] `npm run dev` starts successfully
- [x] Login page renders with Email, GitHub, Google buttons
- [x] User can register with email
- [x] OAuth login works for all providers
- [x] Authenticated user redirected to dashboard
- [x] Sidebar navigation functional
- [x] Header with project selector displays
- [x] Dashboard layout renders with Sidebar and Header
- [x] Protected routes redirect unauthenticated users

### Phase 2 - Projects
- [ ] Can create project from local directory
- [ ] Can create project by cloning GitHub repo
- [ ] Project settings update correctly
- [ ] Can invite team members
- [ ] Project selector switches context

### Phase 3 - Tasks
- [ ] Kanban board displays all columns
- [ ] Tasks can be created via modal
- [ ] Drag and drop updates task status
- [ ] Task detail modal shows all tabs
- [ ] Phase tracking updates in real-time
- [ ] Task logs display correctly

### Phase 4 - Terminals
- [ ] Terminal grid renders
- [ ] New terminal spawns Claude CLI
- [ ] @xterm/xterm displays output correctly
- [ ] Input is sent to terminal process
- [ ] "Invoke Claude All" broadcasts command
- [ ] Terminal close cleans up process

### Phase 5 - Worktrees
- [ ] Worktree list shows existing worktrees
- [ ] Can create new worktree from branch
- [ ] Worktree selector in terminal works
- [ ] Can delete worktree with confirmation

### Phase 6 - Roadmap
- [ ] Phases display in order
- [ ] Features show with priority badges
- [ ] Milestones can be checked/unchecked
- [ ] "Build" creates task from feature
- [ ] View tabs switch correctly

### Phase 7 - Memory
- [ ] Memory browser displays memories
- [ ] Search filters results
- [ ] Type filters work
- [ ] Memory cards expand/collapse
- [ ] Session insights auto-captured

### Phase 8 - MCP
- [ ] MCP servers list displays
- [ ] Toggle enables/disables servers
- [ ] Custom server can be added
- [ ] Config persists to database

### End-to-End
- [ ] Full workflow: Login → Project → Task → Terminal → Claude → Complete → Review
