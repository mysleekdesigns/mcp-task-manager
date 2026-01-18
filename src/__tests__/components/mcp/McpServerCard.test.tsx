import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { McpServerCard } from '@/components/mcp/McpServerCard';
import type { McpConfig } from '@/types/mcp';

describe('McpServerCard', () => {
  const mockConfig: McpConfig = {
    id: 'config-1',
    name: 'Custom Database Server',
    type: 'database',
    enabled: true,
    config: {
      host: 'localhost',
      port: 5432,
    },
    projectId: 'proj-1',
    createdAt: new Date().toISOString(),
  };

  it('renders custom server name', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Custom Database Server')).toBeInTheDocument();
  });

  it('displays server type', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Type: database')).toBeInTheDocument();
  });

  it('renders edit button with correct aria-label', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const editButton = screen.getByRole('button', {
      name: /Edit Custom Database Server/i,
    });
    expect(editButton).toBeInTheDocument();
  });

  it('renders delete button with correct aria-label', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: /Delete Custom Database Server/i,
    });
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const editButton = screen.getByRole('button', {
      name: /Edit Custom Database Server/i,
    });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: /Delete Custom Database Server/i,
    });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders toggle switch with correct initial state', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    let switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');

    // Render with disabled config
    const disabledConfig = { ...mockConfig, enabled: false };
    rerender(
      <McpServerCard
        config={disabledConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onToggle when switch is toggled', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('has accessible aria-label on toggle switch', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute(
      'aria-label',
      'Toggle Custom Database Server'
    );
  });

  it('renders all buttons without disabled state by default', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const editButton = screen.getByRole('button', {
      name: /Edit Custom Database Server/i,
    });
    const deleteButton = screen.getByRole('button', {
      name: /Delete Custom Database Server/i,
    });

    expect(editButton).not.toBeDisabled();
    expect(deleteButton).not.toBeDisabled();
  });

  it('handles config with null config object', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const configWithoutSettings = {
      ...mockConfig,
      config: null,
    };

    render(
      <McpServerCard
        config={configWithoutSettings}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Custom Database Server')).toBeInTheDocument();
    expect(screen.getByText('Type: database')).toBeInTheDocument();
  });

  it('handles long server names with truncation', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const longNameConfig = {
      ...mockConfig,
      name: 'This is a very long server name that should be truncated in the UI',
    };

    render(
      <McpServerCard
        config={longNameConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const nameElement = screen.getByText(longNameConfig.name);
    expect(nameElement).toHaveClass('truncate');
  });

  it('has delete button with destructive styling', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <McpServerCard
        config={mockConfig}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: /Delete Custom Database Server/i,
    });

    expect(deleteButton).toHaveClass('text-destructive');
  });
});
