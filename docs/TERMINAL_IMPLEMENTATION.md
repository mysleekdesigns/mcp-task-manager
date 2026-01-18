# Terminal Management Implementation - Phase 4

This document describes the implementation of Phases 4.1, 4.2, 4.5, and 4.6 from the PRD.

## Overview

The terminal management system enables users to manage multiple terminal sessions within the application, with WebSocket-based real-time communication and support for git worktrees.

## Architecture

### Server-Side Components

#### 1. TerminalManager (`server/terminal-manager.ts`)
- Manages terminal process lifecycle using `node-pty`
- Tracks active terminal sessions per project
- Handles process spawning, input/output, resizing, and cleanup

**Key Methods:**
- `spawn(id, cwd, projectId, worktreeId?)` - Create new terminal process
- `write(id, data)` - Send input to terminal
- `resize(id, cols, rows)` - Resize terminal
- `kill(id)` - Terminate terminal process
- `getAllForProject(projectId)` - Get all terminals for a project

#### 2. WebSocket Server (`server/ws.ts`)
- Handles WebSocket connections at `/ws/terminal`
- Implements terminal message protocol
- Manages terminal I/O streaming
- Supports broadcast functionality

**Message Types:**
- `create` - Spawn new terminal process
- `input` - Send user input to terminal
- `resize` - Update terminal dimensions
- `close` - Terminate terminal
- `broadcast` - Send command to all project terminals

**Authentication:**
- Validates session token from query parameters
- TODO: Integrate with Auth.js session verification

#### 3. Custom Server (`server/index.ts`)
- Next.js custom server with WebSocket support
- Runs on port 3000 (configurable via PORT env)
- Handles both HTTP and WebSocket connections

### Client-Side Components

#### 1. XTermWrapper (`src/components/terminal/xterm-wrapper.tsx`)
- React wrapper for @xterm/xterm
- WebSocket client integration
- Automatic terminal fitting with FitAddon
- Status tracking (idle, running, exited)

**Props:**
- `terminalId` - Unique terminal identifier
- `cwd` - Working directory
- `projectId` - Project identifier
- `worktreeId` - Optional worktree identifier
- `sessionToken` - WebSocket authentication token
- `onReady` - Callback when terminal is ready
- `onExit` - Callback when process exits

#### 2. TerminalPane (`src/components/terminal/terminal-pane.tsx`)
- Individual terminal UI component
- Header with name, status indicator, and controls
- Worktree selector dropdown
- Expand/collapse functionality
- Close button

**Features:**
- Visual status indicator (green=running, yellow=idle, red=exited)
- Worktree switching (updates working directory)
- Expand to fullscreen
- Graceful cleanup on close

#### 3. TerminalGrid (`src/components/terminal/terminal-grid.tsx`)
- Responsive grid layout for multiple terminals
- Supports 1-12 terminals with dynamic layouts:
  - 1 terminal: 1x1
  - 2 terminals: 2x1
  - 3-4 terminals: 2x2
  - 5-6 terminals: 3x2
  - 7-9 terminals: 3x3
  - 10-12 terminals: 3x4
- Single terminal expansion mode

#### 4. InvokeClaudeModal (`src/components/terminal/invoke-claude-modal.tsx`)
- Modal for broadcasting commands to all terminals
- Command input with keyboard shortcuts (Cmd/Ctrl+Enter)
- Shows terminal count
- Status feedback

#### 5. Terminals Page (`src/app/dashboard/terminals/page.tsx`)
- Main terminal management interface
- Controls bar with terminal count and actions
- Terminal grid or empty state
- Integrates all terminal components

**Features:**
- Create new terminals (max 12)
- Close individual terminals
- Invoke Claude All (broadcast commands)
- Project and worktree integration
- Real-time status updates

### API Routes

#### GET `/api/terminals?projectId={id}`
- Fetch all terminals for a project
- Returns array of terminals with worktree relations
- Requires project membership

#### POST `/api/terminals`
- Create new terminal
- Body: `{ name, projectId, worktreeId? }`
- Validates project access and worktree ownership
- Returns created terminal

#### GET `/api/terminals/[id]`
- Fetch single terminal by ID
- Includes project and worktree relations
- Validates user access

#### DELETE `/api/terminals/[id]`
- Delete terminal
- Requires MEMBER role or higher
- Cleans up database entry (WebSocket handles process cleanup)

#### GET `/api/worktrees?projectId={id}`
- Fetch all worktrees for a project (placeholder for Phase 5)
- Returns array of worktrees

## Database Schema

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

## Running the Application

### Development
```bash
npm run dev
```

This now starts the custom server with WebSocket support instead of the default Next.js dev server.

### Production
```bash
npm run build
npm start
```

## Dependencies

### New Dependencies
- `@xterm/xterm` (^6.0.0) - Terminal emulator for the web
- `@xterm/addon-fit` (^0.11.0) - Auto-fit terminal to container
- `node-pty` (^1.1.0) - Spawn shell processes with PTY
- `ws` (^8.19.0) - WebSocket library
- `@types/ws` (^8.18.1) - TypeScript types for ws
- `tsx` (^4.21.0) - TypeScript execution for server

## Testing

### Manual Testing Checklist

1. **Terminal Creation**
   - [ ] Create new terminal
   - [ ] Terminal appears in grid
   - [ ] Terminal connects via WebSocket
   - [ ] Shell prompt appears

2. **Terminal Input/Output**
   - [ ] Type commands and see output
   - [ ] Long output scrolls correctly
   - [ ] Colors and formatting work
   - [ ] Special characters display correctly

3. **Terminal Resize**
   - [ ] Terminal adapts to pane size
   - [ ] Resize when expanding/collapsing
   - [ ] Grid layout updates correctly

4. **Worktree Integration**
   - [ ] Worktree selector shows available worktrees
   - [ ] Selecting worktree changes working directory
   - [ ] Commands execute in correct directory

5. **Invoke Claude All**
   - [ ] Modal opens with correct terminal count
   - [ ] Command broadcasts to all terminals
   - [ ] All terminals receive and execute command
   - [ ] Success toast shows terminal count

6. **Terminal Cleanup**
   - [ ] Close terminal via X button
   - [ ] Terminal removed from grid
   - [ ] WebSocket disconnects
   - [ ] Process terminates
   - [ ] Database record deleted

7. **Grid Layouts**
   - [ ] 1 terminal: fullscreen
   - [ ] 2 terminals: side by side
   - [ ] 4 terminals: 2x2 grid
   - [ ] 12 terminals: 3x4 grid
   - [ ] Expand single terminal to fullscreen
   - [ ] Collapse back to grid

## Known Limitations

1. **Session Token**: Currently uses a random token instead of Auth.js session
   - TODO: Integrate with actual session management
   - Security risk in current implementation

2. **Process Persistence**: Terminal processes don't survive server restarts
   - Processes are in-memory only
   - TODO: Implement session recovery

3. **No Terminal History**: Terminal output is not persisted
   - TODO: Optional logging to database for audit trail

4. **Limited Shell Support**: Only bash/powershell
   - TODO: Support custom shells (zsh, fish, etc.)
   - TODO: Claude CLI detection and auto-launch

## Future Enhancements (Phase 5+)

1. **Git Worktree Management**
   - Create worktrees from UI
   - Auto-switch terminal to worktree path
   - Worktree status indicators

2. **Claude CLI Integration**
   - Auto-detect Claude CLI in PATH
   - One-click Claude launch
   - Claude-specific command palette

3. **Terminal Sharing**
   - Share terminal view with team members
   - Collaborative terminal sessions
   - View-only mode for VIEWER role

4. **Terminal Customization**
   - Custom themes
   - Font size adjustment
   - Shell preference per terminal

## Files Created/Modified

### New Files
- `/server/terminal-manager.ts` - Terminal process manager
- `/server/ws.ts` - WebSocket server
- `/server/index.ts` - Custom Next.js server
- `/src/components/terminal/xterm-wrapper.tsx` - XTerm React wrapper
- `/src/components/terminal/terminal-pane.tsx` - Terminal pane component
- `/src/components/terminal/terminal-grid.tsx` - Terminal grid layout
- `/src/components/terminal/invoke-claude-modal.tsx` - Broadcast modal
- `/src/components/terminal/index.tsx` - Component exports
- `/src/app/api/terminals/route.ts` - Terminal CRUD API
- `/src/app/api/worktrees/route.ts` - Worktree API placeholder

### Modified Files
- `/package.json` - Updated dev/start scripts, added dependencies
- `/prisma/schema.prisma` - Terminal model (already had required fields)
- `/src/app/api/terminals/[id]/route.ts` - Added worktree relation
- `/src/app/dashboard/terminals/page.tsx` - Full terminal UI implementation

## Verification

Run the following to verify implementation:

```bash
# Check TypeScript compilation
npm run build

# Check linting
npm run lint

# Start development server
npm run dev

# Access terminals at http://localhost:3000/dashboard/terminals
```

## Support

For issues or questions:
1. Check WebSocket connection in browser DevTools
2. Check server logs for terminal process errors
3. Verify node-pty native compilation (may require rebuild on some systems)
4. Ensure PostgreSQL is running for API routes
