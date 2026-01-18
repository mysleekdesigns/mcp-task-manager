'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface XTermWrapperProps {
  terminalId: string;
  cwd: string;
  projectId: string;
  worktreeId?: string;
  sessionToken: string;
  onReady?: (terminal: Terminal) => void;
  onExit?: () => void;
}

export function XTermWrapper({
  terminalId,
  cwd,
  projectId,
  worktreeId,
  sessionToken,
  onReady,
  onExit,
}: XTermWrapperProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      cols: 80,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/terminal?token=${sessionToken}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Request terminal creation
      ws.send(
        JSON.stringify({
          type: 'create',
          id: terminalId,
          cwd,
          projectId,
          worktreeId,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'created':
          onReady?.(terminal);
          break;
        case 'output':
          if (message.id === terminalId && message.data) {
            terminal.write(message.data);
          }
          break;
        case 'exit':
          if (message.id === terminalId) {
            terminal.write('\r\n[Process exited]\r\n');
            onExit?.();
          }
          break;
        case 'error':
          terminal.write(`\r\n[Error: ${message.message}]\r\n`);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      terminal.write('\r\n[WebSocket connection error]\r\n');
    };

    ws.onclose = () => {
      setIsConnected(false);
      terminal.write('\r\n[Connection closed]\r\n');
    };

    // Handle terminal input
    const disposable = terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'input',
            id: terminalId,
            data,
          })
        );
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'resize',
            id: terminalId,
            cols: terminal.cols,
            rows: terminal.rows,
          })
        );
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Cleanup
    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'close',
            id: terminalId,
          })
        );
        ws.close();
      }
      terminal.dispose();
    };
  }, [terminalId, cwd, projectId, worktreeId, sessionToken, onReady, onExit]);

  return (
    <div className="relative h-full w-full">
      <div ref={terminalRef} className="h-full w-full" />
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Connecting...</div>
        </div>
      )}
    </div>
  );
}
