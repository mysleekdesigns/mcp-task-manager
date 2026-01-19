import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { XTermWrapper } from '../xterm-wrapper';
import { Terminal } from '@xterm/xterm';

// Mock xterm and addons
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    focus: vi.fn(),
    loadAddon: vi.fn(),
    onData: vi.fn(() => ({ dispose: vi.fn() })),
    options: {},
    cols: 80,
    rows: 24,
  })),
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn(() => ({
    fit: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
  }),
}));

describe('XTermWrapper - Phase 11.4 Terminal Polish', () => {
  let mockWebSocket: any;
  const defaultProps = {
    terminalId: 'test-terminal-1',
    name: 'Test Terminal',
    cwd: '/test/path',
    projectId: 'test-project',
    sessionToken: 'test-token',
  };

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.OPEN,
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      onclose: null as any,
    };

    (global as any).WebSocket = vi.fn(() => mockWebSocket);
    (global as any).ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection State Management', () => {
    it('should show connecting state initially', () => {
      render(<XTermWrapper {...defaultProps} />);
      expect(screen.getByText(/Connecting to server/i)).toBeInTheDocument();
    });

    it('should transition to launching state after WebSocket opens', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate WebSocket connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      await waitFor(() => {
        expect(screen.getByText(/Launching terminal/i)).toBeInTheDocument();
      });
    });

    it('should transition to ready state after terminal created', async () => {
      const onReady = vi.fn();
      render(<XTermWrapper {...defaultProps} onReady={onReady} />);

      // Simulate WebSocket connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Simulate terminal creation response
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({ type: 'created', id: defaultProps.terminalId }),
        });
      }

      await waitFor(() => {
        expect(onReady).toHaveBeenCalled();
      });
    });

    it('should show error state on connection failure', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate WebSocket error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      await waitFor(() => {
        expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Input Queue', () => {
    it('should queue input during connection phase', () => {
      const { container } = render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as any).mock.results[0]?.value;

      // Get the onData callback
      const onDataCallback = terminalInstance?.onData.mock.calls[0]?.[0];

      // Before connection is ready, WebSocket.OPEN should not be set
      mockWebSocket.readyState = WebSocket.CONNECTING;

      // Simulate user typing
      if (onDataCallback) {
        onDataCallback('test input');
      }

      // Should NOT send immediately when not connected
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should process queued input after connection is ready', async () => {
      render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as any).mock.results[0]?.value;
      const onDataCallback = terminalInstance?.onData.mock.calls[0]?.[0];

      // Queue input while connecting
      mockWebSocket.readyState = WebSocket.CONNECTING;
      if (onDataCallback) {
        onDataCallback('queued input 1');
        onDataCallback('queued input 2');
      }

      // Now connect
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      // Simulate terminal creation
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({ type: 'created', id: defaultProps.terminalId }),
        });
      }

      await waitFor(() => {
        // Should have sent create message + queued inputs
        expect(mockWebSocket.send).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should show retry button on recoverable error', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate WebSocket error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      await waitFor(() => {
        expect(screen.getByText(/Retry Connection/i)).toBeInTheDocument();
      });
    });

    it('should attempt reconnection on unexpected close', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate WebSocket close with non-normal code
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1006, reason: 'Abnormal closure' });
      }

      await waitFor(() => {
        expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
      });
    });

    it('should show max reconnect message after max attempts', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate multiple connection failures
      for (let i = 0; i < 4; i++) {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection failed' });
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await waitFor(
        () => {
          expect(screen.getByText(/Please refresh the page/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should handle server error messages gracefully', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate server error message
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'error',
            message: 'Failed to spawn terminal',
          }),
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/Failed to spawn terminal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Message Routing', () => {
    it('should handle output messages and write to terminal', async () => {
      render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as any).mock.results[0]?.value;

      // Connect and create terminal
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({ type: 'created', id: defaultProps.terminalId }),
        });
      }

      // Simulate output message
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'output',
            id: defaultProps.terminalId,
            data: 'Hello from terminal\r\n',
          }),
        });
      }

      await waitFor(() => {
        expect(terminalInstance.write).toHaveBeenCalledWith('Hello from terminal\r\n');
      });
    });

    it('should handle claude_status messages silently', async () => {
      render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as any).mock.results[0]?.value;
      const writeCallCount = terminalInstance.write.mock.calls.length;

      // Simulate claude_status message
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'claude_status',
            status: 'working',
            message: 'Processing request...',
          }),
        });
      }

      // Should not write claude_status to terminal
      expect(terminalInstance.write.mock.calls.length).toBe(writeCallCount);
    });

    it('should log warning for unknown message types', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<XTermWrapper {...defaultProps} />);

      // Simulate unknown message type
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'unknown_type',
            data: 'some data',
          }),
        });
      }

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unknown message type'),
          'unknown_type',
          expect.any(Object)
        );
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as any).mock.results[0]?.value;

      unmount();

      expect(terminalInstance.dispose).toHaveBeenCalled();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should clear all timeouts on cleanup', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { unmount } = render(<XTermWrapper {...defaultProps} />);

      // Trigger a reconnect timeout
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1006, reason: 'Test' });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('User Experience', () => {
    it('should show loading spinner during connection states', () => {
      render(<XTermWrapper {...defaultProps} />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should call onExit when terminal process exits', async () => {
      const onExit = vi.fn();
      render(<XTermWrapper {...defaultProps} onExit={onExit} />);

      // Simulate terminal exit
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'exit',
            id: defaultProps.terminalId,
            exitCode: 0,
          }),
        });
      }

      await waitFor(() => {
        expect(onExit).toHaveBeenCalled();
      });
    });

    it('should display user-friendly error messages', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate connection timeout
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'error',
            message: 'Connection timeout - server not responding',
          }),
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/Connection timeout/i)).toBeInTheDocument();
      });
    });
  });
});
