# Implementation Plan: Module SALM (2/3) — back-office des éditions et des contenus, statistiques

**Branch**: `007-salm-admin-contenus` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-salm-admin-contenus/spec.md`

## Summary

La feature donne à l'équipe SALM la main sur tout ce que la page `/salm`, les formulaires et le badge affichent :
- gestion des éditions : création, modification, publication unique, archivage, republication tant que le salon n'est pas terminé, suppression d'un brouillon vierge ;
- prévisualisation d'une édition non publiée ;
- gestion des contenus : textes, affiche, PDF du programme, contacts, temps forts, chronogramme avec signalement des chevauchements, types de stands, et médias produits pendant l'édition (vidéo récapitulative, vidéos du canapé, photos) ;
- duplication d'une édition vers l'année suivante, sans médias ni inscriptions ;
- statistiques comparées à l'édition précédente, et encart sur le tableau de bord.

Ce plan intègre les **5 clarifications du 2026-09-28** (spec, section Clarifications).

**Approche technique** :
- **Aucune migration** : le modèle de la feature A couvre tout le périmètre (R16).
- ~34 routes Nitro sous `/api/admin/salm/*`, déjà protégées toutes méthodes par le middleware existant.
- La catégorie `salm` est ajoutée à `POST /api/upload`, avec contrôle du contenu réel par `sharp` (R2).
- Les fichiers sont libérés par comptage de références (R3).
- Publication dans une transaction qui archive l'édition publiée (R4).
- Duplication par écriture Prisma imbriquée, atomique (R5).
- Prévisualisation par une page admin qui réutilise le composant de `/salm` extrait (R6).
- `parseYoutubeId` durci et URL canoniques (R7).
- Ordre par boutons Monter / Descendre (R8).
- Statistiques calculées par `computePurgedStats`, la même fonction que pour les compteurs conservés, avec des graphiques `vue-chartjs` (R11).
- Seed en création seule, pour ne plus écraser les saisies (R12).

## Technical Context

**Language/Version** : TypeScript (ESM), Node 22 (image `node:22-slim`)

**Primary Dependencies** : existantes uniquement. Nuxt 4.3.1, Vue 3.5, Tailwind CSS 4.2 (`@tailwindcss/vite`), Prisma 7.4.2 (`prisma-client` + `@prisma/adapter-better-sqlite3`), h3, busboy 1.6, sharp 0.34.5, chart.js 4.5.1, vue-chartjs 5.3.3. **Aucune dépendance ajoutée**, aucun module Nuxt.

**Storage** :
- SQLite via Prisma 7 (`dev.db`, `/app/data/production.db` en production), **sans changement de schéma**.
- Fichiers envoyés dans `public/uploads/salm/` (volume Docker `uploads`, déjà monté).
- Images du seed inchangées dans `public/images/salm/`.

**Testing** : aucun test runner (constitution). Vérification par [quickstart.md](./quickstart.md).

**Target Platform** : serveur Nitro (Node) dans Docker derrière nginx ; back-office utilisé sur navigateurs de bureau récents, et utilisable sur tablette ou mobile.

**Project Type** : application web full-stack Nuxt (`app/`, `server/`, `shared/`).

**Performance Goals** :
- Statistiques en moins de 3 s pour 5 000 inscriptions (SC-010).
- Envoi de 20 photos de 3 Mo en moins de 2 minutes (SC-006).
- Toute modification visible immédiatement sur `/salm` : pas de cache sur `/api/salm/*`.

**Constraints** :
- Conteneur unique mono-processus, SQLite à un seul écrivain (R4).
- Images JPEG, PNG ou WebP de 5 Mo au plus ; PDF de 10 Mo au plus (clarification Q3).
- Un seul rôle admin, mot de passe partagé (clarification Q2).
- Aucune modification visible de la page publique hors aperçu.
- Accessibilité clavier (FR-198) ; français avec accents ; fichiers en `[a-z0-9-]`.

**Scale/Scope** :
- Données : quelques éditions, environ 50 photos et une dizaine de vidéos par édition, quelques milliers d'inscriptions.
- Code : 4 pages admin nouvelles et 1 modifiée, 1 page publique refactorée, 11 composants, 34 routes admin, 1 route modifiée.

Aucune inconnue ne reste : toutes les décisions sont dans [research.md](./research.md).

## Constitution Check

*GATE : passé avant la phase 0, puis revérifié après la conception (phase 1).*

| Principe | Vérification | Statut |
|---|---|---|
| **I. Nuxt Conventions First** | Routage par fichiers (`app/pages/admin/salm/editions/**`, `statistiques.vue`). Routes Nitro dans `server/api/admin/salm/**`, utilitaires dans `server/utils/`, code commun dans `shared/`. `useFetch` avec clés partagées, `definePageMeta`, `useSeoMeta`. Composants auto-importés (`salm/admin-*.vue` → `<SalmAdmin…>`). | ✅ |
| **II. Simplicity & YAGNI** | Aucune table, aucune colonne, aucune dépendance. Chaque abstraction nouvelle a au moins 2 usages réels : `applyOrder` (5 listes), `releaseSalmFiles` (6 routes), `loadEditionPayload` (public + aperçu), `edition-view.vue` (`/salm` + aperçu), `admin-order-buttons` (5 listes), `admin-image-field` (3 champs), `admin-youtube-field` (2), `useSalmUpload` (3), `isValidEmail` (2), `computePurgedStats` (purge + stats). Rejets documentés : index partiel, glisser-déposer, éditeur riche, fenêtre de confirmation maison, redimensionnement d'images. | ✅ |
| **III. Data Integrity via Prisma** | Tous les accès passent par `server/utils/prisma.ts`. Publication en `$transaction` interactive, réordonnancement en transaction, duplication par écriture imbriquée atomique. Aucun SQL brut (les agrégats par jour restent en JavaScript, comme `server/api/stats/*`). **Aucune migration**, justifié en R16 ; l'index partiel est écarté, car il échapperait à `schema.prisma` (R4). | ✅ |
| **IV. Consistent Toolchain** | Aucun `pnpm add`, aucun module. Tailwind reste un plugin Vite. | ✅ |
| **V. Content-Centric UX** | `/salm` reste en SSR, sans changement de rendu : le texte « Pourquoi » reste en texte brut rendu côté serveur (R9), sans ToastViewer. Aperçu non indexable. Les images publiques gardent le poids choisi par l'équipe (5 Mo au plus, clarification Q3). Graphiques uniquement dans le back-office. HTML sémantique (`nav`, `table`, `details`, `fieldset`) et tableaux de données accessibles sous les graphiques. | ✅ (les images de 5 Mo au plus sont servies telles quelles, sans redimensionnement : c'est la clarification Q3) |
| **Workflow** | Branche dédiée `007-salm-admin-contenus`, commits conventionnels. `CLAUDE.md` mis à jour : seed en création seule, section « Module SALM » (écrans d'édition, catégorie d'upload `salm`). Séparation `app/`, `server/` et `shared/`. | ✅ |

**Conventions du dépôt (CLAUDE.md)** :
- Nouveaux fichiers en kebab-case `[a-z0-9-]`.
- **Avant de créer un composant**, trois sous-agents ont vérifié l'existant ([research R1](./research.md#r1-inventaire-de-lexistant-sous-agents-de-recherche)). Aucun composant d'ordre, d'upload admin, de confirmation admin ou de champ YouTube n'existe. `SalmModalDialog` est stylé pour le public. `ToastEditor` est écarté (R9). Le reste est réutilisé : route d'upload, `parseYoutubeId`, validateurs de téléphone, `computePurgedStats`, `getPreviousEdition`, sérialiseurs publics, composants de section de `/salm`, `useSalmAdminEdition`, graphiques `vue-chartjs`.

**Réévaluation après la phase 1** : le modèle de données, les contrats et le quickstart ne créent aucune violation. **Aucune entrée dans Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/007-salm-admin-contenus/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 : décisions R1 à R16
├── data-model.md        # Phase 1 : écarts avec 006 uniquement (aucune migration)
├── quickstart.md        # Phase 1 : scénarios de vérification manuelle
├── contracts/
│   ├── admin-api.md     # /api/admin/salm/* (nouvelles routes, GET /editions étendu), /api/upload catégorie salm
│   └── ui-routes.md     # navigation, pages, sections, composants, aperçu, statistiques, tableau de bord
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks), pas encore créé
```

### Source Code (repository root)

```text
shared/
├── utils/salm.ts                          # MODIFIÉ : parseYoutubeId durci + canonicalYoutubeUrl (R7), isValidEmail (déplacé),
│                                          #           SLOT_KIND_LABELS, findSlotOverlaps (R13)
└── types/salm.ts                          # MODIFIÉ : SalmAdminEditionListItem, SalmAdminEditionDetail, SalmAdminStats,
                                           #           SalmAdminSummary, SalmAdminWarning

prisma/seed/
├── salm.ts                                # MODIFIÉ : création seule si l'année est absente (R12)
└── salm-data.ts                           # MODIFIÉ : en-tête (le contenu se gère dans le back-office)

server/
├── api/upload/index.post.ts               # MODIFIÉ : catégorie salm, champ kind, contrôles sharp / %PDF-, 5 et 10 Mo, pas d'OG (R2)
├── utils/
│   ├── salm-edition.ts                    # MODIFIÉ : loadEditionPayload(where) extrait de getPublicEditionPayload (R6)
│   ├── salm-purge.ts                      # MODIFIÉ : exposants des inscriptions non annulées (R11)
│   ├── salm-registration.ts               # MODIFIÉ : EMAIL_REGEX → isValidEmail (shared)
│   ├── salm-files.ts                      # NOUVEAU : isSalmImagePath, isSalmPdfPath, assertFileExists, releaseSalmFiles (R3, R15)
│   ├── salm-content.ts                    # NOUVEAU : validateurs des corps admin (édition, contacts, jour, créneau, temps fort,
│   │                                      #           vidéo, photo, stand), applyOrder, getEditionDetail, dérivés (data-model § 3)
│   ├── salm-lifecycle.ts                  # NOUVEAU : publishEdition, archiveEdition, duplicateEdition, deleteDraftEdition (R4, R5)
│   └── salm-stats.ts                      # NOUVEAU : getEditionStats, getDashboardSummary, findComparisonEdition (R11)
└── api/admin/salm/
    ├── editions/index.get.ts              # MODIFIÉ : champs ajoutés (contrat § 1)
    ├── editions/index.post.ts
    ├── editions/[editionId]/index.get.ts
    ├── editions/[editionId]/index.patch.ts
    ├── editions/[editionId]/index.delete.ts
    ├── editions/[editionId]/publish.post.ts
    ├── editions/[editionId]/archive.post.ts
    ├── editions/[editionId]/duplicate.post.ts
    ├── editions/[editionId]/preview.get.ts
    ├── editions/[editionId]/stats.get.ts
    ├── editions/[editionId]/days/index.post.ts
    ├── editions/[editionId]/highlights/index.post.ts   + order.put.ts
    ├── editions/[editionId]/videos/index.post.ts       + order.put.ts
    ├── editions/[editionId]/photos/index.post.ts       + order.put.ts
    ├── editions/[editionId]/stand-types/index.post.ts  + order.put.ts
    ├── days/[id].patch.ts, days/[id].delete.ts
    ├── days/[id]/slots/index.post.ts, days/[id]/slots/order.put.ts
    ├── slots/[id].patch.ts, slots/[id].delete.ts
    ├── highlights/[id].patch.ts, highlights/[id].delete.ts
    ├── videos/[id].patch.ts, videos/[id].delete.ts
    ├── photos/[id].patch.ts, photos/[id].delete.ts
    ├── stand-types/[id].patch.ts, stand-types/[id].delete.ts
    └── summary.get.ts

app/
├── layouts/admin.vue                      # MODIFIÉ : navItems.children, sous-entrées SALM (R14)
├── utils/salm-admin-errors.ts             # NOUVEAU : codes → textes français (R10)
├── composables/use-salm-upload.ts         # NOUVEAU : envoi XHR avec progression (R14)
├── components/salm/
│   ├── edition-view.vue                   # NOUVEAU (extrait de pages/salm/index.vue) : sections de /salm, utilisé par /salm et l'aperçu
│   ├── admin-order-buttons.vue            # NOUVEAU
│   ├── admin-image-field.vue              # NOUVEAU
│   ├── admin-youtube-field.vue            # NOUVEAU
│   ├── admin-edition-general.vue          # NOUVEAU
│   ├── admin-edition-texts.vue            # NOUVEAU
│   ├── admin-edition-contacts.vue         # NOUVEAU
│   ├── admin-edition-highlights.vue       # NOUVEAU
│   ├── admin-edition-chronogram.vue       # NOUVEAU
│   ├── admin-edition-stands.vue           # NOUVEAU
│   └── admin-edition-media.vue            # NOUVEAU
└── pages/
    ├── salm/index.vue                     # MODIFIÉ : utilise <SalmEditionView> (rendu identique)
    └── admin/
        ├── index.vue                      # MODIFIÉ : encart SALM (FR-197a)
        └── salm/
            ├── editions/index.vue         # NOUVEAU
            ├── editions/[id]/index.vue    # NOUVEAU
            ├── editions/[id]/apercu.vue   # NOUVEAU
            └── statistiques.vue           # NOUVEAU

CLAUDE.md                                  # MODIFIÉ : seed en création seule, écrans d'édition SALM, catégorie d'upload salm
deploy.sh                                  # MODIFIÉ : texte d'aide de la commande seed
```

**Structure Decision** : application Nuxt 4 unique, selon la structure posée par la feature A (`app/`, `server/`, `shared/`, `prisma/`). La logique serveur est regroupée en quatre utilitaires par responsabilité : fichiers, contenu, cycle de vie, statistiques. Les routes restent donc de minces adaptateurs HTTP, dans le style de `salm-admin.ts` et `salm-purge.ts`.

## Implementation Notes (ordre recommandé pour `/speckit-tasks`)

1. **Fondations** (bloquant) :
   - `shared/` : YouTube, e-mail, libellés, chevauchements, types ;
   - `salm-files.ts` et catégorie `salm` de l'upload ;
   - `salm-content.ts` (validateurs, `applyOrder`, fiche) ;
   - `salm-admin-errors.ts`, `use-salm-upload.ts` ;
   - navigation du layout ;
   - seed en création seule (à faire **avant** toute saisie de test, pour ne pas l'écraser).
2. **US1 — éditions** :
   - `salm-lifecycle.ts` : publier, archiver, supprimer ;
   - routes 1 à 7 et 9 ;
   - extraction de `loadEditionPayload` et de `edition-view.vue`, avec vérification du rendu identique de `/salm` ;
   - pages liste, fiche (section générale) et aperçu.
3. **US2 — contenus**, une section à la fois, chacune livrable seule :
   - textes, affiche et PDF ;
   - contacts ;
   - temps forts ;
   - chronogramme ;
   - stands ;
   - médias (vidéo récapitulative, canapé, photos).
   
   Composants transverses (`order-buttons`, `image-field`, `youtube-field`) créés avec leur premier usage.
4. **US3 — duplication** : `duplicateEdition`, route 8, bouton et message.
5. **US4 — statistiques** : correction de `computePurgedStats`, `salm-stats.ts`, routes 10 et 11, page des statistiques, encart du tableau de bord.
6. **Finitions** : `CLAUDE.md`, aide de `deploy.sh`, passage complet du quickstart (clavier, non-régression de `/salm`, de l'upload et du back-office des inscriptions).

**Points de vigilance** :
- Les routes de contenu **n'écrivent jamais** `status`, les interrupteurs, `lastBadgeSeq` ni les champs de purge (liste blanche, R15).
- `releaseSalmFiles` est appelé **après** l'écriture en base, et ne touche jamais `/images/salm/`.
- Publication : `updateMany` de l'édition publiée, puis `update` de la cible, **dans la même transaction**.
- Un chemin d'image venant du client est toujours validé (préfixe, extension, pas de `..`, existence) : il est injecté dans des `src` publics.
- `computePurgedStats` est partagé par la purge et les statistiques : garder la même forme `SalmPurgedStats`.
- Dates en UTC (Abidjan = UTC+0) ; décalage de duplication de + 364 jours en UTC.
- Rafraîchir la clé `salm-admin-editions` après toute action de statut, pour que l'en-tête des inscriptions reste à jour.
- Le refactor de `/salm` ne doit rien changer au HTML rendu (scénario 5.4 du quickstart).

## Points signalés (décision du porteur de projet)

1. **Fichiers orphelins** : les envois abandonnés restent sur le volume ; le nettoyage manuel est documenté dans le quickstart. Une automatisation pourra venir si le volume devient notable.
2. **Photos non redimensionnées** : conformément à la clarification Q3, les photos sont servies telles qu'envoyées (5 Mo au plus). Si l'équipe envoie souvent des photos proches de 5 Mo, la galerie publique sera lourde sur mobile ; un redimensionnement automatique par `sharp` serait alors le prochain pas, sans changement de contrat.
3. **Sécurité existante** (déjà signalée par la feature A) : mot de passe admin écrit dans les logs par `login.post.ts`, `PUT /api/homepage-images/[slug]` non protégé, `NUXT_SESSION_SECRET` absent en production. Le back-office peut désormais publier et supprimer des contenus ; la correction est recommandée avant la mise en production.
4. **Données encore manquantes** pour 2026 et 2027 (URL YouTube, titres des vidéos, tarifs des stands, affiche officielle, PDF du programme) : l'équipe peut désormais les saisir elle-même.

## Complexity Tracking

Aucune violation de la constitution : section sans objet.
