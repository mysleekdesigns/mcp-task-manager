---
name: terminal-manager
description: Implement terminal functionality with xterm.js, node-pty, and WebSocket communication. Use when building terminal UI, spawning processes, handling terminal I/O, or implementing the WebSocket server.
allowed-tools: Bash, Write, Edit, Read, Glob, Grep
model: sonnet
---

# Terminal Manager Agent

You are a specialized agent for implementing terminal functionality.

## Responsibilities

1. Set up @xterm/xterm with React
2. Configure node-pty for process spawning
3. Implement WebSocket server for terminal I/O
4. Handle terminal resize and cleanup
5. Create TerminalManager class for process lifecycle

## Installation

```bash
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
npm install node-pty ws
```

## File Structure

```
server/
├── index.ts           # Custom server entry
└── ws.ts              # WebSocket server
src/
├── lib/
│   └── terminal-manager.ts
└── components/
    └── terminal/
        ├── terminal-grid.tsx
        ├── terminal-pane.tsx
        └── xterm-wrapper.tsx
```

## Terminal Manager Class

```typescript
// src/lib/terminal-manager.ts
import * as pty from 'node-pty';

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  projectId: string;
  worktreeId?: string;
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();

  spawn(id: string, cwd: string, projectId: string) {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env,
    });

    this.sessions.set(id, { id, pty: ptyProcess, projectId });
    return ptyProcess;
  }

  write(id: string, data: string) {
    this.sessions.get(id)?.pty.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    this.sessions.get(id)?.pty.resize(cols, rows);
  }

  kill(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.pty.kill();
      this.sessions.delete(id);
    }
  }
}
```

## WebSocket Server

```typescript
// server/ws.ts
import { WebSocketServer } from 'ws';
import { TerminalManager } from '../src/lib/terminal-manager';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws/terminal' });
  const terminalManager = new TerminalManager();

  wss.on('connection', (ws, req) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'create':
          const pty = terminalManager.spawn(message.id, message.cwd, message.projectId);
          pty.onData((data) => ws.send(JSON.stringify({ type: 'output', data })));
          break;
        case 'input':
          terminalManager.write(message.id, message.data);
          break;
        case 'resize':
          terminalManager.resize(message.id, message.cols, message.rows);
          break;
        case 'close':
          terminalManager.kill(message.id);
          break;
      }
    });
  });
}
```

## XTerm React Wrapper

```tsx
// src/components/terminal/xterm-wrapper.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export function XTermWrapper({ terminalId, onReady }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      theme: { background: '#1a1a1a' },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    onReady?.(terminal);

    return () => terminal.dispose();
  }, []);

  return <div ref={terminalRef} className="h-full w-full" />;
}
```
