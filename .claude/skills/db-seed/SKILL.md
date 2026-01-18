---
name: db-seed
description: Seed the database with sample data for development. Use when you need to populate the database with test data.
allowed-tools: Bash, Write, Read
---

# Database Seed Skill

Populate the database with sample data for development and testing.

## Instructions

1. Create or update the seed file at `prisma/seed.ts`
2. Run the seed command to populate the database
3. Verify data with Prisma Studio

## Seed File Location

`prisma/seed.ts`

## Commands

### Run seed
```bash
npx prisma db seed
```

### Reset and seed
```bash
npx prisma migrate reset
```

## Package.json Configuration

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

## Sample Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  // Create test project
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'A sample project for testing',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  });

  // Create sample tasks
  const statuses = ['PENDING', 'PLANNING', 'IN_PROGRESS', 'AI_REVIEW', 'HUMAN_REVIEW'];
  for (let i = 0; i < 10; i++) {
    await prisma.task.create({
      data: {
        title: `Sample Task ${i + 1}`,
        description: `Description for task ${i + 1}`,
        status: statuses[i % statuses.length],
        priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
        projectId: project.id,
        assigneeId: user.id,
      },
    });
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
