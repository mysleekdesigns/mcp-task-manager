import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { TerminalManager } from './terminal-manager';
import { parse } from 'url';
import fetch from 'node-fetch';

interface TerminalMessage {
  type: 'create' | 'input' | 'resize' | 'close' | 'broadcast';
  id?: string;
  cwd?: string;
  projectId?: string;
  worktreeId?: string;
  data?: string;
  cols?: number;
  rows?: number;
  sessionToken?: string;
  name?: string;
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
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');

    // Only handle our terminal WebSocket path
    if (pathname === '/ws/terminal') {
      // Verify client before handling upgrade
      const params = new URLSearchParams(parse(request.url || '').query || '');
      const sessionToken = params.get('token');

      // In production, verify the session token against your auth system
      // For now, we require a token to be present
      if (!sessionToken) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // For all other paths (like /_next/webpack-hmr), let Next.js handle them
  });

  const terminalManager = new TerminalManager();

  // Track session tokens and terminal names per WebSocket connection
  const connectionData = new WeakMap<WebSocket, {
    sessionToken: string;
    terminals: Map<string, string>; // terminalId -> terminalName
  }>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');

    // Extract session token from query params
    const params = new URLSearchParams(parse(req.url || '').query || '');
    const sessionToken = params.get('token') || '';

    // Initialize connection data
    connectionData.set(ws, {
      sessionToken,
      terminals: new Map(),
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

              pty.onData((data) => {
                ws.send(JSON.stringify({
                  type: 'output',
                  id: terminalId,
                  data
                }));
              });

              pty.onExit(({ exitCode, signal }) => {
                ws.send(JSON.stringify({
                  type: 'exit',
                  id: terminalId,
                  exitCode,
                  signal
                }));

                // Capture session insights before killing the terminal
                const connData = connectionData.get(ws);
                if (connData) {
                  const name = connData.terminals.get(terminalId) || 'Terminal';
                  captureSessionInsights(
                    terminalManager,
                    terminalId,
                    name,
                    connData.sessionToken
                  ).catch(err => console.error('Failed to capture insights on exit:', err));
                }

                terminalManager.kill(terminalId);
              });

              ws.send(JSON.stringify({
                type: 'created',
                id: terminalId
              }));
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

            // Capture session insights before killing the terminal
            const closeConnData = connectionData.get(ws);
            if (closeConnData) {
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
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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
