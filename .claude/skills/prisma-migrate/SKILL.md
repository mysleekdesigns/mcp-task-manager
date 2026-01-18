---
name: prisma-migrate
description: Run Prisma migrations and database operations. Use when you need to generate migrations, push schema changes, or reset the database.
allowed-tools: Bash, Read
---

# Prisma Migration Skill

Run database migrations and schema operations with Prisma.

## Instructions

1. Before migrating, verify the schema file exists at `prisma/schema.prisma`
2. Check for pending changes with `npx prisma migrate status`
3. Generate migration with descriptive name

## Commands

### Generate a new migration
```bash
npx prisma migrate dev --name $ARGUMENTS
```

### Push schema changes without migration (development only)
```bash
npx prisma db push
```

### Reset database (destructive)
```bash
npx prisma migrate reset
```

### Generate Prisma client
```bash
npx prisma generate
```

### Open Prisma Studio
```bash
npx prisma studio
```

## Migration Naming Convention

Use descriptive names in snake_case:
- `add_user_model`
- `add_task_status_enum`
- `add_project_member_relation`
- `add_terminal_worktree_relation`
