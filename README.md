# Office Management System

An internal office management application built with Next.js 16, Prisma, and Supabase PostgreSQL.

## Features

- Authentication with JWT sessions
- Role-based access control (Super Admin, HR, Manager, Employee)
- Employee Management
- Department Management
- Attendance (check-in / check-out)
- Leave Management
- Task Management
- Role-aware dashboards

## Tech Stack

- **Next.js 16** (App Router, Server Components)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (Radix UI primitives)
- **Prisma 5** ORM
- **PostgreSQL** (Supabase)
- **Zod** validation
- **bcryptjs** password hashing
- **jose** JWT sessions

## Local Development

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooler connection string (port 6543) |
| `DIRECT_URL` | Supabase direct connection string (port 5432) |
| `AUTH_SECRET` | Random secret (min 32 chars) — run `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | App URL (http://localhost:3000 for local) |

### 3. Set up database

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@company.com | Password123! |
| HR | hr@company.com | Password123! |
| Manager | manager@company.com | Password123! |
| Employee | alice@company.com | Password123! |

## Supabase Setup

1. Create a new Supabase project
2. Go to **Project Settings → Database → Connection string**
3. Copy the **Transaction pooler** URL (port 6543) → `DATABASE_URL`
4. Copy the **Direct connection** URL (port 5432) → `DIRECT_URL`

## Vercel Deployment

1. Push to GitHub
2. Import repo in Vercel
3. Add all environment variables from `.env.example`
4. After first deploy, run: `npx prisma migrate deploy` (or use Vercel CLI)
5. Configure custom domain `office_management.riturajray.com` in Vercel settings

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema without migration
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```
