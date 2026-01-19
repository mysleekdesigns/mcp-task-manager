import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { TerminalManager } from './terminal-manager';
import { validateSessionToken } from './auth-validator';
import { parse } from 'url';
import fetch from 'node-fetch';

interface TerminalMessage {
  type: 'create' | 'input' | 'resize' | 'close' | 'broadcast' | 'launch_claude' | 'get_claude_status';
  id?: string;
  cwd?: string;
  projectId?: string;
  worktreeId?: string;
  data?: string;
  cols?: number;
  rows?: number;
  sessionToken?: string;
  name?: string;
  autoLaunchClaude?: boolean;
}

/**
 * Capture session insights when a terminal is closed
 */
async function captureSessionInsights(
  terminalManager: TerminalManager,
  terminalId: string,
  terminalName: string,
  sessionToken: string
): Promise<void> {
  try {
    const metadata = terminalManager.getSessionMetadata(terminalId);
    if (!metadata) {
      console.log(`No session metadata found for terminal ${terminalId}`);
      return;
    }

    // Skip if session was very short (less than 30 seconds)
    const duration = metadata.endTime.getTime() - metadata.startTime.getTime();
    if (duration < 30000) {
      console.log(`Skipping insight capture for short session (${duration}ms)`);
      return;
    }

    // Call the API to capture insights
    const response = await fetch('http://localhost:3000/api/memories/capture-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authjs.session-token=${sessionToken}`,
      },
      body: JSON.stringify({
        terminalId,
        terminalName,
        projectId: metadata.projectId,
        outputBuffer: metadata.outputBuffer,
        startTime: metadata.startTime.toISOString(),
        endTime: metadata.endTime.toISOString(),
        commandCount: metadata.commandCount,
        worktreeId: metadata.worktreeId,
        cwd: metadata.cwd,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.skipped) {
        console.log(`Session insights skipped: ${result.message}`);
      } else {
        console.log(`Session insights captured for terminal ${terminalId}:`, {
          memoryId: result.memory.id,
          insightCount: result.summary.insightCount,
          keyTopics: result.summary.keyTopics,
        });
      }
    } else {
      const error = await response.text();
      console.error(`Failed to capture session insights: ${response.status} ${error}`);
    }
  } catch (error) {
    console.error('Error capturing session insights:', error);
  }
}

export function setupWebSocket(server: HTTPServer) {
  // Create WebSocket server without attaching to HTTP server directly
  // This prevents conflicts with Next.js HMR WebSocket
  const wss = new WebSocketServer({
    noServer: true,
  });

  // Handle HTTP upgrade events manually
  server.on('upgrade', async (request, socket, head) => {
    const { pathname } = parse(request.url || '');

    // Only handle our terminal WebSocket path
    if (pathname === '/ws/terminal') {
      // Verify client before handling upgrade
      const params = new URLSearchParams(parse(request.url || '').query || '');
      const sessionToken = params.get('token');

      if (!sessionToken) {
        console.log('WebSocket upgrade rejected: No token provided');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Validate the session token
      const validation = await validateSessionToken(sessionToken);
      if (!validation.valid) {
        console.log('WebSocket upgrade rejected:', validation.error);
        socket.write(`HTTP/1.1 401 Unauthorized\r\nX-Auth-Error: ${validation.error}\r\n\r\n`);
        socket.destroy();
        return;
      }

      console.log(`WebSocket upgrade authorized for user ${validation.userId}`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        // Pass the validated userId to the connection handler
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ws as any).userId = validation.userId;
        wss.emit('connection', ws, request);
      });
    }
    // For all other paths (like /_next/webpack-hmr), let Next.js handle them
  });

  const terminalManager = new TerminalManager();

  // Track session tokens, user IDs, terminal names, and auto-launch timeouts per WebSocket connection
  const connectionData = new WeakMap<WebSocket, {
    sessionToken: string;
    userId: string;
    terminals: Map<string, string>; // terminalId -> terminalName
    autoLaunchTimeouts: Map<string, NodeJS.Timeout>; // terminalId -> timeout
    keepaliveInterval?: NodeJS.Timeout;
  }>();

  wss.on('connection', (ws: WebSocket, req) => {
    // Get the authenticated userId that was attached during upgrade
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (ws as any).userId as string;
    console.log('[WebSocket] Client connected:', userId);

    // Extract session token from query params
    const params = new URLSearchParams(parse(req.url || '').query || '');
    const sessionToken = params.get('token') || '';

    // Set up WebSocket keepalive to prevent premature disconnection
    const keepaliveInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // Ping every 30 seconds

    // Initialize connection data
    connectionData.set(ws, {
      sessionToken,
      userId,
      terminals: new Map(),
      autoLaunchTimeouts: new Map(),
      keepaliveInterval,
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: TerminalMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'create':
            if (!message.id || !message.cwd || !message.projectId || !message.name) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing required fields for create'
              }));
              return;
            }

            // Store values to narrow TypeScript types
            const terminalId = message.id;
            const terminalName = message.name;
            const cwd = message.cwd;
            const projectId = message.projectId;
            const worktreeId = message.worktreeId;

            // Track terminal name for this connection
            const connData = connectionData.get(ws);
            if (connData) {
              connData.terminals.set(terminalId, terminalName);
            }

            try {
              const pty = terminalManager.spawn(
                terminalId,
                cwd,
                projectId,
                worktreeId
              );

              // Track previous Claude status to detect changes
              let previousClaudeStatus = terminalManager.getClaudeStatus(terminalId);

              pty.onData((data) => {
                // Only send if WebSocket is still open
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'output',
                    id: terminalId,
                    data
                  }));

                  // Check if Claude status changed
                  const currentStatus = terminalManager.getClaudeStatus(terminalId);
                  if (currentStatus !== previousClaudeStatus) {
                    previousClaudeStatus = currentStatus;
                    ws.send(JSON.stringify({
                      type: 'claude_status',
                      id: terminalId,
                      status: currentStatus,
                      success: true
                    }));
                  }
                }
              });

              pty.onExit(({ exitCode, signal }) => {
                // Clear any pending auto-launch timeout
                const connData = connectionData.get(ws);
                if (connData) {
                  const timeout = connData.autoLaunchTimeouts.get(terminalId);
                  if (timeout) {
                    clearTimeout(timeout);
                    connData.autoLaunchTimeouts.delete(terminalId);
                    console.log(`[WebSocket] Cleared auto-launch timeout for terminal ${terminalId}`);
                  }
                }

                // Notify client of exit
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'exit',
                    id: terminalId,
                    exitCode,
                    signal
                  }));
                }

                // Capture session insights before killing the terminal
                if (connData) {
                  const name = connData.terminals.get(terminalId) || 'Terminal';
                  captureSessionInsights(
                    terminalManager,
                    terminalId,
                    name,
                    connData.sessionToken
                  ).catch(err => console.error('[WebSocket] Failed to capture insights on exit:', err));
                }

                terminalManager.kill(terminalId);
              });

              // Give the PTY a moment to stabilize before notifying client
              // This prevents race conditions where the client might disconnect before the shell is ready
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

              // Auto-launch Claude after terminal is created (with delay for shell prompt)
              if (message.autoLaunchClaude !== false) {
                const connData = connectionData.get(ws);
                const timeout = setTimeout(() => {
                  // Remove timeout from tracking once it fires
                  if (connData) {
                    connData.autoLaunchTimeouts.delete(terminalId);
                  }

                  // Check if terminal session still exists before launching
                  if (!terminalManager.get(terminalId)) {
                    console.log(`[WebSocket] Skipping Claude auto-launch: terminal ${terminalId} no longer exists`);
                    return;
                  }

                  const success = terminalManager.launchClaude(terminalId);
                  const status = terminalManager.getClaudeStatus(terminalId);
                  ws.send(JSON.stringify({
                    type: 'claude_status',
                    id: terminalId,
                    status,
                    success
                  }));
                }, 500); // Wait 500ms for shell prompt

                // Track timeout so it can be cancelled if terminal exits early
                if (connData) {
                  connData.autoLaunchTimeouts.set(terminalId, timeout);
                }
              }
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to create terminal: ${error instanceof Error ? error.message : 'Unknown error'}`
              }));
            }
            break;

          case 'input':
            if (!message.id || message.data === undefined) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing id or data for input'
              }));
              return;
            }
            // Store values to narrow TypeScript types
            const inputTerminalId = message.id;
            const inputData = message.data;
            terminalManager.write(inputTerminalId, inputData);
            break;

          case 'resize':
            if (!message.id || !message.cols || !message.rows) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing id, cols, or rows for resize'
              }));
              return;
            }
            // Store values to narrow TypeScript types
            const resizeTerminalId = message.id;
            const cols = message.cols;
            const rows = message.rows;
            terminalManager.resize(resizeTerminalId, cols, rows);
            break;

          case 'close':
            if (!message.id) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing id for close'
              }));
              return;
            }
            // Store value to narrow TypeScript type
            const closeTerminalId = message.id;

            // Clear any pending auto-launch timeout
            const closeConnData = connectionData.get(ws);
            if (closeConnData) {
              const timeout = closeConnData.autoLaunchTimeouts.get(closeTerminalId);
              if (timeout) {
                clearTimeout(timeout);
                closeConnData.autoLaunchTimeouts.delete(closeTerminalId);
                console.log(`[WebSocket] Cleared auto-launch timeout for closing terminal ${closeTerminalId}`);
              }

              // Capture session insights before killing the terminal
              const terminalName = closeConnData.terminals.get(closeTerminalId) || 'Terminal';
              captureSessionInsights(
                terminalManager,
                closeTerminalId,
                terminalName,
                closeConnData.sessionToken
              ).catch(err => console.error('Failed to capture insights on close:', err));

              // Remove terminal from tracking
              closeConnData.terminals.delete(closeTerminalId);
            }

            terminalManager.kill(closeTerminalId);
            ws.send(JSON.stringify({
              type: 'closed',
              id: closeTerminalId
            }));
            break;

          case 'broadcast':
            if (!message.projectId || message.data === undefined) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing projectId or data for broadcast'
              }));
              return;
            }
            // Broadcast input to all terminals in the project
            const sessions = terminalManager.getAllForProject(message.projectId);
            sessions.forEach((session) => {
              terminalManager.write(session.id, message.data!);
            });
            ws.send(JSON.stringify({
              type: 'broadcasted',
              count: sessions.length
            }));
            break;

          case 'launch_claude':
            if (!message.id) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing id for launch_claude'
              }));
              return;
            }
            // Store value to narrow TypeScript type
            const launchTerminalId = message.id;
            const success = terminalManager.launchClaude(launchTerminalId);
            const status = terminalManager.getClaudeStatus(launchTerminalId);
            ws.send(JSON.stringify({
              type: 'claude_status',
              id: launchTerminalId,
              status,
              success
            }));
            break;

          case 'get_claude_status':
            if (!message.id) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing id for get_claude_status'
              }));
              return;
            }
            // Store value to narrow TypeScript type
            const statusTerminalId = message.id;
            const claudeStatus = terminalManager.getClaudeStatus(statusTerminalId);
            ws.send(JSON.stringify({
              type: 'claude_status',
              id: statusTerminalId,
              status: claudeStatus,
              success: claudeStatus !== null
            }));
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected:', userId);

      // Clean up keepalive interval
      const connData = connectionData.get(ws);
      if (connData) {
        if (connData.keepaliveInterval) {
          clearInterval(connData.keepaliveInterval);
        }

        // Clear all auto-launch timeouts
        connData.autoLaunchTimeouts.forEach((timeout) => {
          clearTimeout(timeout);
        });
        connData.autoLaunchTimeouts.clear();

        console.log(`[WebSocket] Cleaned up ${connData.terminals.size} terminal(s) for user ${userId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error for user', userId, ':', error);
    });

    // Handle pong responses (keepalive)
    ws.on('pong', () => {
      // Optional: log periodic pong responses for debugging
      // console.log('[WebSocket] Received pong from', userId);
    });
  });

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    console.log('Cleaning up terminal sessions...');
    terminalManager.killAll();
  });

  process.on('SIGINT', () => {
    console.log('Cleaning up terminal sessions...');
    terminalManager.killAll();
    process.exit(0);
  });

  return wss;
}
