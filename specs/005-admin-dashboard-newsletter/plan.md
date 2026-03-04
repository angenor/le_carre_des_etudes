# Implementation Plan: Dashboard Admin, Newsletter & Embellissement

**Branch**: `005-admin-dashboard-newsletter` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-admin-dashboard-newsletter/spec.md`

## Summary

Transformer le tableau de bord admin avec des graphiques Chart.js/vue-chartjs (téléchargements par période, répartition par magazine/niveau d'étude, visites), ajouter une page de consultation des téléchargements avec recherche/tri/export CSV, implémenter une newsletter simple (capture emails en base sans SMTP, formulaire dans le footer), une page admin de gestion des abonnés avec export CSV, et embellir le layout admin (sidebar/header) avec le thème sombre/ambré du front office.

## Technical Context

**Language/Version**: TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3.5.28
**Primary Dependencies**: Nuxt 4, Vue 3, Tailwind CSS v4.2.1 (`@tailwindcss/vite`), Chart.js 4.5.1, vue-chartjs 5.3.3, Prisma 7.4.2
**Storage**: SQLite via Prisma 7 (`dev.db` à la racine) ; client généré dans `app/generated/prisma/`
**Testing**: Aucun test runner configuré
**Target Platform**: Application web SSR (serveur Nitro)
**Project Type**: Web application fullstack (Nuxt)
**Performance Goals**: Dashboard < 3s de chargement, recherche téléchargements < 5s, newsletter < 15s d'inscription
**Constraints**: Pas de SMTP (newsletter en mode capture uniquement), SQLite (écritures séquentielles), admin mono-utilisateur protégé par mot de passe
**Scale/Scope**: Petite plateforme, ~500+ téléchargements, croissance modérée des visites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|----------|--------|---------------|
| I. Nuxt Conventions First | PASS | Routage fichier (`app/pages/admin/`), routes serveur dans `server/api/`, auto-imports, composables |
| II. Simplicity & YAGNI | PASS | Compteur de pages vues simple (1 row par vue), newsletter basique (email uniquement), pas de système de notification automatique |
| III. Data Integrity via Prisma | PASS | Nouveaux modèles (`NewsletterSubscriber`, `PageVisit`) via Prisma avec migrations, accès via singleton `server/utils/prisma.ts` |
| IV. Consistent Toolchain | PASS | pnpm exclusivement, Tailwind via `@tailwindcss/vite`, Chart.js/vue-chartjs déjà installés via pnpm |
| V. Content-Centric UX | PASS | Dashboard admin = outil interne (pas de SSR requis). Newsletter footer = léger, pas de JS lourd côté public. Suivi des visites = appel serveur non-bloquant |

**Résultat** : Tous les gates passent. Aucune violation à justifier.

## Project Structure

### Documentation (this feature)

```text
specs/005-admin-dashboard-newsletter/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-endpoints.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma                    # +2 modèles : NewsletterSubscriber, PageVisit

server/
├── api/
│   ├── newsletter/
│   │   ├── index.get.ts             # Liste abonnés (admin, GET paginé)
│   │   ├── index.post.ts            # Inscription newsletter (public, POST)
│   │   ├── [id].delete.ts           # Suppression abonné (admin, DELETE)
│   │   └── export.get.ts            # Export CSV abonnés (admin, GET)
│   ├── downloads/
│   │   ├── index.get.ts             # Liste téléchargements (admin, GET paginé)
│   │   └── export.get.ts            # Export CSV téléchargements (admin, GET)
│   ├── stats/
│   │   ├── summary.get.ts           # Chiffres clés (totaux)
│   │   ├── downloads.get.ts         # Données graphique téléchargements par période
│   │   └── visits.get.ts            # Données graphique visites par période
│   └── visits/
│       └── index.post.ts            # Enregistrement visite (public, POST)
├── middleware/
│   └── admin.ts                     # Mise à jour : protéger nouvelles routes admin
└── utils/
    └── prisma.ts                    # Inchangé (singleton Prisma)

app/
├── layouts/
│   └── admin.vue                    # Re-thème sidebar/header (sombre + ambré)
├── pages/admin/
│   ├── index.vue                    # Dashboard refait avec graphiques Chart.js
│   ├── telechargements.vue          # Nouvelle page : liste des téléchargements
│   └── newsletter.vue               # Nouvelle page : gestion abonnés newsletter
├── components/
│   └── AppFooter.vue                # Ajout formulaire newsletter
└── plugins/
    └── track-visit.client.ts        # Plugin client pour enregistrer les visites
```

**Structure Decision**: Structure Nuxt existante conservée. Ajout de routes API suivant le pattern CRUD existant (ex: `magazines/`). Nouvelles pages admin dans `app/pages/admin/`. Plugin client pour le tracking des visites (non-bloquant).
