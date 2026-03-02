# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Le Carré des Études" is an Ivorian magazine for students, aimed at guiding, informing, and inspiring Côte d'Ivoire's student community. This is its web platform.

## Commands

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm postinstall  # Run nuxt prepare (auto-runs after pnpm install)
```

### Prisma (database)

```bash
pnpm prisma migrate dev     # Apply migrations in development
pnpm prisma migrate deploy  # Apply migrations in production
pnpm prisma generate        # Regenerate Prisma client
```

No test runner is configured yet.

## Tech Stack

- **Nuxt 4** (v4.3.1) with Vue 3
- **pnpm** as package manager
- **Tailwind CSS v4** (v4.2.1) via `@tailwindcss/vite` Vite plugin — NOT `@nuxtjs/tailwindcss`
- **Prisma 7** with SQLite (`dev.db` at project root)
- TypeScript (ESM)

## Architecture

### Tailwind CSS v4 Setup

Tailwind is configured as a Vite plugin in `nuxt.config.ts`, not as a Nuxt module. The global stylesheet at `app/assets/css/main.css` uses `@import "tailwindcss"` (v4 syntax). Do not install or use `@nuxtjs/tailwindcss` (that's for Tailwind v3).

### Prisma Setup

- Schema: `prisma/schema.prisma`
- Config: `prisma.config.ts` (sets datasource URL and migration path)
- Generated client output: `app/generated/prisma/` (gitignored)
- Server singleton: `server/utils/prisma.ts` — import `prisma` from here in server routes
- Database URL defined in `.env` as `DATABASE_URL`

### Nuxt App Structure

Standard Nuxt 4 layout with the `app/` directory convention:
- `app/app.vue` — root component
- `app/pages/` — file-based routing
- `app/assets/css/` — stylesheets
- `server/` — server routes and utilities (Nitro)

## Conventions

- **Install Nuxt modules** with `npx nuxi@latest module add <module>` (not manual pnpm add + config edit)
- **Package manager**: always use `pnpm`, never npm/yarn/bun
