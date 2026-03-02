# Implementation Plan: Site Vitrine Le Carré des Études

**Branch**: `001-magazine-landing-site` | **Date**: 2026-03-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-magazine-landing-site/spec.md`

## Summary

Build a 4-page showcase website for the Ivorian student
magazine "Le Carré des Études". The site includes a
landing/presentation page, a magazine download page with
a lead-capture form (modal), an editorial content page
(interviews & rubriques), and a partners page. An admin
interface protected by password allows content management.
The stack is Nuxt 4 with Prisma 7/SQLite, Tailwind CSS v4,
and SSR.

## Technical Context

**Language/Version**: TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3
**Primary Dependencies**: Nuxt 4, Vue 3, Tailwind CSS v4 (`@tailwindcss/vite`), Prisma 7
**Storage**: SQLite via Prisma 7 (`dev.db` at project root); generated client in `app/generated/prisma/`
**Testing**: No test runner configured yet
**Target Platform**: Web (SSR via Nitro server)
**Project Type**: Web application (full-stack Nuxt)
**Performance Goals**: < 3s initial page load on 3G connection
**Constraints**: SSR mandatory, pnpm only, French-only UI, local file storage for PDFs and images
**Scale/Scope**: ~5000 estimated readers first edition, 4 public pages + admin section

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Verification |
|-----------|--------|-------------|
| I. Nuxt Conventions First | PASS | File-based routing under `app/pages/`, server routes under `server/api/`, auto-imports, Nuxt layouts for shared navigation |
| II. Simplicity & YAGNI | PASS | No unnecessary abstractions; direct Prisma queries in server routes, simple Vue components, no state management library |
| III. Data Integrity via Prisma | PASS | All DB access through `server/utils/prisma.ts` singleton; schema changes via `prisma migrate dev`; 4 models |
| IV. Consistent Toolchain | PASS | pnpm only; Tailwind CSS v4 via `@tailwindcss/vite`; no new external modules needed |
| V. Content-Centric UX | PASS | SSR for all pages; semantic HTML; responsive design; minimal client JS; optimized for slow connections |

No violations. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-magazine-landing-site/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API routes)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── app.vue                     # Root component (exists)
├── assets/css/main.css         # Tailwind entry (exists)
├── components/
│   ├── AppNavbar.vue           # Shared navigation bar
│   ├── AppFooter.vue           # Shared footer
│   ├── DownloadModal.vue       # Download form modal
│   ├── MagazineCard.vue        # Magazine display card
│   ├── RubriqueCard.vue        # Content item card
│   └── PartnerLogo.vue         # Partner logo display
├── layouts/
│   └── default.vue             # Layout with navbar + footer
├── pages/
│   ├── index.vue               # PAGE 1: Présentation
│   ├── magazine.vue            # PAGE 2: Téléchargement
│   ├── rubriques.vue           # PAGE 3: Interviews & Rubriques
│   ├── partenaires.vue         # PAGE 4: Partenaires
│   └── admin/
│       ├── index.vue           # Admin dashboard
│       ├── login.vue           # Admin login page
│       ├── magazines.vue       # Manage magazines
│       ├── rubriques.vue       # Manage content items
│       └── partenaires.vue     # Manage partners
└── composables/
    └── useAdmin.ts             # Admin auth state composable

server/
├── api/
│   ├── magazines/
│   │   ├── index.get.ts        # GET all magazines
│   │   ├── [id].get.ts         # GET single magazine
│   │   ├── index.post.ts       # POST create (admin)
│   │   ├── [id].put.ts         # PUT update (admin)
│   │   └── [id].delete.ts      # DELETE (admin)
│   ├── downloads/
│   │   └── index.post.ts       # POST create download record
│   ├── rubriques/
│   │   ├── index.get.ts        # GET all content items
│   │   ├── index.post.ts       # POST create (admin)
│   │   ├── [id].put.ts         # PUT update (admin)
│   │   └── [id].delete.ts      # DELETE (admin)
│   ├── partenaires/
│   │   ├── index.get.ts        # GET all partners
│   │   ├── index.post.ts       # POST create (admin)
│   │   ├── [id].put.ts         # PUT update (admin)
│   │   └── [id].delete.ts      # DELETE (admin)
│   ├── upload/
│   │   └── index.post.ts       # POST file upload (admin)
│   └── auth/
│       └── login.post.ts       # POST admin login
├── middleware/
│   └── admin.ts                # Admin auth middleware
└── utils/
    └── prisma.ts               # Prisma singleton (exists)

prisma/
└── schema.prisma               # Database schema (to update)

public/
├── uploads/
│   ├── magazines/              # PDF files
│   ├── rubriques/              # Content images
│   └── partenaires/            # Partner logos
└── images/
    └── hero/                   # Homepage hero images
```

**Structure Decision**: Standard Nuxt 4 full-stack structure.
Frontend pages under `app/pages/`, API routes under
`server/api/`, shared layout with navigation. Admin pages
nested under `app/pages/admin/`. File uploads served from
`public/uploads/`. This follows Nuxt conventions (Principle I)
with no custom abstractions.

## Complexity Tracking

> No Constitution Check violations. No entries needed.
