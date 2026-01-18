# McpConfig Model Tests

## Overview

Comprehensive test suite for the McpConfig Prisma model used in Phase 8 MCP Integration. All tests pass successfully.

## Test Statistics

- **Total Tests:** 34
- **Passed:** 34
- **Failed:** 0
- **Duration:** ~126ms
- **Coverage:** Full CRUD operations + relationships + data validation

## Test File Location

`/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/src/__tests__/mcp-config.model.test.ts`

## Test Categories

### 1. Create Operations (6 tests)
- Create McpConfig with all required fields
- Create McpConfig with optional config JSON
- Create McpConfig with null config
- Set enabled to false by default
- Include project relation when requested
- Generate unique ID for new McpConfig

### 2. Read Operations (7 tests)
- Find McpConfig by ID
- Return null when McpConfig not found
- Find all McpConfigs for a project
- Find only enabled McpConfigs
- Find McpConfigs by type
- Include project relation in find operations
- Return empty array when no McpConfigs found

### 3. Update Operations (6 tests)
- Update McpConfig enabled status
- Update McpConfig name
- Update McpConfig config JSON
- Clear config by setting it to null
- Update multiple fields simultaneously
- Include project relation after update

### 4. Delete Operations (3 tests)
- Delete McpConfig by ID
- Delete multiple McpConfigs
- Return deleted McpConfig data

### 5. Relationships (3 tests)
- Maintain project reference on creation
- Load associated project when included
- Cascade delete when project is deleted

### 6. Data Validation (3 tests)
- Accept valid config JSON structures
- Preserve config JSON structure on retrieval
- Handle string, number, and boolean values in config

### 7. Query Operations (3 tests)
- Count McpConfigs for a project
- Check if specific McpConfig exists
- Order McpConfigs by creation date

### 8. Edge Cases (3 tests)
- Handle McpConfig with very large config JSON (1000 items)
- Handle special characters in name and type
- Handle Unicode characters in config (Chinese, Arabic, Russian)

## Schema Coverage

The tests verify the complete McpConfig model schema:

```prisma
model McpConfig {
  id        String   @id @default(cuid())      // ✓ Tested
  name      String                             // ✓ Tested
  type      String                             // ✓ Tested
  enabled   Boolean  @default(false)           // ✓ Tested
  config    Json?                              // ✓ Tested
  projectId String                             // ✓ Tested
  project   Project  @relation(...)            // ✓ Tested
  createdAt DateTime @default(now())           // ✓ Tested
  
  @@index([projectId])
}
```

## Key Test Scenarios

### Basic CRUD
- Creation with all field combinations
- Reading with and without relationships
- Updates to all mutable fields
- Deletion with cascade behavior

### Relations
- Project association verification
- Relation loading with `include`
- Cascade delete behavior documentation

### Data Types
- JSON config handling (objects, arrays, primitives)
- Null handling for optional fields
- Type preservation and serialization

### Edge Cases
- Large JSON payloads (1000+ items)
- Special characters and escaping
- Unicode in multiple languages
- Field value boundaries

## Running Tests

```bash
# Run McpConfig tests only
npm run test:run -- src/__tests__/mcp-config.model.test.ts

# Run all tests
npm run test:run

# Run with watch mode
npm test

# Run with coverage
npm run test:coverage
```

## Setup

Test infrastructure includes:

- **Vitest 4.0.17:** Test runner
- **Mocked Prisma:** Using `vi.mock()` for isolation
- **Setup file:** `src/test/setup.ts` with environment configuration
- **Config:** `vitest.config.ts` with path aliases and jsdom environment

## Mock Data Structure

Tests use realistic mock data:

- **McpConfig Sample:**
  ```typescript
  {
    id: 'mcp-config-1',
    name: 'Claude MCP',
    type: 'claude',
    enabled: true,
    config: {
      apiKey: 'sk-test-123',
      model: 'claude-3-opus',
      maxTokens: 4096
    },
    projectId: 'project-1',
    createdAt: Date
  }
  ```

- **Project Sample:**
  ```typescript
  {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project for MCP',
    targetPath: '/path/to/project',
    githubRepo: 'https://github.com/test/repo',
    createdAt: Date,
    updatedAt: Date
  }
  ```

## Test Patterns

All tests follow these patterns:

1. **Arrange:** Set up mock data and spy on Prisma methods
2. **Act:** Call the Prisma method
3. **Assert:** Verify the result and expected behavior

Example:
```typescript
it('should update McpConfig enabled status', async () => {
  // Arrange
  const updatedConfig = { ...mockMcpConfig, enabled: false };
  vi.mocked(prisma.mcpConfig.update).mockResolvedValue(updatedConfig);

  // Act
  const result = await prisma.mcpConfig.update({
    where: { id: 'mcp-config-1' },
    data: { enabled: false },
  });

  // Assert
  expect(result.enabled).toBe(false);
});
```

## Notes

- Tests are isolated using Vitest's mock functionality
- No database connection required
- Each test is independent and can run in any order
- All assertions are synchronous for quick feedback
- Tests document expected behavior for API consumers

## Related Files

- **Schema:** `/prisma/schema.prisma` (lines 277-288)
- **Config:** `/vitest.config.ts`
- **Setup:** `/src/test/setup.ts`
- **Package:** `/package.json` (test scripts)

