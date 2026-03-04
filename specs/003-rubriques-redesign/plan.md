# Implementation Plan: Refonte des Rubriques avec Affichage Spécialisé par Type

**Branch**: `003-rubriques-redesign` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-rubriques-redesign/spec.md`

## Summary

Refondre le système de rubriques pour supporter 4 types distincts (`parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus`) avec des champs spécifiques par type, un éditeur de contenu riche (Toast UI Editor, déjà installé), et un affichage spécialisé par type sur la page publique (premier item en layout magazine, suivants en cards stylisées). Ajout d'une page de détail par rubrique avec mise en page type-spécifique.

## Technical Context

**Language/Version**: TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3.5.28
**Primary Dependencies**: Nuxt 4, Vue 3, Tailwind CSS v4.2.1 (`@tailwindcss/vite`), @toast-ui/editor 3.2.2, Sharp 0.34.5
**Storage**: Prisma 7.4.2 with SQLite (`dev.db`), generated client in `app/generated/prisma/`
**Testing**: Aucun test runner configuré
**Target Platform**: Web SSR (Nitro server)
**Project Type**: Web application (Nuxt fullstack)
**Performance Goals**: Page listing < 3s avec 20 contenus
**Constraints**: Responsive (375px, 768px, 1280px+), SSR, accents dans le contenu mais pas dans les noms de fichiers
**Scale/Scope**: ~4 types × ~10-20 items chacun, 1 admin

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Nuxt Conventions First | PASS | Utilise file-based routing, auto-imports, `app/` + `server/` conventions |
| II. Simplicity & YAGNI | PASS | 4 composants de layout type-spécifique — justifié car chaque type a un rendu visuel fondamentalement différent. Pas d'abstraction superflue |
| III. Data Integrity via Prisma | PASS | Migration Prisma pour les nouveaux champs, accès via singleton `server/utils/prisma.ts` |
| IV. Consistent Toolchain | PASS | pnpm, Tailwind via @tailwindcss/vite, pas de nouvelles dépendances |
| V. Content-Centric UX | PASS | SSR, HTML sémantique, responsive, contenu éditorial mis en valeur |

**Pre-design gate: PASS**

## Project Structure

### Documentation (this feature)

```text
specs/003-rubriques-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                      # + content, subtitle, eventDate, eventLocation fields
└── migrations/                        # + new migration for ContentItem changes

app/
├── pages/
│   ├── rubriques.vue                  # MODIFIED — redesign with type-specific sections
│   ├── rubriques/
│   │   └── [id].vue                   # NEW — detail page with type-specific layout
│   └── admin/
│       └── rubriques.vue              # MODIFIED — dynamic form, ToastEditor, 4 types
├── components/
│   ├── RubriqueCard.vue               # MODIFIED — type-aware card variants
│   ├── rubrique/
│   │   ├── LayoutParcours.vue         # NEW — dark theme, portrait + columns
│   │   ├── LayoutVedette.vue          # NEW — newspaper style, orange accents
│   │   ├── LayoutAgenda.vue           # NEW — event style, date/location
│   │   └── LayoutFocus.vue            # NEW — structured info, photo
│   ├── ToastEditor.client.vue         # EXISTING — reused
│   └── ToastViewer.client.vue         # EXISTING — reused

server/
├── api/
│   └── rubriques/
│       ├── index.get.ts               # MODIFIED — 4 types, new fields, portrait mapping
│       ├── index.post.ts              # MODIFIED — 4 types, new fields validation
│       ├── [id].get.ts                # NEW — single rubrique for detail page
│       ├── [id].put.ts                # MODIFIED — new fields support
│       └── [id].delete.ts             # UNCHANGED
```

**Structure Decision**: Nuxt fullstack monorepo avec convention `app/` + `server/`. Les composants de layout type-spécifiques sont regroupés sous `app/components/rubrique/` pour éviter de polluer le dossier racine des composants. Ceci est le seul nouveau dossier créé — justifié car 4 composants de layout distincts avec des styles très différents.

## Complexity Tracking

> Aucune violation de la constitution détectée. Pas de justification nécessaire.
