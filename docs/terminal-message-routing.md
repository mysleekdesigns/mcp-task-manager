# Terminal Message Routing Architecture

## Overview

The terminal component uses a manual message routing system instead of AttachAddon to have precise control over what appears in the terminal display. This prevents internal control messages from appearing as raw JSON in the terminal.

## Message Flow

```
WebSocket Server → Browser WebSocket → onmessage Handler → Message Router → Terminal Display
                                                         ↓
                                                    Console Log (for control messages)
```

## Message Types

### Output Messages (`type: "output"`)

**Purpose:** Actual terminal output from the running process
**Action:** Write directly to terminal display
**Example:**
```json
{
  "type": "output",
  "id": "terminal-123",
  "data": "Hello World\r\n"
}
```

**Handler:**
```typescript
case 'output':
  if (message.id === terminalId && message.data) {
    xtermRef.current?.write(message.data);
  }
  break;
```

### Created Messages (`type: "created"`)

**Purpose:** Terminal session successfully created
**Action:** Set connection state to ready, process input queue
**Example:**
```json
{
  "type": "created",
  "id": "terminal-123"
}
```

**Handler:**
```typescript
case 'created':
  console.log('[Terminal] Terminal created successfully');
  clearTimeouts();
  setConnectionState('ready');
  setReconnectAttempts(0);
  processInputQueue();
  onReady?.(xtermRef.current!);
  break;
```

### Claude Status Messages (`type: "claude_status"`)

**Purpose:** Claude Code integration status updates
**Action:** Log silently, handled by use-claude-integration hook
**Example:**
```json
{
  "type": "claude_status",
  "status": "working",
  "message": "Processing request..."
}
```

**Handler:**
```typescript
case 'claude_status':
  // Claude Code status updates - handle silently
  // These are informational messages for the UI, not terminal output
  // The use-claude-integration hook already handles these
  console.log('[Terminal] Claude status:', message.status);
  break;
```

### Exit Messages (`type: "exit"`)

**Purpose:** Terminal process has exited
**Action:** Display exit message, close terminal
**Example:**
```json
{
  "type": "exit",
  "id": "terminal-123",
  "exitCode": 0
}
```

**Handler:**
```typescript
case 'exit':
  if (message.id === terminalId) {
    console.log('[Terminal] Process exited');
    xtermRef.current?.write('\r\n[Process exited]\r\n');
    setConnectionState('closed');
    onExit?.();
  }
  break;
```

### Error Messages (`type: "error"`)

**Purpose:** Server-side error occurred
**Action:** Display error message, update state
**Example:**
```json
{
  "type": "error",
  "message": "Failed to spawn terminal"
}
```

**Handler:**
```typescript
case 'error':
  console.error('[Terminal] Server error:', message.message);
  xtermRef.current?.write(`\r\n[Error: ${message.message}]\r\n`);
  setConnectionState('error');
  setError({
    message: message.message || 'Unknown server error',
    recoverable: true,
    retryCount: reconnectAttempts,
  });
  break;
```

### Unknown Messages

**Purpose:** Catch-all for unrecognized message types
**Action:** Log warning without writing to terminal
**Handler:**
```typescript
default:
  // Unknown message type - log but don't write to terminal
  console.warn('[Terminal] Unknown message type:', message.type, message);
```

## Input Handling

User input is sent via the terminal's `onData` handler:

```typescript
terminal.onData((data) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({
      type: 'input',
      id: terminalId,
      data,
    }));
  } else {
    inputQueueRef.current.push(data); // Queue for later
  }
});
```

### Input Queue

Before the terminal is ready, user input is queued:
- Input is added to `inputQueueRef.current`
- When terminal becomes ready (after `created` message), queue is processed
- All queued input is sent to the server in order

## Adding New Message Types

To add a new message type:

1. **Define the message structure** in the WebSocket server
2. **Add a case** to the switch statement in `onmessage`
3. **Decide the action:**
   - Write to terminal? → Use `xtermRef.current?.write()`
   - Update UI state? → Use state setters
   - Silent handling? → Just `console.log()`
4. **Document** the new message type in this file

Example:
```typescript
case 'my_new_message':
  // Handle the new message type
  console.log('[Terminal] New message:', message);
  // Only write to terminal if it's actual output
  // xtermRef.current?.write(...); // If needed
  break;
```

## Best Practices

### DO:
- ✅ Only write actual terminal output to the display
- ✅ Log control messages to console for debugging
- ✅ Check message ID matches terminalId
- ✅ Handle errors gracefully
- ✅ Update connection state appropriately

### DON'T:
- ❌ Write JSON control messages to terminal
- ❌ Write every message to terminal display
- ❌ Skip error handling
- ❌ Forget to validate message structure
- ❌ Ignore unknown message types

## Error Handling

All message processing is wrapped in try-catch:

```typescript
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    // ... message routing
  } catch (err) {
    console.error('[Terminal] Error processing message:', err);
    setError({
      message: 'Failed to process server message',
      recoverable: true,
      retryCount: reconnectAttempts,
    });
  }
};
```

## Performance Considerations

### Benefits of Manual Routing:
1. **No addon overhead** - Direct message handling
2. **Precise control** - Only write what's needed
3. **Better debugging** - Clear message flow
4. **Less memory** - No AttachAddon instance

### Optimization Tips:
- Keep switch cases simple and fast
- Avoid complex logic in message handler
- Use early returns for invalid messages
- Batch writes when possible (already handled by xterm)

## Testing Message Routing

### Unit Tests

Test each message type independently:
```typescript
it('should handle output messages', () => {
  if (mockWebSocket.onmessage) {
    mockWebSocket.onmessage({
      data: JSON.stringify({
        type: 'output',
        id: terminalId,
        data: 'test output\r\n',
      }),
    });
  }
  expect(terminal.write).toHaveBeenCalledWith('test output\r\n');
});
```

### Integration Tests

Test message sequences:
```typescript
it('should handle creation -> output -> exit flow', async () => {
  // Send created message
  // Send output messages
  // Send exit message
  // Verify each step
});
```

## Debugging

Enable console logging to track message flow:
```javascript
// In browser DevTools console:
localStorage.debug = 'terminal:*';
```

Look for these console messages:
- `[Terminal] Setting up WebSocket connection...`
- `[Terminal] WebSocket connected`
- `[Terminal] Terminal created successfully`
- `[Terminal] Claude status: ...`
- `[Terminal] Unknown message type: ...`

## Future Enhancements

Potential improvements to message routing:

1. **Message validation** - Use Zod schemas
2. **Message buffering** - Batch rapid messages
3. **Compression** - For large outputs
4. **Binary protocol** - For efficiency
5. **Message priorities** - Handle critical messages first
6. **Rate limiting** - Prevent message flooding
