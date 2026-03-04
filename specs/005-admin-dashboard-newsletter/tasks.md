# Tasks: Dashboard Admin, Newsletter & Embellissement

**Input**: Design documents from `/specs/005-admin-dashboard-newsletter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Aucun test runner configuré — pas de tâches de tests automatisés.

**Organization**: Tâches groupées par user story pour permettre l'implémentation et la vérification indépendantes de chaque story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, pas de dépendances)
- **[Story]**: User story associée (US1, US2, US3, US4, US5, US6)
- Chemins de fichiers exacts inclus dans les descriptions

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Ajout des nouveaux modèles Prisma et mise à jour du middleware d'authentification admin

- [x] T001 Ajouter les modèles `NewsletterSubscriber` et `PageVisit` dans `prisma/schema.prisma` — NewsletterSubscriber (id, email @unique, createdAt), PageVisit (id, path, visitedAt)
- [x] T002 Exécuter la migration Prisma : `pnpm prisma migrate dev --name add-newsletter-and-visits` puis `pnpm prisma generate`
- [x] T003 Mettre à jour `server/middleware/admin.ts` pour protéger les nouvelles routes admin : GET/DELETE `/api/newsletter`, GET `/api/downloads`, GET `/api/stats/*`, GET `/api/newsletter/export`, GET `/api/downloads/export` — les POST `/api/newsletter` et `/api/visits` restent publics

---

## Phase 2: Foundational — Suivi des visites (US6 - Prérequis pour US1)

**Purpose**: Mécanisme de collecte des visites de pages — bloquant pour le graphique de visites du dashboard (US1)

**⚠️ CRITIQUE**: Le dashboard (US1) a besoin des données de visite pour le graphique de fréquentation

- [x] T004 [P] [US6] Créer l'endpoint POST `/api/visits` dans `server/api/visits/index.post.ts` — valider que `path` est présent et commence par `/`, créer un enregistrement PageVisit, retourner `{ success: true }` (201) ou `{ message: "..." }` (400). Voir contrat dans `contracts/api-endpoints.md`
- [x] T005 [P] [US6] Créer le plugin client `app/plugins/track-visit.client.ts` — envoyer un POST fire-and-forget à `/api/visits` avec le `path` courant à chaque navigation (utiliser le hook `useRouter().afterEach` ou `watch` sur `useRoute().fullPath`)

**Checkpoint**: Les visites de pages sont enregistrées en base à chaque navigation côté client

---

## Phase 3: User Story 1 — Tableau de bord analytique avec graphiques (Priority: P1) 🎯 MVP

**Goal**: Remplacer le contenu actuel du dashboard admin (simples cartes de liens) par des graphiques Chart.js interactifs : courbe des téléchargements par période, répartition par magazine (doughnut), répartition par niveau d'étude (barres), courbe des visites, et cartes de chiffres clés.

**Independent Test**: Se connecter à l'admin, vérifier que les graphiques s'affichent. Créer des enregistrements Download et PageVisit via Prisma Studio, recharger et vérifier que les courbes reflètent les données.

### Implementation

- [x] T006 [P] [US1] Créer l'endpoint GET `/api/stats/summary` dans `server/api/stats/summary.get.ts` — retourner `{ totalDownloads, totalVisits, totalSubscribers, totalMagazines }` via `prisma.download.count()`, `prisma.pageVisit.count()`, `prisma.newsletterSubscriber.count()`, `prisma.magazine.count()`. Voir contrat dans `contracts/api-endpoints.md`
- [x] T007 [P] [US1] Créer l'endpoint GET `/api/stats/downloads` dans `server/api/stats/downloads.get.ts` — accepter query param `period` (7d|30d|90d|12m, défaut 30d), retourner `{ labels, datasets, byMagazine, byStudyLevel }`. Agréger les données Download par jour/mois côté serveur (JS car SQLite n'a pas DATE_TRUNC). Voir contrat dans `contracts/api-endpoints.md`
- [x] T008 [P] [US1] Créer l'endpoint GET `/api/stats/visits` dans `server/api/stats/visits.get.ts` — accepter query param `period` (7d|30d|90d|12m, défaut 30d), retourner `{ labels, datasets }`. Agréger les PageVisit par jour/mois côté serveur. Voir contrat dans `contracts/api-endpoints.md`
- [x] T009 [US1] Refaire `app/pages/admin/index.vue` avec le dashboard Chart.js — importer et enregistrer les composants Chart.js nécessaires (Line, Bar, Doughnut de vue-chartjs + CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend de chart.js). Afficher : (1) cartes de chiffres clés (totalDownloads, totalVisits, totalSubscribers, totalMagazines) via `/api/stats/summary`, (2) courbe téléchargements via `/api/stats/downloads` avec sélecteur de période, (3) doughnut répartition par magazine, (4) barres répartition par niveau d'étude, (5) courbe visites via `/api/stats/visits`. Gérer les états vides (message « Aucune donnée disponible »)

**Checkpoint**: Le dashboard admin affiche les graphiques interactifs et les chiffres clés. Changement de période met à jour les courbes. Les états vides sont gérés.

---

## Phase 4: User Story 2 — Liste des téléchargeurs avec détails (Priority: P2)

**Goal**: Ajouter une page admin listant tous les téléchargements avec nom, contact, âge, niveau d'étude, filière, magazine et date. Pagination serveur, recherche, tri par colonne, et export CSV.

**Independent Test**: Créer des enregistrements Download, accéder à `/admin/telechargements`, vérifier la liste paginée, la recherche, le tri et l'export CSV.

### Implementation

- [x] T010 [P] [US2] Créer l'endpoint GET `/api/downloads` dans `server/api/downloads/index.get.ts` — accepter query params `page` (défaut 1), `limit` (défaut 20, max 100), `search` (filtre sur fullName, contact, fieldOfStudy via `contains`), `sortBy` (fullName|contact|age|studyLevel|fieldOfStudy|createdAt, défaut createdAt), `sortOrder` (asc|desc, défaut desc). Retourner `{ data, total, page, limit }` avec relation `magazine` incluse. Voir contrat dans `contracts/api-endpoints.md`
- [x] T011 [P] [US2] Créer l'endpoint GET `/api/downloads/export` dans `server/api/downloads/export.get.ts` — exporter TOUS les téléchargements en CSV (ignorer pagination). Headers : `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="telechargements-YYYY-MM-DD.csv"`. Colonnes : Nom complet, Contact, Âge, Niveau d'étude, Filière, Magazine, Date. Entourer de guillemets les champs contenant des virgules. Voir contrat dans `contracts/api-endpoints.md`
- [x] T012 [US2] Créer la page `app/pages/admin/telechargements.vue` — tableau avec colonnes (Nom, Contact, Âge, Niveau d'étude, Filière, Magazine, Date), pagination (boutons précédent/suivant + info page), barre de recherche avec debounce, tri par clic sur en-tête de colonne (indicateur visuel de direction), bouton « Exporter CSV » qui déclenche le téléchargement via `/api/downloads/export`. Ajouter le lien « Téléchargements » dans la sidebar de `app/layouts/admin.vue`

**Checkpoint**: La page téléchargements affiche la liste paginée, la recherche filtre les résultats, le tri fonctionne, et l'export CSV télécharge un fichier complet.

---

## Phase 5: User Story 3 — Inscription newsletter dans le footer (Priority: P2)

**Goal**: Ajouter un formulaire d'inscription à la newsletter dans le footer du site. Validation email côté client et serveur, gestion des doublons.

**Independent Test**: Saisir un email dans le footer, vérifier le message de confirmation. Réessayer avec le même email, vérifier le message « déjà inscrit ». Saisir un email invalide, vérifier le message d'erreur.

### Implementation

- [x] T013 [P] [US3] Créer l'endpoint POST `/api/newsletter` dans `server/api/newsletter/index.post.ts` — valider le format email (RFC 5322 basique, max 254 chars), vérifier l'unicité, créer un NewsletterSubscriber. Réponses : 201 (inscription réussie), 400 (email invalide), 409 (déjà inscrit). Voir contrat dans `contracts/api-endpoints.md`
- [x] T014 [US3] Ajouter le formulaire newsletter dans `app/components/AppFooter.vue` — champ email avec placeholder, bouton « S'inscrire », validation côté client avant soumission, affichage des messages de retour (succès en vert, erreur en rouge, déjà inscrit en jaune/orange), état de chargement pendant la requête. Intégrer dans la section existante du footer en respectant le thème sombre/ambré

**Checkpoint**: Le formulaire newsletter dans le footer permet l'inscription, gère les doublons et les emails invalides avec des messages explicites.

---

## Phase 6: User Story 4 — Gestion des abonnés newsletter dans l'admin (Priority: P3)

**Goal**: Ajouter une page admin listant les abonnés newsletter avec export CSV et possibilité de suppression.

**Independent Test**: Inscrire des emails via le footer, accéder à `/admin/newsletter`, vérifier la liste, exporter en CSV, supprimer un abonné.

### Implementation

- [x] T015 [P] [US4] Créer l'endpoint GET `/api/newsletter` dans `server/api/newsletter/index.get.ts` — accepter query params `page` (défaut 1), `limit` (défaut 20, max 100). Retourner `{ data: [{ id, email, createdAt }], total, page, limit }`. Voir contrat dans `contracts/api-endpoints.md`
- [x] T016 [P] [US4] Créer l'endpoint GET `/api/newsletter/export` dans `server/api/newsletter/export.get.ts` — exporter TOUS les abonnés en CSV. Headers : `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="newsletter-YYYY-MM-DD.csv"`. Colonnes : Email, Date d'inscription. Voir contrat dans `contracts/api-endpoints.md`
- [x] T017 [P] [US4] Créer l'endpoint DELETE `/api/newsletter/:id` dans `server/api/newsletter/[id].delete.ts` — supprimer l'abonné par ID. Réponses : 200 (supprimé), 404 (non trouvé). Voir contrat dans `contracts/api-endpoints.md`
- [x] T018 [US4] Créer la page `app/pages/admin/newsletter.vue` — tableau avec colonnes (Email, Date d'inscription, Actions), pagination, bouton « Exporter CSV » via `/api/newsletter/export`, bouton de suppression par abonné avec confirmation (dialogue ou clic double). Ajouter le lien « Newsletter » dans la sidebar de `app/layouts/admin.vue`

**Checkpoint**: La page admin newsletter affiche les abonnés, permet l'export CSV et la suppression individuelle.

---

## Phase 7: User Story 5 — Embellissement du layout admin (Priority: P3)

**Goal**: Re-thématiser le layout admin (sidebar, header, fond de page) pour adopter le thème sombre avec accents ambrés du front office. Les pages internes existantes conservent leur thème blanc/emerald.

**Independent Test**: Vérifier visuellement que la sidebar et le header utilisent `gray-950`/`gray-900` pour les fonds et `amber-400`/`amber-500` pour les accents. Vérifier que les pages magazines/rubriques/partenaires gardent leur apparence actuelle. Vérifier le menu mobile.

### Implementation

- [x] T019 [US5] Re-thématiser `app/layouts/admin.vue` — remplacer les classes Tailwind emerald/white par le thème sombre/ambré : fond sidebar `bg-gray-950`, items actifs `bg-gray-800 text-amber-400`, items hover `hover:bg-gray-800`, texte secondaire `text-gray-400`, accents `text-amber-400`/`amber-500`, header mobile `bg-gray-900`. Conserver la structure HTML et la logique existante (menu mobile toggle, navigation, logout). Ne PAS modifier les styles des pages internes

**Checkpoint**: Le layout admin utilise le thème sombre/ambré. Les pages internes restent inchangées.

---

## Phase 8: Polish & Vérifications croisées

**Purpose**: Validation finale et vérifications transversales

- [x] T020 Vérifier les états vides sur toutes les pages : dashboard sans données (graphiques à zéro ou message), liste téléchargements vide, liste newsletter vide, export CSV vide (en-tête uniquement)
- [x] T021 Vérifier les edge cases : email > 254 caractères rejeté, path de visite invalide rejeté, pagination avec page > nombre total de pages, tri sur toutes les colonnes disponibles
- [x] T022 Exécuter le scénario complet de `quickstart.md` : inscription newsletter, vérification dashboard, liste téléchargements avec export, liste newsletter avec export et suppression, thème admin

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Pas de dépendances — démarrage immédiat
- **Foundational (Phase 2)**: Dépend du Setup (Phase 1) — les modèles Prisma doivent exister
- **US1 Dashboard (Phase 3)**: Dépend de Phase 2 (les visites alimentent le graphique)
- **US2 Downloads list (Phase 4)**: Dépend de Phase 1 uniquement (utilise le modèle Download existant)
- **US3 Newsletter footer (Phase 5)**: Dépend de Phase 1 uniquement (utilise NewsletterSubscriber)
- **US4 Newsletter admin (Phase 6)**: Dépend de Phase 1 ; indépendant de US3 mais logiquement après
- **US5 Admin theme (Phase 7)**: Dépend de Phase 1 uniquement ; indépendant de toutes les stories
- **Polish (Phase 8)**: Dépend de toutes les phases précédentes

### User Story Dependencies

- **US6 → US1**: Le tracking des visites (US6) alimente le graphique du dashboard (US1)
- **US3 → US4**: L'inscription newsletter (US3) produit les données affichées dans l'admin (US4)
- **US2, US5**: Totalement indépendants des autres stories
- **US2 et US4** modifient `app/layouts/admin.vue` (ajout de liens sidebar) — coordination nécessaire
- **US5** modifie `app/layouts/admin.vue` (re-theming) — exécuter après US2 et US4 pour éviter les conflits

### Within Each User Story

- Endpoints API avant pages frontend (les pages consomment les API)
- Les tâches marquées [P] dans une même phase peuvent s'exécuter en parallèle

### Parallel Opportunities

- **Phase 2**: T004 et T005 en parallèle (fichiers différents)
- **Phase 3**: T006, T007, T008 en parallèle (3 endpoints indépendants) → puis T009 (consomme les 3 APIs)
- **Phase 4**: T010 et T011 en parallèle (2 endpoints) → puis T012 (page + sidebar)
- **Phase 5**: T013 en parallèle avec d'autres phases si nécessaire → puis T014
- **Phase 6**: T015, T016, T017 en parallèle (3 endpoints) → puis T018 (page + sidebar)
- **Phases 4 et 5** peuvent s'exécuter en parallèle entre elles (aucune dépendance mutuelle)

---

## Parallel Example: Phase 3 (US1 Dashboard)

```bash
# 1. Lancer les 3 endpoints stats en parallèle :
Task T006: "Créer GET /api/stats/summary dans server/api/stats/summary.get.ts"
Task T007: "Créer GET /api/stats/downloads dans server/api/stats/downloads.get.ts"
Task T008: "Créer GET /api/stats/visits dans server/api/stats/visits.get.ts"

# 2. Une fois les 3 endpoints prêts, créer la page dashboard :
Task T009: "Refaire app/pages/admin/index.vue avec les graphiques Chart.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 + US6 prérequis)

1. Compléter Phase 1 : Setup (Prisma + middleware)
2. Compléter Phase 2 : Tracking des visites (US6)
3. Compléter Phase 3 : Dashboard Chart.js (US1)
4. **STOP et VALIDER** : Le dashboard affiche les graphiques avec les données existantes
5. Déployer/démo si prêt

### Livraison incrémentale

1. Setup + Foundational → Infrastructure prête
2. US1 Dashboard → Tester → Démo (MVP!)
3. US2 Téléchargements + US3 Newsletter footer → Tester → Démo
4. US4 Newsletter admin + US5 Thème admin → Tester → Démo
5. Polish → Validation finale

---

## Notes

- [P] = fichiers différents, pas de dépendances → exécution parallèle possible
- [Story] = traçabilité vers la user story de spec.md
- Pas de tests automatisés (aucun test runner configuré)
- Les contrats API détaillés sont dans `contracts/api-endpoints.md`
- Les décisions techniques sont dans `research.md`
- Committer après chaque tâche ou groupe logique
- S'arrêter à chaque checkpoint pour valider la story indépendamment
