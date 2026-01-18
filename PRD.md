# Auto Claude - MCP Task Manager
## Product Requirements Document

---

## Implementation Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Authentication | **Complete** |
| 2 | Project Management | **Complete** |
| 3 | Task Management Core | **Complete** |
| 4 | Terminal Management | **Complete** |
| 5 | Git Worktree Management | **Complete** |
| 6 | Roadmap & Planning | **Complete** |
| 7 | Context & Memory | **Complete** |
| 8 | MCP Integration | Pending |
| 9 | GitHub Integration | Pending |
| 10 | Polish & Additional Features | Pending |

**Current Status:** Phase 7 complete. Ready to begin Phase 8 (MCP Integration).

**Recent Updates:**
- Fixed sidebar layout: Changed sidebar to fixed positioning to eliminate excessive right-side spacing in dashboard

**Branches:**
- `main` - Production-ready code
- `development` - Active development (current)

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
- [x] Create Project model (id, name, description, targetPath, githubRepo)
- [x] Create ProjectMember model with roles (OWNER, ADMIN, MEMBER, VIEWER)
- [x] Add project relations to User model
- [x] Run migration

### 2.2 Project CRUD
- [x] Create `/api/projects` route (GET, POST)
- [x] Create `/api/projects/[id]` route (GET, PUT, DELETE)
- [x] Create `/api/projects/[id]/members` route for team management

### 2.3 Project UI
- [x] Build "Create Project" modal/page
  - [x] Local directory selector input
  - [x] GitHub repo URL input with clone option
  - [x] Project name and description fields
- [x] Create project dashboard/home page
- [x] Build project settings page
  - [x] Edit name/description
  - [x] Update paths
  - [x] Danger zone (delete)
- [x] Create team member management UI
  - [x] Invite by email
  - [x] Role assignment dropdown
  - [x] Remove member

**Phase 2 Complete** - Project Management fully implemented.

---

## Phase 3: Task Management Core

### 3.1 Database Models
- [x] Create Task model (id, title, description, branchName, status, priority, tags)
- [x] Create TaskStatus enum (PENDING, PLANNING, IN_PROGRESS, AI_REVIEW, HUMAN_REVIEW, COMPLETED, CANCELLED)
- [x] Create Priority enum (LOW, MEDIUM, HIGH, URGENT)
- [x] Create TaskPhase model (id, name, status, model, startedAt, endedAt)
- [x] Create PhaseStatus enum (PENDING, RUNNING, COMPLETED, FAILED)
- [x] Create TaskLog model (id, type, message, metadata, createdAt)
- [x] Create TaskFile model (id, path, action)
- [x] Add subtask self-relation on Task
- [x] Add assignee relation to User
- [x] Run migration

### 3.2 Task API
- [x] Create `/api/tasks` route (GET with filters, POST)
- [x] Create `/api/tasks/[id]` route (GET, PUT, PATCH, DELETE)
- [x] Create `/api/tasks/[id]/phases` route
- [x] Create `/api/tasks/[id]/logs` route
- [x] Create `/api/tasks/[id]/subtasks` route
- [x] Create `/api/tasks/[id]/start` route
- [x] Create `/api/tasks/[id]/stop` route
- [x] Create `/api/projects/[id]/tasks` route

### 3.3 Kanban Board
- [x] Create `/kanban` page
- [x] Build KanbanBoard component with columns:
  - [x] Planning
  - [x] In Progress
  - [x] AI Review
  - [x] Human Review
  - [x] (Completed - optional/collapsible)
- [x] Implement drag-and-drop with @dnd-kit/core
- [x] Build KanbanColumn component
  - [x] Column header with count
  - [x] "+ Add" button
  - [x] Droppable area
- [x] Build TaskCard component
  - [x] Title and description preview
  - [x] Status badge (Pending, Running)
  - [x] Tag badges (Feature, Bug, Trivial)
  - [x] Phase progress indicator (Plan → Code → QA)
  - [x] Time ago indicator
  - [x] Start/Stop button
  - [x] Menu button (⋮)
- [x] Add "Refresh Tasks" button

### 3.4 Task Detail Modal
- [x] Build TaskModal component
- [x] Create modal header:
  - [x] Editable title
  - [x] Branch name badge
  - [x] Status badge
  - [x] Edit (pencil) button
  - [x] Close (X) button
- [x] Create tab navigation:
  - [x] Overview tab
  - [x] Subtasks tab with count
  - [x] Logs tab
  - [x] Files tab
- [x] Build Overview tab content:
  - [x] Description editor
  - [x] Assignee selector
  - [x] Priority selector
  - [x] Tags input
- [x] Build Subtasks tab:
  - [x] Subtask list
  - [x] Add subtask form
- [x] Build Logs tab:
  - [x] Collapsible phase sections (Planning, Coding, Validation)
  - [x] Phase header with entry count, model badge, status
  - [x] Log entries with timestamps
  - [x] Log entry types (phase_start, file_read, ai_response, etc.)
  - [x] "Show output" expandable sections
- [x] Build Files tab:
  - [x] List of modified files
  - [x] File action indicators (created, modified, deleted)
- [x] Add action buttons:
  - [x] Delete Task
  - [x] Stop Task (when running)
  - [x] Close

### 3.5 New Task Flow
- [x] Create "New Task" modal/drawer
- [x] Add title input
- [x] Add description textarea
- [x] Add priority selector
- [x] Add tags input
- [x] Add "Create and Start" vs "Create" options

**Phase 3 Complete** - Task Management Core fully implemented.

---

## Phase 4: Terminal Management

### 4.1 WebSocket Server
- [x] Create custom server entry (`server/index.ts`)
- [x] Implement WebSocket server (`server/ws.ts`)
- [x] Define terminal message protocol (create, input, resize, close)
- [x] Add authentication to WebSocket connections
- [x] Implement terminal session management

### 4.2 Process Management
- [x] Install node-pty (handle native compilation)
- [x] Create TerminalManager class
- [x] Implement spawn method for Claude CLI
- [x] Handle input/output streaming
- [x] Implement process cleanup on disconnect
- [x] Add terminal resize handling

### 4.3 Database Models
- [x] Create Terminal model (id, name, status, pid, projectId, worktreeId)
- [x] Run migration

### 4.4 Terminal API
- [x] Create `/api/terminals` route (GET, POST)
- [x] Create `/api/terminals/[id]` route (GET, DELETE)

### 4.5 Terminal UI
- [x] Create `/terminals` page
- [x] Build TerminalGrid component
  - [x] 2x2 default layout
  - [x] Support for 3x4 (12 terminals)
  - [x] Responsive grid
- [x] Build TerminalPane component
  - [x] Header with terminal name
  - [x] "Claude" button/indicator
  - [x] Worktree selector dropdown
  - [x] Expand button
  - [x] Close (X) button
  - [x] Status indicator (green dot)
- [x] Integrate @xterm/xterm
  - [x] Install @xterm/xterm and @xterm/addon-fit
  - [x] Create XTerm wrapper component
  - [x] Connect to WebSocket
  - [x] Handle resize events
- [x] Build terminal controls bar:
  - [x] Terminal count indicator (e.g., "4 / 12 terminals")
  - [x] "Invoke Claude All" button
  - [x] "+ New Terminal" button
  - [x] "Files" toggle/button

### 4.6 Invoke Claude All
- [x] Create command input modal/bar
- [x] Implement broadcast to all active terminals
- [x] Show execution status per terminal

**Phase 4 Complete** - Terminal Management fully implemented.

---

## Phase 5: Git Worktree Management

### 5.1 Database Models
- [x] Create Worktree model (id, name, path, branch, isMain, projectId)
- [x] Add worktree relation to Terminal
- [x] Run migration

### 5.2 Git Operations
- [x] Create `lib/git.ts` utility
- [x] Implement worktree list function
- [x] Implement worktree add function
- [x] Implement worktree remove function
- [x] Add branch listing function
- [x] Handle git errors gracefully

### 5.3 Worktree API
- [x] Create `/api/worktrees` route (GET, POST)
- [x] Create `/api/worktrees/[id]` route (GET, DELETE)
- [x] Create `/api/projects/[id]/branches` route

### 5.4 Worktree UI
- [x] Create `/worktrees` page
- [x] Build WorktreeList component
  - [x] Table/card view of worktrees
  - [x] Branch name
  - [x] Path
  - [x] Main indicator
  - [x] Terminal count using this worktree
- [x] Build WorktreeForm component
  - [x] Branch selector
  - [x] Custom path input
  - [x] Create button
- [x] Add worktree deletion with confirmation
- [x] Build worktree selector for terminals (dropdown)

**Phase 5 Complete** - Git Worktree Management fully implemented.

---

## Phase 6: Roadmap & Planning

### 6.1 Database Models
- [x] Create Phase model (id, name, description, order, status, projectId)
- [x] Create Feature model (id, title, description, priority, status)
- [x] Create MoscowPriority enum (MUST, SHOULD, COULD, WONT)
- [x] Create Milestone model (id, title, completed, phaseId)
- [x] Run migration

### 6.2 Roadmap API
- [x] Create `/api/phases` route (GET, POST)
- [x] Create `/api/phases/[id]` route (GET, PUT, DELETE)
- [x] Create `/api/features` route (GET, POST)
- [x] Create `/api/features/[id]` route (GET, PUT, DELETE)
- [x] Create `/api/milestones` route

### 6.3 Roadmap UI
- [x] Create `/roadmap` page
- [x] Build project header:
  - [x] Project name with status badge
  - [x] Competitor analysis link
  - [x] Description
  - [x] Target audience
  - [x] Stats (features, phases, priority breakdown)
- [x] Build view tabs:
  - [x] Kanban
  - [x] Phases (default)
  - [x] All Features
  - [x] By Priority
- [x] Build PhaseCard component:
  - [x] Phase number and name
  - [x] Description
  - [x] Status badge (planned, active, completed)
  - [x] Progress bar
  - [x] Milestones section with checkboxes
  - [x] Features list
- [x] Build FeatureItem component:
  - [x] MoSCoW priority badge (must, should, could, won't)
  - [x] Feature title
  - [x] "Build" button to create task
- [x] Add "+ Add Feature" button

**Phase 6 Complete** - Roadmap & Planning fully implemented.

---

## Phase 7: Context & Memory

### 7.1 Database Models
- [x] Create Memory model (id, type, title, content, metadata, projectId, createdAt)
- [x] Define memory types (session, pr_review, codebase, pattern, gotcha)
- [x] Run migration

### 7.2 Memory API
- [x] Create `/api/memories` route (GET with filters, POST)
- [x] Create `/api/memories/[id]` route (GET, DELETE)
- [x] Create `/api/memories/search` route

### 7.3 Context UI
- [x] Create `/context` page
- [x] Build tab navigation:
  - [x] Project Index
  - [x] Memories
- [x] Build Project Index tab (TBD - codebase overview)
- [x] Build Memories tab:
  - [x] Graph Memory Status card (Graphiti integration placeholder)
  - [x] Search Memories input
  - [x] Memory Browser with filter chips:
    - [x] All
    - [x] PR Reviews
    - [x] Sessions
    - [x] Codebase
    - [x] Patterns
    - [x] Gotchas
  - [x] Memory count indicator
- [x] Build MemoryCard component:
  - [x] Type badge (Session Insight, etc.)
  - [x] Title
  - [x] Timestamp
  - [x] Expand/collapse button
  - [x] Content preview / full content

### 7.4 Session Insight Capture
- [x] Hook into terminal session end
- [x] Parse Claude conversation for insights
- [x] Auto-create memory entries
- [x] Tag with session metadata

**Phase 7 Complete** - Context & Memory fully implemented.

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
│   │       ├── tasks/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── phases/route.ts
│   │       │       ├── logs/route.ts
│   │       │       ├── subtasks/route.ts
│   │       │       ├── start/route.ts
│   │       │       └── stop/route.ts
│   │       ├── projects/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── members/route.ts
│   │       │       └── tasks/route.ts
│   │       ├── terminals/route.ts
│   │       ├── worktrees/route.ts
│   │       ├── phases/route.ts
│   │       ├── features/route.ts
│   │       ├── memories/route.ts
│   │       └── mcp/route.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── layout/              # Sidebar, Header, ProjectSelector, UserMenu
│   │   ├── kanban/              # KanbanBoard, KanbanColumn, TaskCard
│   │   ├── task/                # TaskModal, NewTaskModal, tabs/*
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

### Phase 2 - Projects (Complete)
- [x] Can create project from local directory
- [x] Can create project by cloning GitHub repo
- [x] Project settings update correctly
- [x] Can invite team members
- [x] Project selector switches context

### Phase 3 - Tasks (Complete)
- [x] Kanban board displays all columns
- [x] Tasks can be created via modal
- [x] Drag and drop updates task status
- [x] Task detail modal shows all tabs
- [x] Phase tracking updates in real-time
- [x] Task logs display correctly

### Phase 4 - Terminals (Complete)
- [x] Terminal grid renders
- [x] New terminal spawns Claude CLI
- [x] @xterm/xterm displays output correctly
- [x] Input is sent to terminal process
- [x] "Invoke Claude All" broadcasts command
- [x] Terminal close cleans up process

### Phase 5 - Worktrees (Complete)
- [x] Worktree list shows existing worktrees
- [x] Can create new worktree from branch
- [x] Worktree selector in terminal works
- [x] Can delete worktree with confirmation

### Phase 6 - Roadmap (Complete)
- [x] Phases display in order
- [x] Features show with priority badges
- [x] Milestones can be checked/unchecked
- [x] "Build" creates task from feature
- [x] View tabs switch correctly

### Phase 7 - Memory (Complete)
- [x] Memory browser displays memories
- [x] Search filters results
- [x] Type filters work
- [x] Memory cards expand/collapse
- [x] Session insights auto-captured

### Phase 8 - MCP
- [ ] MCP servers list displays
- [ ] Toggle enables/disables servers
- [ ] Custom server can be added
- [ ] Config persists to database

### End-to-End
- [ ] Full workflow: Login → Project → Task → Terminal → Claude → Complete → Review
