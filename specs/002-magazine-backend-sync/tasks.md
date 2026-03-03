# Tasks: Synchronisation données magazine — Backend & Back Office

**Input**: Design documents from `/specs/002-magazine-backend-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Non requis (aucun test runner configuré — vérification manuelle via quickstart.md)

**Organization**: Tasks groupées par user story pour permettre l'implémentation et le test indépendant de chaque story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, pas de dépendance)
- **[Story]**: User story associée (US1, US2, US3, US4)
- Chemins exacts inclus dans les descriptions

---

## Phase 1: Setup (Schéma Prisma)

**Purpose**: Ajouter les 3 nouveaux champs au modèle Magazine et appliquer la migration

- [ ] T001 Ajouter les champs `subtitle` (String?), `availableAt` (DateTime?), `isFeatured` (Boolean @default(false)) au modèle Magazine dans `prisma/schema.prisma`
- [ ] T002 Appliquer la migration Prisma (`pnpm prisma migrate dev --name add-magazine-featured-fields`) et régénérer le client (`pnpm prisma generate`)

---

## Phase 2: Foundational (Endpoints existants + Middleware)

**Purpose**: Mettre à jour les endpoints existants pour accepter les nouveaux champs et protéger les futurs endpoints

**CRITICAL**: Doit être complété avant toute implémentation de user story

- [ ] T003 [P] Modifier `server/api/magazines/index.post.ts` pour accepter `subtitle` (String optionnel → null si absent) et `availableAt` (DateTime ISO optionnel → null si absent) dans le body. Ne PAS accepter `isFeatured`.
- [ ] T004 [P] Modifier `server/api/magazines/[id].put.ts` pour accepter `subtitle` et `availableAt` dans le body avec logique de mise à jour conditionnelle. Ne PAS accepter `isFeatured`.
- [ ] T005 Modifier `server/middleware/admin.ts` pour protéger les endpoints d'écriture `PUT /api/magazines/:id/featured` et `DELETE /api/magazines/:id/featured`

**Checkpoint**: Les endpoints existants acceptent les nouveaux champs, le middleware protège les futurs endpoints admin.

---

## Phase 3: User Story 1 — Mettre une édition à la une (Priority: P1) MVP

**Goal**: L'administrateur peut marquer un magazine « à la une » et la section AlaUne de la page d'accueil affiche dynamiquement ce magazine.

**Independent Test**: Mettre un magazine à la une via le back office → vérifier sur la page d'accueil. Retirer le statut → vérifier que la section disparaît.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Créer `server/api/magazines/featured.get.ts` — retourne le magazine avec `isFeatured: true` via `prisma.magazine.findFirst({ where: { isFeatured: true } })`, ou `null` si aucun
- [ ] T007 [P] [US1] Créer `server/api/magazines/[id]/featured.put.ts` — dans une transaction Prisma : (1) `updateMany({ where: { isFeatured: true }, data: { isFeatured: false } })` (2) `update({ where: { id }, data: { isFeatured: true } })`. Retourne 404 si magazine introuvable.
- [ ] T008 [P] [US1] Créer `server/api/magazines/[id]/featured.delete.ts` — met `isFeatured: false` sur le magazine ciblé. Retourne 404 si magazine introuvable.
- [ ] T009 [US1] Modifier `app/components/AlaUneSection.vue` — remplacer les données en dur par `useFetch('/api/magazines/featured')`. Si `data` est null, ne rien rendre (v-if). Mapper les champs API vers les variables du template (version→numero, name→titre, subtitle→sousTitre, description, availableAt→dateDisponibilite, pdfPath→pdfUrl, coverImage).
- [ ] T010 [US1] Modifier `app/pages/admin/magazines.vue` — ajouter un bouton « Mettre à la une » / « Retirer de la une » dans la liste des magazines. Utiliser `$fetch` vers `PUT /api/magazines/:id/featured` ou `DELETE /api/magazines/:id/featured`. Afficher un badge visuel sur le magazine actuellement à la une.

**Checkpoint**: US1 complète — la section « À la une » affiche dynamiquement le magazine sélectionné par l'admin.

---

## Phase 4: User Story 2 — Date de disponibilité et décompteur (Priority: P1)

**Goal**: L'administrateur peut définir une date de disponibilité future, le décompteur s'affiche en temps réel, le bouton de téléchargement s'active une fois la date passée.

**Independent Test**: Définir une date future → vérifier le décompteur. Définir une date passée → vérifier que le bouton « Télécharger » est actif. Pas de date → pas de décompteur, bouton actif.

### Implementation for User Story 2

- [ ] T011 [US2] Modifier `app/pages/admin/magazines.vue` — ajouter un champ `<input type="datetime-local">` pour `availableAt` dans le formulaire de création/modification. Envoyer la valeur en ISO 8601 dans le body du POST/PUT.
- [ ] T012 [US2] Modifier `app/components/AlaUneSection.vue` — adapter la logique du décompteur pour utiliser `data.availableAt` de l'API au lieu de la date en dur. Si `availableAt` est null, pas de décompteur.
- [ ] T013 [US2] Modifier `app/components/AlaUneSection.vue` — le bouton « Télécharger » est actif uniquement si `availableAt` est passée (ou null) ET `pdfPath` existe. Sinon afficher « Bientôt disponible » (désactivé).

**Checkpoint**: US2 complète — le décompteur et le bouton de téléchargement reflètent la date de disponibilité.

---

## Phase 5: User Story 3 — Sous-titre (Priority: P2)

**Goal**: L'administrateur peut renseigner un sous-titre pour chaque magazine, affiché dans la section « À la une ».

**Independent Test**: Ajouter un sous-titre à un magazine → vérifier qu'il s'affiche. Supprimer le sous-titre → vérifier qu'aucun espace vide ne reste.

### Implementation for User Story 3

- [ ] T014 [US3] Modifier `app/pages/admin/magazines.vue` — ajouter un champ texte pour `subtitle` dans le formulaire de création/modification. Envoyer la valeur dans le body du POST/PUT.
- [ ] T015 [US3] Modifier `app/components/AlaUneSection.vue` — afficher `subtitle` sous le titre si défini. Utiliser `v-if` pour ne pas rendre l'élément si `subtitle` est null/vide (pas d'espace résiduel).

**Checkpoint**: US3 complète — le sous-titre s'affiche dans la section « À la une » quand il est défini.

---

## Phase 6: User Story 4 — Cohérence page de détail (Priority: P2)

**Goal**: La page de détail du magazine affiche les nouvelles informations (sous-titre, date de disponibilité) de façon cohérente.

**Independent Test**: Accéder à `/magazine/:id` pour un magazine avec sous-titre et date de disponibilité → vérifier l'affichage.

### Implementation for User Story 4

- [ ] T016 [US4] Modifier `app/pages/magazine/[id].vue` — mettre à jour l'interface TypeScript `Magazine` pour inclure `subtitle`, `availableAt`, `isFeatured`. Afficher le sous-titre sous le titre (v-if sur subtitle).
- [ ] T017 [US4] Modifier `app/pages/magazine/[id].vue` — afficher la date de disponibilité si définie. Si date future et pas de PDF, désactiver le bouton de téléchargement avec « Bientôt disponible ».

**Checkpoint**: US4 complète — la page de détail affiche toutes les informations de façon cohérente avec la section « À la une ».

---

## Phase 7: Polish & Vérification

**Purpose**: Validation globale et edge cases

- [ ] T018 Exécuter les scénarios de vérification de `quickstart.md` — tester tous les chemins (back office, API, page d'accueil, page de détail)
- [ ] T019 Vérifier les edge cases : suppression d'un magazine à la une, magazine sans image de couverture, magazine sans PDF avec date passée, changement de date de disponibilité sur un magazine à la une

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pas de dépendance — démarre immédiatement
- **Foundational (Phase 2)**: Dépend de Phase 1 — BLOQUE toutes les user stories
- **US1 (Phase 3)**: Dépend de Phase 2 — MVP, prioritaire
- **US2 (Phase 4)**: Dépend de Phase 3 (AlaUneSection doit déjà fetcher l'API)
- **US3 (Phase 5)**: Dépend de Phase 3 (AlaUneSection doit déjà fetcher l'API)
- **US4 (Phase 6)**: Dépend de Phase 2 uniquement (indépendant des autres US)
- **Polish (Phase 7)**: Dépend de toutes les phases précédentes

### User Story Dependencies

- **US1 (P1)**: Dépend de Phase 2 — Aucune dépendance sur les autres stories
- **US2 (P1)**: Dépend de US1 (AlaUneSection.vue doit être connectée à l'API)
- **US3 (P2)**: Dépend de US1 (AlaUneSection.vue doit être connectée à l'API)
- **US4 (P2)**: Dépend de Phase 2 uniquement — peut être parallélisée avec US1

### Within Each User Story

- Endpoints serveur avant composants frontend
- Logique métier avant affichage
- Tester manuellement à chaque checkpoint

### Parallel Opportunities

- T003 et T004 (modification POST et PUT) en parallèle
- T006, T007, T008 (3 nouveaux endpoints featured) en parallèle
- US3 et US4 peuvent être développées en parallèle (fichiers différents)
- US4 peut commencer dès Phase 2 terminée (indépendante de US1)

---

## Parallel Example: User Story 1

```bash
# Lancer les 3 endpoints featured en parallèle :
Task T006: "Créer GET /api/magazines/featured dans server/api/magazines/featured.get.ts"
Task T007: "Créer PUT /api/magazines/:id/featured dans server/api/magazines/[id]/featured.put.ts"
Task T008: "Créer DELETE /api/magazines/:id/featured dans server/api/magazines/[id]/featured.delete.ts"

# Puis séquentiellement :
Task T009: "Modifier AlaUneSection.vue (dépend de T006)"
Task T010: "Modifier admin/magazines.vue (dépend de T007, T008)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (Prisma migration)
2. Phase 2: Foundational (endpoints existants + middleware)
3. Phase 3: US1 (featured endpoints + AlaUneSection dynamique + admin toggle)
4. **STOP et VALIDER**: Tester US1 indépendamment via quickstart.md
5. Déployer/démontrer si prêt

### Incremental Delivery

1. Setup + Foundational → Base prête
2. US1 → Section « À la une » dynamique → **MVP !**
3. US2 → Décompteur basé sur date API → Démontrer
4. US3 + US4 en parallèle → Sous-titre + page détail → Démontrer
5. Polish → Validation complète

---

## Notes

- Pas de tests automatisés — vérification manuelle via quickstart.md
- `isFeatured` géré UNIQUEMENT via les endpoints dédiés (jamais via POST/PUT magazine)
- Transaction Prisma obligatoire pour le toggle `isFeatured` (unicité applicative, contrainte SQLite)
- Commit recommandé après chaque phase ou checkpoint
