# Terminal Output Fix - Remove AttachAddon

## Problem
The `AttachAddon` from `@xterm/addon-attach` was writing ALL WebSocket messages directly to the terminal display, including JSON control messages like:
```json
{"type":"claude_status","status":"idle"}
```

This confused users as these internal control messages appeared as raw text in the terminal.

## Solution
Replaced the `AttachAddon` with manual message routing that intelligently handles different message types and only writes actual terminal output to the display.

## Changes Made in `src/components/terminal/xterm-wrapper.tsx`

### 1. Removed AttachAddon Import
**Before:**
```typescript
import { AttachAddon } from '@xterm/addon-attach';
```

**After:**
```typescript
// Import removed - no longer needed
```

### 2. Removed AttachAddon Reference
**Before:**
```typescript
const attachAddonRef = useRef<AttachAddon | null>(null);
```

**After:**
```typescript
// Reference removed - no longer needed
```

### 3. Updated WebSocket Message Handler
**Before:**
```typescript
case 'created':
  // Attach the terminal to WebSocket for bidirectional communication
  const attachAddon = new AttachAddon(ws, { bidirectional: false });
  attachAddonRef.current = attachAddon;
  xtermRef.current?.loadAddon(attachAddon);
  break;

case 'output':
  // Handled by AttachAddon after 'created'
  if (message.id === terminalId && message.data && connectionState !== 'ready') {
    xtermRef.current?.write(message.data);
  }
  break;

default:
  console.warn('[Terminal] Unknown message type:', message.type);
```

**After:**
```typescript
case 'created':
  console.log('[Terminal] Terminal created successfully');
  clearTimeouts();
  setConnectionState('ready');
  setReconnectAttempts(0);
  processInputQueue();
  onReady?.(xtermRef.current!);
  break;

case 'output':
  // Write actual terminal output to the display
  // This is the only message type that should appear in the terminal
  if (message.id === terminalId && message.data) {
    xtermRef.current?.write(message.data);
  }
  break;

case 'claude_status':
  // Claude Code status updates - handle silently
  // These are informational messages for the UI, not terminal output
  // The use-claude-integration hook already handles these
  console.log('[Terminal] Claude status:', message.status);
  break;

default:
  // Unknown message type - log but don't write to terminal
  console.warn('[Terminal] Unknown message type:', message.type, message);
```

### 4. Removed AttachAddon from Cleanup
**Before:**
```typescript
if (attachAddonRef.current) {
  attachAddonRef.current.dispose();
  attachAddonRef.current = null;
}
```

**After:**
```typescript
// Code removed - no longer needed
```

### 5. Removed AttachAddon from WebSocket Setup Cleanup
**Before:**
```typescript
if (attachAddonRef.current) {
  attachAddonRef.current.dispose();
  attachAddonRef.current = null;
}
if (wsRef.current) {
  // ... cleanup code
}
```

**After:**
```typescript
if (wsRef.current) {
  // ... cleanup code (no AttachAddon cleanup needed)
}
```

## How Message Routing Works Now

The updated `onmessage` handler intelligently routes messages:

| Message Type | Action |
|--------------|--------|
| `output` | Write `message.data` to terminal display (the only message that appears) |
| `claude_status` | Log silently (UI hook handles this) |
| `created` | Initialize terminal session, process input queue |
| `exit` | Display exit message and close terminal |
| `error` | Display error message and update state |
| Unknown | Log warning but don't display |

## Input Still Works

The existing `onData` handler continues to work without AttachAddon:
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

## Testing Checklist

- [x] Terminal output displays correctly
- [x] User input is sent to server via WebSocket
- [x] `claude_status` messages don't appear in terminal
- [x] ANSI color codes render properly
- [x] Error messages display correctly
- [x] Exit messages display correctly
- [x] Input queueing works before connection ready

## Benefits

1. **No Raw JSON**: Control messages stay out of the terminal display
2. **Better Control**: Explicit handling of each message type
3. **Cleaner Code**: More readable and maintainable
4. **Better UX**: Users only see actual terminal output
5. **Future-Proof**: Easy to add new message types without breaking display

## Dependencies Removed

Can now remove `@xterm/addon-attach` from package.json if not used elsewhere:
```bash
npm uninstall @xterm/addon-attach
```
