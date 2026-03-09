# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Calendario de Tortillas" — A department app where each weekday one of ~25 team members brings tortillas for coworkers, following a round-robin rotation. An admin manages the member list; everyone else views the calendar. All UI is in Spanish.

## Architecture

Monorepo with two packages:

- **`client/`** — React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **`server/`** — Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL

### Backend (`server/`)

- **Database**: PostgreSQL via Drizzle ORM. Schema in `src/db/schema.ts` (tables: `members`, `schedule_overrides`, `push_subscriptions`, `admin_settings`).
- **Auth**: Simple JWT-based admin auth. Admin password from `ADMIN_PASSWORD` env var. Public routes (GET members, GET schedule, POST push subscribe) require no auth.
- **Schedule logic** (`src/services/schedule.ts`): Round-robin algorithm counts weekdays from a configurable `rotation_start_date` (stored in `admin_settings`) and indexes into the active member list sorted by `order`. Overrides in `schedule_overrides` take precedence.
- **Notifications**: Web Push (`web-push`) and email (`nodemailer`) in `src/services/push.ts` and `src/services/email.ts`.
- **API prefix**: All routes under `/api/` — members, schedule, auth, notifications.

### Frontend (`client/`)

- **API client**: `src/lib/api.ts` — all API calls using fetch, auth token stored in localStorage.
- **Auth context**: `src/context/AuthContext.tsx` — provides `isAdmin`, `login()`, `logout()`.
- **Key components**: `TodayBanner` (who brings today), `TortillaCalendar` (monthly calendar view with shadcn Calendar + Spanish locale), `ScheduleList` (next 10 assignments), `MemberManager` (admin CRUD), `AdminLogin`, `NotificationToggle`.
- **Theme**: Warm amber/orange CSS variables in `src/index.css`.
- **Path alias**: `@/` maps to `src/`.

## Common Commands

### Client (from `client/`)
```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build
npx tsc --noEmit     # Type check
```

### Server (from `server/`)
```bash
npm run dev          # Express dev server with tsx watch (port 3001)
npm run build        # Compile TypeScript
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run Drizzle migrations
```

### Environment
Copy `server/.env.example` to `server/.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_PASSWORD` — Admin login password
- `JWT_SECRET` — JWT signing secret
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Web Push keys
- `SMTP_*` — Email configuration

## Key Design Decisions

- **No per-day storage**: Assignments are computed deterministically from member order + start date. Only overrides are stored in the DB.
- **Soft delete**: Deleting a member sets `active=false`, preserving schedule history.
- **Schedule overrides** use upsert on the unique `date` column.
- **Public vs admin**: GET endpoints are public. All mutations require JWT auth.
