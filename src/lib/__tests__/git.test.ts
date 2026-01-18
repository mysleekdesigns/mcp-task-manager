import { describe, it, expect, beforeAll } from 'vitest';
import {
  getWorktrees,
  getBranches,
  getCurrentBranch,
  isGitRepository,
  branchExists,
  GitError,
} from '../git';
import { resolve } from 'path';

// Use the current project directory for testing
const TEST_REPO_PATH = resolve(__dirname, '../../..');

describe('Git Operations', () => {
  beforeAll(async () => {
    // Verify we're in a git repository
    const isRepo = await isGitRepository(TEST_REPO_PATH);
    if (!isRepo) {
      throw new Error('Test must be run in a git repository');
    }
  });

  describe('isGitRepository', () => {
    it('should return true for valid git repository', async () => {
      const result = await isGitRepository(TEST_REPO_PATH);
      expect(result).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const result = await isGitRepository('/nonexistent/path');
      expect(result).toBe(false);
    });

    it('should return false for non-git directory', async () => {
      const result = await isGitRepository('/tmp');
      expect(result).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const branch = await getCurrentBranch(TEST_REPO_PATH);
      expect(branch).toBeTruthy();
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    });

    it('should throw GitError for invalid path', async () => {
      await expect(getCurrentBranch('/invalid/path')).rejects.toThrow(GitError);
    });
  });

  describe('getBranches', () => {
    it('should list all branches', async () => {
      const result = await getBranches(TEST_REPO_PATH);

      expect(result).toHaveProperty('all');
      expect(result).toHaveProperty('local');
      expect(result).toHaveProperty('remote');
      expect(result).toHaveProperty('current');

      expect(Array.isArray(result.all)).toBe(true);
      expect(Array.isArray(result.local)).toBe(true);
      expect(Array.isArray(result.remote)).toBe(true);
      expect(typeof result.current).toBe('string');
    });

    it('should mark current branch correctly', async () => {
      const result = await getBranches(TEST_REPO_PATH);
      const currentBranch = result.all.find((b) => b.current);

      expect(currentBranch).toBeTruthy();
      expect(currentBranch?.name).toBe(result.current);
    });

    it('should separate local and remote branches', async () => {
      const result = await getBranches(TEST_REPO_PATH);

      result.local.forEach((branch) => {
        expect(branch.remote).toBe(false);
        expect(branch.ref).toMatch(/^refs\/heads\//);
      });

      result.remote.forEach((branch) => {
        expect(branch.remote).toBe(true);
        expect(branch.name).toMatch(/^origin\//);
      });
    });
  });

  describe('branchExists', () => {
    it('should return true for existing branch', async () => {
      const branches = await getBranches(TEST_REPO_PATH);
      const firstBranch = branches.local[0];

      if (firstBranch) {
        const exists = await branchExists(TEST_REPO_PATH, firstBranch.name);
        expect(exists).toBe(true);
      }
    });

    it('should return false for non-existent branch', async () => {
      const exists = await branchExists(
        TEST_REPO_PATH,
        'this-branch-definitely-does-not-exist-12345'
      );
      expect(exists).toBe(false);
    });
  });

  describe('getWorktrees', () => {
    it('should list worktrees', async () => {
      const worktrees = await getWorktrees(TEST_REPO_PATH);

      expect(Array.isArray(worktrees)).toBe(true);
      expect(worktrees.length).toBeGreaterThan(0);

      // First worktree should be the main one
      const mainWorktree = worktrees.find((w) => w.isMain);
      expect(mainWorktree).toBeTruthy();
    });

    it('should include required worktree properties', async () => {
      const worktrees = await getWorktrees(TEST_REPO_PATH);
      const firstWorktree = worktrees[0];

      expect(firstWorktree).toHaveProperty('path');
      expect(firstWorktree).toHaveProperty('head');
      expect(firstWorktree).toHaveProperty('branch');
      expect(firstWorktree).toHaveProperty('isMain');

      expect(typeof firstWorktree.path).toBe('string');
      expect(typeof firstWorktree.head).toBe('string');
      expect(typeof firstWorktree.branch).toBe('string');
      expect(typeof firstWorktree.isMain).toBe('boolean');
    });

    it('should throw GitError for invalid repository', async () => {
      await expect(getWorktrees('/invalid/path')).rejects.toThrow(GitError);
    });
  });

  describe('GitError', () => {
    it('should contain operation information', async () => {
      try {
        await getCurrentBranch('/invalid/path');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(GitError);
        if (error instanceof GitError) {
          expect(error.operation).toBe('getCurrentBranch');
          expect(error.message).toBeTruthy();
          expect(error.name).toBe('GitError');
        }
      }
    });
  });
});
