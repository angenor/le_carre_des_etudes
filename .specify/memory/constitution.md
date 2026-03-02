<!--
## Sync Impact Report

- **Version change**: N/A (initial) → 1.0.0
- **Modified principles**: None (first ratification)
- **Added sections**:
  - Core Principles (5 principles)
  - Technology Constraints
  - Development Workflow
  - Governance
- **Removed sections**: None
- **Templates requiring updates**:
  - `.specify/templates/plan-template.md` — ✅ No update needed
    (Constitution Check section is generic; gates will be
    derived from these principles at plan time)
  - `.specify/templates/spec-template.md` — ✅ No update needed
    (template is technology-agnostic by design)
  - `.specify/templates/tasks-template.md` — ✅ No update needed
    (template is generic; task phases adapt at generation time)
  - `.specify/templates/commands/` — ✅ No command templates exist
- **Follow-up TODOs**: None
-->

# Le Carré des Études Constitution

## Core Principles

### I. Nuxt Conventions First

All features MUST follow Nuxt 4 conventions and idioms.
File-based routing, auto-imports, composables, and the
`app/` directory structure MUST be used as intended by
the framework. Server routes MUST live under `server/`
and use Nitro conventions. Custom abstractions that
duplicate or bypass built-in Nuxt features MUST NOT be
introduced without explicit justification.

**Rationale**: Leveraging framework conventions reduces
onboarding friction, keeps the codebase idiomatic, and
ensures compatibility with Nuxt ecosystem tooling and
future upgrades.

### II. Simplicity & YAGNI

Every feature MUST be implemented in the simplest way
that satisfies the requirement. Code MUST NOT anticipate
hypothetical future needs. New abstractions, utilities,
or indirection layers MUST NOT be created unless they
serve at least two concrete, existing use cases.
Premature optimization MUST be avoided; measure first.

**Rationale**: An early-stage editorial platform must
ship quickly. Over-engineering slows delivery and
increases maintenance burden with no proven benefit.

### III. Data Integrity via Prisma

All database access MUST go through the Prisma client
singleton exported from `server/utils/prisma.ts`. Raw SQL
MUST NOT be used unless Prisma cannot express the query
and the exception is documented. Schema changes MUST be
applied via `prisma migrate dev` in development and
`prisma migrate deploy` in production. Every model
change MUST include a corresponding migration.

**Rationale**: Centralizing data access through Prisma
ensures type safety, migration traceability, and
prevents schema drift between environments.

### IV. Consistent Toolchain

**pnpm** MUST be the sole package manager; npm, yarn,
and bun MUST NOT be used. Nuxt modules MUST be installed
via `npx nuxi@latest module add <module>`. Tailwind CSS
MUST remain configured as a Vite plugin via
`@tailwindcss/vite`; the legacy `@nuxtjs/tailwindcss`
module MUST NOT be installed. Dependencies MUST NOT be
added without a clear, immediate need.

**Rationale**: A single, consistent toolchain eliminates
lock file conflicts, prevents configuration drift, and
ensures all contributors operate in an identical
environment.

### V. Content-Centric UX

The platform serves students seeking guidance and
information. Every UI decision MUST prioritize
readability, fast page loads, and accessible content
consumption. Pages MUST be server-rendered (SSR) or
statically generated where possible. Heavy client-side
JavaScript that degrades the reading experience MUST be
avoided. Semantic HTML and proper heading hierarchy
MUST be used for accessibility and SEO.

**Rationale**: The core audience accesses the platform
on varying network conditions and devices across
Côte d'Ivoire. Performance and accessibility are not
optional—they directly determine reach and impact.

## Technology Constraints

- **Runtime**: Nuxt 4 (v4.3.x) with Vue 3, TypeScript (ESM)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`
  (NOT `@nuxtjs/tailwindcss`)
- **Database**: Prisma 7 with SQLite (`dev.db` at root);
  generated client output in `app/generated/prisma/`
- **Package manager**: pnpm exclusively
- **Node version**: Compatible with Nuxt 4 requirements
- **Deployment**: SSR-capable target (Nitro server)
- **Testing**: No test runner configured yet; when
  introduced it MUST be documented in `CLAUDE.md`

## Development Workflow

- Features MUST be developed on dedicated branches and
  merged via pull request.
- `CLAUDE.md` is the single source of truth for project
  commands, architecture, and conventions. It MUST be
  kept up-to-date when tooling or structure changes.
- Commits MUST use conventional commit messages
  (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).
- Server-side code (`server/`) and client-side code
  (`app/`) MUST remain clearly separated following
  Nuxt directory conventions.

## Governance

This constitution is the authoritative reference for
architectural decisions and development practices in
the Le Carré des Études project. It supersedes any
conflicting guidance found elsewhere.

- **Amendments**: Any change to this constitution MUST
  be documented with a version bump, rationale, and
  updated `LAST_AMENDED_DATE`.
- **Versioning**: Follows semantic versioning —
  MAJOR for principle removals or incompatible
  redefinitions, MINOR for new principles or material
  expansions, PATCH for clarifications and typo fixes.
- **Compliance**: All code contributions SHOULD be
  reviewed against these principles. Violations MUST
  be justified in writing (e.g., in a PR description
  or plan complexity tracking table).
- **Guidance file**: `CLAUDE.md` serves as the runtime
  development guidance document and MUST stay aligned
  with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-03-02 | **Last Amended**: 2026-03-02
