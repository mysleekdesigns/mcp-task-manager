# MCP Components Testing Guide

This guide covers testing for Phase 8 MCP Integration UI components using Vitest and React Testing Library.

## Table of Contents

1. [Setup](#setup)
2. [Running Tests](#running-tests)
3. [Writing New Tests](#writing-new-tests)
4. [Component Testing Patterns](#component-testing-patterns)
5. [Mocking](#mocking)
6. [Best Practices](#best-practices)
7. [Debugging Tests](#debugging-tests)

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

All testing dependencies are already installed. To verify:

```bash
npm install
```

Tests are configured via:
- `/vitest.config.ts` - Vitest configuration
- `/src/__tests__/setup.ts` - Global test setup
- `package.json` - Test scripts

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- McpServerItem.test.tsx

# Run MCP component tests only
npm run test:run -- src/__tests__/components/mcp/

# Run with coverage report
npm run test:coverage -- src/__tests__/components/mcp/

# Run with UI dashboard
npm test -- --ui
```

### Test Script in package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Writing New Tests

### Test File Structure

Create test files alongside or in `src/__tests__/components/mcp/`:

```typescript
// src/__tests__/components/mcp/ComponentName.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentName } from '@/components/mcp/ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should render component', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Basic Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  const mockCallback = vi.fn();

  it('renders and interacts', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<MyComponent onClick={mockCallback} />);

    // Act
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    // Assert
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
```

## Component Testing Patterns

### 1. Rendering Tests

```typescript
it('renders component with props', () => {
  render(
    <McpServerItem
      server={mockServer}
      enabled={true}
      onToggle={vi.fn()}
    />
  );

  expect(screen.getByText(mockServer.name)).toBeInTheDocument();
  expect(screen.getByText(mockServer.description)).toBeInTheDocument();
});
```

### 2. User Interaction Tests

```typescript
it('handles button clicks', async () => {
  const user = userEvent.setup();
  const onEdit = vi.fn();

  render(
    <McpServerCard
      config={mockConfig}
      onEdit={onEdit}
      onToggle={vi.fn()}
      onDelete={vi.fn()}
    />
  );

  const editButton = screen.getByRole('button', { name: /edit/i });
  await user.click(editButton);

  expect(onEdit).toHaveBeenCalledTimes(1);
});
```

### 3. Form Validation Tests

```typescript
it('validates form inputs', async () => {
  const user = userEvent.setup();
  render(<AddServerModal projectId="proj-1" onSave={vi.fn()} />);

  const submitButton = screen.getByRole('button', { name: /add server/i });

  // Initially disabled (empty form)
  expect(submitButton).toBeDisabled();

  // Fill name field
  const nameInput = screen.getByLabelText('Server Name');
  await user.type(nameInput, 'Test Server');

  // Still disabled (type field empty)
  expect(submitButton).toBeDisabled();
});
```

### 4. State Management Tests

```typescript
it('manages component state', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <McpServerItem server={mockServer} enabled={false} onToggle={vi.fn()} />
  );

  let switchElement = screen.getByRole('switch');
  expect(switchElement).toHaveAttribute('aria-checked', 'false');

  // Update state
  rerender(
    <McpServerItem server={mockServer} enabled={true} onToggle={vi.fn()} />
  );

  switchElement = screen.getByRole('switch');
  expect(switchElement).toHaveAttribute('aria-checked', 'true');
});
```

### 5. Async Tests

```typescript
it('handles async operations', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValueOnce(undefined);

  render(<AddServerModal projectId="proj-1" onSave={onSave} />);

  // Trigger modal
  const trigger = screen.getByRole('button', { name: /add/i });
  await user.click(trigger);

  // Fill form and submit
  const submitButton = screen.getByRole('button', { name: /add server/i });
  await user.click(submitButton);

  // Wait for async operation
  await waitFor(() => {
    expect(onSave).toHaveBeenCalled();
  });
});
```

## Mocking

### Mock Functions

```typescript
import { vi } from 'vitest';

// Create mock function
const onToggle = vi.fn();

// Assert function was called
expect(onToggle).toHaveBeenCalled();
expect(onToggle).toHaveBeenCalledTimes(1);
expect(onToggle).toHaveBeenCalledWith(true);

// Clear mocks
onToggle.mockClear();

// Mock return value
const onSave = vi.fn().mockResolvedValueOnce({ success: true });
```

### Module Mocks

Configured in `src/__tests__/setup.ts`:

```typescript
// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
```

Add additional mocks as needed:

```typescript
vi.mock('@/lib/api', () => ({
  fetchServers: vi.fn(),
}));
```

## Best Practices

### 1. Use Semantic Queries

```typescript
// Good - Accessible and semantic
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter name')

// Avoid - Implementation details
screen.getByTestId('submit-btn')
container.querySelector('.button')
screen.getByText('Button')
```

### 2. Test User Behavior

```typescript
// Good - User interaction
await user.click(button);
await user.type(input, 'text');

// Avoid - Internal implementation
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'text' } });
```

Use `fireEvent` only for special cases like JSON input that has special characters.

### 3. Wait for Async State

```typescript
// Good - Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Avoid - setTimeout hacks
await new Promise(r => setTimeout(r, 1000));
```

### 4. Accessibility First

```typescript
// Always include aria-labels and test them
it('has accessible toggle', () => {
  render(<Component />);
  const toggle = screen.getByRole('switch');
  expect(toggle).toHaveAttribute('aria-label', 'Toggle Server');
});
```

### 5. Describe Tests Clearly

```typescript
// Good - Clear, descriptive names
it('disables submit button when form is invalid')
it('calls onSave with trimmed values')
it('shows error message for invalid JSON')

// Avoid - Vague names
it('works correctly')
it('handles input')
```

## Testing Checklist for New Components

When creating tests for a new MCP component:

- [ ] **Rendering Tests**
  - [ ] Component renders with default props
  - [ ] All text content displays correctly
  - [ ] Icons/images render appropriately

- [ ] **User Interaction Tests**
  - [ ] Button clicks trigger callbacks
  - [ ] Form inputs update state
  - [ ] Modal opens/closes correctly

- [ ] **State Management Tests**
  - [ ] Component state updates reflected in UI
  - [ ] Callbacks receive correct values
  - [ ] State transitions work correctly

- [ ] **Edge Cases**
  - [ ] Empty/null values handled gracefully
  - [ ] Long text truncation works
  - [ ] Missing optional props don't crash

- [ ] **Accessibility**
  - [ ] aria-labels present on interactive elements
  - [ ] Roles correctly assigned
  - [ ] Keyboard navigation works

- [ ] **Async Operations** (if applicable)
  - [ ] Loading states work
  - [ ] Error handling works
  - [ ] Success callbacks fire

## Debugging Tests

### 1. View Rendered Output

```typescript
import { render, screen } from '@testing-library/react';

it('debug component', () => {
  const { debug } = render(<Component />);
  debug(); // Prints DOM to console
});
```

### 2. Check Element State

```typescript
it('debug element', () => {
  render(<Component />);
  const button = screen.getByRole('button');
  console.log(button);
  console.log(button.getAttribute('aria-checked'));
});
```

### 3. Screen Queries Debug

```typescript
it('find element', () => {
  render(<Component />);

  // Shows all available roles/queries
  screen.logTestingPlaygroundURL();
});
```

### 4. Run Single Test

```bash
# Run only one test
npm test -- -t "should render component"

# Run tests in specific file
npm test -- McpServerItem.test.tsx

# Run with verbose output
npm test -- --reporter=verbose
```

### 5. Watch Mode Debugging

```bash
# Start tests in watch mode
npm test -- --watch

# Then use commands:
# a - run all tests
# f - run only failed tests
# p - filter by filename
# t - filter by test name
# q - quit
```

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage -- src/__tests__/components/mcp/
```

### View Coverage Report

```bash
# HTML report opens in browser
open coverage/index.html

# Or view in terminal
npm run test:coverage -- src/__tests__/components/mcp/ --reporter=text
```

### Coverage Targets

- **Statements:** > 90%
- **Branches:** > 85%
- **Functions:** > 90%
- **Lines:** > 90%

## Common Issues

### Issue: "Cannot find module" errors

**Solution:** Ensure path aliases in `vitest.config.ts` match `tsconfig.json`

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: Radix UI component not rendering

**Solution:** Mocks might be interfering. Check `setup.ts` doesn't mock too broadly.

### Issue: Async test timeouts

**Solution:** Increase timeout or use explicit waits:

```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 3000 });
```

### Issue: userEvent.type() failing with special characters

**Solution:** Use `fireEvent.change()` for JSON and special characters:

```typescript
fireEvent.change(input, { target: { value: '{"key": "value"}' } });
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessible Role Documentation](https://www.w3.org/WAI/ARIA/apg/)

## Contributing Tests

When submitting PR with changes to MCP components:

1. Write tests for new features
2. Update tests for modified behavior
3. Maintain > 90% coverage
4. Ensure all tests pass: `npm run test:run`
5. Generate coverage report
6. Update this guide if needed

## Quick Reference

```bash
# Start here
npm install                           # Install deps
npm test                              # Run tests (watch)
npm run test:run                      # Run once
npm run test:coverage                 # With coverage

# Filter tests
npm test -- --grep "McpServerItem"   # By pattern
npm test -- -t "renders"             # By test name

# Debug
npm test -- --reporter=verbose       # Verbose output
npm test -- --inspect-brk            # Node debugger
```
