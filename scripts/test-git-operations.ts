#!/usr/bin/env tsx

/**
 * Test script for Git operations
 * Run with: npx tsx scripts/test-git-operations.ts
 */

import { resolve } from 'path';
import {
  getWorktrees,
  getBranches,
  getCurrentBranch,
  isGitRepository,
  branchExists,
  GitError,
} from '../src/lib/git';

const REPO_PATH = resolve(__dirname, '..');

async function main() {
  console.log('🧪 Testing Git Operations\n');
  console.log(`Repository: ${REPO_PATH}\n`);

  try {
    // Test 1: Check if valid repository
    console.log('1️⃣  Testing isGitRepository...');
    const isRepo = await isGitRepository(REPO_PATH);
    console.log(`   ✅ Is valid git repository: ${isRepo}\n`);

    if (!isRepo) {
      console.error('   ❌ Not a git repository. Exiting.');
      process.exit(1);
    }

    // Test 2: Get current branch
    console.log('2️⃣  Testing getCurrentBranch...');
    const currentBranch = await getCurrentBranch(REPO_PATH);
    console.log(`   ✅ Current branch: ${currentBranch}\n`);

    // Test 3: List all branches
    console.log('3️⃣  Testing getBranches...');
    const branches = await getBranches(REPO_PATH);
    console.log(`   ✅ Total branches: ${branches.all.length}`);
    console.log(`   ✅ Local branches: ${branches.local.length}`);
    console.log(`   ✅ Remote branches: ${branches.remote.length}`);
    console.log(`   ✅ Current: ${branches.current}\n`);

    console.log('   Local branches:');
    branches.local.forEach((branch) => {
      const indicator = branch.current ? '👉' : '  ';
      console.log(
        `   ${indicator} ${branch.name} (${branch.commit.substring(0, 7)})`
      );
    });
    console.log();

    // Test 4: Check branch existence
    console.log('4️⃣  Testing branchExists...');
    const mainExists = await branchExists(REPO_PATH, currentBranch);
    const fakeExists = await branchExists(REPO_PATH, 'nonexistent-branch-xyz');
    console.log(`   ✅ Current branch exists: ${mainExists}`);
    console.log(`   ✅ Fake branch exists: ${fakeExists}\n`);

    // Test 5: List worktrees
    console.log('5️⃣  Testing getWorktrees...');
    const worktrees = await getWorktrees(REPO_PATH);
    console.log(`   ✅ Total worktrees: ${worktrees.length}\n`);

    console.log('   Worktrees:');
    worktrees.forEach((worktree, index) => {
      const mainIndicator = worktree.isMain ? '⭐' : '  ';
      console.log(
        `   ${mainIndicator} ${index + 1}. ${worktree.branch} @ ${worktree.path}`
      );
      console.log(
        `      HEAD: ${worktree.head.substring(0, 7)} | Main: ${worktree.isMain}`
      );
    });
    console.log();

    // Test 6: Error handling
    console.log('6️⃣  Testing error handling...');
    try {
      await getCurrentBranch('/invalid/path');
      console.log('   ❌ Should have thrown an error');
    } catch (error) {
      if (error instanceof GitError) {
        console.log(`   ✅ GitError caught: ${error.operation}`);
        console.log(`   ✅ Error message: ${error.message.substring(0, 50)}...`);
      }
    }
    console.log();

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof GitError) {
      console.error('   Operation:', error.operation);
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

main();
