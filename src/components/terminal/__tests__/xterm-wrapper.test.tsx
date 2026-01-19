import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { XTermWrapper } from '../xterm-wrapper';
import { Terminal } from '@xterm/xterm';

// Mock xterm and addons
vi.mock('@xterm/xterm', () => {
  const TerminalMock = vi.fn(function (this: Record<string, unknown>, options?: Record<string, unknown>) {
    this.open = vi.fn();
    this.write = vi.fn();
    this.dispose = vi.fn();
    this.focus = vi.fn();
    this.loadAddon = vi.fn();
    this.onData = vi.fn(() => ({ dispose: vi.fn() }));
    this.options = options || {};
    this.cols = 80;
    this.rows = 24;
  });
  return {
    Terminal: TerminalMock,
  };
});

vi.mock('@xterm/addon-fit', () => {
  const FitAddonMock = vi.fn(function (this: Record<string, unknown>) {
    this.fit = vi.fn();
    this.dispose = vi.fn();
  });
  return {
    FitAddon: FitAddonMock,
  };
});

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
  }),
}));

interface MockWebSocketData {
  send: vi.Mock;
  close: vi.Mock;
  readyState: number;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: { code: number; reason: string }) => void) | null;
  instance?: MockWebSocketInstance;
}

interface MockWebSocketInstance extends Record<string, unknown> {
  readyState: number;
  send: vi.Mock;
  close: vi.Mock;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: { code: number; reason: string }) => void) | null;
}

describe('XTermWrapper - Phase 11.4 Terminal Polish', () => {
  let mockWebSocket: MockWebSocketData;

  const defaultProps = {
    terminalId: 'test-terminal-1',
    name: 'Test Terminal',
    cwd: '/test/path',
    projectId: 'test-project',
    sessionToken: 'test-token',
  };

  beforeEach(() => {
    // Mock WebSocket - using a constructor function so `new WebSocket()` works
    const WebSocketMock = vi.fn(function (this: MockWebSocketInstance) {
      mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: (WebSocket as unknown as Record<string, number>).OPEN,
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
      };

      // Add getter/setter for readyState
      Object.defineProperty(this, 'readyState', {
        get: () => mockWebSocket.readyState,
        set: (val: number) => {
          mockWebSocket.readyState = val;
        },
        configurable: true,
      });

      // Add getter/setter for event handlers
      Object.defineProperty(this, 'onopen', {
        get: () => mockWebSocket.onopen,
        set: (val: (() => void) | null) => {
          mockWebSocket.onopen = val;
        },
        configurable: true,
      });
      Object.defineProperty(this, 'onmessage', {
        get: () => mockWebSocket.onmessage,
        set: (val: ((event: { data: string }) => void) | null) => {
          mockWebSocket.onmessage = val;
        },
        configurable: true,
      });
      Object.defineProperty(this, 'onerror', {
        get: () => mockWebSocket.onerror,
        set: (val: ((event: Event) => void) | null) => {
          mockWebSocket.onerror = val;
        },
        configurable: true,
      });
      Object.defineProperty(this, 'onclose', {
        get: () => mockWebSocket.onclose,
        set: (val: ((event: { code: number; reason: string }) => void) | null) => {
          mockWebSocket.onclose = val;
        },
        configurable: true,
      });

      // Assign methods to this instance
      this.send = mockWebSocket.send;
      this.close = mockWebSocket.close;

      // Store the instance for test access through mockWebSocket reference
      mockWebSocket.instance = this;
    });

    (global as unknown as Record<string, unknown>).WebSocket = WebSocketMock;

    // Add WebSocket constants
    (global as unknown as Record<string, Record<string, number>>).WebSocket.CONNECTING = 0;
    (global as unknown as Record<string, Record<string, number>>).WebSocket.OPEN = 1;
    (global as unknown as Record<string, Record<string, number>>).WebSocket.CLOSING = 2;
    (global as unknown as Record<string, Record<string, number>>).WebSocket.CLOSED = 3;

    // Mock ResizeObserver - also needs to be a constructor
    const ResizeObserverMock = vi.fn(function (this: Record<string, unknown>) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });

    (global as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverMock;
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
      if (mockWebSocket.instance?.onopen) {
        mockWebSocket.instance.onopen();
      }

      await waitFor(() => {
        expect(screen.getByText(/Launching terminal/i)).toBeInTheDocument();
      });
    });

    it('should transition to ready state after terminal created', async () => {
      const onReady = vi.fn();
      render(<XTermWrapper {...defaultProps} onReady={onReady} />);

      // Simulate WebSocket connection
      if (mockWebSocket.instance?.onopen) {
        mockWebSocket.instance.onopen();
      }

      // Simulate terminal creation response
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
      act(() => {
        if (mockWebSocket.instance?.onerror) {
          mockWebSocket.instance.onerror(new Event('error'));
        }
      });

      await waitFor(
        () => {
          // Check for error heading and retry button
          expect(screen.getByText('Connection Error')).toBeInTheDocument();
          expect(screen.getByText('Retry Connection')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Input Queue', () => {
    it('should queue input during connection phase', () => {
      render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as unknown as vi.Mock).mock.results[0]?.value;

      // Get the onData callback
      const onDataCallback = terminalInstance?.onData.mock.calls[0]?.[0] as ((input: string) => void) | undefined;

      // Before connection is ready, WebSocket.OPEN should not be set
      mockWebSocket.instance.readyState = (WebSocket as unknown as Record<string, number>).CONNECTING;

      // Simulate user typing
      if (onDataCallback) {
        onDataCallback('test input');
      }

      // Should NOT send immediately when not connected
      expect(mockWebSocket.instance.send).not.toHaveBeenCalled();
    });

    it('should process queued input after connection is ready', async () => {
      render(<XTermWrapper {...defaultProps} />);
      const terminalInstance = (Terminal as unknown as vi.Mock).mock.results[0]?.value;
      const onDataCallback = terminalInstance?.onData.mock.calls[0]?.[0] as ((input: string) => void) | undefined;

      // Queue input while connecting
      mockWebSocket.instance.readyState = (WebSocket as unknown as Record<string, number>).CONNECTING;
      if (onDataCallback) {
        onDataCallback('queued input 1');
        onDataCallback('queued input 2');
      }

      // Now connect
      mockWebSocket.instance.readyState = (WebSocket as unknown as Record<string, number>).OPEN;
      if (mockWebSocket.instance?.onopen) {
        mockWebSocket.instance.onopen();
      }

      // Simulate terminal creation
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
          data: JSON.stringify({ type: 'created', id: defaultProps.terminalId }),
        });
      }

      await waitFor(() => {
        // Should have sent create message + queued inputs
        expect(mockWebSocket.instance.send).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should show retry button on recoverable error', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate WebSocket error
      if (mockWebSocket.instance?.onerror) {
        mockWebSocket.instance.onerror(new Event('error'));
      }

      await waitFor(
        () => {
          expect(screen.getByText(/Retry Connection/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should attempt reconnection on unexpected close', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate WebSocket close with non-normal code (use 1011 which is not an auth error)
      act(() => {
        if (mockWebSocket.instance?.onclose) {
          mockWebSocket.instance.onclose({ code: 1011, reason: 'Server error' });
        }
      });

      await waitFor(
        () => {
          expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show max reconnect message after max attempts', async () => {
      render(<XTermWrapper {...defaultProps} />);

      // Simulate multiple connection failures
      for (let i = 0; i < 4; i++) {
        if (mockWebSocket.instance?.onclose) {
          mockWebSocket.instance.onclose({ code: 1006, reason: 'Connection failed' });
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
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
      const terminalInstance = (Terminal as unknown as vi.Mock).mock.results[0]?.value;

      // Connect and create terminal
      if (mockWebSocket.instance?.onopen) {
        mockWebSocket.instance.onopen();
      }

      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
          data: JSON.stringify({ type: 'created', id: defaultProps.terminalId }),
        });
      }

      // Simulate output message
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
      const terminalInstance = (Terminal as unknown as vi.Mock).mock.results[0]?.value;
      const writeCallCount = terminalInstance.write.mock.calls.length;

      // Simulate claude_status message
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
      const terminalInstance = (Terminal as unknown as vi.Mock).mock.results[0]?.value;

      unmount();

      expect(terminalInstance.dispose).toHaveBeenCalled();
      expect(mockWebSocket.instance.close).toHaveBeenCalled();
    });

    it('should clear all timeouts on cleanup', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { unmount } = render(<XTermWrapper {...defaultProps} />);

      // Trigger a reconnect timeout
      if (mockWebSocket.instance?.onclose) {
        mockWebSocket.instance.onclose({ code: 1006, reason: 'Test' });
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
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
      if (mockWebSocket.instance?.onmessage) {
        mockWebSocket.instance.onmessage({
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
