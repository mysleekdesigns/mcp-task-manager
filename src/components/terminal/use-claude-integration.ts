import { useEffect, useState, useRef } from 'react';

export type ClaudeStatus = 'launching' | 'active' | 'exited' | 'failed' | null;

interface UseClaudeIntegrationProps {
  terminalId: string;
  ws: WebSocket | null;
  autoLaunch?: boolean;
}

interface ClaudeIntegration {
  status: ClaudeStatus;
  launchClaude: () => void;
}

/**
 * Hook to manage Claude Code integration in a terminal
 */
export function useClaudeIntegration({
  terminalId,
  ws,
  autoLaunch = true,
}: UseClaudeIntegrationProps): ClaudeIntegration {
  const [status, setStatus] = useState<ClaudeStatus>(null);
  const hasAutoLaunched = useRef(false);

  // Function to manually launch Claude
  const launchClaude = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      console.log(`[Claude] Launching Claude for terminal ${terminalId}`);
      ws.send(
        JSON.stringify({
          type: 'launch_claude',
          id: terminalId,
        })
      );
    } else {
      console.warn('[Claude] Cannot launch Claude: WebSocket not connected');
    }
  };

  // Listen for Claude status messages from the WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'claude_status' && message.id === terminalId) {
          console.log(`[Claude] Status updated for terminal ${terminalId}:`, message.status);
          setStatus(message.status);
        }
      } catch (err) {
        console.error('[Claude] Error parsing message:', err);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, terminalId]);

  // Auto-launch Claude when terminal is ready (if enabled)
  useEffect(() => {
    if (
      autoLaunch &&
      !hasAutoLaunched.current &&
      ws?.readyState === WebSocket.OPEN &&
      status === null
    ) {
      hasAutoLaunched.current = true;
      console.log(`[Claude] Auto-launching Claude for terminal ${terminalId}`);
      // Small delay to ensure terminal is fully initialized
      setTimeout(launchClaude, 100);
    }
  }, [autoLaunch, ws, status, terminalId]);

  return {
    status,
    launchClaude,
  };
}
