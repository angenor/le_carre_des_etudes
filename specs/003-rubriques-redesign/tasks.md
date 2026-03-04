# Tasks: Refonte des Rubriques avec Affichage Spécialisé par Type

**Input**: Design documents from `/specs/003-rubriques-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Non demandés — aucun test runner configuré dans le projet.

**Organization**: Tasks groupées par user story pour permettre une implémentation et des tests indépendants par story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut être exécuté en parallèle (fichiers différents, pas de dépendances)
- **[Story]**: User story associée (US1, US2, US3, US4)
- Chemins de fichiers exacts inclus dans les descriptions

---

## Phase 1: Setup

**Purpose**: Extension du modèle de données pour supporter les 4 types de rubriques

- [ ] T001 Ajouter 4 champs optionnels (`content String?`, `subtitle String?`, `eventDate DateTime?`, `eventLocation String?`) au modèle ContentItem dans `prisma/schema.prisma`
- [ ] T002 Exécuter la migration Prisma (`pnpm prisma migrate dev`) et régénérer le client (`pnpm prisma generate`)

---

## Phase 2: Foundational (Backend APIs)

**Purpose**: Modifier les endpoints API existants et créer le nouvel endpoint de détail. DOIT être complété avant toute implémentation frontend.

**⚠️ CRITICAL**: Aucun travail sur les user stories ne peut commencer avant la fin de cette phase.

- [ ] T003 [P] Modifier GET /api/rubriques : retourner 4 groupes (`en_vedette`, `parcours_inspirant`, `agenda_et_opportunites`, `focus`), mapper `portrait` → `parcours_inspirant`, inclure les nouveaux champs dans la réponse, trier par `order` ASC dans `server/api/rubriques/index.get.ts`
- [ ] T004 [P] Modifier POST /api/rubriques : valider les 4 types (`parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus`), accepter les nouveaux champs (`content`, `subtitle`, `eventDate`, `eventLocation`) avec validation contextuelle par type dans `server/api/rubriques/index.post.ts`
- [ ] T005 [P] Modifier PUT /api/rubriques/:id : supporter les nouveaux champs (`content`, `subtitle`, `eventDate`, `eventLocation`) dans la mise à jour partielle dans `server/api/rubriques/[id].put.ts`
- [ ] T006 [P] Créer GET /api/rubriques/:id : endpoint de détail retournant un ContentItem unique avec mapping `portrait` → `parcours_inspirant`, réponse 404 si non trouvé dans `server/api/rubriques/[id].get.ts`

**Checkpoint**: Tous les endpoints API sont fonctionnels — les user stories frontend peuvent commencer.

---

## Phase 3: US2 - Prise en charge des 4 types avec champs spécifiques (Priority: P1)

**Goal**: L'admin peut créer/éditer des rubriques avec les 4 types et les champs spécifiques par type.

**Independent Test**: Créer un contenu de chaque type via l'admin et vérifier la sauvegarde et récupération correcte de tous les champs.

**Dépendances**: Phase 2 (APIs backend)

### Implementation for User Story 2

- [ ] T007 [US2] Modifier le formulaire admin : remplacer le sélecteur de type par les 4 nouveaux types (`parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus`), afficher dynamiquement les champs `subtitle` (pour parcours_inspirant), `eventDate` et `eventLocation` (pour agenda_et_opportunites) selon le type sélectionné dans `app/pages/admin/rubriques.vue`

**Checkpoint**: L'admin peut créer et éditer des rubriques des 4 types avec les champs adaptés.

---

## Phase 4: US1 - Consultation des rubriques avec mise en page spécialisée par type (Priority: P1) 🎯 MVP

**Goal**: La page publique affiche chaque type de rubrique avec un layout visuel distinct inspiré du magazine physique.

**Independent Test**: Créer un contenu de chaque type et vérifier que la page rubriques affiche chacun avec son layout spécifique et identifiable.

**Dépendances**: Phase 2 (APIs backend). Indépendant de US2 (l'admin n'est pas requis — les données peuvent être insérées en base).

### Implementation for User Story 1

- [ ] T008 [P] [US1] Créer le composant LayoutParcours — thème sombre brun/noir, portrait photo à gauche, sous-titre (nom/titre personne), texte en colonnes, typographie serif, rendu du contenu riche via ToastViewer dans `app/components/rubrique/LayoutParcours.vue`
- [ ] T009 [P] [US1] Créer le composant LayoutVedette — style journal/presse, titre « EN VEDETTE » imposant, photo d'article, disposition 2 colonnes, accents orange sur fond clair, rendu du contenu riche via ToastViewer dans `app/components/rubrique/LayoutVedette.vue`
- [ ] T010 [P] [US1] Créer le composant LayoutAgenda — style événementiel/promotionnel, image de couverture grande, date et lieu mis en valeur, tons orange vifs, rendu du contenu riche via ToastViewer dans `app/components/rubrique/LayoutAgenda.vue`
- [ ] T011 [P] [US1] Créer le composant LayoutFocus — style informatif/académique structuré, titre « FOCUS » en gras, listes à puces, photo de groupe, disposition 2 colonnes, rendu du contenu riche via ToastViewer dans `app/components/rubrique/LayoutFocus.vue`
- [ ] T012 [US1] Modifier RubriqueCard avec des variantes de card stylisées par type (couleurs, typographie, disposition différentes selon le type) dans `app/components/RubriqueCard.vue`
- [ ] T013 [US1] Refondre la page listing des rubriques : 4 sections dans l'ordre (En Vedette → Parcours Inspirant → Agenda & Opportunités → Focus), premier item de chaque section en layout magazine (composant Layout* correspondant), 3 items suivants en cards stylisées (RubriqueCard), maximum 4 items par section, lien « Voir tout » si plus d'items existent, sections vides masquées dans `app/pages/rubriques.vue`

**Checkpoint**: La page publique affiche les 4 types de rubriques avec des layouts visuellement distincts et identifiables.

---

## Phase 5: US3 - Rédaction de contenu riche avec éditeur stylisé (Priority: P2)

**Goal**: L'admin peut rédiger du contenu riche formaté (titres, gras, italique, listes, images) via un éditeur intégré.

**Independent Test**: Rédiger un article avec mise en forme riche dans l'admin et vérifier le rendu sur la page publique.

**Dépendances**: Phase 3 / US2 (le formulaire admin doit exister)

### Implementation for User Story 3

- [ ] T014 [US3] Intégrer le composant ToastEditor pour l'édition du champ `content` (Markdown) dans le formulaire admin : ajout de l'éditeur avec chargement du contenu existant en mode édition, récupération du Markdown via `getMarkdown()` à la soumission dans `app/pages/admin/rubriques.vue`

**Checkpoint**: L'admin peut créer et éditer du contenu riche, rendu fidèlement sur la page publique via les layouts de la Phase 4.

---

## Phase 6: US4 - Page de détail d'une rubrique (Priority: P2)

**Goal**: Chaque rubrique a une page de détail dédiée affichant le contenu complet dans la mise en page spécialisée du type.

**Independent Test**: Cliquer sur une rubrique et vérifier que la page de détail affiche le contenu complet avec la mise en page du type.

**Dépendances**: Phase 2 (API [id].get.ts) + Phase 4 / US1 (composants Layout*)

### Implementation for User Story 4

- [ ] T015 [US4] Créer la page de détail rubrique : fetch via `/api/rubriques/:id`, sélection dynamique du composant Layout* selon le type, affichage du contenu complet (titre, image, description, contenu riche, champs spécifiques par type), lien retour vers le listing dans `app/pages/rubriques/[id].vue`

**Checkpoint**: Navigation complète listing → détail → retour, avec mise en page type-spécifique sur la page de détail.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Vérifications finales et ajustements transversaux

- [ ] T016 Vérifier et ajuster le responsive design sur les 3 formats (mobile 375px, tablette 768px, desktop 1280px+) pour tous les layouts et cards dans `app/components/rubrique/Layout*.vue` et `app/components/RubriqueCard.vue`
- [ ] T017 Exécuter la validation quickstart.md : vérifier le workflow complet (migration → admin création → listing affichage → détail navigation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pas de dépendances — démarre immédiatement
- **Foundational (Phase 2)**: Dépend de Phase 1 — BLOQUE toutes les user stories
- **US2 (Phase 3)**: Dépend de Phase 2 — formulaire admin avec 4 types
- **US1 (Phase 4)**: Dépend de Phase 2 — indépendant de US2
- **US3 (Phase 5)**: Dépend de US2 (Phase 3) — éditeur riche dans le formulaire admin
- **US4 (Phase 6)**: Dépend de US1 (Phase 4) + Phase 2 — page de détail
- **Polish (Phase 7)**: Dépend de toutes les phases précédentes

### User Story Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Backend APIs)
            ├── US2 (Phase 3: Admin 4 types)
            │       └── US3 (Phase 5: Éditeur riche)
            └── US1 (Phase 4: Layouts publics)
                    └── US4 (Phase 6: Page détail)
                            └── Phase 7 (Polish)
```

- **US1 ↔ US2**: Indépendants — peuvent être développés en parallèle après Phase 2
- **US3 → US2**: US3 dépend de US2 (le formulaire admin doit exister)
- **US4 → US1**: US4 dépend de US1 (les composants Layout* doivent exister)

### Parallel Opportunities

- **Phase 2**: T003, T004, T005, T006 — tous en parallèle (fichiers différents)
- **Phase 4**: T008, T009, T010, T011 — tous en parallèle (fichiers différents)
- **Phase 3 ↔ Phase 4**: US2 et US1 en parallèle (admin vs public, fichiers différents)

---

## Parallel Example: Phase 2 (Backend APIs)

```bash
# Lancer les 4 modifications d'API en parallèle :
Task: "Modifier GET /api/rubriques dans server/api/rubriques/index.get.ts"
Task: "Modifier POST /api/rubriques dans server/api/rubriques/index.post.ts"
Task: "Modifier PUT /api/rubriques/:id dans server/api/rubriques/[id].put.ts"
Task: "Créer GET /api/rubriques/:id dans server/api/rubriques/[id].get.ts"
```

## Parallel Example: Phase 4 (Layouts)

```bash
# Lancer les 4 composants de layout en parallèle :
Task: "Créer LayoutParcours dans app/components/rubrique/LayoutParcours.vue"
Task: "Créer LayoutVedette dans app/components/rubrique/LayoutVedette.vue"
Task: "Créer LayoutAgenda dans app/components/rubrique/LayoutAgenda.vue"
Task: "Créer LayoutFocus dans app/components/rubrique/LayoutFocus.vue"
```

---

## Implementation Strategy

### MVP First (US2 + US1)

1. Compléter Phase 1: Setup (migration Prisma)
2. Compléter Phase 2: Backend APIs (CRITIQUE — bloque tout le frontend)
3. Compléter Phase 3: US2 (admin 4 types) + Phase 4: US1 (layouts publics) — en parallèle
4. **STOP et VALIDER**: Tester la création de rubriques et l'affichage par type
5. Déployer/démontrer si prêt

### Incremental Delivery

1. Setup + Backend → Fondation prête
2. US2 + US1 (en parallèle) → MVP fonctionnel (admin + affichage)
3. US3 → Éditeur riche pour contenu de qualité
4. US4 → Pages de détail pour lecture complète
5. Polish → Responsive et validation finale

---

## Notes

- [P] = fichiers différents, pas de dépendances → exécution parallèle possible
- [Story] = label de traçabilité vers la user story (US1, US2, US3, US4)
- Pas de tests automatisés (aucun test runner configuré)
- Commit après chaque tâche ou groupe logique
- Les composants ToastEditor.client.vue et ToastViewer.client.vue existants sont réutilisés (pas de nouvelle dépendance)
- Le type `portrait` en base est mappé vers `parcours_inspirant` côté API (pas de migration de données)
