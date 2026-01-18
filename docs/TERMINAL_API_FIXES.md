# Terminal API Routes - Required Fixes

## Overview

The Terminal API implementation is 95% complete with 2 issues identified during testing. Both are quick fixes.

---

## Issue 1: WorktreeId Not Persisted (CRITICAL)

**File:** `src/app/api/terminals/route.ts`
**Lines:** 137-138
**Severity:** CRITICAL
**Impact:** Worktree associations cannot be created despite validation passing

### Current Code

```typescript
const terminal = await prisma.terminal.create({
  data: {
    name: data.name,
    projectId: data.projectId,
    // Note: worktreeId field needs to be added to schema
    // worktreeId: data.worktreeId,
  },
  include: {
    project: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

### The Problem

- The POST endpoint validates `worktreeId` (lines 112-130)
- Verifies the worktree exists and belongs to the same project
- But then fails to save it to the database (line 138 is commented out)
- Result: Client thinks terminal is created with worktree, but it isn't

### The Fix

**Simply uncomment line 138:**

```typescript
const terminal = await prisma.terminal.create({
  data: {
    name: data.name,
    projectId: data.projectId,
    worktreeId: data.worktreeId,  // <-- UNCOMMENT THIS LINE
  },
  include: {
    project: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

### Verification

The Prisma schema already has the field:
```prisma
model Terminal {
  // ...
  worktreeId String?
  worktree   Worktree? @relation(fields: [worktreeId], references: [id], onDelete: SetNull)
  // ...
}
```

So this is a safe fix.

---

## Issue 2: Incomplete Error Handling in POST (MINOR)

**File:** `src/app/api/terminals/route.ts`
**Lines:** 151-156
**Severity:** MINOR
**Impact:** Non-Zod errors thrown instead of caught; could crash the handler

### Current Code

```typescript
try {
  const body = await request.json();
  const data = createTerminalSchema.parse(body);

  // ... validation and creation logic ...

} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues }, { status: 400 });
  }
  throw error;  // <-- PROBLEM: re-throws non-Zod errors
}
```

### The Problem

- If any non-Zod error occurs (database error, JSON parse error, etc.)
- It gets re-thrown instead of caught
- This could crash the handler and return a 500 without proper error message
- Compare to GET and DELETE handlers which catch all errors properly

### The Fix

Replace the catch block to handle all error types:

```typescript
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues }, { status: 400 });
  }
  console.error('Error creating terminal:', error);
  return NextResponse.json(
    { error: 'Failed to create terminal', details: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
}
```

This matches the pattern used in the GET handler (lines 67-71) and DELETE handler (lines 125-129).

---

## Testing the Fixes

### After fixing Issue 1:

```bash
# Test creating terminal with worktree
curl -X POST http://localhost:3000/api/terminals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Terminal",
    "projectId": "project-1",
    "worktreeId": "worktree-1"
  }'

# Response should include worktreeId in the response
# Before fix: worktreeId would be null
# After fix: worktreeId would match the input
```

### After fixing Issue 2:

Run the test suite to verify error handling:

```bash
npm test -- src/app/api/terminals/__tests__/
```

All 37 tests should pass.

---

## Summary of Changes

| Issue | File | Lines | Change | Time |
|-------|------|-------|--------|------|
| 1 | route.ts | 138 | Uncomment line | 10 seconds |
| 2 | route.ts | 151-156 | Replace catch block | 1 minute |
| **Total** | | | | **~2 minutes** |

---

## Verification Checklist

After applying both fixes:

- [ ] Line 138 uncommented in route.ts
- [ ] Catch block in POST handler catches all errors
- [ ] TypeScript check passes: `npx tsc --noEmit`
- [ ] Test suite passes: `npm test`
- [ ] Manual POST test creates terminal with worktreeId
- [ ] Error messages are consistent across all handlers

---

## Files Provided

1. **TERMINAL_API_TEST_REPORT.txt** - Comprehensive test analysis
2. **src/app/api/terminals/__tests__/TESTING_REPORT.md** - Detailed test documentation
3. **src/app/api/terminals/__tests__/route.test.ts** - 18 test cases for GET/POST
4. **src/app/api/terminals/__tests__/route.id.test.ts** - 19 test cases for GET/DELETE
5. **TERMINAL_API_FIXES.md** - This file with required fixes

---

## Next Steps

1. Apply the two fixes above
2. Run: `npm test`
3. Run: `npx tsc --noEmit`
4. Test manually with curl or Postman
5. All checks pass = ready to deploy

---

## Questions?

Refer to:
- Test coverage details in `TERMINAL_API_TEST_REPORT.txt`
- Detailed analysis in `src/app/api/terminals/__tests__/TESTING_REPORT.md`
- Test implementations in the `__tests__` directory
