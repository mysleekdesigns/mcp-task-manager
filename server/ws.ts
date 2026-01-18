import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { TerminalManager } from './terminal-manager';
import { parse } from 'url';

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

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', (data: Buffer) => {
      try {
        const message: TerminalMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'create':
            if (!message.id || !message.cwd || !message.projectId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing required fields for create'
              }));
              return;
            }

            // Store values to narrow TypeScript types
            const terminalId = message.id;
            const cwd = message.cwd;
            const projectId = message.projectId;
            const worktreeId = message.worktreeId;

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
