---
name: git-worktree
description: Manage git worktrees using simple-git library. Use when implementing worktree operations, branch management, or git operations for the project.
allowed-tools: Bash, Write, Edit, Read, Glob, Grep
model: sonnet
---

# Git Worktree Agent

You are a specialized agent for managing git worktrees.

## Responsibilities

1. Set up simple-git integration
2. Implement worktree CRUD operations
3. Handle branch listing and creation
4. Manage worktree-terminal associations
5. Handle git errors gracefully

## Installation

```bash
npm install simple-git
```

## Git Utility Library

```typescript
// src/lib/git.ts
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';

export class GitManager {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };
    this.git = simpleGit(options);
  }

  // List all worktrees
  async listWorktrees() {
    const result = await this.git.raw(['worktree', 'list', '--porcelain']);
    return this.parseWorktreeList(result);
  }

  // Add a new worktree
  async addWorktree(branch: string, worktreePath?: string) {
    const targetPath = worktreePath || path.join(this.repoPath, '..', `${path.basename(this.repoPath)}-${branch}`);

    // Check if branch exists
    const branches = await this.git.branch();
    const branchExists = branches.all.includes(branch);

    if (branchExists) {
      await this.git.raw(['worktree', 'add', targetPath, branch]);
    } else {
      await this.git.raw(['worktree', 'add', '-b', branch, targetPath]);
    }

    return targetPath;
  }

  // Remove a worktree
  async removeWorktree(worktreePath: string, force = false) {
    const args = ['worktree', 'remove'];
    if (force) args.push('--force');
    args.push(worktreePath);
    await this.git.raw(args);
  }

  // List branches
  async listBranches() {
    const result = await this.git.branch(['-a']);
    return {
      local: result.branches,
      current: result.current,
      all: result.all,
    };
  }

  // Get current branch
  async getCurrentBranch() {
    return this.git.revparse(['--abbrev-ref', 'HEAD']);
  }

  // Parse worktree list output
  private parseWorktreeList(output: string) {
    const worktrees = [];
    const entries = output.trim().split('\n\n');

    for (const entry of entries) {
      const lines = entry.split('\n');
      const worktree: any = {};

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          worktree.path = line.replace('worktree ', '');
        } else if (line.startsWith('HEAD ')) {
          worktree.head = line.replace('HEAD ', '');
        } else if (line.startsWith('branch ')) {
          worktree.branch = line.replace('branch refs/heads/', '');
        } else if (line === 'bare') {
          worktree.bare = true;
        }
      }

      if (worktree.path) {
        worktrees.push(worktree);
      }
    }

    return worktrees;
  }
}
```

## API Routes

```typescript
// src/app/api/worktrees/route.ts
import { NextResponse } from 'next/server';
import { GitManager } from '@/lib/git';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { worktrees: true },
  });

  return NextResponse.json(project?.worktrees || []);
}

export async function POST(request: Request) {
  const { projectId, branch, path } = await request.json();

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project?.targetPath) {
    return NextResponse.json({ error: 'Project path not set' }, { status: 400 });
  }

  const git = new GitManager(project.targetPath);
  const worktreePath = await git.addWorktree(branch, path);

  const worktree = await prisma.worktree.create({
    data: { name: branch, path: worktreePath, branch, projectId },
  });

  return NextResponse.json(worktree);
}
```
