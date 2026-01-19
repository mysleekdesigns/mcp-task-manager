import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Git utility functions for managing worktrees and branches
 */

/**
 * Represents a Git worktree
 */
export interface GitWorktree {
  /** Absolute path to the worktree directory */
  path: string;
  /** Git commit SHA that the worktree is currently at */
  head: string;
  /** Branch name (without refs/heads/ prefix) */
  branch: string;
  /** Whether this is a bare repository */
  bare?: boolean;
  /** Whether this is the main worktree */
  isMain: boolean;
}

/**
 * Represents a Git branch
 */
export interface GitBranch {
  /** Branch name (without refs/ prefix) */
  name: string;
  /** Full reference path (e.g., refs/heads/main or refs/remotes/origin/main) */
  ref: string;
  /** Commit SHA */
  commit: string;
  /** Whether this is the current branch */
  current: boolean;
  /** Whether this is a remote branch */
  remote: boolean;
  /** Branch label (commit message summary) */
  label?: string;
}

/**
 * Result of listing branches
 */
export interface BranchListResult {
  /** All branches (local and remote) */
  all: GitBranch[];
  /** Local branches only */
  local: GitBranch[];
  /** Remote branches only */
  remote: GitBranch[];
  /** Current branch name */
  current: string;
}

/**
 * Git operation error
 */
export class GitError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * Get a simple-git instance for a given repository path
 *
 * @param repoPath - Absolute path to the repository
 * @returns SimpleGit instance
 * @throws {GitError} If the path doesn't exist
 */
export function getGitInstance(repoPath: string): SimpleGit {
  if (!existsSync(repoPath)) {
    throw new GitError(
      `Repository path does not exist: ${repoPath}`,
      'getGitInstance'
    );
  }

  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };

  return simpleGit(options);
}

/**
 * Parse the output of `git worktree list --porcelain`
 */
function parseWorktreeList(output: string): GitWorktree[] {
  const worktrees: GitWorktree[] = [];
  const entries = output.trim().split('\n\n');

  for (const entry of entries) {
    const lines = entry.split('\n');
    const worktree: Partial<GitWorktree> = {
      isMain: false,
      bare: false,
    };

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        worktree.path = line.replace('worktree ', '');
      } else if (line.startsWith('HEAD ')) {
        worktree.head = line.replace('HEAD ', '');
      } else if (line.startsWith('branch ')) {
        worktree.branch = line.replace('branch refs/heads/', '');
      } else if (line === 'bare') {
        worktree.bare = true;
      } else if (line === 'detached') {
        // Detached HEAD state
        worktree.branch = 'HEAD';
      }
    }

    // If we have a path, it's a valid worktree
    if (worktree.path && worktree.head && worktree.branch) {
      worktrees.push(worktree as GitWorktree);
    }
  }

  // Mark the first worktree as main if no explicit main is set
  if (worktrees.length > 0 && !worktrees.some((w) => w.isMain)) {
    worktrees[0].isMain = true;
  }

  return worktrees;
}

/**
 * List all worktrees for a repository
 *
 * @param repoPath - Absolute path to the repository
 * @returns Array of worktrees
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * const worktrees = await getWorktrees('/path/to/repo');
 * console.log(worktrees);
 * // [
 * //   { path: '/path/to/repo', branch: 'main', head: 'abc123', isMain: true },
 * //   { path: '/path/to/repo-feature', branch: 'feature', head: 'def456', isMain: false }
 * // ]
 * ```
 */
export async function getWorktrees(repoPath: string): Promise<GitWorktree[]> {
  try {
    const git = getGitInstance(repoPath);
    const output = await git.raw(['worktree', 'list', '--porcelain']);
    return parseWorktreeList(output);
  } catch (error) {
    throw new GitError(
      `Failed to list worktrees: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getWorktrees',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * List all worktrees in a repository (legacy function, use getWorktrees instead)
 *
 * @deprecated Use getWorktrees instead for better type safety
 */
export async function listWorktrees(repoPath: string): Promise<{
  path: string;
  branch: string;
  commit: string;
}[]> {
  const worktrees = await getWorktrees(repoPath);
  return worktrees.map((w) => ({
    path: w.path,
    branch: w.branch,
    commit: w.head,
  }));
}

/**
 * Add a new worktree
 *
 * @param repoPath - Absolute path to the main repository
 * @param worktreePath - Absolute path where the new worktree should be created
 * @param branch - Branch name to checkout in the new worktree
 * @returns The absolute path to the created worktree
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * // Create a worktree for an existing branch
 * await addWorktree('/path/to/repo', '/path/to/repo-feature', 'feature-branch');
 *
 * // Create a worktree with a new branch (will be created automatically)
 * await addWorktree('/path/to/repo', '/path/to/repo-new', 'new-feature');
 * ```
 */
export async function addWorktree(
  repoPath: string,
  worktreePath: string,
  branch: string
): Promise<string> {
  try {
    const git = getGitInstance(repoPath);

    // Check if branch exists (local or remote)
    const branches = await git.branch(['-a']);
    const branchExists =
      branches.all.includes(branch) ||
      branches.all.includes(`remotes/origin/${branch}`);

    if (branchExists) {
      // Branch exists, create worktree with existing branch
      await git.raw(['worktree', 'add', worktreePath, branch]);
    } else {
      // Branch doesn't exist, create new branch
      await git.raw(['worktree', 'add', '-b', branch, worktreePath]);
    }

    return worktreePath;
  } catch (error) {
    throw new GitError(
      `Failed to add worktree at ${worktreePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'addWorktree',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Create a new git worktree (legacy function, use addWorktree instead)
 *
 * @deprecated Use addWorktree instead for better error handling
 */
export async function createWorktree(
  repoPath: string,
  worktreePath: string,
  branch: string
): Promise<void> {
  await addWorktree(repoPath, worktreePath, branch);
}

/**
 * Remove a worktree
 *
 * @param repoPath - Absolute path to the main repository
 * @param worktreePath - Absolute path to the worktree to remove
 * @param force - Force removal even if the worktree has uncommitted changes (default: false)
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * // Remove a worktree
 * await removeWorktree('/path/to/repo', '/path/to/repo-feature');
 *
 * // Force remove a worktree with uncommitted changes
 * await removeWorktree('/path/to/repo', '/path/to/repo-feature', true);
 * ```
 */
export async function removeWorktree(
  repoPath: string,
  worktreePath: string,
  force = false
): Promise<void> {
  try {
    const git = getGitInstance(repoPath);
    const args = ['worktree', 'remove'];

    if (force) {
      args.push('--force');
    }

    args.push(worktreePath);
    await git.raw(args);
  } catch (error) {
    throw new GitError(
      `Failed to remove worktree at ${worktreePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'removeWorktree',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * List all branches (local and remote)
 *
 * @param repoPath - Absolute path to the repository
 * @returns Object containing all, local, and remote branches
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * const branches = await getBranches('/path/to/repo');
 * console.log(branches.current); // 'main'
 * console.log(branches.local.map(b => b.name)); // ['main', 'feature']
 * console.log(branches.remote.map(b => b.name)); // ['origin/main', 'origin/feature']
 * ```
 */
export async function getBranches(repoPath: string): Promise<BranchListResult> {
  try {
    const git = getGitInstance(repoPath);
    const result = await git.branch(['-a', '-v']);

    const all: GitBranch[] = [];
    const local: GitBranch[] = [];
    const remote: GitBranch[] = [];

    for (const [branchName, branchInfo] of Object.entries(result.branches)) {
      const isRemote = branchName.startsWith('remotes/');
      const cleanName = isRemote ? branchName.replace('remotes/', '') : branchName;

      const branch: GitBranch = {
        name: cleanName,
        ref: isRemote ? `refs/${branchName}` : `refs/heads/${branchName}`,
        commit: branchInfo.commit,
        current: branchInfo.current,
        remote: isRemote,
        label: branchInfo.label,
      };

      all.push(branch);

      if (isRemote) {
        remote.push(branch);
      } else {
        local.push(branch);
      }
    }

    return {
      all,
      local,
      remote,
      current: result.current,
    };
  } catch (error) {
    throw new GitError(
      `Failed to list branches: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getBranches',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * List all branches in a repository (legacy function, use getBranches instead)
 *
 * @deprecated Use getBranches instead for more complete information
 */
export async function listBranches(repoPath: string): Promise<GitBranch[]> {
  const result = await getBranches(repoPath);
  return result.local;
}

/**
 * Create a new branch
 *
 * @param repoPath - Absolute path to the repository
 * @param branchName - Name of the new branch
 * @param baseBranch - Base branch to create from (default: current branch)
 * @returns The name of the created branch
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * // Create a branch from current HEAD
 * await createBranch('/path/to/repo', 'new-feature');
 *
 * // Create a branch from a specific base branch
 * await createBranch('/path/to/repo', 'new-feature', 'main');
 * ```
 */
export async function createBranch(
  repoPath: string,
  branchName: string,
  baseBranch?: string
): Promise<string> {
  try {
    const git = getGitInstance(repoPath);

    if (baseBranch) {
      // Create branch from specific base
      await git.checkoutBranch(branchName, baseBranch);
    } else {
      // Create branch from current HEAD
      await git.checkoutLocalBranch(branchName);
    }

    return branchName;
  } catch (error) {
    throw new GitError(
      `Failed to create branch ${branchName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'createBranch',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get the current branch name
 *
 * @param repoPath - Absolute path to the repository
 * @returns The current branch name
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * const branch = await getCurrentBranch('/path/to/repo');
 * console.log(branch); // 'main'
 * ```
 */
export async function getCurrentBranch(repoPath: string): Promise<string> {
  try {
    const git = getGitInstance(repoPath);
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  } catch (error) {
    throw new GitError(
      `Failed to get current branch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getCurrentBranch',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Check if a branch exists
 *
 * @param repoPath - Absolute path to the repository
 * @param branchName - Name of the branch to check
 * @returns True if the branch exists (locally)
 * @throws {GitError} If the operation fails
 *
 * @example
 * ```ts
 * const exists = await branchExists('/path/to/repo', 'feature-branch');
 * if (exists) {
 *   console.log('Branch exists');
 * }
 * ```
 */
export async function branchExists(
  repoPath: string,
  branchName: string
): Promise<boolean> {
  try {
    const git = getGitInstance(repoPath);
    const branches = await git.branchLocal();
    return branches.all.includes(branchName);
  } catch (error) {
    throw new GitError(
      `Failed to check if branch exists: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'branchExists',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Check if a path is a valid Git repository
 *
 * @param repoPath - Path to check
 * @returns True if the path is a valid Git repository
 *
 * @example
 * ```ts
 * const isRepo = await isGitRepository('/path/to/repo');
 * if (isRepo) {
 *   // Perform git operations
 * }
 * ```
 */
export async function isGitRepository(repoPath: string): Promise<boolean> {
  if (!existsSync(repoPath)) {
    return false;
  }

  // Check if .git exists in this specific directory
  const gitDir = join(repoPath, '.git');
  if (existsSync(gitDir)) {
    return true;
  }

  try {
    const git = simpleGit({
      baseDir: repoPath,
      binary: 'git',
    });
    // Check if git thinks this is a repository (searches parent directories)
    const result = await git.rev(['parse', '--git-dir']);
    // If the git-dir is .git (relative) or points to this directory, it's a direct repo
    return result.trim() === '.git' || result.trim() === gitDir;
  } catch {
    return false;
  }
}
