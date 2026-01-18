import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { McpServerList } from '@/components/mcp/McpServerList';
import type { McpServerTemplate, McpConfig } from '@/types/mcp';

describe('McpServerList', () => {
  const mockServers: McpServerTemplate[] = [
    {
      id: 'documentation-1',
      name: 'Documentation Server',
      description: 'Serves documentation',
      type: 'documentation',
      category: 'Documentation',
      icon: 'FileText',
    },
    {
      id: 'documentation-2',
      name: 'Search Server',
      description: 'Search functionality',
      type: 'documentation',
      category: 'Documentation',
      icon: 'FileText',
    },
  ];

  const mockConfigs: McpConfig[] = [
    {
      id: 'config-1',
      name: 'Documentation Server',
      type: 'documentation-1',
      enabled: true,
      config: null,
      projectId: 'proj-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'config-2',
      name: 'Search Server',
      type: 'documentation-2',
      enabled: false,
      config: null,
      projectId: 'proj-1',
      createdAt: new Date().toISOString(),
    },
  ];

  it('renders category title', () => {
    const onToggle = vi.fn();
    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('displays server count in description', () => {
    const onToggle = vi.fn();
    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('2 servers available')).toBeInTheDocument();
  });

  it('displays "server" singular when only one server', () => {
    const onToggle = vi.fn();
    const singleServer = mockServers.slice(0, 1);

    render(
      <McpServerList
        category="Documentation"
        servers={singleServer}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('1 server available')).toBeInTheDocument();
  });

  it('renders all servers in the list', () => {
    const onToggle = vi.fn();
    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('Documentation Server')).toBeInTheDocument();
    expect(screen.getByText('Search Server')).toBeInTheDocument();
  });

  it('returns null when servers array is empty', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <McpServerList category="Empty" servers={[]} configs={[]} onToggle={onToggle} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('passes correct enabled state to each server item', () => {
    const onToggle = vi.fn();
    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);

    // First server should be enabled
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');

    // Second server should be disabled
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onToggle with correct server id and enabled state', () => {
    const onToggle = vi.fn();
    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    const switches = screen.getAllByRole('switch');

    // Toggle first server
    fireEvent.click(switches[0]);
    expect(onToggle).toHaveBeenCalledWith('documentation-1', false);

    // Toggle second server
    fireEvent.click(switches[1]);
    expect(onToggle).toHaveBeenCalledWith('documentation-2', true);
  });

  it('handles servers without matching config (defaults to disabled)', () => {
    const onToggle = vi.fn();
    const serverWithoutConfig: McpServerTemplate = {
      id: 'unknown-server',
      name: 'Unknown Server',
      description: 'No config for this',
      type: 'integration',
      category: 'Documentation',
    };

    const serversWithUnknown = [...mockServers, serverWithoutConfig];

    render(
      <McpServerList
        category="Documentation"
        servers={serversWithUnknown}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    const switches = screen.getAllByRole('switch');
    // The third server (unknown-server) should be disabled by default
    expect(switches[2]).toHaveAttribute('aria-checked', 'false');
  });

  it('renders McpServerItem components for each server', () => {
    const onToggle = vi.fn();
    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={mockConfigs}
        onToggle={onToggle}
      />
    );

    // Check that all server names and descriptions are rendered
    expect(screen.getByText('Documentation Server')).toBeInTheDocument();
    expect(screen.getByText('Serves documentation')).toBeInTheDocument();
    expect(screen.getByText('Search Server')).toBeInTheDocument();
    expect(screen.getByText('Search functionality')).toBeInTheDocument();
  });

  it('correctly maps server id to config for enabled state lookup', () => {
    const onToggle = vi.fn();

    const configs: McpConfig[] = [
      {
        id: 'config-1',
        name: 'Doc Server',
        type: 'documentation-1', // Matches server id
        enabled: true,
        config: null,
        projectId: 'proj-1',
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <McpServerList
        category="Documentation"
        servers={mockServers}
        configs={configs}
        onToggle={onToggle}
      />
    );

    const switches = screen.getAllByRole('switch');
    // First server matches the config
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    // Second server doesn't have a matching config
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });
});
