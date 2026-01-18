---
name: lint-fix
description: Run linting and auto-fix code style issues. Use when you need to fix ESLint errors, format code with Prettier, or check TypeScript types.
allowed-tools: Bash
---

# Lint and Fix Skill

Run linting tools and auto-fix code style issues.

## Instructions

1. Run the appropriate linting command
2. Review any errors that couldn't be auto-fixed
3. Fix remaining issues manually if needed

## Commands

### ESLint - Check for issues
```bash
npm run lint
```

### ESLint - Auto-fix issues
```bash
npm run lint -- --fix
```

### Prettier - Format all files
```bash
npx prettier --write .
```

### Prettier - Check formatting
```bash
npx prettier --check .
```

### TypeScript - Type check
```bash
npx tsc --noEmit
```

### Run all checks
```bash
npm run lint && npx tsc --noEmit && npx prettier --check .
```

## Common Issues

### Unused imports
ESLint will flag unused imports. Remove them or use:
```bash
npm run lint -- --fix
```

### Missing dependencies in useEffect
Add the missing dependency or disable the rule:
```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
```

### Any type usage
Replace `any` with proper types or use `unknown`:
```typescript
// Instead of
const data: any = response;

// Use
const data: unknown = response;
// or define proper type
interface ResponseData { ... }
const data: ResponseData = response;
```

## ESLint Configuration

The project uses these ESLint configurations:
- `next/core-web-vitals` - Next.js recommended rules
- `@typescript-eslint/recommended` - TypeScript rules
- `prettier` - Prettier integration
