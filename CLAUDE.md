# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — Start dev server with Turbopack on http://localhost:3000
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npx prisma generate` — Regenerate Prisma Client after schema changes
- `npx prisma db push` — Push schema to database without migration file
- `npx prisma migrate dev --name <name>` — Create and apply a named migration
- `npx prisma studio` — Open Prisma Studio GUI

## Architecture

### Route structure

```
app/
  (auth)/           # /login, /register — no sidebar layout
  (dashboard)/      # all protected pages — wraps with <AppSidebar>
    dashboard/      # role-switch: AdminDashboard / HRDashboard / ManagerDashboard / EmployeeDashboard
    employees/
    attendance/
    tasks/
    ...
  api/              # Route Handlers only — no business logic here
  founder/          # Public page
  page.tsx          # Landing page (public)
```

### Auth

`lib/auth/session.ts` — `getSession()` reads the `office_session` httpOnly cookie and verifies JWT via `jose`. Returns `SessionPayload { userId, email, role, employeeId?, name? }` or null.

`lib/auth/guards.ts` — server-side helpers:
- `requireAuth()` — redirects to `/login` if no session
- `requireRole(roles[])` — redirects to `/dashboard` if role not in list
- `isAdmin(role)` — `SUPER_ADMIN || HR`
- `canManageTasks(role)` — `SUPER_ADMIN || HR || MANAGER`

### API route pattern

Every route handler follows this exact structure:
```ts
const session = await getSession()
if (!session) return unauthorizedResponse()
if (!hasPermission(session.role)) return forbiddenResponse()
const body = await request.json()
const parsed = schema.safeParse(body)
if (!parsed.success) return errorResponse(parsed.error.issues[0].message)
const result = await serviceFunction(parsed.data)
return successResponse(result, 201)
```

All response helpers live in `lib/utils/api.ts`: `successResponse`, `errorResponse`, `unauthorizedResponse`, `forbiddenResponse`, `notFoundResponse`, `serverErrorResponse`.

### Service layer

`services/*.service.ts` — pure Prisma logic, no HTTP. Called from API routes and Server Components only — never from Client Components. Use `repositories/*.repository.ts` for complex queries with many includes/filters (see `repositories/employee.repository.ts` as reference).

### Validation

`lib/validations/*.ts` — Zod 4 schemas. Same schema used for API route parsing and client-side form validation.

### Page component pattern

Each module follows this split:
- `app/(dashboard)/<module>/page.tsx` — thin Server Component; fetches data server-side, calls `requireAuth()`, passes data as props
- `components/<module>/<module>-page.tsx` — `"use client"` component; all state, mutations, and TanStack Query calls live here

### Color system

CSS variables in `app/globals.css` using OKLCH. Primary brand = warm amber-orange (`oklch(0.56 0.19 47)` light / `oklch(0.73 0.20 52)` dark). Background is warm cream light / warm charcoal dark — not neutral white/black. Sidebar variables follow the same warm palette.

### Role permissions

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access to all modules |
| `HR` | Same as SUPER_ADMIN except project assignment |
| `MANAGER` | Own team + assign/review tasks; read-only employees list |
| `EMPLOYEE` | Self-service: own attendance, leaves, tasks, salary slips |

### Sidebar nav

`components/layout/sidebar.tsx` — `NAV_ITEMS` array with `{ label, href, icon, roles[] }`. Items are filtered by `session.role`. Add new module pages here.
