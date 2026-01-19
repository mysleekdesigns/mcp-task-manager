# Terminal PTY Exit Fix - 2026-01-18

## Problem

The terminal PTY process was exiting immediately after spawning with signal 1 (SIGHUP) after only 2ms. This caused terminals to fail before becoming usable.

### Root Causes

1. **Race condition during initialization**: The PTY was spawning but receiving SIGHUP when the WebSocket connection wasn't fully stable
2. **No keepalive mechanism**: WebSocket connections could disconnect during initialization without any prevention
3. **Immediate client notification**: The 'created' message was sent immediately, potentially before the PTY was stable
4. **Missing WebSocket state checks**: Data was being sent even when the WebSocket was closing
5. **Session registration timing**: Session was added to the map after handlers were set up, creating a window for race conditions

## Changes Made

### 1. Terminal Manager (`server/terminal-manager.ts`)

#### Added PTY Flow Control
```typescript
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
  cwd: validCwd,
  env,
  handleFlowControl: true, // NEW: Prevent hanging on large output
});
```

#### Fixed Session Registration Order
- Moved `this.sessions.set(id, session)` to BEFORE setting up event handlers
- This prevents race conditions where handlers reference a non-existent session

#### Improved Exit Logging
```typescript
ptyProcess.onExit(({ exitCode, signal }) => {
  const session = this.sessions.get(id);
  if (session) {
    const duration = Date.now() - session.startTime.getTime();
    console.log(
      `[TerminalManager] Terminal ${id} exited after ${duration}ms with code ${exitCode}, signal ${signal}`
    );
  }
  this.sessions.delete(id);
});
```

#### Added PID Logging
```typescript
console.log(`[TerminalManager] Successfully spawned terminal ${id} (pid: ${ptyProcess.pid})`);
```

### 2. WebSocket Server (`server/ws.ts`)

#### Added WebSocket Keepalive
```typescript
const keepaliveInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 30000); // Ping every 30 seconds
```

This prevents the WebSocket from being closed by proxies or load balancers during periods of inactivity.

#### Added Keepalive to Connection Data
```typescript
const connectionData = new WeakMap<WebSocket, {
  sessionToken: string;
  userId: string;
  terminals: Map<string, string>;
  autoLaunchTimeouts: Map<string, NodeJS.Timeout>;
  keepaliveInterval?: NodeJS.Timeout; // NEW
}>();
```

#### Improved Close Handler Cleanup
```typescript
ws.on('close', () => {
  console.log('[WebSocket] Client disconnected:', userId);

  const connData = connectionData.get(ws);
  if (connData) {
    // Clean up keepalive interval
    if (connData.keepaliveInterval) {
      clearInterval(connData.keepaliveInterval);
    }

    // Clear all auto-launch timeouts
    for (const timeout of connData.autoLaunchTimeouts.values()) {
      clearTimeout(timeout);
    }
    connData.autoLaunchTimeouts.clear();

    console.log(`[WebSocket] Cleaned up ${connData.terminals.size} terminal(s) for user ${userId}`);
  }
});
```

#### Added Pong Handler
```typescript
ws.on('pong', () => {
  // Optional: log periodic pong responses for debugging
});
```

#### Delayed 'created' Message
```typescript
// Give the PTY a moment to stabilize before notifying client
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN && terminalManager.get(terminalId)) {
    ws.send(JSON.stringify({
      type: 'created',
      id: terminalId
    }));
    console.log(`[WebSocket] Terminal ${terminalId} ready and client notified`);
  } else {
    console.log(`[WebSocket] Terminal ${terminalId} created but WebSocket no longer open`);
  }
}, 100); // 100ms delay to ensure PTY is stable
```

This delay ensures the shell has time to initialize before we tell the client it's ready.

#### Added WebSocket State Checks
```typescript
pty.onData((data) => {
  // Only send if WebSocket is still open
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'output',
      id: terminalId,
      data
    }));
    // ...
  }
});

pty.onExit(({ exitCode, signal }) => {
  // ...
  // Notify client of exit
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'exit',
      id: terminalId,
      exitCode,
      signal
    }));
  }
  // ...
});
```

#### Improved Logging
All WebSocket logs now use `[WebSocket]` prefix for consistency:
```typescript
console.log('[WebSocket] Client connected:', userId);
console.log('[WebSocket] Terminal ${terminalId} ready and client notified');
console.log('[WebSocket] Client disconnected:', userId);
console.error('[WebSocket] Error for user', userId, ':', error);
```

## Expected Behavior After Fix

1. PTY processes should now remain alive for their full session duration
2. WebSocket connections should be more stable with keepalive pings
3. Race conditions during initialization should be eliminated
4. Terminals should not exit with SIGHUP immediately after creation
5. Better logging will help diagnose any remaining issues

## Testing Checklist

- [ ] Create a new terminal - should not exit immediately
- [ ] Terminal should show shell prompt after ~100ms
- [ ] Claude Code should auto-launch successfully
- [ ] Multiple terminals can be created without issues
- [ ] Terminals survive page refreshes (WebSocket reconnection)
- [ ] Check logs show duration > 30 seconds before exit
- [ ] No "posix_spawnp failed" errors in logs

## Related Files

- `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/server/terminal-manager.ts`
- `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/server/ws.ts`

## Next Steps

1. Test the changes with `npm run dev`
2. Monitor terminal creation in the console logs
3. Verify terminals remain active for expected duration
4. Check that session insights are captured properly for sessions > 30 seconds
