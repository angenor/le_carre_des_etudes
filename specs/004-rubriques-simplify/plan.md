# Implementation Plan: Simplification des Rubriques

**Branch**: `004-rubriques-simplify` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-rubriques-simplify/spec.md`

## Summary

Simplifier l'affichage des rubriques pour présenter uniquement les images A4 verticales par catégorie, avec navigation vers les éditions de magazine via slug. L'admin affiche 3 champs essentiels (type, ordre, image) en priorité avec un toggle pour les champs avancés. Le modèle Magazine reçoit un champ `slug` et ContentItem un champ `magazineId` optionnel.

## Technical Context

**Language/Version**: TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3.5.28
**Primary Dependencies**: Nuxt 4, Vue 3, Tailwind CSS v4.2.1 (`@tailwindcss/vite`), Prisma 7.4.2, @toast-ui/editor 3.2.2
**Storage**: Prisma 7 avec SQLite (`dev.db` à la racine) ; client généré dans `app/generated/prisma/`
**Testing**: Aucun test runner configuré
**Target Platform**: SSR via Nitro (Nuxt 4)
**Project Type**: Web application (fullstack Nuxt)
**Performance Goals**: Page `/rubriques` en moins de 3 secondes avec 20 images
**Constraints**: Images A4 vertical, responsive 375px/768px/1280px+
**Scale/Scope**: ~4 types × ~5-20 rubriques/type, ~10 magazines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Nuxt Conventions First | PASS | File-based routing (`/magazine/[slug].vue`), auto-imports, `server/` routes Nitro |
| II. Simplicity & YAGNI | PASS | Simplification nette — champs avancés masqués, galerie image simple, pas de nouveau composant complexe |
| III. Data Integrity via Prisma | PASS | Migration Prisma pour `slug` et `magazineId`, relations FK |
| IV. Consistent Toolchain | PASS | pnpm, Tailwind v4 via Vite, pas de nouvelle dépendance |
| V. Content-Centric UX | PASS | Images en SSR, page légère, navigation fluide vers magazine |

## Project Structure

### Documentation (this feature)

```text
specs/004-rubriques-simplify/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma              # Modifié — ajout slug (Magazine), magazineId (ContentItem)

server/api/
├── magazines/
│   ├── index.get.ts           # Modifié — inclure slug dans la réponse
│   ├── index.post.ts          # Modifié — générer slug à la création
│   ├── [id].get.ts            # Existant — inchangé (rétro-compatibilité)
│   ├── [id].put.ts            # Modifié — support mise à jour slug
│   └── by-slug/
│       └── [slug].get.ts      # Nouveau — lookup magazine par slug
└── rubriques/
    ├── index.get.ts           # Modifié — inclure magazine (slug) dans la réponse
    ├── index.post.ts          # Modifié — accepter magazineId, title/description optionnels
    ├── [id].put.ts            # Modifié — accepter magazineId
    └── [id].get.ts            # Existant — inchangé

app/pages/
├── magazine/
│   ├── [id].vue               # Existant — conservé (rétro-compatibilité)
│   └── [slug].vue             # Nouveau — page détail par slug
├── rubriques/
│   └── index.vue              # Modifié — galerie images par catégorie
└── admin/
    └── rubriques.vue          # Modifié — formulaire simplifié avec toggle avancé

app/components/
├── RubriqueCard.vue           # Modifié — simplifié en carte image
└── rubrique/
    └── Layout*.vue            # Existants — conservés (non utilisés pour l'instant)
```

**Structure Decision**: Architecture fullstack Nuxt existante conservée. Modifications incrémentales sur les fichiers existants. Un seul nouveau fichier créé (`by-slug/[slug].get.ts`). Un nouveau fichier page (`[slug].vue`). Les Layout* existants sont préservés mais inutilisés pour le moment.

## Complexity Tracking

> Aucune violation de constitution détectée.
