# Git Operations Guide

This guide demonstrates how to use the Git operations utility library (`src/lib/git.ts`) for managing worktrees and branches in the Claude Tasks project.

## Overview

The Git utility library provides type-safe functions for:
- Managing Git worktrees
- Listing and creating branches
- Checking repository status
- Error handling with custom GitError class

## Installation

The library uses `simple-git` (v3.30.0) which is already installed in the project.

## Core Functions

### 1. Working with Worktrees

#### List All Worktrees

```typescript
import { getWorktrees } from '@/lib/git';

const projectPath = '/path/to/project';
const worktrees = await getWorktrees(projectPath);

console.log(worktrees);
// [
//   {
//     path: '/path/to/project',
//     branch: 'main',
//     head: 'abc123...',
//     isMain: true,
//     bare: false
//   },
//   {
//     path: '/path/to/project-feature',
//     branch: 'feature-branch',
//     head: 'def456...',
//     isMain: false,
//     bare: false
//   }
// ]
```

#### Create a New Worktree

```typescript
import { addWorktree } from '@/lib/git';

// Create a worktree for an existing branch
await addWorktree(
  '/path/to/project',
  '/path/to/project-feature',
  'existing-branch'
);

// Create a worktree with a new branch
await addWorktree(
  '/path/to/project',
  '/path/to/project-new-feature',
  'new-feature-branch'
);
```

#### Remove a Worktree

```typescript
import { removeWorktree } from '@/lib/git';

// Normal removal
await removeWorktree('/path/to/project', '/path/to/project-feature');

// Force removal (even with uncommitted changes)
await removeWorktree('/path/to/project', '/path/to/project-feature', true);
```

### 2. Branch Management

#### List All Branches

```typescript
import { getBranches } from '@/lib/git';

const branches = await getBranches('/path/to/project');

console.log('Current branch:', branches.current);
console.log('Local branches:', branches.local.map(b => b.name));
console.log('Remote branches:', branches.remote.map(b => b.name));

// Access detailed branch info
branches.local.forEach(branch => {
  console.log(`${branch.name}: ${branch.commit.substring(0, 7)} - ${branch.label}`);
});
```

#### Create a New Branch

```typescript
import { createBranch } from '@/lib/git';

// Create from current HEAD
await createBranch('/path/to/project', 'new-feature');

// Create from a specific base branch
await createBranch('/path/to/project', 'new-feature', 'main');
```

#### Get Current Branch

```typescript
import { getCurrentBranch } from '@/lib/git';

const currentBranch = await getCurrentBranch('/path/to/project');
console.log('Currently on:', currentBranch);
```

#### Check if Branch Exists

```typescript
import { branchExists } from '@/lib/git';

const exists = await branchExists('/path/to/project', 'feature-branch');
if (exists) {
  console.log('Branch exists locally');
}
```

### 3. Repository Validation

#### Check if Path is a Git Repository

```typescript
import { isGitRepository } from '@/lib/git';

const isRepo = await isGitRepository('/path/to/check');
if (isRepo) {
  // Proceed with git operations
} else {
  console.log('Not a valid git repository');
}
```

## Error Handling

All functions throw a `GitError` with detailed information:

```typescript
import { getWorktrees, GitError } from '@/lib/git';

try {
  const worktrees = await getWorktrees('/invalid/path');
} catch (error) {
  if (error instanceof GitError) {
    console.error(`Git operation failed: ${error.operation}`);
    console.error(`Message: ${error.message}`);
    console.error(`Cause:`, error.cause);
  }
}
```

## API Routes Integration

### Example: Worktree Management Endpoint

```typescript
// src/app/api/worktrees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWorktrees, addWorktree, GitError } from '@/lib/git';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.targetPath) {
      return NextResponse.json(
        { error: 'Project path not configured' },
        { status: 400 }
      );
    }

    const worktrees = await getWorktrees(project.targetPath);
    return NextResponse.json({ worktrees });

  } catch (error) {
    if (error instanceof GitError) {
      return NextResponse.json(
        { error: error.message, operation: error.operation },
        { status: 500 }
      );
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, worktreePath, branch } = await request.json();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.targetPath) {
      return NextResponse.json(
        { error: 'Project path not configured' },
        { status: 400 }
      );
    }

    // Create the worktree
    const path = await addWorktree(
      project.targetPath,
      worktreePath,
      branch
    );

    // Save to database
    const worktree = await prisma.worktree.create({
      data: {
        name: branch,
        path,
        branch,
        isMain: false,
        projectId,
      },
    });

    return NextResponse.json({ worktree });

  } catch (error) {
    if (error instanceof GitError) {
      return NextResponse.json(
        { error: error.message, operation: error.operation },
        { status: 500 }
      );
    }
    throw error;
  }
}
```

## TypeScript Types

### GitWorktree

```typescript
interface GitWorktree {
  path: string;        // Absolute path to worktree
  head: string;        // Commit SHA
  branch: string;      // Branch name (without refs/heads/)
  bare?: boolean;      // Is bare repository
  isMain: boolean;     // Is main worktree
}
```

### GitBranch

```typescript
interface GitBranch {
  name: string;        // Branch name
  ref: string;         // Full reference path
  commit: string;      // Commit SHA
  current: boolean;    // Is current branch
  remote: boolean;     // Is remote branch
  label?: string;      // Commit message summary
}
```

### BranchListResult

```typescript
interface BranchListResult {
  all: GitBranch[];     // All branches
  local: GitBranch[];   // Local branches only
  remote: GitBranch[];  // Remote branches only
  current: string;      // Current branch name
}
```

## Best Practices

1. **Always validate paths**: Use `isGitRepository()` before operations
2. **Handle errors gracefully**: Wrap operations in try-catch blocks
3. **Use absolute paths**: All functions expect absolute paths
4. **Check branch existence**: Use `branchExists()` before creating branches
5. **Force removal carefully**: Only use force flag when necessary

## Legacy Functions

The library maintains backward compatibility with these deprecated functions:

- `listWorktrees()` - Use `getWorktrees()` instead
- `createWorktree()` - Use `addWorktree()` instead
- `listBranches()` - Use `getBranches()` instead

## Related Documentation

- See `PRD.md` for Phase 5 implementation details
- See Prisma schema for Worktree model structure
- See `.claude/agents/git-worktree.md` for agent-specific guidance
