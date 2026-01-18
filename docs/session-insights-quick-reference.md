# Session Insights - Quick Reference

## Overview

Automatic terminal session insight capture for Phase 7 of the Context & Memory feature.

## How It Works

```
Terminal Opens → Output Tracked → Terminal Closes → Insights Parsed → Memory Created
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/session-insights.ts` | Parsing logic |
| `server/terminal-manager.ts` | Session tracking |
| `server/ws.ts` | Capture trigger |
| `src/app/api/memories/capture-session/route.ts` | API endpoint |

## Insight Types

| Type | Examples |
|------|----------|
| `accomplishment` | Commits, builds, tests passed |
| `error` | Compilation errors, runtime errors |
| `pattern` | Best practices, notes |
| `command` | Important commands (not cd/ls/pwd) |

## Key Topics Detected

- `git` - Git operations
- `dependencies` - npm/yarn/pnpm installs
- `build` - Build processes
- `testing` - Test runs
- `database` - Prisma migrations
- `docker` - Docker operations
- `file-management` - File operations

## Configuration

### Minimum Session Duration
**File:** `server/ws.ts`
```typescript
if (duration < 30000) { // milliseconds
```

### Buffer Size
**File:** `server/terminal-manager.ts`
```typescript
private readonly MAX_BUFFER_SIZE = 10000; // lines
```

### Insight Threshold
**File:** `src/app/api/memories/capture-session/route.ts`
```typescript
if (insights.length < 3 && data.commandCount === 0) {
```

## API Usage

### Endpoint
```
POST /api/memories/capture-session
```

### Request
```json
{
  "terminalId": "clxxx...",
  "terminalName": "Main Terminal",
  "projectId": "clxxx...",
  "outputBuffer": "$ npm test\nAll tests passed...",
  "startTime": "2024-01-18T10:00:00.000Z",
  "endTime": "2024-01-18T10:30:00.000Z",
  "commandCount": 15
}
```

### Response
```json
{
  "memory": {
    "id": "clxxx...",
    "type": "session",
    "title": "Main Terminal: git, testing - 1/18/2024",
    "content": "# Terminal Session Summary\n...",
    "metadata": { ... }
  },
  "summary": {
    "insightCount": 12,
    "duration": 1800000,
    "keyTopics": ["git", "testing"]
  }
}
```

## Memory Format

```markdown
# Terminal Session Summary

**Session ID:** clxxx...
**Duration:** 45m
**Commands Executed:** 23
**Topics:** git, testing

## Accomplishments
1. Successfully committed changes
2. All tests passed

## Errors Encountered
1. Module not found
   - Resolution: Installed dependency

## Patterns & Learnings
1. Note: Run tests before commit

## Key Commands
- `npm test`
- `git commit -m "feat: ..."`
```

## Testing

### Run Unit Tests
```bash
npx vitest run src/lib/__tests__/session-insights.test.ts
```

### Manual Test
1. Create terminal in dashboard
2. Execute commands for >30 seconds
3. Close terminal
4. Check `/api/memories?type=session`

## Troubleshooting

### No Memory Created

**Reasons:**
1. Session <30 seconds
2. User is VIEWER role
3. <3 insights detected
4. No commands executed

**Fix:**
- Check server logs
- Verify permissions
- Increase session duration
- Execute meaningful commands

### Memory Content Empty

**Reason:** Insight parsing failed

**Fix:**
- Check output buffer format
- Verify command prompts (`$` or `>`)
- Review parsing regex patterns

## Integration Checklist

Backend (✅ Complete):
- [x] TerminalManager tracks output
- [x] Session insights parsing
- [x] API endpoint
- [x] WebSocket trigger
- [x] Unit tests
- [x] TypeScript types

Frontend (⚠️ Required):
- [ ] Send terminal name on create
- [ ] Display session memories
- [ ] Filter by type="session"

## Performance

### Memory Usage
- Max 10,000 lines per session
- Auto-trimming prevents overflow
- WeakMap for connection tracking

### API Calls
- 1 call per terminal close/exit
- Async/non-blocking
- Error handling with logs

## Security

- ✅ Session token required
- ✅ User authentication
- ✅ Project membership check
- ✅ VIEWER role blocked
- ✅ Input validation (Zod)
- ✅ Buffer size limits

## Dependencies

```json
{
  "node-fetch": "^2.x",
  "@types/node-fetch": "^2.x",
  "vitest": "^4.x"
}
```

## Next Steps

1. Update terminal component to send name
2. Run E2E test
3. Deploy to staging
4. Monitor server logs
5. Gather user feedback

## Support

**Logs:**
```bash
# Server logs
tail -f logs/server.log | grep insight

# WebSocket logs
grep "Session insights" logs/server.log

# API logs
grep "capture-session" logs/server.log
```

**Database:**
```sql
-- View recent session memories
SELECT * FROM "Memory"
WHERE type = 'session'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Examples

### Git Workflow Session
```
Topics: git, testing
Accomplishments: 3 commits, all tests passed
Commands: 15
Duration: 25m
```

### Build & Deploy Session
```
Topics: build, docker, dependencies
Accomplishments: Build successful, deployed
Errors: 1 (resolved)
Commands: 8
Duration: 12m
```

### Debug Session
```
Topics: testing, database
Accomplishments: Fixed 2 bugs
Errors: 5 (all resolved)
Commands: 30
Duration: 1h 15m
```
