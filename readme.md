# Web Design Material — Monorepo

## Stack
- **Web**: React TS + Vite + TailwindCSS (Vercel)
- **Backoffice**: React TS + Vite + TailwindCSS (Vercel)
- **API**: Node.js + Express + Socket.io + Prisma (Railway)
- **Database**: PostgreSQL (Neon.tech)

## Structure
```
apps/
  web/         → main frontend (port 5173)
  backoffice/  → admin panel (port 5174)
  api/         → backend API + WebSocket (port 4000)
packages/
  types/       → shared TypeScript types
```

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Setup environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/backoffice/.env.example apps/backoffice/.env
# แก้ไขค่าใน .env ให้ถูกต้อง
```

### 3. Setup database
```bash
cd apps/api
pnpm db:generate
pnpm db:migrate
```

### 4. Run all apps
```bash
pnpm dev
```

## Deploy
- **Web**: connect `apps/web` to Vercel project
- **Backoffice**: connect `apps/backoffice` to Vercel project  
- **API**: connect `apps/api` to Railway project
- **DB**: create free PostgreSQL on [neon.tech](https://neon.tech)
