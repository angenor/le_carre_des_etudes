# Tasks: Simplification des Rubriques

**Input**: Design documents from `/specs/004-rubriques-simplify/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Tests**: Aucun test runner configuré — tests non inclus.

**Organization**: Tâches groupées par user story. US3 est exécutée avant US1 car la navigation `/magazine/[slug]` est un prérequis pour les liens de la galerie.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, pas de dépendances)
- **[Story]**: User story concernée (US1, US2, US3)
- Chemins de fichiers exacts inclus dans les descriptions

---

## Phase 1: Setup

**Purpose**: Extension du schéma Prisma — ajout du slug Magazine et de la relation ContentItem → Magazine

- [x] T001 Modifier le schéma Prisma : ajouter `slug String @unique` sur Magazine, ajouter `magazineId Int?` + relation `magazine Magazine? @relation(fields: [magazineId], references: [id], onDelete: SetNull)` sur ContentItem, ajouter `contentItems ContentItem[]` sur Magazine, changer `title` et `description` en `@default("")` sur ContentItem dans `prisma/schema.prisma`
- [x] T002 Exécuter la migration Prisma (`pnpm prisma migrate dev`) et régénérer le client (`pnpm prisma generate`). Vérifier que les slugs des magazines existants sont peuplés (script dans la migration ou post-migration via `slugify(version)`)

---

## Phase 2: Foundational

**Purpose**: Utilitaire partagé utilisé par les endpoints magazines. DOIT être complété avant les user stories.

**⚠️ CRITICAL**: Aucun travail sur les user stories ne peut commencer avant la fin de cette phase.

- [x] T003 Créer la fonction utilitaire `slugify(text: string): string` (minuscules, tirets, suppression accents et caractères spéciaux, format `[a-z0-9-]+`) dans `server/utils/slugify.ts`

**Checkpoint**: Utilitaire slugify disponible — les user stories peuvent commencer.

---

## Phase 3: US3 - Navigation magazine via slug (Priority: P1) 🎯 MVP

**Goal**: Les magazines sont accessibles via `/magazine/[slug]` avec slug auto-généré à partir de `version`.

**Independent Test**: Accéder à `/magazine/n-001` et vérifier que la page du magazine s'affiche. Créer un magazine et vérifier que le slug est auto-généré.

**Dépendances**: Phase 2 (slugify)

### Implementation for User Story 3

- [x] T004 [P] [US3] Créer l'endpoint GET /api/magazines/by-slug/[slug] : lookup magazine par slug, réponse 200 avec le magazine complet ou 404 `{ statusCode: 404, message: "Magazine non trouvé" }` dans `server/api/magazines/by-slug/[slug].get.ts`
- [x] T005 [P] [US3] Modifier POST /api/magazines : générer automatiquement le slug via `slugify(version)` si absent ou null, valider l'unicité du slug dans `server/api/magazines/index.post.ts`
- [x] T006 [P] [US3] Modifier PUT /api/magazines/:id : supporter la mise à jour du slug, régénérer le slug si `version` est mise à jour et `slug` non fourni dans `server/api/magazines/[id].put.ts`
- [x] T007 [US3] Créer la page de détail magazine par slug : fetch via `/api/magazines/by-slug/:slug`, affichage des informations du magazine (couverture, nom, version, description, PDF), page 404 si slug inexistant dans `app/pages/magazine/[slug].vue`

**Checkpoint**: Navigation `/magazine/[slug]` fonctionnelle. Les anciennes URLs `/magazine/[id]` restent accessibles.

---

## Phase 4: US1 - Galerie d'images par catégorie (Priority: P1)

**Goal**: La page `/rubriques` affiche une galerie d'images A4 verticales par catégorie avec navigation vers le magazine associé.

**Independent Test**: Créer des rubriques liées à des magazines, accéder à `/rubriques`, vérifier les 4 sections et que le clic mène à `/magazine/[slug]`.

**Dépendances**: Phase 2 + Phase 3 / US3 (la navigation `/magazine/[slug]` doit exister pour les liens)

### Implementation for User Story 1

- [x] T008 [US1] Modifier GET /api/rubriques : inclure la relation `magazine: { id, slug, name }` dans chaque item via Prisma `include`, retourner `magazine: null` si non associé dans `server/api/rubriques/index.get.ts`
- [x] T009 [US1] Simplifier RubriqueCard en carte image : afficher uniquement l'image A4 verticale, lien NuxtLink vers `/magazine/${magazine.slug}` si magazine associé, pas de lien si `magazine` est null, hover effect dans `app/components/RubriqueCard.vue`
- [x] T010 [US1] Refondre la page listing rubriques : 4 sections dans l'ordre (En Vedette → Parcours Inspirant → Agenda & Opportunités → Focus), affichage des RubriqueCard images, maximum 4 images par section avec bouton « Charger plus » (incréments de 4, côté client via ref réactive), sections vides masquées, responsive 375px/768px/1280px+ dans `app/pages/rubriques/index.vue`

**Checkpoint**: Galerie d'images par catégorie fonctionnelle avec navigation vers les magazines.

---

## Phase 5: US2 - Administration simplifiée des rubriques (Priority: P1)

**Goal**: Le formulaire admin affiche 3 champs essentiels en priorité avec toggle pour les champs avancés et sélection du magazine.

**Independent Test**: Créer une rubrique avec uniquement type + ordre + image + magazine, vérifier la sauvegarde. Cliquer « Afficher les champs avancés » et vérifier l'apparition des champs.

**Dépendances**: Phase 2 (schéma). Indépendant de US1 et US3.

### Implementation for User Story 2

- [x] T011 [P] [US2] Modifier POST /api/rubriques : rendre `title` et `description` optionnels (défaut `""`), accepter `magazineId` optionnel (valider que le magazine existe si fourni) dans `server/api/rubriques/index.post.ts`
- [x] T012 [P] [US2] Modifier PUT /api/rubriques/:id : accepter `magazineId` (peut être `null` pour dissocier), valider le magazine si fourni dans `server/api/rubriques/[id].put.ts`
- [x] T013 [US2] Modifier le formulaire admin rubriques : réorganiser pour afficher en premier les 3 champs essentiels (type, ordre, image) + dropdown sélection magazine (fetch `/api/magazines`), masquer les champs avancés (titre, description, contenu riche, sous-titre, date événement, lieu) derrière un bouton « Afficher les champs avancés » (toggle via ref réactive `showAdvanced`), préremplir les champs avancés en mode édition dans `app/pages/admin/rubriques.vue`

**Checkpoint**: L'admin peut créer/éditer des rubriques avec le workflow simplifié.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Vérifications finales et ajustements transversaux

- [x] T014 Vérifier et ajuster le responsive design sur les 3 formats (mobile 375px, tablette 768px, desktop 1280px+) pour la galerie d'images et les cartes dans `app/pages/rubriques/index.vue` et `app/components/RubriqueCard.vue`
- [x] T015 Exécuter la validation quickstart.md : vérifier le workflow complet (migration → admin création rubrique → listing galerie → clic rubrique → page magazine slug)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pas de dépendances — démarre immédiatement
- **Foundational (Phase 2)**: Dépend de Phase 1 (schéma migré)
- **US3 (Phase 3)**: Dépend de Phase 2 (slugify). Prérequis pour US1.
- **US1 (Phase 4)**: Dépend de Phase 3 / US3 (navigation slug doit exister)
- **US2 (Phase 5)**: Dépend de Phase 2 uniquement. Peut s'exécuter en parallèle avec US3 et US1.
- **Polish (Phase 6)**: Dépend de toutes les user stories

### User Story Dependencies

- **US3 (P1)**: Prérequis pour US1 — la navigation `/magazine/[slug]` doit fonctionner
- **US1 (P1)**: Dépend de US3 — les liens de la galerie pointent vers `/magazine/[slug]`
- **US2 (P1)**: Indépendant de US1 et US3 — peut s'exécuter en parallèle

### Within Each User Story

- API endpoints avant pages frontend
- Composants réutilisables avant pages qui les utilisent
- Compléter une story avant de passer à la suivante (sauf US2 parallélisable)

### Parallel Opportunities

- T004, T005, T006 (US3 endpoints) : parallèles — fichiers différents
- T011, T012 (US2 endpoints) : parallèles — fichiers différents
- US2 (Phase 5) entière : parallélisable avec US3 (Phase 3) et US1 (Phase 4)

---

## Parallel Example: User Story 3

```bash
# Lancer les 3 endpoints en parallèle :
Task: "T004 — Créer GET /api/magazines/by-slug/[slug].get.ts"
Task: "T005 — Modifier POST /api/magazines/index.post.ts"
Task: "T006 — Modifier PUT /api/magazines/[id].put.ts"

# Puis séquentiellement :
Task: "T007 — Créer page /magazine/[slug].vue" (dépend de T004)
```

---

## Implementation Strategy

### MVP First (US3 Slug Navigation)

1. Compléter Phase 1: Setup (migration schéma)
2. Compléter Phase 2: Foundational (slugify)
3. Compléter Phase 3: US3 (navigation slug)
4. **STOP et VALIDER** : Tester `/magazine/[slug]` indépendamment

### Incremental Delivery

1. Setup + Foundational → Schéma prêt
2. US3 → Navigation slug fonctionnelle → Valider
3. US1 → Galerie d'images → Valider
4. US2 → Admin simplifiée → Valider
5. Polish → Responsive + validation finale

### Parallel Strategy

Si plusieurs développeurs :
1. Tous complètent Setup + Foundational
2. Dev A : US3 (slug) → US1 (galerie, dépend de US3)
3. Dev B : US2 (admin) — en parallèle dès Phase 2

---

## Notes

- [P] = fichiers différents, pas de dépendances
- [Story] = traçabilité vers la user story
- Les Layout* de 003-rubriques-redesign sont conservés mais non utilisés
- La page `/magazine/[id].vue` reste accessible (rétro-compatibilité)
- La page `/rubriques/[id].vue` (détail rubrique) n'est plus utilisée (navigation vers magazine)
- Pas de nouvelle dépendance à installer
