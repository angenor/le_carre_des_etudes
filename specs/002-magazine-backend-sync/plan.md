# Implementation Plan: Synchronisation données magazine — Backend & Back Office

**Branch**: `002-magazine-backend-sync` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-magazine-backend-sync/spec.md`

## Summary

Enrichir le modèle Magazine existant avec 3 nouveaux champs (sous-titre, date de disponibilité, statut à la une) pour aligner la base de données avec les besoins des composants frontend `AlaUneSection.vue` et `magazine/[id].vue`. Créer un endpoint API dédié pour récupérer le magazine à la une, adapter le back office admin pour gérer ces nouveaux champs, et connecter le frontend aux données dynamiques.

## Technical Context

**Language/Version**: TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3
**Primary Dependencies**: Nuxt 4, Vue 3, Tailwind CSS v4 (`@tailwindcss/vite`), Prisma 7, h3
**Storage**: SQLite via Prisma 7 (`dev.db` at project root)
**Testing**: Aucun test runner configuré — vérification manuelle
**Target Platform**: SSR web application (Nitro server)
**Project Type**: Web application full-stack (Nuxt)
**Performance Goals**: N/A (site éditorial, faible trafic)
**Constraints**: SQLite ne supporte pas les index partiels uniques → contrainte `isFeatured` gérée côté applicatif
**Scale/Scope**: ~4 fichiers backend modifiés/créés, ~3 fichiers frontend modifiés

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|----------|--------|---------------|
| I. Nuxt Conventions First | ✅ PASS | Utilise server routes Nitro, auto-imports Vue, useFetch, file-based routing |
| II. Simplicity & YAGNI | ✅ PASS | 3 champs ajoutés à un modèle existant, pas de nouvelle abstraction, pas d'over-engineering |
| III. Data Integrity via Prisma | ✅ PASS | Migration Prisma pour les nouveaux champs, client singleton, transaction pour l'unicité isFeatured |
| IV. Consistent Toolchain | ✅ PASS | pnpm uniquement, Tailwind via @tailwindcss/vite, pas de nouvelle dépendance |
| V. Content-Centric UX | ✅ PASS | SSR maintenu, données dynamiques au lieu de hardcoded, décompteur côté client uniquement |

**Post-Phase 1 Re-check**: Tous les principes restent respectés. Aucune violation.

## Project Structure

### Documentation (this feature)

```text
specs/002-magazine-backend-sync/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Phase 1 data model changes
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/
│   └── api.md           # Phase 1 API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma                          # +3 champs sur Magazine

server/
├── api/
│   └── magazines/
│       ├── index.get.ts                   # inchangé (nouveaux champs inclus auto)
│       ├── index.post.ts                  # modifié: accepte subtitle, availableAt
│       ├── [id].get.ts                    # inchangé (nouveaux champs inclus auto)
│       ├── [id].put.ts                    # modifié: accepte subtitle, availableAt
│       ├── [id].delete.ts                 # inchangé
│       ├── featured.get.ts                # NOUVEAU: GET /api/magazines/featured
│       └── [id]/
│           ├── featured.put.ts            # NOUVEAU: PUT /api/magazines/:id/featured
│           └── featured.delete.ts         # NOUVEAU: DELETE /api/magazines/:id/featured
├── middleware/
│   └── admin.ts                           # modifié: protège les nouveaux endpoints
└── utils/
    └── prisma.ts                          # inchangé

app/
├── components/
│   └── AlaUneSection.vue                  # modifié: useFetch au lieu de données en dur
├── pages/
│   ├── magazine/
│   │   └── [id].vue                       # modifié: affiche subtitle, availableAt
│   └── admin/
│       └── magazines.vue                  # modifié: formulaire + bouton à la une
└── generated/
    └── prisma/                            # regénéré par prisma generate
```

**Structure Decision**: Aucune nouvelle structure — ajout de fichiers dans les répertoires existants, conformément aux conventions Nuxt 4 et au pattern établi par la feature 001.

## Complexity Tracking

Aucune violation de la constitution à justifier.
