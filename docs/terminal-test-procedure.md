# Terminal Testing Procedure

## Prerequisites

1. Ensure PostgreSQL is running: `docker compose up -d`
2. Ensure database is migrated: `npx prisma migrate dev`
3. Start the development server: `npm run dev`

## Test Cases

### Test 1: Single Terminal Creation

1. Navigate to the Terminals page in the application
2. Click "New Terminal" or create a terminal
3. Observe the console logs (server-side)
4. **Expected logs:**
   ```
   [WebSocket] Client connected: <userId>
   [TerminalManager] Spawning terminal with cwd: <path>
   [TerminalManager] Using shell: <shell-path>
   [TerminalManager] Successfully spawned terminal <id> (pid: <pid>)
   [WebSocket] Terminal <id> ready and client notified
   ```
5. **Expected behavior:**
   - Terminal should show a shell prompt within 100-200ms
   - No immediate exit (signal 1 or SIGHUP)
   - Terminal remains interactive

### Test 2: Multiple Terminal Creation

1. Create 3-5 terminals in quick succession
2. Observe that all terminals initialize successfully
3. **Expected:** Each terminal gets its own PTY process with unique PID

### Test 3: Terminal Session Duration

1. Create a terminal
2. Run a few commands (e.g., `ls`, `pwd`, `echo test`)
3. Close the terminal after at least 30 seconds
4. **Expected logs:**
   ```
   [TerminalManager] Terminal <id> exited after <duration>ms with code 0, signal <signal>
   ```
5. **Expected:** Duration should be > 30000ms (30 seconds)
6. **Expected:** Session insights should be captured (check the logs)

### Test 4: WebSocket Keepalive

1. Create a terminal
2. Leave it idle for 60+ seconds
3. **Expected:** Terminal stays alive, periodic pings keep the connection open
4. **Expected:** No unexpected disconnections

### Test 5: Claude Code Auto-Launch

1. Create a new terminal
2. Observe Claude Code auto-launching after shell prompt
3. **Expected logs:**
   ```
   [TerminalManager] Launching Claude Code for terminal <id> (attempt 1)
   [TerminalManager] Claude Code active for terminal <id>
   ```
4. **Expected:** Claude prompt appears in terminal

### Test 6: Page Refresh / Reconnection

1. Create a terminal
2. Refresh the browser page
3. **Expected:** Old WebSocket disconnects cleanly, new connection establishes
4. **Expected logs:**
   ```
   [WebSocket] Client disconnected: <userId>
   [WebSocket] Cleaned up <n> terminal(s) for user <userId>
   [WebSocket] Client connected: <userId>
   ```

### Test 7: Rapid Create/Delete

1. Quickly create and delete 5 terminals
2. **Expected:** No memory leaks, all PTY processes are cleaned up
3. Check with `ps aux | grep -i node` to verify no orphaned processes

## Known Issues to Monitor

### Issue 1: Immediate Exit (SIGHUP)
**Symptom:** Terminal exits within milliseconds with signal 1
**Log pattern:**
```
[TerminalManager] Terminal <id> exited after 2ms with code 0, signal 1
Skipping insight capture for short session (2ms)
```
**Status:** Should be FIXED with this update

### Issue 2: cwd Does Not Exist
**Symptom:** Terminal spawns with fallback cwd
**Log pattern:**
```
[TerminalManager] cwd does not exist: /
[TerminalManager] Using fallback cwd: <home-dir>
```
**Expected:** Should use valid project path, fallback only in error cases

### Issue 3: PTY Already Destroyed
**Symptom:** Cannot write to destroyed PTY
**Log pattern:**
```
[TerminalManager] Cannot launch Claude: PTY for session <id> is destroyed
```
**Expected:** Should not occur with the fixes

## Success Criteria

✅ All terminals survive for their full session duration
✅ No immediate SIGHUP exits (< 1 second)
✅ WebSocket keepalive prevents disconnections
✅ Clean cleanup on WebSocket close
✅ Session insights captured for sessions > 30 seconds
✅ No orphaned PTY processes after terminal deletion
✅ Claude Code auto-launches successfully
✅ Multiple terminals can coexist without issues

## Monitoring Commands

### Check Active PTY Processes
```bash
ps aux | grep -E '(zsh|bash|sh)' | grep -v grep
```

### Check Node.js Process Memory
```bash
ps aux | grep 'next-server' | grep -v grep
```

### Watch Server Logs
```bash
npm run dev 2>&1 | grep -E '\[TerminalManager\]|\[WebSocket\]'
```

## Debugging Tips

1. **Enable verbose logging**: Add `DEBUG=*` environment variable
2. **Check PTY lifecycle**: Monitor PID in logs from spawn to exit
3. **Verify cwd exists**: Ensure project paths are valid on the filesystem
4. **Test with different shells**: Try bash, zsh, sh
5. **Check environment variables**: Ensure SHELL, HOME, PATH are set correctly

## Rollback Plan

If issues persist, revert commits:
```bash
git log --oneline -5  # Find commit hash before changes
git revert <commit-hash>
```

Or restore from backup:
```bash
git stash
git checkout <previous-commit>
```
