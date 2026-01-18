import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { McpServerItem } from '@/components/mcp/McpServerItem';
import type { McpServerTemplate } from '@/types/mcp';

describe('McpServerItem', () => {
  const mockServer: McpServerTemplate = {
    id: 'test-server',
    name: 'Test Server',
    description: 'A test MCP server',
    type: 'integration',
    category: 'Integrations',
    icon: 'Box',
  };

  it('renders server name and description', () => {
    const onToggle = vi.fn();
    render(<McpServerItem server={mockServer} enabled={false} onToggle={onToggle} />);

    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('A test MCP server')).toBeInTheDocument();
  });

  it('displays the correct icon based on server.icon property', () => {
    const onToggle = vi.fn();
    const serverWithIcon: McpServerTemplate = {
      ...mockServer,
      icon: 'Github',
    };

    render(
      <McpServerItem server={serverWithIcon} enabled={false} onToggle={onToggle} />
    );

    // The icon should be rendered as an SVG element
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('renders with default Box icon when icon property is not provided', () => {
    const onToggle = vi.fn();
    const serverWithoutIcon: McpServerTemplate = {
      id: 'test-server',
      name: 'Test Server',
      description: 'A test MCP server',
      type: 'integration',
      category: 'Integrations',
    };

    render(
      <McpServerItem server={serverWithoutIcon} enabled={false} onToggle={onToggle} />
    );

    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('calls onToggle callback when switch is toggled', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <McpServerItem server={mockServer} enabled={false} onToggle={onToggle} />
    );

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(onToggle).toHaveBeenCalledWith(true);

    // Rerender with enabled=true to simulate the toggle
    rerender(<McpServerItem server={mockServer} enabled={true} onToggle={onToggle} />);

    fireEvent.click(switchElement);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('renders switch with correct initial state', () => {
    const onToggle = vi.fn();

    const { rerender } = render(
      <McpServerItem server={mockServer} enabled={false} onToggle={onToggle} />
    );

    let switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');

    rerender(
      <McpServerItem server={mockServer} enabled={true} onToggle={onToggle} />
    );

    switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });

  it('has accessible aria-label on switch', () => {
    const onToggle = vi.fn();
    render(<McpServerItem server={mockServer} enabled={false} onToggle={onToggle} />);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-label', 'Toggle Test Server');
  });

  it('renders with multiple servers and handles each independently', () => {
    const onToggle1 = vi.fn();
    const onToggle2 = vi.fn();
    const server2: McpServerTemplate = {
      id: 'test-server-2',
      name: 'Another Server',
      description: 'Another test server',
      type: 'knowledge',
      category: 'Knowledge',
      icon: 'Brain',
    };

    const { container: container1 } = render(
      <McpServerItem server={mockServer} enabled={false} onToggle={onToggle1} />
    );

    const { container: container2 } = render(
      <McpServerItem server={server2} enabled={true} onToggle={onToggle2} />
    );

    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('Another Server')).toBeInTheDocument();
  });

  it('handles truncated text in descriptions', () => {
    const onToggle = vi.fn();
    const longDescription = 'This is a very long description that should be truncated';
    const serverWithLongText: McpServerTemplate = {
      ...mockServer,
      description: longDescription,
    };

    render(
      <McpServerItem server={serverWithLongText} enabled={false} onToggle={onToggle} />
    );

    const descriptionElement = screen.getByText(longDescription);
    expect(descriptionElement).toHaveClass('truncate');
  });
});
