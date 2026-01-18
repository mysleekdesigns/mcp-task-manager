---
name: run-dev
description: Start the development server and related services. Use when you need to run the Next.js dev server, start Docker containers, or run the full development environment.
allowed-tools: Bash
---

# Run Development Server

Start the development environment for the Auto Claude MCP Task Manager.

## Instructions

1. Ensure Docker is running for PostgreSQL
2. Start the development server
3. The app will be available at http://localhost:3000

## Commands

### Start PostgreSQL with Docker
```bash
docker compose up -d
```

### Run database migrations
```bash
npx prisma migrate dev
```

### Start Next.js development server
```bash
npm run dev
```

### Full development startup sequence
```bash
docker compose up -d && npx prisma migrate dev && npm run dev
```

### Start with custom server (for WebSocket support)
```bash
npm run dev:server
```

## Environment Setup

Ensure `.env` file exists with:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auto_claude?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Troubleshooting

### Port 3000 in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database connection failed
```bash
docker compose down
docker compose up -d
```

### Prisma client outdated
```bash
npx prisma generate
```
