---
name: git-commit
description: Create well-formatted git commits following conventional commit standards. Use when committing changes to the repository.
allowed-tools: Bash, Read
---

# Git Commit Skill

Create properly formatted git commits following conventional commit standards.

## Instructions

1. Stage the relevant files
2. Review staged changes with `git diff --staged`
3. Create commit with conventional commit message format

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Scopes for this project
- `auth`: Authentication related
- `kanban`: Kanban board
- `terminal`: Terminal management
- `api`: API routes
- `db`: Database/Prisma
- `ui`: UI components
- `worktree`: Git worktree
- `task`: Task management

## Commands

```bash
# Stage specific files
git add <files>

# Stage all changes
git add .

# Review staged changes
git diff --staged

# Commit with message
git commit -m "feat(kanban): add drag-and-drop task sorting"
```

## Examples

```bash
# Feature commit
git commit -m "feat(terminal): add WebSocket connection for terminal I/O"

# Bug fix
git commit -m "fix(auth): handle expired session tokens correctly"

# Multiple file commit
git commit -m "feat(api): add task CRUD endpoints

- Add GET /api/tasks with filtering
- Add POST /api/tasks for task creation
- Add PUT/DELETE /api/tasks/[id]
"
```
