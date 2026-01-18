# Phase 7: Session Insight Capture - Implementation Guide

## Overview

Phase 7 implements automatic session insight capture from terminal sessions. When a terminal closes, the system analyzes the session output, extracts meaningful insights, and automatically creates a "session" type memory entry.

## Completed Components

### 1. Session Insights Utility (`src/lib/session-insights.ts`)

**Purpose:** Parse and analyze terminal output to extract meaningful insights.

**Key Features:**
- Detects accomplishments (successful commits, builds, tests)
- Identifies errors and their solutions
- Captures important commands
- Extracts patterns and best practices
- Generates structured summaries
- Formats content for memory storage

**Main Functions:**
- `parseTerminalOutput(output: string)` - Extract insights from raw output
- `extractKeyTopics(output: string)` - Identify session topics
- `generateSessionSummary()` - Create structured summary
- `formatMemoryContent()` - Format content for memory entry
- `generateMemoryTitle()` - Create descriptive title

**Insight Types:**
- `accomplishment` - Successful operations (commits, builds, tests)
- `error` - Errors encountered (with context and solutions)
- `pattern` - Best practices and learnings
- `command` - Important commands executed
- `conversation` - Key discussion points

### 2. Enhanced Terminal Manager (`server/terminal-manager.ts`)

**Changes:**
- Added `outputBuffer: string[]` to track session output
- Added `startTime: Date` to track session duration
- Added `commandCount: number` to count commands
- Added `MAX_BUFFER_SIZE = 10000` to prevent memory issues
- Added `captureOutput()` method to store output
- Added `getSessionMetadata()` method to retrieve session data

**Session Tracking:**
```typescript
interface TerminalSession {
  id: string;
  pty: pty.IPty;
  projectId: string;
  worktreeId?: string;
  cwd: string;
  outputBuffer: string[];  // NEW
  startTime: Date;         // NEW
  commandCount: number;    // NEW
}
```

### 3. Session Capture API (`src/app/api/memories/capture-session/route.ts`)

**Endpoint:** `POST /api/memories/capture-session`

**Request Body:**
```typescript
{
  terminalId: string;
  terminalName: string;
  projectId: string;
  outputBuffer: string;
  startTime: string;
  endTime: string;
  commandCount: number;
  worktreeId?: string;
  cwd?: string;
}
```

**Behavior:**
- Validates user permissions (VIEWER cannot create memories)
- Parses terminal output for insights
- Skips creation if session too brief (<3 insights, 0 commands)
- Creates memory with type "session"
- Returns summary statistics

**Response:**
```typescript
{
  memory: Memory;
  summary: {
    insightCount: number;
    duration: number;
    keyTopics: string[];
  }
}
```

### 4. WebSocket Integration (`server/ws.ts`)

**Changes:**
- Added `node-fetch` import for API calls
- Added `name` field to `TerminalMessage` interface
- Added `connectionData` WeakMap to track session tokens and terminal names
- Added `captureSessionInsights()` helper function
- Integrated insight capture on terminal close and exit

**Flow:**
1. Terminal created → Store terminal name and session token
2. Terminal output → Captured in buffer
3. Terminal closes/exits → Trigger insight capture
4. Insight capture → Parse output, call API, create memory

**Minimum Session Duration:** 30 seconds (configurable)

## Testing

### Unit Tests (`src/lib/__tests__/session-insights.test.ts`)

**Coverage:**
- ✅ Detects accomplishments from git commits
- ✅ Detects errors with context
- ✅ Detects commands (excludes basic navigation)
- ✅ Detects patterns and notes
- ✅ Extracts key topics (git, dependencies, build, testing, etc.)
- ✅ Generates session summaries with correct metrics
- ✅ Formats memory content with all sections
- ✅ Generates descriptive titles

**Run Tests:**
```bash
npx vitest run src/lib/__tests__/session-insights.test.ts
```

**Results:** All 15 tests passing ✅

## Usage Flow

### Automatic Capture (Default)

1. User opens a terminal in the dashboard
2. Terminal session is created with tracking enabled
3. User works in the terminal (commands, builds, tests, etc.)
4. User closes the terminal OR terminal process exits
5. System automatically:
   - Checks session duration (must be >30s)
   - Retrieves output buffer from TerminalManager
   - Calls `/api/memories/capture-session`
   - Parses output for insights
   - Creates memory entry if meaningful activity detected
6. Memory appears in Context & Memory dashboard

### Memory Content Format

```markdown
# Terminal Session Summary

**Session ID:** term-abc123
**Duration:** 45m
**Commands Executed:** 23
**Topics:** git, testing, build

## Accomplishments

1. Successfully committed 3 changes
2. All tests passed
3. Build completed successfully

## Errors Encountered

1. Error: Module not found
   - Resolution: Installed missing dependency

## Patterns & Learnings

1. Note: Always run tests before commit
2. Pattern: Use --force-with-lease instead of --force

## Key Commands

- `npm test`
- `git commit -m "feat: add feature"`
- `npm run build`
```

## Configuration

### Minimum Session Duration

Edit `server/ws.ts`:
```typescript
if (duration < 30000) { // 30 seconds
```

### Buffer Size

Edit `server/terminal-manager.ts`:
```typescript
private readonly MAX_BUFFER_SIZE = 10000; // lines
```

### Insight Thresholds

Edit `src/app/api/memories/capture-session/route.ts`:
```typescript
if (insights.length < 3 && data.commandCount === 0) {
  // Skip creation
}
```

## Security Considerations

1. **Authentication:** Session token required for WebSocket connection
2. **Authorization:** User must be project member (not VIEWER)
3. **Data Sanitization:** Output buffer limited to prevent memory exhaustion
4. **API Validation:** Zod schema validation on all inputs

## Database Schema

**Memory Model (No Changes Required):**
```prisma
model Memory {
  id        String   @id @default(cuid())
  type      String   // "session"
  title     String   // "Terminal 1: git, testing - 1/18/2026"
  content   String   @db.Text  // Formatted markdown
  metadata  Json?    // Session details
  projectId String
  project   Project  @relation(...)
  createdAt DateTime @default(now())
}
```

**Metadata Structure:**
```typescript
{
  terminalId: string;
  terminalName: string;
  worktreeId?: string;
  cwd: string;
  duration: number;
  commandCount: number;
  errorCount: number;
  successCount: number;
  keyTopics: string[];
  startTime: string;
  endTime: string;
}
```

## Dependencies

**Installed:**
- `node-fetch@2` - For WebSocket to API communication
- `@types/node-fetch` - TypeScript types
- `vitest` - Testing framework

## Future Enhancements

### Suggested Improvements

1. **AI-Powered Summarization**
   - Use Claude API to generate natural language summaries
   - Identify patterns across multiple sessions
   - Suggest best practices based on errors

2. **Session Replay**
   - Store complete session output
   - Allow users to "replay" terminal sessions
   - Search through historical commands

3. **Insight Notifications**
   - Real-time notifications for important insights
   - Daily/weekly summary emails
   - Slack integration for team insights

4. **Advanced Filtering**
   - Filter insights by type, topic, date range
   - Search across all session memories
   - Tag sessions with custom labels

5. **Session Analytics**
   - Visualize command usage patterns
   - Track error rates over time
   - Identify most productive sessions

6. **Smart Suggestions**
   - Suggest related memories based on context
   - Recommend commands based on history
   - Auto-tag sessions with relevant tasks

## Troubleshooting

### Insights Not Captured

**Check:**
1. Session duration >30 seconds
2. User has permissions (not VIEWER)
3. WebSocket connection has valid session token
4. Terminal name provided in create message

**Debug:**
```bash
# Check server logs for insight capture messages
tail -f logs/server.log | grep "insight"
```

### Empty Memories Created

**Cause:** Insufficient insight threshold

**Fix:** Increase minimum insight count in API route:
```typescript
if (insights.length < 5 && data.commandCount === 0) {
```

### Memory Overflow

**Cause:** Large output buffer

**Fix:** Reduce buffer size in TerminalManager:
```typescript
private readonly MAX_BUFFER_SIZE = 5000;
```

## Integration Points

### Frontend Integration Required

To complete Phase 7, update the terminal component to include terminal name:

**File:** `src/components/terminal/terminal-pane.tsx`

```typescript
// When creating terminal via WebSocket
ws.send(JSON.stringify({
  type: 'create',
  id: terminalId,
  name: terminalName,  // ADD THIS
  cwd: currentDirectory,
  projectId: projectId,
  worktreeId: worktreeId,
}));
```

### API Documentation

Add to API documentation:

```markdown
## POST /api/memories/capture-session

Capture insights from a terminal session.

**Auth:** Required
**Permissions:** Project member (not VIEWER)

**Request:**
- terminalId: Terminal UUID
- terminalName: Display name
- projectId: Project UUID
- outputBuffer: Raw terminal output
- startTime: ISO 8601 datetime
- endTime: ISO 8601 datetime
- commandCount: Number of commands
- worktreeId: Optional worktree UUID
- cwd: Optional working directory

**Response:**
- memory: Created memory object
- summary: Insight statistics
```

## Verification Checklist

- [x] TerminalManager tracks output buffer
- [x] TerminalManager tracks session metadata
- [x] Session insights utility parses output
- [x] API endpoint validates and creates memories
- [x] WebSocket triggers insight capture on close/exit
- [x] Tests cover all parsing logic
- [x] TypeScript compilation successful
- [x] Dependencies installed
- [ ] Frontend sends terminal name (requires implementation)
- [ ] Manual E2E testing completed

## Next Steps

1. **Update Frontend Components**
   - Modify terminal creation to include name
   - Add UI to view session memories
   - Filter memories by type="session"

2. **Testing**
   - Manual E2E test: Create terminal, execute commands, close
   - Verify memory created in database
   - Check memory content format

3. **Documentation**
   - Update user documentation
   - Add troubleshooting guide
   - Document configuration options

## Files Modified

| File | Type | Changes |
|------|------|---------|
| `server/terminal-manager.ts` | Modified | Added session tracking |
| `server/ws.ts` | Modified | Added insight capture trigger |
| `src/lib/session-insights.ts` | New | Insight parsing utility |
| `src/app/api/memories/capture-session/route.ts` | New | API endpoint |
| `src/lib/__tests__/session-insights.test.ts` | New | Unit tests |
| `package.json` | Modified | Added dependencies |

## Summary

Phase 7 Session Insight Capture is **functionally complete** on the backend. The system automatically captures terminal session insights and creates structured memory entries. All tests pass and TypeScript compilation succeeds.

**Remaining Work:**
- Frontend integration to send terminal names
- Manual E2E testing
- User documentation

The feature is production-ready for backend testing and can be integrated with the frontend terminal components.
