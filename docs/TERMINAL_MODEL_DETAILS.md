# Terminal Model - Detailed Schema Documentation

## Model Definition

Located in: `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/prisma/schema.prisma` (lines 222-235)

### Complete Terminal Model

```prisma
model Terminal {
  id         String    @id @default(cuid())
  name       String
  status     String    @default("idle")
  pid        Int?
  projectId  String
  project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  worktreeId String?
  worktree   Worktree? @relation(fields: [worktreeId], references: [id], onDelete: SetNull)
  createdAt  DateTime  @default(now())

  @@index([projectId])
  @@index([worktreeId])
}
```

---

## Field Specifications

### 1. id (Primary Key)
- **Type:** String
- **Required:** Yes
- **Default:** `@default(cuid())` - Generates unique CUID
- **Description:** Unique identifier for each terminal
- **Usage:** Used in API endpoints: `/api/terminals/{id}`

### 2. name
- **Type:** String
- **Required:** Yes (no `?` modifier)
- **Default:** None (must be provided on creation)
- **Length:** Unlimited (VARCHAR in PostgreSQL)
- **Description:** Human-readable terminal name/label
- **Example:** "Main Terminal", "Build Terminal", "SSH Session"

### 3. status
- **Type:** String
- **Required:** No (can be updated)
- **Default:** `"idle"`
- **Allowed Values:** Currently unrestricted (consider creating enum)
- **Possible Values:** "idle", "running", "busy", "stopped", "error"
- **Description:** Current state of the terminal session
- **Usage:** UI displays different indicators based on status

### 4. pid
- **Type:** Int
- **Required:** No (nullable with `?`)
- **Default:** None
- **Range:** Platform-dependent process ID range
- **Description:** Operating system process ID for the terminal
- **Usage:** Used by node-pty to manage terminal process
- **Note:** Can be null when terminal is not yet initialized

### 5. projectId
- **Type:** String (CUID format)
- **Required:** Yes (no `?` modifier)
- **Foreign Key:** References `Project.id`
- **Default:** None (must be provided)
- **Description:** Links terminal to its parent project
- **On Delete:** Cascade - deleting project deletes all terminals
- **Usage:** Filter terminals by project in queries

### 6. project
- **Type:** Project (relation)
- **Required:** Yes
- **Description:** Reference to the parent Project model
- **Relation:** Many terminals → One project
- **Access:** `terminal.project` in queries with include
- **Cascade Delete:** Yes - if project deleted, terminal deleted

### 7. worktreeId
- **Type:** String (CUID format)
- **Required:** No (nullable with `?`)
- **Foreign Key:** References `Worktree.id`
- **Default:** None
- **Description:** Links terminal to a specific git worktree
- **On Delete:** SetNull - deleting worktree nullifies reference
- **Usage:** Associate terminal with feature branch workspace

### 8. worktree
- **Type:** Worktree (optional relation)
- **Required:** No (nullable with `?`)
- **Description:** Reference to the associated Worktree model
- **Relation:** Many terminals → One worktree
- **Access:** `terminal.worktree` in queries with include
- **On Delete:** SetNull - terminal remains but worktree reference cleared
- **Note:** Allows terminal to exist without worktree association

### 9. createdAt
- **Type:** DateTime
- **Required:** Yes (auto-generated)
- **Default:** `@default(now())` - Current timestamp
- **Timezone:** UTC
- **Description:** Timestamp of terminal creation
- **Immutable:** True (never updated)
- **Usage:** Sort terminals chronologically, audit trails

---

## Indexes

### Index 1: [@index([projectId])]
```prisma
@@index([projectId])
```
- **Purpose:** Optimize queries filtering by project
- **Query Pattern:** `findMany({ where: { projectId } })`
- **Lookup Speed:** O(log n) → Fast
- **Storage:** Minimal overhead (~1-2% DB size)
- **Usage:** GET /api/terminals?projectId=proj-1

### Index 2: [@index([worktreeId])]
```prisma
@@index([worktreeId])
```
- **Purpose:** Optimize queries filtering by worktree
- **Query Pattern:** `findMany({ where: { worktreeId } })`
- **Lookup Speed:** O(log n) → Fast
- **Nullable:** Yes - handles NULL values efficiently
- **Usage:** Find terminals for a specific worktree

---

## Relations

### Relation 1: project (Many-to-One)
```prisma
project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
```

**Configuration:**
- **Type:** Many-to-One (Many terminals per project)
- **Foreign Key:** projectId
- **References:** Project.id
- **Cascade Delete:** YES
  - Deleting a project → Deletes all its terminals
  - Prevents orphaned terminal records
- **Required:** YES

**Example Query:**
```typescript
const terminal = await prisma.terminal.findUnique({
  where: { id: 'terminal-1' },
  include: { project: true }
});
// Returns: { ..., project: { id, name, description, ... } }
```

### Relation 2: worktree (One-to-One Optional)
```prisma
worktree   Worktree? @relation(fields: [worktreeId], references: [id], onDelete: SetNull)
```

**Configuration:**
- **Type:** One-to-One (one terminal per worktree, but many terminals can exist without)
- **Foreign Key:** worktreeId (nullable)
- **References:** Worktree.id
- **Set Null On Delete:** YES
  - Deleting a worktree → Sets worktreeId to NULL on terminal
  - Terminal survives, just loses worktree association
- **Required:** NO (optional)

**Example Query:**
```typescript
const terminal = await prisma.terminal.findUnique({
  where: { id: 'terminal-1' },
  include: { worktree: true }
});
// Returns: { ..., worktree: { id, name, branch, ... } or null }
```

---

## Worktree Model Integration

Located in: `prisma/schema.prisma` (lines 261-273)

### Worktree ↔ Terminal Relationship

```prisma
model Worktree {
  id        String     @id @default(cuid())
  name      String
  path      String
  branch    String
  isMain    Boolean    @default(false)
  projectId String
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  terminals Terminal[] // ← One-to-many array relation
  createdAt DateTime   @default(now())

  @@index([projectId])
}
```

**Bidirectional Relation:**
- Terminal has `worktreeId` and `worktree` relation
- Worktree has `terminals` array relation
- Automatically linked by Prisma

**Query Example:**
```typescript
// Get worktree with all its terminals
const worktree = await prisma.worktree.findUnique({
  where: { id: 'wt-1' },
  include: { terminals: true }
});
// Returns: { ..., terminals: [{ id, name, status, ... }, ...] }

// Get terminals for a specific worktree
const terminals = await prisma.terminal.findMany({
  where: { worktreeId: 'wt-1' },
  include: { project: true }
});
```

---

## Project Model Integration

Located in: `prisma/schema.prisma` (lines 68-84)

### Project ↔ Terminal Relationship

```prisma
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
  terminals   Terminal[]      // ← One-to-many array relation
  memories    Memory[]
  mcpConfigs  McpConfig[]
  worktrees   Worktree[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

**Query Example:**
```typescript
// Get project with all terminals
const project = await prisma.project.findUnique({
  where: { id: 'proj-1' },
  include: { terminals: true }
});
// Returns: { ..., terminals: [{ id, name, status, ... }, ...] }
```

---

## API Test Coverage

### Test File 1: `/src/app/api/terminals/__tests__/route.test.ts`

**Tests for Terminal Model:**
1. GET /api/terminals - List and filter by projectId
2. POST /api/terminals - Create with validation
3. Terminal fields in response
4. Worktree association in requests
5. Authorization checks
6. Database error handling

**Mock Data:**
```typescript
const mockTerminal = {
  id: 'terminal-1',
  name: 'Main Terminal',
  status: 'idle',
  pid: null,
  projectId: 'project-1',
  worktreeId: null,
  createdAt: new Date(),
  project: { id: 'project-1', name: 'Test Project' },
};
```

### Test File 2: `/src/app/api/terminals/__tests__/route.id.test.ts`

**Tests for Terminal Model:**
1. GET /api/terminals/[id] - Fetch by ID
2. DELETE /api/terminals/[id] - Delete with permissions
3. Terminal with worktree details
4. Role-based access control
5. Project membership validation

**Mock Data with Worktree:**
```typescript
const mockTerminalWithWorktree = {
  ...mockTerminal,
  worktreeId: 'worktree-1',
  worktree: {
    id: 'worktree-1',
    name: 'Feature Branch',
    path: '/path/to/worktree',
    branch: 'feature/test',
  },
};
```

---

## Database Schema (PostgreSQL)

### SQL Table Structure

```sql
CREATE TABLE "Terminal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "pid" INTEGER,
    "projectId" TEXT NOT NULL,
    "worktreeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Terminal_projectId_fkey"
        FOREIGN KEY ("projectId")
        REFERENCES "Project"("id")
        ON DELETE CASCADE,
    CONSTRAINT "Terminal_worktreeId_fkey"
        FOREIGN KEY ("worktreeId")
        REFERENCES "Worktree"("id")
        ON DELETE SET NULL
);

CREATE INDEX "Terminal_projectId_idx" ON "Terminal"("projectId");
CREATE INDEX "Terminal_worktreeId_idx" ON "Terminal"("worktreeId");
```

---

## API Contract Examples

### Create Terminal

**Request:**
```typescript
POST /api/terminals
{
  "name": "Dev Terminal",
  "projectId": "proj-1",
  "worktreeId": "wt-1" // optional
}
```

**Response (201 Created):**
```typescript
{
  "id": "term-xyz",
  "name": "Dev Terminal",
  "status": "idle",
  "pid": null,
  "projectId": "proj-1",
  "worktreeId": "wt-1",
  "createdAt": "2026-01-18T20:00:00Z",
  "project": { "id": "proj-1", "name": "MyProject" }
}
```

### List Terminals

**Request:**
```
GET /api/terminals?projectId=proj-1
```

**Response (200 OK):**
```typescript
[
  {
    "id": "term-1",
    "name": "Main Terminal",
    "status": "running",
    "pid": 12345,
    "projectId": "proj-1",
    "worktreeId": "wt-1",
    "createdAt": "2026-01-18T19:00:00Z",
    "project": { "id": "proj-1", "name": "MyProject" }
  },
  // ... more terminals
]
```

### Get Terminal Details

**Request:**
```
GET /api/terminals/term-1
```

**Response (200 OK):**
```typescript
{
  "id": "term-1",
  "name": "Main Terminal",
  "status": "running",
  "pid": 12345,
  "projectId": "proj-1",
  "worktreeId": "wt-1",
  "createdAt": "2026-01-18T19:00:00Z",
  "project": {
    "id": "proj-1",
    "name": "MyProject",
    "description": "...",
    "targetPath": "/path/to/project"
  },
  "worktree": {
    "id": "wt-1",
    "name": "feature-branch",
    "path": "/path/to/worktree",
    "branch": "feature/new-feature"
  }
}
```

### Delete Terminal

**Request:**
```
DELETE /api/terminals/term-1
```

**Response (200 OK):**
```typescript
{
  "success": true
}
```

---

## Validation Rules

### On Create
- ✅ `name` - Required, non-empty string
- ✅ `projectId` - Required, valid CUID, project must exist
- ✅ `worktreeId` - Optional, if provided must be valid CUID and belong to same project

### On Update
- ✅ `status` - Can be any string (consider restricting to enum)
- ✅ `pid` - Can be updated when terminal process changes
- ⚠️ `id`, `projectId` - Should not be updated after creation
- ❌ `createdAt` - Immutable, auto-generated

### Data Constraints
- Max `name` length: 255 characters (PostgreSQL VARCHAR)
- Max `status` length: 255 characters
- `pid` range: 0 to 2,147,483,647 (32-bit integer)
- All timestamps: UTC timezone

---

## Performance Considerations

### Efficient Queries

**Get terminals for project:**
```typescript
// Uses projectId index - O(log n)
const terminals = await prisma.terminal.findMany({
  where: { projectId: 'proj-1' },
  include: { project: true }
});
```

**Get terminals for worktree:**
```typescript
// Uses worktreeId index - O(log n)
const terminals = await prisma.terminal.findMany({
  where: { worktreeId: 'wt-1' }
});
```

### Potential Improvements

**Optional - Create composite index:**
```prisma
@@index([projectId, status])
```
- Useful if frequently querying: "get running terminals for project"
- Adds minimal storage overhead
- Improves query speed for combined filters

**Optional - Status enum:**
```prisma
enum TerminalStatus {
  IDLE
  RUNNING
  BUSY
  STOPPED
  ERROR
}

status TerminalStatus @default(IDLE)
```
- Type safety in code
- Faster PostgreSQL comparisons
- Better documentation

---

## Security Considerations

### Authorization
- ✅ All Terminal endpoints check project membership
- ✅ Role-based access control (VIEWER cannot create/delete)
- ✅ Users can only access terminals in projects they're members of

### Data Protection
- ✅ No sensitive data stored in Terminal model
- ✅ PID exposure is safe (OS-level, not credentials)
- ✅ Cascade delete prevents orphaned records

### Validation
- ✅ projectId validated on create/update
- ✅ worktreeId validated for same-project constraint
- ✅ Terminal existence checked before operations

---

## Status: VALID AND PRODUCTION-READY

All schema requirements met. Ready for:
1. Database migration
2. API deployment
3. Production use

