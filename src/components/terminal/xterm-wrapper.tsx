'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import { useTheme } from 'next-themes';
import '@xterm/xterm/css/xterm.css';

interface XTermWrapperProps {
  terminalId: string;
  name: string;
  cwd: string;
  projectId: string;
  worktreeId?: string;
  sessionToken: string;
  onReady?: (terminal: Terminal) => void;
  onExit?: () => void;
  autoFocus?: boolean;
}

type ConnectionState = 'connecting' | 'launching' | 'ready' | 'error' | 'closed';

interface ErrorInfo {
  message: string;
  recoverable: boolean;
  retryCount?: number;
}

const getTerminalTheme = (isDark: boolean) => {
  if (isDark) {
    // Dark theme
    return {
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
    };
  } else {
    // Light theme
    return {
      background: '#ffffff',
      foreground: '#383a42',
      cursor: '#383a42',
      black: '#000000',
      red: '#e45649',
      green: '#50a14f',
      yellow: '#c18401',
      blue: '#0184bc',
      magenta: '#a626a4',
      cyan: '#0997b3',
      white: '#fafafa',
      brightBlack: '#4f525e',
      brightRed: '#e06c75',
      brightGreen: '#98c379',
      brightYellow: '#e5c07b',
      brightBlue: '#61afef',
      brightMagenta: '#c678dd',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff',
    };
  }
};

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000; // 2 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds

export function XTermWrapper({
  terminalId,
  name,
  cwd,
  projectId,
  worktreeId,
  sessionToken,
  onReady,
  onExit,
  autoFocus = false,
}: XTermWrapperProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const attachAddonRef = useRef<AttachAddon | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputQueueRef = useRef<string[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setupWebSocketRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false); // Guard against React StrictMode double-mounting
  const isMountedRef = useRef(true); // Track if component is mounted
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { theme, resolvedTheme } = useTheme();

  // Determine if dark mode is active
  const isDark = resolvedTheme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');

  // Process queued input once ready
  const processInputQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && inputQueueRef.current.length > 0) {
      console.log(`[Terminal] Processing ${inputQueueRef.current.length} queued inputs`);
      inputQueueRef.current.forEach((data) => {
        wsRef.current?.send(
          JSON.stringify({
            type: 'input',
            id: terminalId,
            data,
          })
        );
      });
      inputQueueRef.current = [];
    }
  }, [terminalId]);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Attempt to reconnect
  const reconnect = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionState('error');
      setError({
        message: 'Maximum reconnection attempts reached',
        recoverable: false,
        retryCount: reconnectAttempts,
      });
      return;
    }

    clearTimeouts();
    setReconnectAttempts((prev) => prev + 1);
    setConnectionState('connecting');
    setError({
      message: `Reconnecting... (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
      recoverable: true,
      retryCount: reconnectAttempts + 1,
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      // Re-trigger WebSocket setup using ref
      setupWebSocketRef.current?.();
    }, RECONNECT_DELAY);
  }, [reconnectAttempts, clearTimeouts]);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!xtermRef.current || !isMountedRef.current) return;

    console.log('[Terminal] Setting up WebSocket connection...');

    try {
      // Clean up existing connection
      if (attachAddonRef.current) {
        attachAddonRef.current.dispose();
        attachAddonRef.current = null;
      }
      if (wsRef.current) {
        // Remove event listeners before closing to prevent reconnection
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.onopen = null;

        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }

      clearTimeouts();
      setConnectionState('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws/terminal?token=${sessionToken}`
      );

      wsRef.current = ws;

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectionState === 'connecting' || connectionState === 'launching') {
          console.error('[Terminal] Connection timeout');
          setConnectionState('error');
          setError({
            message: 'Connection timeout - server not responding',
            recoverable: true,
            retryCount: reconnectAttempts,
          });
          ws.close();
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        console.log('[Terminal] WebSocket connected');
        clearTimeouts();
        setConnectionState('launching');
        setError(null);

        // Request terminal creation
        ws.send(
          JSON.stringify({
            type: 'create',
            id: terminalId,
            name,
            cwd,
            projectId,
            worktreeId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'created':
              console.log('[Terminal] Terminal created, attaching...');
              clearTimeouts();
              setConnectionState('ready');
              setReconnectAttempts(0); // Reset reconnect counter on success

              // Attach the terminal to WebSocket for bidirectional communication
              const attachAddon = new AttachAddon(ws, { bidirectional: false });
              attachAddonRef.current = attachAddon;
              xtermRef.current?.loadAddon(attachAddon);

              // Process any queued input
              processInputQueue();

              // Notify parent component
              onReady?.(xtermRef.current!);
              break;

            case 'output':
              // Handled by AttachAddon after 'created'
              if (message.id === terminalId && message.data && connectionState !== 'ready') {
                xtermRef.current?.write(message.data);
              }
              break;

            case 'exit':
              if (message.id === terminalId) {
                console.log('[Terminal] Process exited');
                xtermRef.current?.write('\r\n[Process exited]\r\n');
                setConnectionState('closed');
                onExit?.();
              }
              break;

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

            default:
              console.warn('[Terminal] Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('[Terminal] Error processing message:', err);
          setError({
            message: 'Failed to process server message',
            recoverable: true,
            retryCount: reconnectAttempts,
          });
        }
      };

      ws.onerror = (event) => {
        console.error('[Terminal] WebSocket error:', event);
        clearTimeouts();

        // Check if this is likely an authentication error (connection refused before open)
        if (wsRef.current?.readyState === WebSocket.CLOSED && reconnectAttempts === 0) {
          xtermRef.current?.write('\r\n[Authentication failed - please refresh the page]\r\n');
          setConnectionState('error');
          setError({
            message: 'Authentication failed - please refresh the page',
            recoverable: false,
            retryCount: reconnectAttempts,
          });
          return;
        }

        xtermRef.current?.write('\r\n[Connection error]\r\n');
        setConnectionState('error');
        setError({
          message: 'WebSocket connection error',
          recoverable: true,
          retryCount: reconnectAttempts,
        });
      };

      ws.onclose = (event) => {
        console.log('[Terminal] WebSocket closed:', event.code, event.reason);
        clearTimeouts();

        if (connectionState !== 'closed' && connectionState !== 'error') {
          // Check if this is a normal closure
          const isNormalClosure = event.code === 1000;

          // Check if this is an authentication error (code 1002 or 1008 indicates policy violation or auth failure)
          const isAuthError = event.code === 1002 || event.code === 1008 || event.code === 1006;
          const authErrorMessage = 'Authentication failed - please refresh the page';

          if (isAuthError) {
            xtermRef.current?.write(`\r\n[${authErrorMessage}]\r\n`);
            setConnectionState('error');
            setError({
              message: authErrorMessage,
              recoverable: false, // Auth errors are not recoverable by reconnecting
              retryCount: reconnectAttempts,
            });
            // Don't attempt to reconnect for auth errors
            return;
          }

          xtermRef.current?.write('\r\n[Connection closed]\r\n');
          setConnectionState('error');
          setError({
            message: event.reason || 'Connection closed unexpectedly',
            recoverable: !isNormalClosure, // Normal closure is not recoverable
            retryCount: reconnectAttempts,
          });

          // Attempt to reconnect if it wasn't a normal closure
          if (!isNormalClosure && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnect();
          }
        }
      };
    } catch (err) {
      console.error('[Terminal] Error setting up WebSocket:', err);
      setConnectionState('error');
      setError({
        message: err instanceof Error ? err.message : 'Failed to setup connection',
        recoverable: true,
        retryCount: reconnectAttempts,
      });
    }
  }, [
    terminalId,
    name,
    cwd,
    projectId,
    worktreeId,
    sessionToken,
    onReady,
    onExit,
    connectionState,
    reconnectAttempts,
    reconnect,
    processInputQueue,
    clearTimeouts,
  ]);

  // Store setupWebSocket in ref for reconnect
  useEffect(() => {
    setupWebSocketRef.current = setupWebSocket;
  }, [setupWebSocket]);

  // Initialize terminal
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (!terminalRef.current || isInitializedRef.current) return;

    console.log('[Terminal] Initializing terminal...');
    isInitializedRef.current = true;
    isMountedRef.current = true;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: getTerminalTheme(isDark),
      cols: 80,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Focus the terminal after initialization
    if (autoFocus) {
      terminal.focus();
    }

    // Setup WebSocket connection using the ref (to avoid dependency on setupWebSocket)
    setupWebSocketRef.current?.();

    // Handle terminal input - queue if not ready
    const disposable = terminal.onData((data) => {
      // Use refs to avoid dependency issues
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'input',
            id: terminalId,
            data,
          })
        );
      } else {
        inputQueueRef.current.push(data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
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
      console.log('[Terminal] Cleaning up...');
      isMountedRef.current = false;
      isInitializedRef.current = false;

      disposable.dispose();
      resizeObserver.disconnect();
      clearTimeouts();

      if (attachAddonRef.current) {
        attachAddonRef.current.dispose();
        attachAddonRef.current = null;
      }

      if (wsRef.current) {
        // Remove event listeners before cleanup to prevent spurious reconnection attempts
        const ws = wsRef.current;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.onopen = null;

        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          // Send close message if connection is open
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(
                JSON.stringify({
                  type: 'close',
                  id: terminalId,
                })
              );
            } catch (err) {
              console.error('[Terminal] Error sending close message:', err);
            }
          }
          ws.close();
        }
        wsRef.current = null;
      }

      terminal.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalId, isDark]); // Only re-run on terminalId or theme change - setupWebSocket is managed via ref

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(isDark);
    }
  }, [isDark]);

  // Handle autoFocus prop
  useEffect(() => {
    if (autoFocus && xtermRef.current) {
      xtermRef.current.focus();
    }
  }, [autoFocus]);

  // Click-to-focus handler
  const handleContainerClick = () => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  };

  // Render overlay based on connection state
  const renderOverlay = () => {
    if (connectionState === 'ready') return null;

    let overlayContent;
    let overlayColor = 'text-foreground';

    switch (connectionState) {
      case 'connecting':
        overlayContent = (
          <>
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div>
              {reconnectAttempts > 0
                ? `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
                : 'Connecting to server...'}
            </div>
          </>
        );
        break;

      case 'launching':
        overlayContent = (
          <>
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div>Launching terminal...</div>
          </>
        );
        break;

      case 'error':
        overlayColor = 'text-destructive';
        overlayContent = (
          <div className="flex flex-col items-center gap-3">
            <div className="text-lg font-semibold">Connection Error</div>
            <div className="text-center text-sm">{error?.message || 'Unknown error occurred'}</div>
            {error?.recoverable && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && (
              <button
                onClick={reconnect}
                className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Retry Connection
              </button>
            )}
            {reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && (
              <div className="mt-2 text-xs text-muted-foreground">
                Please refresh the page to try again
              </div>
            )}
          </div>
        );
        break;

      case 'closed':
        overlayColor = 'text-muted-foreground';
        overlayContent = (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-semibold">Terminal Closed</div>
            <div className="text-sm">The terminal session has ended</div>
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className={`flex flex-col items-center ${overlayColor}`}>{overlayContent}</div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full" onClick={handleContainerClick}>
      <div ref={terminalRef} className="h-full w-full" />
      {renderOverlay()}
    </div>
  );
}
