# Tasks: Site Vitrine Le Carré des Études

**Input**: Design documents from `/specs/001-magazine-landing-site/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-routes.md, research.md, quickstart.md

**Tests**: No test runner configured — test tasks are NOT included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database schema, upload directories

- [x] T001 Update Prisma schema with Magazine, Download, ContentItem, Partner models (remove User model) in `prisma/schema.prisma`
- [x] T002 Run Prisma migration to apply the new schema (`pnpm prisma migrate dev --name magazine-landing-site`)
- [x] T003 [P] Create upload directories: `public/uploads/magazines/`, `public/uploads/rubriques/`, `public/uploads/partenaires/`
- [x] T004 [P] Create `.env` file with `DATABASE_URL="file:./dev.db"` and `ADMIN_PASSWORD="admin-secret"` (if not exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared layout, navigation, admin auth middleware — MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create default layout with navbar and footer in `app/layouts/default.vue`
- [x] T006 [P] Create navigation bar component with links to 4 public pages and active-page indicator in `app/components/AppNavbar.vue`
- [x] T007 [P] Create footer component in `app/components/AppFooter.vue`
- [x] T008 [P] Implement admin authentication API route (POST /api/auth/login, compare password to ADMIN_PASSWORD env var, set server session) in `server/api/auth/login.post.ts`
- [x] T009 [P] Implement admin auth middleware (check session, return 401 if invalid) in `server/middleware/admin.ts`
- [x] T010 [P] Create admin auth composable (client-side login state, login/logout methods) in `app/composables/useAdmin.ts`
- [x] T011 Create admin login page (password form, call POST /api/auth/login, redirect to /admin on success) in `app/pages/admin/login.vue`
- [x] T012 Create admin dashboard page (links to manage magazines, rubriques, partenaires) in `app/pages/admin/index.vue`
- [x] T013 [P] Implement file upload API route (POST /api/upload, multipart, category field, save to public/uploads/{category}/) in `server/api/upload/index.post.ts`
- [x] T014 Update root `app/app.vue` to use default layout with NuxtLayout

**Checkpoint**: Foundation ready — layout, navigation, admin auth, and file upload infrastructure are operational

---

## Phase 3: User Story 1 — Découvrir le magazine (Priority: P1) 🎯 MVP

**Goal**: Un visiteur arrive sur le site et découvre Le Carré des Études à travers une page d'accueil immersive avec image de couverture, nom, slogan et navigation.

**Independent Test**: Accéder à `/`, voir l'image de présentation, le nom du magazine, l'accroche, et naviguer vers les autres pages.

### Implementation for User Story 1

- [x] T015 [US1] Create homepage with hero image, magazine name, mission statement, and call-to-action in `app/pages/index.vue`
- [x] T016 [US1] Add placeholder hero image in `public/images/hero/` and reference it from homepage

**Checkpoint**: User Story 1 complete — homepage displays magazine presentation and navigation works across all pages

---

## Phase 4: User Story 2 — Télécharger le magazine (Priority: P1) 🎯 MVP

**Goal**: Un visiteur consulte les magazines disponibles, remplit un formulaire dans une modale, ses informations sont enregistrées, et le téléchargement du PDF démarre.

**Independent Test**: Accéder à `/magazine`, voir les numéros disponibles, cliquer "Télécharger", remplir le formulaire, soumettre, et obtenir le PDF.

### Implementation for User Story 2

- [x] T017 [P] [US2] Implement GET /api/magazines (return all published magazines) in `server/api/magazines/index.get.ts`
- [x] T018 [P] [US2] Implement GET /api/magazines/:id (return single magazine or 404) in `server/api/magazines/[id].get.ts`
- [x] T019 [P] [US2] Implement POST /api/downloads (validate form fields including Ivorian phone regex, studyLevel enum, age 15-99; save to DB; return pdfUrl) in `server/api/downloads/index.post.ts`
- [x] T020 [US2] Create magazine card component (name, description, version, date, cover image, "Télécharger" button) in `app/components/MagazineCard.vue`
- [x] T021 [US2] Create download modal component (form with fullName, contact, studyLevel dropdown, age, fieldOfStudy text input; client-side validation; submit to POST /api/downloads; trigger PDF download on success) in `app/components/DownloadModal.vue`
- [x] T022 [US2] Create magazine listing page (fetch GET /api/magazines, display MagazineCard grid, open DownloadModal on click, disable download button if no pdfPath) in `app/pages/magazine.vue`
- [x] T023 [P] [US2] Implement POST /api/magazines (admin: create magazine with name, description, version, pdfPath, coverImage, publishedAt) in `server/api/magazines/index.post.ts`
- [x] T024 [P] [US2] Implement PUT /api/magazines/:id (admin: update magazine) in `server/api/magazines/[id].put.ts`
- [x] T025 [P] [US2] Implement DELETE /api/magazines/:id (admin: delete magazine and its file) in `server/api/magazines/[id].delete.ts`
- [x] T026 [US2] Create admin magazines management page (list, create, edit, delete magazines with file upload) in `app/pages/admin/magazines.vue`

**Checkpoint**: User Story 2 complete — visitors can browse magazines, fill the download form, and get the PDF. Admin can manage magazines.

---

## Phase 5: User Story 3 — Interviews & Rubriques (Priority: P2)

**Goal**: Un visiteur consulte les contenus éditoriaux organisés en 3 catégories : Portrait, Parcours Inspirant, En Vedette.

**Independent Test**: Accéder à `/rubriques`, voir les sections avec images, titres et descriptions. Les sections vides sont masquées.

### Implementation for User Story 3

- [x] T027 [P] [US3] Implement GET /api/rubriques (return all content items grouped by type: portrait, parcours_inspirant, en_vedette) in `server/api/rubriques/index.get.ts`
- [x] T028 [P] [US3] Create rubrique card component (image, title, description) in `app/components/RubriqueCard.vue`
- [x] T029 [US3] Create rubriques page (fetch GET /api/rubriques, display sections grouped by type, hide empty sections) in `app/pages/rubriques.vue`
- [x] T030 [P] [US3] Implement POST /api/rubriques (admin: create content item with type, title, description, imagePath, order) in `server/api/rubriques/index.post.ts`
- [x] T031 [P] [US3] Implement PUT /api/rubriques/:id (admin: update content item) in `server/api/rubriques/[id].put.ts`
- [x] T032 [P] [US3] Implement DELETE /api/rubriques/:id (admin: delete content item and its image) in `server/api/rubriques/[id].delete.ts`
- [x] T033 [US3] Create admin rubriques management page (list, create with type selector, edit, delete content items with image upload) in `app/pages/admin/rubriques.vue`

**Checkpoint**: User Story 3 complete — editorial content displays grouped by type, empty sections hidden. Admin can manage content items.

---

## Phase 6: User Story 4 — Partenaires (Priority: P3)

**Goal**: Un visiteur voit les organisations partenaires avec leurs logos et noms sur une grille dédiée.

**Independent Test**: Accéder à `/partenaires`, voir les logos et noms des partenaires. Message "pas encore de partenaires" si la liste est vide.

### Implementation for User Story 4

- [x] T034 [P] [US4] Implement GET /api/partenaires (return all partners ordered by order field) in `server/api/partenaires/index.get.ts`
- [x] T035 [P] [US4] Create partner logo component (logo image, name, optional link) in `app/components/PartnerLogo.vue`
- [x] T036 [US4] Create partenaires page (fetch GET /api/partenaires, display logo grid, show empty state message if no partners) in `app/pages/partenaires.vue`
- [x] T037 [P] [US4] Implement POST /api/partenaires (admin: create partner with name, logoPath, url, order) in `server/api/partenaires/index.post.ts`
- [x] T038 [P] [US4] Implement PUT /api/partenaires/:id (admin: update partner) in `server/api/partenaires/[id].put.ts`
- [x] T039 [P] [US4] Implement DELETE /api/partenaires/:id (admin: delete partner and its logo) in `server/api/partenaires/[id].delete.ts`
- [x] T040 [US4] Create admin partenaires management page (list, create, edit, delete partners with logo upload) in `app/pages/admin/partenaires.vue`

**Checkpoint**: User Story 4 complete — partner logos and names display in a grid. Admin can manage partners.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive design, SSR validation, performance, and edge case handling across all pages

- [x] T041 [P] Ensure all pages and components are responsive (mobile 375px, tablet 768px, desktop 1280px) across `app/pages/` and `app/components/`
- [x] T042 [P] Add alt text to all images for accessibility across all components
- [x] T043 Verify SSR renders content server-side for all public pages (text-first, images lazy-loaded)
- [x] T044 Run full quickstart.md verification checklist (all 12 items)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — No dependency on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) — No dependency on other stories
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) — No dependency on other stories
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) — No dependency on other stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — only needs layout and navigation from Phase 2
- **US2 (P1)**: Independent — needs Prisma models (Phase 1) + admin middleware (Phase 2)
- **US3 (P2)**: Independent — needs Prisma models (Phase 1) + admin middleware (Phase 2)
- **US4 (P3)**: Independent — needs Prisma models (Phase 1) + admin middleware (Phase 2)

### Within Each User Story

- API routes (server/) before frontend pages (app/pages/)
- Components before pages that use them
- Public API routes before admin CRUD routes
- Admin API routes before admin pages

### Parallel Opportunities

- T003 and T004 can run in parallel (setup)
- T006, T007, T008, T009, T010, T013 can all run in parallel (foundational — different files)
- After Phase 2, all 4 user stories can start in parallel
- Within US2: T017, T018, T019 can run in parallel (different API files)
- Within US2: T023, T024, T025 can run in parallel (different admin API files)
- Within US3: T027 and T028 can run in parallel; T030, T031, T032 can run in parallel
- Within US4: T034 and T035 can run in parallel; T037, T038, T039 can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all public API routes for US2 together:
Task: "Implement GET /api/magazines in server/api/magazines/index.get.ts"
Task: "Implement GET /api/magazines/:id in server/api/magazines/[id].get.ts"
Task: "Implement POST /api/downloads in server/api/downloads/index.post.ts"

# Then launch components in parallel:
Task: "Create MagazineCard component in app/components/MagazineCard.vue"
Task: "Create DownloadModal component in app/components/DownloadModal.vue"

# Then build the page that uses them:
Task: "Create magazine listing page in app/pages/magazine.vue"

# Then admin CRUD routes in parallel:
Task: "Implement POST /api/magazines in server/api/magazines/index.post.ts"
Task: "Implement PUT /api/magazines/:id in server/api/magazines/[id].put.ts"
Task: "Implement DELETE /api/magazines/:id in server/api/magazines/[id].delete.ts"

# Finally admin page:
Task: "Create admin magazines management page in app/pages/admin/magazines.vue"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (schema + migration + directories)
2. Complete Phase 2: Foundational (layout, nav, admin auth, upload)
3. Complete Phase 3: User Story 1 (homepage)
4. Complete Phase 4: User Story 2 (magazine download + admin)
5. **STOP and VALIDATE**: Homepage + magazine download flow works end-to-end
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (homepage) → Basic landing page live
3. Add US2 (download) → Core value delivered — magazine distribution works (MVP!)
4. Add US3 (rubriques) → Editorial content showcased
5. Add US4 (partenaires) → Partner visibility added
6. Polish → Responsive, accessible, performant

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (homepage — quick) then User Story 3 (rubriques)
   - Developer B: User Story 2 (magazine + download — largest story)
   - Developer C: User Story 4 (partenaires)
3. Stories complete and integrate independently via shared layout

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- No test runner configured — manual testing via browser and quickstart.md checklist
- Admin routes use server middleware for session validation (T009)
- All file uploads go through POST /api/upload (T013) — admin pages reuse this endpoint
