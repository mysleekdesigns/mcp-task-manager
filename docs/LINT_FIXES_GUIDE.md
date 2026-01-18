# Phase 1 Lint Issues - Detailed Fixing Guide

## Overview
There are 3 errors and 2 warnings to fix. All are straightforward to resolve.

---

## Error 1: `/src/app/api/tasks/route.ts:37`

### Issue
```typescript
const where: any = {
  project: { ... }
}
```

### Root Cause
The `where` object dynamically builds a Prisma `findMany` query filter. Using `any` defeats type safety.

### Solution

**Option A: Use Prisma.TaskWhereInput (Recommended)**
```typescript
import { Prisma } from '@prisma/client';

// Instead of:
const where: any = { ... }

// Use:
const where: Prisma.TaskWhereInput = {
  project: {
    members: {
      some: {
        userId: session.user.id,
      },
    },
  },
};

// Then conditionally add filters:
if (projectId) {
  where.projectId = projectId;
}
```

**Option B: Use satisfies (if Prisma.TaskWhereInput doesn't cover all cases)**
```typescript
const where = {
  project: {
    members: {
      some: {
        userId: session.user.id,
      },
    },
  },
} satisfies Prisma.TaskWhereInput;
```

### Fix Steps
1. Add import: `import { Prisma } from '@prisma/client';`
2. Change line 37 from `const where: any = {` to `const where: Prisma.TaskWhereInput = {`
3. Run `npm run lint` to verify

### Code Diff
```diff
+ import { Prisma } from '@prisma/client';

- const where: any = {
+ const where: Prisma.TaskWhereInput = {
    project: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  };
```

---

## Error 2: `/src/app/api/tasks/[id]/logs/route.ts:56`

### Issue
```typescript
const where: any = { taskId };
```

### Root Cause
Similar to Error 1, the `where` object needs proper typing for Prisma queries.

### Solution

**Use Prisma.TaskLogWhereInput**
```typescript
import { Prisma } from '@prisma/client';

const where: Prisma.TaskLogWhereInput = { taskId };

if (phaseId) {
  where.phaseId = phaseId;
}
```

### Fix Steps
1. Add import if not present: `import { Prisma } from '@prisma/client';`
2. Change line 56 from `const where: any = { taskId };` to `const where: Prisma.TaskLogWhereInput = { taskId };`
3. Run `npm run lint` to verify

### Code Diff
```diff
+ import { Prisma } from '@prisma/client';

- const where: any = { taskId };
+ const where: Prisma.TaskLogWhereInput = { taskId };

  if (phaseId) {
    where.phaseId = phaseId;
  }
```

---

## Error 3: `/src/components/task/example-usage.tsx:105`

### Issue
```typescript
const handleTaskUpdate = async (task: any) => {
  console.log("Updating task:", task)
}
```

### Root Cause
Example file has untyped function parameter. This is intentionally an example, but it violates strict TypeScript.

### Solution

**Option A: Remove the file (if it's just an example)**
- This file appears to be example/demo code
- Delete `/src/components/task/example-usage.tsx`
- Or move to a separate `examples/` or `docs/` directory

**Option B: Type the function properly**
```typescript
import { Task } from '@prisma/client';

const handleTaskUpdate = async (task: Task) => {
  console.log("Updating task:", task)
}
```

**Option C: Use unknown + validation**
```typescript
const handleTaskUpdate = async (task: unknown) => {
  if (!task || typeof task !== 'object') {
    throw new Error('Invalid task')
  }
  console.log("Updating task:", task)
}
```

### Recommended Fix
Since this appears to be an example/demo file, **delete it**:
```bash
rm /src/components/task/example-usage.tsx
```

If the file is needed for documentation:
1. Move to `/docs/examples/task-example.tsx`
2. Or add to a Storybook stories file
3. Then properly type all code

### Alternative Fix (if keeping the file)
```diff
- const handleTaskUpdate = async (task: any) => {
+ const handleTaskUpdate = async (task: Record<string, unknown>) => {
    console.log("Updating task:", task)
  }
```

---

## Warning 1: `/src/components/layout/UserMenu.tsx:3`

### Issue
```typescript
import { User, LogOut, Settings, Moon, Sun } from 'lucide-react';
```

The `User` icon is imported but never used in the component.

### Solution

**Remove unused import**
```diff
- import { User, LogOut, Settings, Moon, Sun } from 'lucide-react';
+ import { LogOut, Settings, Moon, Sun } from 'lucide-react';
```

### Fix Steps
1. Open `/src/components/layout/UserMenu.tsx`
2. Remove `User` from the import statement
3. Verify the file compiles without errors

---

## Warning 2: `/src/components/layout/example-usage.tsx:13`

### Issue
```typescript
const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
// ... never used in the component
```

### Solution

**Option A: Remove (Recommended)**
Delete the unused state declaration entirely.

**Option B: Implement the feature**
If this was intended functionality, implement the modal logic.

### Fix Steps
1. Find where `isNewTaskModalOpen` is declared
2. Check if it's used anywhere (search for `isNewTaskModalOpen`)
3. If unused, delete the line

### Alternative
Since this is an example file, consider deleting the entire file (same as Error 3).

---

## Implementation Checklist

### Quick Fix (5-10 minutes)

- [ ] **Error 1:** Fix `/src/app/api/tasks/route.ts:37`
  - [ ] Add Prisma import
  - [ ] Change `any` to `Prisma.TaskWhereInput`
  - [ ] Test with `npm run lint`

- [ ] **Error 2:** Fix `/src/app/api/tasks/[id]/logs/route.ts:56`
  - [ ] Add Prisma import (if not present)
  - [ ] Change `any` to `Prisma.TaskLogWhereInput`
  - [ ] Test with `npm run lint`

- [ ] **Error 3:** Fix `/src/components/task/example-usage.tsx:105`
  - [ ] Delete example file, OR
  - [ ] Add proper type annotation to function parameter

- [ ] **Warning 1:** Fix `/src/components/layout/UserMenu.tsx:3`
  - [ ] Remove `User` from lucide-react import

- [ ] **Warning 2:** Fix `/src/components/layout/example-usage.tsx:13`
  - [ ] Remove unused state, OR
  - [ ] Delete example file

### Verification

```bash
# Run linter
npm run lint

# Should show: ✖ 0 problems

# Run build
npm run build

# Should complete successfully
```

---

## Common Prisma Type Patterns

For reference when typing other Prisma queries:

### For Filtering (Where Clauses)
```typescript
import { Prisma } from '@prisma/client';

// Single model
const where: Prisma.TaskWhereInput = { ... }
const where: Prisma.TaskLogWhereInput = { ... }
const where: Prisma.ProjectWhereInput = { ... }

// Multiple models
const taskWhere: Prisma.TaskWhereInput = { ... }
const projectWhere: Prisma.ProjectWhereInput = { ... }
```

### For Creating Data
```typescript
import { Prisma } from '@prisma/client';

const data: Prisma.TaskCreateInput = {
  title: "...",
  project: { connect: { id: "..." } },
}

const created = await prisma.task.create({ data });
```

### For Updating Data
```typescript
const data: Prisma.TaskUpdateInput = {
  title: "New title",
  status: "IN_PROGRESS",
}

const updated = await prisma.task.update({
  where: { id: taskId },
  data,
});
```

### For Including Relations
```typescript
const include: Prisma.TaskInclude = {
  assignee: true,
  project: true,
  phases: { orderBy: { createdAt: 'asc' } },
}

const task = await prisma.task.findUnique({
  where: { id: taskId },
  include,
});
```

---

## What NOT to Do

❌ **Don't use `any`**
```typescript
const where: any = { ... }  // BAD
```

❌ **Don't use `as any`**
```typescript
const where = { ... } as any  // BAD
```

❌ **Don't ignore TypeScript errors**
```typescript
// @ts-ignore
const where: any = { ... }  // BAD
```

---

## Why This Matters

1. **Type Safety:** Prisma types catch errors at compile time
2. **IDE Support:** Better autocomplete and suggestions
3. **Documentation:** Types serve as self-documenting code
4. **Maintainability:** Future developers understand what data structures are expected
5. **Team Standards:** Consistent with project's TypeScript strict mode

---

## Need Help?

If you get stuck on any fix:

1. Check the Prisma documentation: https://www.prisma.io/docs/orm/reference/prisma-client-reference
2. Look at other working API routes in the project for type patterns
3. Use VS Code "Go to Definition" to explore Prisma types

---

## Next Steps After Fixes

Once all lint issues are resolved:

1. Run full test suite: `npm test` (when tests are added)
2. Run build: `npm run build`
3. Commit changes: `git add . && git commit -m "fix: resolve Phase 1 lint errors"`
4. Push to branch: `git push origin development`
5. Create PR for review
6. Proceed to Phase 2 implementation
