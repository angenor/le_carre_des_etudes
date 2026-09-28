---

description: "Tâches du module SALM (1/3) : page publique, inscriptions et back-office"
---

# Tasks: Module SALM (1/3) — page publique, inscriptions et back-office des inscriptions

**Input**: documents de conception dans `specs/006-salm-inscriptions/`

**Prerequisites**:
- [plan.md](./plan.md), [spec.md](./spec.md), avec les décisions de revue D1 à D13 dans Clarifications ;
- [research.md](./research.md) (R1 à R16), [data-model.md](./data-model.md) ;
- [contracts/public-api.md](./contracts/public-api.md), [contracts/admin-api.md](./contracts/admin-api.md), [contracts/ui-routes.md](./contracts/ui-routes.md) ;
- [quickstart.md](./quickstart.md).

**Tests** : aucun test runner n'est configuré (constitution) et aucun test automatisé n'est demandé. La validation se fait par les scénarios de `quickstart.md`, avec une tâche de vérification à la fin de chaque phase.

**Organisation** : phases demandées pour **ouvrir au plus vite les inscriptions étudiantes**.
1. Fondations.
2. MVP : inscription étudiante (US1), page `/salm` (US2) et lien dans la navbar, **plus la mise en production**.
3. Établissements (US3).
4. Back-office (US4).
5. Finitions : mobile, SEO, accessibilité, quickstart.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichier distinct, aucune dépendance sur une tâche non terminée de la même phase).
- **[US1]** inscription étudiante et badge · **[US2]** page publique `/salm` · **[US3]** inscription établissement · **[US4]** back-office.
- Conventions (CLAUDE.md) :
  - **nouveaux fichiers en kebab-case `[a-z0-9-]`**, sans accents : Nuxt résout `components/salm/modal-dialog.vue` en `<SalmModalDialog>` ;
  - textes d'interface en français **avec accents** ;
  - imports explicites dans `server/` (style du dépôt), et alias `#shared/…` pour le dossier `shared/`.

---

## Phase 1 : Fondations (installation et prérequis bloquants)

**But** : dépendances, polices, modèle de données complet, `shared/`, protection admin et seed 2027. Aucune tâche des phases suivantes ne commence avant la fin de cette phase.

### Installation

- [X] T001 Installer les dépendances avec `pnpm add pdf-lib@^1.17.1 @pdf-lib/fontkit@^1.1.1 qrcode@^1.5` puis `pnpm add -D @types/qrcode tsx`. Vérifier que `package.json` et `pnpm-lock.yaml` sont à jour. Aucun module Nuxt n'est à installer (research R3).
- [X] T002 [P] Ajouter `runtimeConfig: { public: { siteUrl: 'https://lecarredesetudes.com' } }` dans `nuxt.config.ts` (surchargeable par `NUXT_PUBLIC_SITE_URL`) et documenter `NUXT_PUBLIC_SITE_URL=` dans `.env.example` (research R5).
- [X] T003 [P] Ajouter les polices TTF **statiques complètes couvrant le Latin étendu** (Google Fonts, SIL OFL) et `OFL.txt` dans `server/assets/fonts/salm/` :
  - `montserrat-400.ttf`, `montserrat-500.ttf`, `montserrat-600.ttf`, `montserrat-800.ttf`, `montserrat-900.ttf` ;
  - `dm-sans-400.ttf`, `dm-sans-600.ttf`, `dm-sans-700.ttf` ;
  - `yellowtail-400.ttf`.
  
  Références : research R2, FR-030c.
- [X] T004 [P] Ajouter les polices web WOFF2 (sous-ensembles latin et latin-ext) dans `public/fonts/salm/` : `montserrat-latin-wght.woff2`, `dm-sans-latin-wght.woff2`, `yellowtail-latin-400.woff2`. Créer `app/assets/css/salm.css`, qui contient uniquement les `@font-face` correspondants avec `font-display: swap` (research R3). Ce fichier ne doit **pas** être ajouté à `css` dans `nuxt.config.ts`.
- [X] T005 [P] Ajouter dans `app/assets/css/main.css` un bloc `@theme` avec :
  - `--color-salm-accent: #D5570B`, `--color-salm-accent-text: #F4792B` ;
  - `--color-salm-bg: #0B0B0D`, `--color-salm-surface: #141417`, `--color-salm-surface-2: #16161A`, `--color-salm-surface-3: #1C1C21` ;
  - `--color-salm-border: #2A2A31`, `--color-salm-input-border: #8A847F` (FR-082a) ;
  - `--font-salm-title: Montserrat, sans-serif`, `--font-salm-body: 'DM Sans', system-ui, sans-serif`, `--font-salm-script: Yellowtail, cursive`.
- [X] T006 [P] Copier les images de `documentations/SALM/maquette/images/` sous des noms en `[a-z0-9-]` :
  - `public/salm/2026/` : `stands.jpg`, `panel.jpg`, `conference.jpg`, `lancement.jpg`, `reseautage.jpg` (catalogue photos 2026 et image de secours de la vidéo récapitulative) ;
  - `public/salm/2027/` : `affiche.jpg` (depuis `diplomee.jpg`), `lancement.jpg`, `conference.jpg`, `stands.jpg`, `panel.jpg`, `reseautage.jpg` (temps forts).
  
  Référence : data-model, « Données du seed ».

### Code partagé (`shared/`) et refactor du module magazine

- [X] T007 [P] Créer `shared/utils/study-levels.ts`. Il exporte `STUDY_LEVELS = ['Terminale / Futur bachelier', 'BTS / DUT (Bac+2)', 'Licence (Bac+3)', 'Master (Bac+5)', 'Doctorat', 'Autre'] as const` (tableau repris à l'identique de `app/components/DownloadModal.vue`) et le type `StudyLevel`.
- [X] T008 [P] Créer `shared/utils/phone.ts` avec les exports suivants (research R6) :
  - `IVORIAN_PHONE_REGEX = /^(01|05|07|27)\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/`, reprise à l'identique ;
  - `normalizeIvorianPhone(raw, { landline = false })`, qui :
    1. retire espaces, points, tirets et parenthèses ;
    2. retire un préfixe `+225` ou `00225` si le reste fait 10 chiffres ;
    3. valide `^(01|05|07|27)\d{8}$`, ou `^(01|05|07|21|25|27)\d{8}$` si `landline` ;
    4. renvoie les 10 chiffres, ou `null` ;
  - `formatIvorianPhone('0712345678')`, qui renvoie `'07 12 34 56 78'`.
- [X] T009 [P] Créer `shared/types/salm.ts` : types `SalmContact { kind: 'phone' | 'email' | 'address'; value: string; onBadge?: boolean }`, `SalmAudience { title: string; text: string }`, `SalmExhibitor { fullName: string; contact: string }`, `SalmPurgedStats` (forme exacte de data-model, « Forme de `purgedStats` »), et les types des réponses de [public-api.md](./contracts/public-api.md) : `SalmStatus`, `SalmPublicEdition`, `SalmPreviousEdition`, `SalmBadgePayload`, `SalmSchoolSummary`.
- [X] T010 [P] Créer `shared/utils/salm.ts` :
  - `formatBadgeNumber(year, seq)`, qui renvoie `SALM27-000482` (`SALM` + 2 derniers chiffres de l'année + `-` + numéro sur 6 chiffres) ;
  - `validateStudentName(raw)`, qui renvoie `{ value } | { error }` avec les codes `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `INVALID_CHARS`. Règle : « 2 à 60 caractères après réduction des espaces ; au moins 2 lettres ; uniquement lettres (accents compris), espaces, `-`, `'`, `’`, `.` », motif `^[\p{L}\p{M} .'’-]+$/u` (FR-020a) ;
  - `nameMatchKey` (NFD, sans diacritiques, minuscules, non-alphanumériques remplacés par un espace, mots triés) ;
  - `nameSearchKey` (même normalisation, sans tri) ;
  - `parseYoutubeId(url)` (formats `youtu.be/ID`, `watch?v=ID`, `embed/ID`, `shorts/ID`) ;
  - `formatHour('09:30')`, qui renvoie `'9h30'` ;
  - `formatDayLong` / `formatDayShort` (`Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' })`) ;
  - `SCHOOL_PROGRAMMES = ['BACHELOR', 'BTS', 'LICENCE', 'MASTER', 'AUTRE']` avec libellés (`AUTRE` → « Autre ») ;
  - `SCHOOL_STATUSES = ['nouvelle', 'contactee', 'confirmee', 'annulee']` avec libellés « Nouvelle · Contactée · Confirmée · Annulée » ;
  - `SLOT_KINDS = ['ceremonie', 'panel', 'presentation', 'stands', 'pause', 'exposition']` ;
  - les codes d'erreur de champ `REQUIRED | TOO_SHORT | TOO_LONG | INVALID_CHARS | INVALID_FORMAT | INVALID_CHOICE | TOO_MANY | DUPLICATE`.
- [X] T011 Remplacer, dans `app/components/DownloadModal.vue`, les constantes locales `STUDY_LEVELS` et `IVORIAN_PHONE_REGEX` par celles de `shared/utils/` (auto-import Nuxt 4). Style, messages et comportement restent **inchangés** (dépend de T007 et T008).
- [X] T012 [P] Remplacer les constantes locales de `server/api/downloads/index.post.ts` par `import { STUDY_LEVELS } from '#shared/utils/study-levels'` et `import { IVORIAN_PHONE_REGEX } from '#shared/utils/phone'`. Validation et format d'erreur **inchangés** (dépend de T007 et T008).

### Modèle de données et migration

- [X] T013 Ajouter les 9 modèles à `prisma/schema.prisma`, exactement selon l'esquisse de [data-model.md](./data-model.md#esquisse-prisma-référence-pour-la-migration-add_salm_module) :
  - `SalmEdition` : `year Int @unique`, `status String @default("draft")`, `salonName` avec défaut, `city @default("Abidjan")`, `audiences Json @default("[]")`, `contacts Json @default("[]")`, `studentRegistrationOpen` et `schoolRegistrationOpen` `@default(false)`, `lastBadgeSeq Int @default(0)`, `personalDataPurgedAt DateTime?`, `purgedStats Json?` ;
  - `SalmDay` avec `@@unique([editionId, date])` ;
  - `SalmSlot` avec `@@index([dayId, sortOrder])` ;
  - `SalmHighlight`, `SalmVideo`, `SalmPhoto` ;
  - `SalmStandType` avec `@@unique([editionId, name])` et `isVisible @default(true)` ;
  - `SalmStudentRegistration` avec `verifyToken @unique`, `downloadToken @unique`, `@@unique([editionId, phone])`, `@@unique([editionId, badgeSeq])`, `@@index([editionId, createdAt])` ;
  - `SalmSchoolRegistration` avec `programmes Json`, `exhibitors Json`, `standType … onDelete: Restrict`, `status @default("nouvelle")`, `@@index([editionId, status])`.
  
  Toutes les relations vers l'édition sont en `onDelete: Cascade`.
- [X] T014 Générer la migration avec `pnpm prisma migrate dev --name add_salm_module`, ce qui crée `prisma/migrations/<horodatage>_add_salm_module/migration.sql`. Contrôler qu'elle ne contient que des `CREATE TABLE` et `CREATE INDEX`, et aucune modification des tables existantes. Lancer ensuite `pnpm prisma generate` (dépend de T013).

### Sécurité des routes et utilitaires serveur communs

- [X] T015 [P] Dans `server/middleware/admin.ts`, ajouter `const ADMIN_ALL_METHODS_PREFIXES = ['/api/admin/']` et exiger la session admin pour **toute méthode** sur ces chemins (`isAdminAnyMethodRoute`), sans modifier les règles existantes (research R13).
- [X] T016 Toujours dans `server/middleware/admin.ts`, point de sécurité signalé au plan : ajouter `'/api/homepage-images'` à `PROTECTED_PREFIXES` (aujourd'hui `PUT /api/homepage-images/[slug]` est public). À retirer de la liste si le porteur de projet refuse ce correctif (dépend de T015, même fichier).
- [X] T017 [P] Point de sécurité signalé au plan : supprimer le `console.log('[LOGIN DEBUG] …')` de `server/api/auth/login.post.ts` (ligne 23), qui écrit le mot de passe reçu et le mot de passe attendu dans les logs.
- [X] T018 [P] Point de sécurité signalé au plan : ajouter `NUXT_SESSION_SECRET=${NUXT_SESSION_SECRET}` à l'environnement du service `app` dans `docker-compose.yml`, et générer ce secret (48 caractères aléatoires) dans la commande `setup` de `deploy.sh`, sur le modèle de `ADMIN_PASSWORD`.
- [X] T019 [P] Créer `server/utils/rate-limit.ts` (research R11) :
  - `getClientIp(event)` : en-tête `x-real-ip`, sinon adresse du socket ; **ne jamais lire `x-forwarded-for`** ;
  - `assertRateLimit(key, { max, windowMs })` : `Map` en mémoire à fenêtre fixe, purge paresseuse, `429` avec `data.code = 'RATE_LIMITED'` et en-tête `Retry-After`, sans aucune persistance ;
  - `recordFailure(key, …)` pour les échecs `NAME_MISMATCH` ;
  - constantes exportées : `STUDENT_LIMIT = { max: 30, windowMs: 10 min }`, `NAME_MISMATCH_LIMIT = { max: 5, windowMs: 60 min }`, `SCHOOL_LIMIT = { max: 5, windowMs: 10 min }`.
- [X] T020 Créer `server/utils/salm-edition.ts` (dépend de T014) :
  - `getPublishedEdition()` ;
  - `getPreviousEdition(year)` : `findFirst({ where: { year: { lt } }, orderBy: { year: 'desc' } })`, quel que soit le statut ;
  - `getEditionTimeline(days)` : `opensAtIso` / `endsAtIso` en UTC (= Abidjan), `hoursLabel`, `retentionDeadlineIso` = fin + 12 mois ;
  - `isRegistrationOpen(edition, 'students' | 'schools', now)` : toggle **et** `now < fin du dernier jour` (FR-053) ;
  - `serializePublicEdition(edition, previous)` : produit **exactement** la forme `GET /api/salm/edition` de public-api.md, avec des `select` Prisma explicites. Jamais `id`, `status`, `lastBadgeSeq`, `purgedStats` ni les toggles bruts.

### Seed de l'édition 2027 (et médias 2026)

- [X] T021 [P] Créer `prisma/seed/salm-data.ts` à partir de `documentations/brouillons/` et de la maquette (data-model, « Données du seed »).
  - **Édition 2026** `archived` : `organizerName` ; photos `public/salm/2026/*.jpg` avec les textes alternatifs de la maquette ; `recapPosterPath: '/salm/2026/panel.jpg'` ; `recapVideoUrl: null` et `videos: []` (URL YouTube à compléter, commentaire `// TODO URL fournies par l'organisateur`).
  - **Édition 2027** `published`, avec les 2 toggles à `true` :
    - tagline « L'avenir se choisit maintenant ! », `venue: null` ;
    - `whyTitle` et `whyText`, 3 `audiences` (textes de `page-desktop.dc.html`) ;
    - `contacts` : `+225 27 35 966 789`, `+225 07 68 011 409` avec `onBadge: true`, `salm2026@sucreycorporates.com`, « Abidjan Cocody, Riviera Palmeraie » ;
    - `posterPath: '/salm/2027/affiche.jpg'` ;
    - jours `2027-03-12` 09:30–16:00 « Jour 1 » et `2027-03-13` 09:30–16:30 « Jour 2 » ;
    - les 7 créneaux du Jour 1 et les 5 du Jour 2, tels que dans le chronogramme 2027, chevauchement et trou inclus, avec `kind`, et `isHighlighted: true` pour « Présentation du magazine Le Carré des Études » (11:00–11:10) ;
    - 5 temps forts (LANCEMENT OFFICIEL, CONFÉRENCE, VISITE DE STANDS, PANEL, RÉSEAUTAGE & PARTENARIAT) ;
    - stands STAND OR, STAND DIAMANT, STAND PREMIUM, sans description ni tarif.
- [X] T022 Créer `prisma/seed/salm.ts` avec `seedSalm()`, idempotent (research R8), qui importe `prisma` depuis `../../server/utils/prisma` (dépend de T014 et T021) :
  - éditions en `upsert` par `year`. À la mise à jour, **seulement les champs de contenu** : jamais `status`, les toggles, `lastBadgeSeq`, `personalDataPurgedAt` ni `purgedStats` ;
  - `SalmDay` en `upsert` par `(editionId, date)` ;
  - créneaux, temps forts, vidéos et photos : `deleteMany` puis `createMany` ;
  - `SalmStandType` en `upsert` par `(editionId, name)`, **jamais supprimés** ;
  - aucune écriture sur les inscriptions.
- [X] T023 Créer `prisma/seed.ts`, qui appelle `seedSalm()`, journalise un résumé et termine avec le bon code de sortie. Ajouter `seed: 'tsx prisma/seed.ts'` dans `migrations` de `prisma.config.ts`. Lancer `pnpm prisma db seed` **deux fois** : aucune erreur ni doublon (dépend de T022).

**Checkpoint** : `pnpm dev` démarre. Le module magazine fonctionne comme avant (quickstart, scénario 6). `curl -i localhost:3000/api/admin/salm/x` répond `401`. Les éditions 2026 et 2027 sont visibles dans `pnpm prisma studio`.

---

## Phase 2 : MVP — inscription étudiante, badge, page `/salm` et navbar (US1 + US2, P1) 🎯

**But** : les étudiant·e·s découvrent le SALM 2027 depuis la navbar, s'inscrivent et téléchargent leur badge. La phase se termine par la mise en production.

**Test indépendant** : quickstart, scénario 1 (desktop) et scénario 2 en entier. Inscription, PDF de 100 × 150 mm, QR code lu par Android et iPhone, parcours « badge perdu », anti-robots.

### US2 — données publiques et navigation

- [X] T024 [P] [US2] Créer `server/api/salm/status.get.ts`, qui renvoie `{ published: boolean, year: number | null }` (public-api.md).
- [X] T025 [P] [US2] Créer `server/api/salm/edition.get.ts`, qui renvoie `serializePublicEdition(...)` ou `{ edition: null, previous: null }` sans erreur (FR-019).
- [X] T026 [P] [US2] Créer `app/composables/use-salm-status.ts`, qui exporte `useSalmStatus()` : `useFetch('/api/salm/status', { key: 'salm-status' })`, partagé par la navbar et le pied de page.
- [X] T027 [US2] Dans `app/components/AppNavbar.vue`, transformer `navLinks` en `computed` qui insère `{ label: \`SALM ${year}\`, to: '/salm' }` après « Résultats » quand `useSalmStatus()` indique `published` (FR-018). **Aucune autre modification** : l'indicateur glissant reste tel quel, pas de menu mobile (D2) (dépend de T026).
- [X] T028 [P] [US2] Dans `app/components/AppFooter.vue`, ajouter aux « Liens rapides » le lien conditionnel « SALM <année> » vers `/salm`, avec le même style que les liens existants (dépend de T026).

### US2 — composants de la page `/salm`

Chaque composant importe `~/assets/css/salm.css`. Textes et styles de `page-desktop.dc.html`, données en props.

- [X] T029 [P] [US2] Créer `app/components/salm/modal-dialog.vue`, fondé sur l'élément natif `<dialog>` (research R9) :
  - props `open`, `title`, `labelledby` ;
  - `showModal()` à l'ouverture, bouton « Fermer » en premier élément focalisable ;
  - l'événement `cancel` (Échap) émet `close`, et le focus est rendu explicitement au déclencheur ;
  - style global `body:has(dialog[open]) { overflow: hidden }` ;
  - slot par défaut.
  
  Il est utilisé par la vidéo et par la galerie (FR-016, FR-017).
- [X] T030 [P] [US2] Créer `app/components/salm/countdown.vue` (research R10) :
  - rendu serveur : texte fixe « Ouverture le 12 mars 2027 à 9h30 » ;
  - dans `onMounted` : « OUVERTURE DANS N jours », « Aujourd'hui, 9h30 », « Le SALM <année> est en cours » ou « Merci pour cette édition », selon `opensAtIso` et `endsAtIso` ;
  - rafraîchissement par `setInterval` de 60 s, nettoyé dans `onUnmounted` ; pas d'`aria-live`.
- [X] T031 [P] [US2] Créer `app/components/salm/badge-card.vue` : visuel HTML du recto du badge, conforme à `inscription-etudiant.dc.html` (aperçu) et `page-desktop.dc.html` (carte). Props `year`, `fullName`, `studyLevel`, `number?`, `qrSvg?`, `size: 'sm' | 'md'`. Le nom est converti avec `toLocaleUpperCase('fr-FR')`. Quand `qrSvg` est absent, un carré de substitution est affiché. Le visuel porte `aria-hidden` et une légende textuelle est fournie par le parent.
- [X] T032 [P] [US2] Créer `app/components/salm/hero.vue` (FR-011, FR-012) :
  - image de secours rendue côté serveur (`previous.recapVideo.posterPath`, sinon l'affiche), avec `fetchpriority="high"`, `width` et `height` ;
  - intitulé, titre `h1` « Salm <année> » en Yellowtail, slogan, dates, « Lieu à confirmer, Abidjan » si `venue` est `null`, `hoursLabel` ;
  - 2 CTA, qui prennent l'état « closes » selon `registration` (FR-051) ;
  - `<SalmCountdown>`, ancres vers les sections, mention de l'organisateur ;
  - bouton « Revivre le SALM <année précédente> », qui ouvre `<SalmModalDialog>` avec l'iframe `youtube-nocookie` et le son, et qui est masqué sans vidéo.
- [X] T033 [US2] Ajouter dans `app/components/salm/hero.vue` la vidéo de fond (dépend de T032) :
  - injection côté client d'un iframe `youtube-nocookie.com/embed/<id>?autoplay=1&mute=1&loop=1&playlist=<id>&controls=0&playsinline=1&rel=0&disablekb=1&iv_load_policy=3`, avec `aria-hidden="true"`, `tabindex="-1"` et `pointer-events:none` ;
  - **seulement si** : largeur ≥ 768 px, pas de `prefers-reduced-motion: reduce`, pas de `navigator.connection.saveData`, et `effectiveType` différent de `slow-2g`, `2g` ou `3g` ;
  - bouton « Mettre la vidéo en pause » / « Relancer la vidéo », mémorisé en `sessionStorage` avec un `try/catch` (research R9, WCAG 2.2.2).
- [X] T034 [P] [US2] Créer `app/components/salm/participate.vue` : bloc « Deux façons de participer ».
  - Libellé « INSCRIPTIONS OUVERTES » seulement si au moins un type est ouvert.
  - Carte étudiant avec `<SalmBadgeCard>`, et carte établissement dont la liste « Or, Diamant ou Premium » est **dérivée des `standTypes`**.
  - Les CTA prennent l'état « closes » (FR-051).
- [X] T035 [P] [US2] Créer `app/components/salm/why.vue` : « Pourquoi le SALM ? », avec l'affiche (`poster`, masquée si `null`), `whyTitle`, `whyText`, les cartes `audiences` et la mention « Organisé par <organizerName> ».
- [X] T036 [P] [US2] Créer `app/components/salm/highlights.vue` : « Programme d'activité », grille des temps forts (titre + image `loading="lazy"` avec `imageAlt`), et lien « Voir le chronogramme détaillé → ».
- [X] T037 [P] [US2] Créer `app/components/salm/chronogram.vue` : « Chronogramme SALM <année> », 2 colonnes (une par jour) avec `label` et date longue, créneaux « 9h30 – 10h00 » avec titre et description. Style ambre pour `isHighlighted` (FR-014), style atténué pour `kind === 'pause'`. Bouton « Télécharger le programme (PDF) » seulement si `programPdfPath` existe (FR-015). Encart « Ton badge est valable les deux jours. » avec un lien vers l'inscription.
- [X] T038 [P] [US2] Créer `app/components/salm/videos.vue` : « Le canapé du SALM <année précédente> » (FR-006).
  - Chaque vidéo est un bouton avec miniature (`loading="lazy"`, `alt=""`), numéro 01, 02… et l'`aria-label` « Lire la vidéo 01 — <titre ou « Vidéo 01 »> ».
  - Au clic, `<SalmModalDialog>` monte l'iframe `youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`, avec `title` et `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`. L'iframe est démontée à la fermeture.
  - Lien de secours « Ouvrir sur YouTube ».
  - Section masquée s'il n'y a aucune vidéo.
- [X] T039 [P] [US2] Créer `app/components/salm/photos.vue` : « Catalogue photos · édition <année précédente> ».
  - Aperçu des 4 premières photos et tuile « + N photos dans le catalogue ».
  - « Voir tout le catalogue » ouvre une galerie dans `<SalmModalDialog>`, avec les flèches ← et →, les boutons « Photo précédente » / « Photo suivante » et le compteur « 3 / 12 ».
  - Section masquée s'il n'y a aucune photo (FR-017).
- [X] T040 [P] [US2] Créer `app/components/salm/final-cta.vue` :
  - titre dérivé de la date du premier jour (« Le 12 mars 2027, ton avenir a rendez-vous. ») ;
  - CTA selon `registration` ;
  - contacts rendus depuis `contacts` : `tel:` pour les téléphones, `mailto:` pour l'e-mail, texte pour l'adresse.
- [X] T041 [US2] Créer `app/pages/salm/index.vue` (dépend de T025 et T029 à T040) :
  - `await useFetch('/api/salm/edition')` ;
  - si `edition` est `null` : message d'attente « La prochaine édition du SALM sera bientôt annoncée. » (FR-019) ;
  - sinon, sections dans l'ordre FR-010, avec les ancres `#participer`, `#pourquoi`, `#programme`, `#chronogramme`, `#canape` et `#photos`, et le fond `bg-salm-bg` ;
  - `useHead` pour précharger `/fonts/salm/montserrat-latin-wght.woff2` ;
  - **socle mobile dès le MVP** (FR-084, constat F5) : sous 768 px, chaque section passe sur une colonne (grilles en `grid-cols-1`, textes et images en `max-w-full`), **sans défilement horizontal de la page à 360 et 390 px**. Les adaptations fines de la maquette mobile (carrousel, onglets, grille de 2 colonnes) restent en phase 5.

### US1 — inscription, badge et vérification (serveur)

- [X] T042 [P] [US1] Créer `server/utils/salm-badge-pdf.ts` (research R1, R2 ; FR-030 à FR-031) :
  - `renderBadgePdf({ registration, edition, days, contacts })`, qui renvoie un `Uint8Array` : 2 pages de **exactement 283,46 × 425,20 pt (100 × 150 mm)** ;
  - polices lues via `useStorage('assets:server').getItemRaw('fonts/salm/…')`, mises en cache au niveau du module, `registerFontkit`, `embedFont(bytes, { subset: true })` ;
  - **recto** (fond #D5570B, texte blanc) : « SALON INTERNATIONAL DES / LICENCES ET MASTERS », « DE CÔTE D'IVOIRE », « Salm » en Yellowtail, `<année>`, nom en majuscules, « <NIVEAU> · N° SALM27-000482 », et le QR code de `${siteUrl}/salm/v/${verifyToken}`. Ce QR code est issu de `QRCode.create(url, { errorCorrectionLevel: 'M' })`, dessiné en rectangles, avec un **carré de données d'au moins 25 mm** et une zone de silence blanche de 2 modules (FR-030a) ;
  - **nom** : la taille descend de 25 pt à **14 pt au minimum** par pas de 0,5 pt, pour tenir sur **2 lignes au plus** ; sinon **3 lignes à 14 pt**. **Jamais de troncature** (FR-030b) ;
  - **glyphes** : un caractère absent (`font.hasGlyphForCodePoint`) est remplacé par sa forme NFD sans diacritiques, dans le PDF uniquement (FR-030c) ;
  - **verso** (fond #F7F5F2, texte #C4500A) : « SALM <année> », « PARTICIPANT(E) », une ligne par jour (« Jour 1 · ven. 12 mars » et horaires), le lieu ou « Lieu à confirmer, Abidjan », et « Organisé par <organizerName> · <contact onBadge> » ;
  - `badgeQrSvg(url)` : `QRCode.toString(url, { type: 'svg', margin: 1 })`.
- [X] T043 [P] [US1] Créer `server/utils/salm-registration.ts` (dépend de T019 et T020) :
  - `assertHuman(event, body)` : `isBot(user-agent)` de `server/utils/is-bot.ts`, `website` vide, `startedAt` numérique avec `now - startedAt` entre 3 s et 24 h. Sinon `400` avec `data.code = 'REJECTED'` et **aucune raison** ;
  - `pickStudentFields(body)` : liste blanche `fullName`, `phone`, `studyLevel`, `website`, `startedAt` (FR-081a) ;
  - `validateStudent(fields)` : `validateStudentName`, `normalizeIvorianPhone`, `STUDY_LEVELS`. Erreur `400 { message: 'VALIDATION', data: { code: 'VALIDATION', errors: { champ: CODE } } }` : **des codes, pas de phrases** (D6) ;
  - `findStudentByPhone(editionId, phone)` et `namesMatch(a, b)` via `nameMatchKey` ;
  - `withStudentCreationLock(fn)` : file d'attente en mémoire (chaîne de promesses) qui exécute les créations **une par une** dans le processus (research R4, constat F14) ;
  - `createStudentRegistration(edition, fields)`, exécutée dans `withStudentCreationLock` : `prisma.$transaction` qui incrémente `lastBadgeSeq` puis crée l'inscription avec `badgeSeq`, `verifyToken` et `downloadToken` (`randomBytes(16).toString('base64url')`) et `nameSearch` ;
  - **gestion de `P2002` selon le champ en cause** (`error.meta`, constat F4) :
    - `phone` → renvoyer `{ kind: 'existing' }` pour que la route repasse par la vérification du nom ;
    - `verifyToken` ou `downloadToken` → régénérer les jetons et réessayer, 3 fois au plus ;
    - `badgeSeq` ou champ inconnu → `500` journalisée, **sans nom ni téléphone** dans le journal ;
  - **vérification immédiate de la concurrence**, dès que T044 existe et avant de commencer l'interface (T048) : lancer le `curl` parallèle du quickstart (scénario 2, étape 9) avec 2 requêtes au même numéro, puis 20 requêtes à des numéros différents. Attendu : aucune erreur 500, une seule inscription pour le même numéro, 20 numéros de badge consécutifs sans doublon ;
  - `toBadgePayload(registration, edition)` : `{ number, fullName, studyLevel, qrSvg, downloadUrl: '/api/salm/badges/<downloadToken>' }`.
- [X] T044 [US1] Créer `server/api/salm/students/index.post.ts` en suivant l'ordre du contrat (dépend de T042 et T043) :
  1. `assertRateLimit('students:ip:<ip>', STUDENT_LIMIT)` ;
  2. `assertHuman` ;
  3. édition publiée, sinon `404 NO_EDITION` ;
  4. validation ;
  5. inscription existante :
     - nom concordant : `200 { status: 'existing', badge }` ;
     - nom différent : `recordFailure('mismatch:<phone>')`, puis `409 NAME_MISMATCH` sans renvoyer le nom, ou `429` au-delà de 5 échecs en 1 h ;
  6. inscriptions fermées au sens effectif : `403 REGISTRATION_CLOSED` ;
  7. sinon création et `201 { status: 'created', badge }`, avec reprise à l'étape 5 si `P2002`.
- [X] T045 [P] [US1] Créer `server/api/salm/students/recover.post.ts` : liste blanche `fullName`, `phone`, `website`, `startedAt`, mêmes contrôles. Réponses `200 existing`, `404 NOT_FOUND`, `409 NAME_MISMATCH`, `400` et `429`. Fonctionne même quand les inscriptions sont fermées (dépend de T043).
- [X] T046 [P] [US1] Créer `server/api/salm/badges/[token].get.ts` : recherche par `downloadToken`, `renderBadgePdf`, en-têtes `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="badge-salm27-000482.pdf"`, `Cache-Control: private, no-store` et `X-Robots-Tag: noindex`. Sinon `404 BADGE_NOT_FOUND` (dépend de T042).
- [X] T047 [P] [US1] Créer `server/api/salm/verify/[token].get.ts` : recherche par `verifyToken`. Renvoie `{ valid: true, edition: { year, salonName } }` ou `{ valid: false, edition: null }`, **sans aucune donnée personnelle** (FR-028).

### US1 — interface

- [X] T048 [US1] Créer `app/components/salm/student-form.vue`, avec le **visuel de `inscription-etudiant.dc.html`** (D1) (dépend de T031 et T044) :
  - **mise en page** : carte #FAF8F5, colonne orange #D5570B à gauche (lien « Retour à la page SALM », photo, « Trois champs, et ton badge est prêt. », 3 atouts dont les dates dérivées de l'édition), formulaire, et aperçu `<SalmBadgeCard>` mis à jour à chaque frappe (FR-023) ;
  - **champs** : libellés, exemples « Kouassi Aya Marie » et « 07 12 34 56 78 », et liste des niveaux repris de `DownloadModal` ; `maxlength="60"` et compteur à partir de 50 caractères ; bordures `#8A847F` au repos et `#D5570B` au focus (FR-082a) ;
  - **accessibilité** : erreurs sous chaque champ avec `id`, `aria-describedby` et `aria-invalid` ; focus sur le premier champ en erreur ; erreur globale en `role="alert"` ;
  - **anti-robots** : champ piège `website` hors écran (`aria-hidden`, `tabindex="-1"`, `autocomplete="off"`) et `startedAt` au montage ;
  - **validation client** avec les fonctions de `shared/` ;
  - **table de textes au tutoiement** pour chaque code (contrats UI, « Textes des erreurs par formulaire ») ;
  - **mention d'usage** FR-024 (12 mois) sous le bouton ;
  - **écran « Félicitations, ton badge est prêt ! »** (ou « Tu es déjà inscrit·e » si `existing`) : badge avec `qrSvg` en `v-html`, lien `download` vers `downloadUrl`, consigne « Imprime à 100 % (sans ajustement à la page) ou présente-le sur ton téléphone », dates, horaires et lieu, et « Inscrire une autre personne », qui réinitialise le formulaire et met le focus sur le premier champ. Le focus est placé sur le titre à l'affichage ;
  - **mode fermé** (`registration.students.open === false`) : message de fermeture, puis formulaire réduit Nom & prénoms + téléphone, bouton « Récupérer mon badge » qui appelle `/api/salm/students/recover` ;
  - **socle mobile dès le MVP** (FR-084, constat F5) : sous 768 px, la colonne orange, le formulaire et l'aperçu du badge s'empilent sur une colonne ; champs et boutons en pleine largeur, sans défilement horizontal à 360 et 390 px. La mise en forme fidèle à la maquette mobile reste en T090 ;
  - **mention d'usage (D5)** : texte **à faire valider par l'organisateur avant la mise en production** (constat F6). Si D5 n'est pas validée à temps, afficher la version de repli « Tes informations servent uniquement à émettre ton badge, à organiser l'accueil du salon et à établir des statistiques anonymes. » (sans durée) et reporter la durée une fois la décision prise.
- [X] T049 [US1] Créer `app/pages/salm/inscription-etudiant.vue` : `useFetch('/api/salm/edition')`, en-tête « Inscription étudiant·e — SALM <année> » et sous-titre dérivé, `<SalmStudentForm>`, `useSeoMeta` (titre et description). Sans édition : même message d'attente que `/salm`. Mise en page sans défilement horizontal à 360 et 390 px (FR-084) (dépend de T048).
- [X] T050 [P] [US1] Créer `app/pages/salm/v/[token].vue` : `useFetch('/api/salm/verify/<token>')`. Affiche « Badge valide · SALM <année> » ou « Badge invalide ». `useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })`, **aucune donnée personnelle**.

### Mise en production du MVP

- [X] T051 [P] [US1] Dans l'étape `production` du `Dockerfile`, ajouter `COPY --from=build /app/app/generated ./app/generated` et `COPY --from=build /app/server/utils/prisma.ts ./server/utils/prisma.ts`, pour que `npx prisma db seed` fonctionne dans le conteneur (research R8). `prisma/` est déjà copié.
- [X] T052 [P] [US1] Ajouter à `deploy.sh` la commande `seed`, qui lance `docker compose exec app npx prisma db seed` sur le serveur, avec son aide dans l'usage du script (research R14).
- [X] T053 [P] [US1] Mettre à jour `CLAUDE.md` : commande `pnpm prisma db seed`, dossier `shared/` (constantes et normalisations communes), commande `./deploy.sh seed`, polices SALM limitées au module.
- [X] T054 [US1] Dérouler le quickstart, scénario 1 (étapes 1 à 6 et 8 à 9, sur desktop, et vérifier l'absence de défilement horizontal à 390 px) et scénario 2 **en entier** : PDF de 100 × 150 mm, QR code ≥ 25 mm lu par Android et iPhone, nom de 60 caractères, accents, repli des glyphes, badge perdu, `NAME_MISMATCH`, concurrence, liste blanche, anti-robots, 429. Corriger les écarts dans les fichiers concernés.

  - *Vérifié en local (implémentation)* : PDF 283,46 × 425,20 pt, QR décodé vers `/salm/v/<verifyToken>` (carré de données ≈ 31,75 mm), noms longs et accentués, repli des glyphes, badge perdu, `NAME_MISMATCH` puis `429`, concurrence, liste blanche, anti-robots, 31ᵉ envoi en `429`. **Reste à faire sur appareils réels** : scan Android et iPhone (écran et impression 10 × 15 cm), mesure du QR à la règle.

**Prérequis de mise en production** (constat F6) :
- le texte de la mention d'usage étudiante (D5) est validé par l'organisateur, ou la version de repli de T048 est en place ;
- le test de concurrence de T043 est passé.

**Checkpoint MVP** : déploiement avec `./deploy.sh deploy` puis `./deploy.sh seed`. Les inscriptions étudiantes sont ouvertes : c'est l'état initial du seed.

---

## Phase 3 : inscription établissement (US3, P2)

**But** : les établissements confirment leur présence en 3 étapes, sans badge.

**Test indépendant** : quickstart, scénario 3.

- [X] T055 [P] [US3] Ajouter dans `server/utils/salm-registration.ts` les fonctions `pickSchoolFields(body)` et `validateSchool(fields, visibleStandIds)` (dépend de T043, même fichier).
  - **Liste blanche** : `name`, `phone`, `email`, `programmes`, `otherProgramme`, `exhibitors[].fullName`, `exhibitors[].contact`, `standTypeId`, `question`, `website`, `startedAt`.
  - **Règles** (codes de public-api.md) :

    | Champ | Règle |
    |---|---|
    | `name` | 2 à 150 caractères |
    | `phone` | `normalizeIvorianPhone(…, { landline: true })` |
    | `email` | Forme valide, 254 caractères au plus, stocké en minuscules |
    | `programmes` | Non vide, ⊂ `SCHOOL_PROGRAMMES`, sans doublon |
    | `otherProgramme` | 120 caractères au plus, et seulement si `AUTRE` |
    | `exhibitors` | **1 à 6** ; `fullName` de 2 à 100 caractères ; `contact` = téléphone valide normalisé |
    | `standTypeId` | Type **visible** de l'édition publiée |
    | `question` | 1 000 caractères au plus |
- [X] T056 [US3] Créer `server/api/salm/schools/index.post.ts` : `assertRateLimit('schools:ip:<ip>', SCHOOL_LIMIT)`, `assertHuman`, `NO_EDITION`, `REGISTRATION_CLOSED` selon `isRegistrationOpen(…, 'schools')`, validation, création avec `status: 'nouvelle'`, puis `201 { status: 'created', summary }`. **Aucun badge, numéro ni jeton** (FR-047) (dépend de T055).
- [X] T057 [P] [US3] Créer `server/api/salm/agenda.ics.get.ts` : un `VEVENT` par jour, `DTSTART` et `DTEND` en UTC (`20270312T093000Z`), `SUMMARY:SALM 2027 — Jour 1`, `LOCATION` (lieu ou « Lieu à confirmer, Abidjan »), `UID:salm-2027-<date>@lecarredesetudes.com` ; en-têtes `text/calendar; charset=utf-8` et `attachment; filename="salm-2027.ics"`. Sinon `404 NO_EDITION`.
- [X] T058 [US3] Créer `app/components/salm/school-form.vue`, conforme à `inscription-ecole.dc.html` (dépend de T056) :
  - **colonne de gauche** : photo `stands.jpg`, titre, encart « Aucun badge pour les établissements », contacts de l'édition ;
  - **indicateur d'étapes** : `<ol aria-label="Étapes">`, avec `aria-current="step"` ;
  - **étape 1** : nom, téléphone, e-mail, programmes en boutons `aria-pressed` dans un `fieldset` et `legend`, « Précisez » si Autre ;
  - **étape 2** :
    - exposants de 1 à 6 : ajout masqué à 6, retrait masqué à 1 ;
    - stands en radios natives, avec description et tarif s'ils existent ;
    - question libre ;
    - **mention d'usage FR-046 au vouvoiement**, au-dessus de « Confirmer notre présence » ;
    - « ← Retour » qui conserve les saisies ;
  - **étape 3, « Présence confirmée »** :
    - récapitulatif : stand, nombre d'exposants, programmes ;
    - « Aucun badge à télécharger : l'équipe SALM vous recontacte pour finaliser votre stand. » ;
    - « Vos exposants n'ont pas besoin de badge : ils seront pointés à l'accueil exposants sur une liste nominative. » ;
    - dates et lieu ;
    - « Ajouter à mon agenda » (`/api/salm/agenda.ics`) et « Retour à la page SALM ».
    
    **Aucune mention d'e-mail** (FR-043).
  - **table de textes au vouvoiement** pour chaque code ;
  - **focus** sur le titre de l'étape à chaque changement ;
  - bordures des champs identiques à T048 ;
  - champ piège et `startedAt`.
- [X] T059 [US3] Créer `app/pages/salm/inscription-ecole.vue` : `useFetch('/api/salm/edition')`, titre « Formulaire exposants — SALM <année> », `<SalmSchoolForm>` ou message de fermeture (FR-051), `useSeoMeta` (dépend de T058).
- [X] T060 [US3] Dérouler le quickstart, scénario 3, et corriger les écarts.

**Checkpoint** : les établissements peuvent s'inscrire ; les inscriptions sont visibles dans Prisma Studio en attendant la phase 4.

---

## Phase 4 : back-office des inscriptions (US4, P2)

**But** : entrée « SALM » dans l'admin, suivi des étudiant·e·s et des établissements, exports, statuts, notes, suppressions, ouverture et fermeture, conservation des données.

**Test indépendant** : quickstart, scénarios 4 et 4 bis.

### Utilitaires

- [X] T061 [P] [US4] Créer `server/utils/csv.ts` avec `toCsv(header: string[], rows: (string | number | null)[][])` (research R12) : BOM UTF-8, séparateur `;`, fin de ligne `\r\n`, chaque champ entre guillemets avec guillemets doublés, et **neutralisation des formules** (préfixe `'` devant `=`, `+`, `-`, `@` ou une tabulation en tête).
- [X] T062 [P] [US4] Créer `server/utils/salm-purge.ts` (research R16, FR-065b) :
  - `computePurgedStats(tx, editionId)` : `groupBy` et `count` produisant la forme `SalmPurgedStats` exacte de data-model ;
  - `purgeEditionPersonalData(editionId)` : une seule transaction qui contrôle `status === 'archived'`, la fin du salon passée et `personalDataPurgedAt === null` (sinon `409` `EDITION_NOT_ARCHIVED`, `EDITION_NOT_ENDED` ou `ALREADY_PURGED`), puis calcule les statistiques, supprime les inscriptions étudiantes et établissements, et renseigne `personalDataPurgedAt` et `purgedStats`. **`lastBadgeSeq` n'est pas modifié.**

### Routes admin (`/api/admin/salm/*`, protégées par T015)

- [X] T063 [P] [US4] Créer `server/api/admin/salm/editions/index.get.ts` : `{ data: [...], defaultEditionId }`, tri par `year` décroissant. Pour chaque édition : `counts`, `ended`, `endsAtIso`, `retention { deadlineIso, exceeded, canPurge, purgedAt }` et `purgedStats` (admin-api.md).
- [X] T064 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/registrations.patch.ts` : booléens `studentRegistrationOpen` et `schoolRegistrationOpen`, au moins un requis. Refuser l'**ouverture** après la fin du salon (`409 EDITION_ENDED`) ; la fermeture est toujours acceptée. `400 INVALID_ID` et `404`.
- [X] T065 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/students/index.get.ts` :
  - pagination `page`/`limit` (1 à 100, 20 par défaut) ;
  - `search` : s'il ne contient que des chiffres (après retrait des espaces et de `+`, et du préfixe `225`), recherche dans `phone` ; sinon `nameSearchKey`, recherché dans `nameSearch`. **Longueur maximale : 100 caractères** ;
  - `studyLevel` ∈ `STUDY_LEVELS`, `sortBy` ∈ `createdAt | fullName | badgeSeq`, `sortOrder` ;
  - réponse `{ data, total, page, limit, grandTotal }`, avec `badgeNumber` et `phone` formatés.
- [X] T066 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/students/export.get.ts` (dépend de T061) : mêmes filtres que la liste, sans pagination. Colonnes `N° de badge;Nom & prénoms;Téléphone;Niveau d'étude;Date d'inscription` (`JJ/MM/AAAA HH:MM`, UTC), fichier `salm-<année>-etudiants-<AAAA-MM-JJ>.csv`.
- [X] T067 [P] [US4] Créer `server/api/admin/salm/students/[id]/badge.get.ts` : même PDF que la route publique, via `renderBadgePdf` ; `404` si l'inscription est introuvable.
- [X] T068 [P] [US4] Créer `server/api/admin/salm/students/[id].delete.ts` : suppression définitive, `{ success: true }`, `404` si introuvable. `lastBadgeSeq` n'est pas modifié.
- [X] T069 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/schools/index.get.ts` : `status` ∈ `SCHOOL_STATUSES`, `search` (nom ou e-mail, 100 caractères au plus), `sortBy` ∈ `createdAt | name`, pagination. Réponse `{ data, total, page, limit, countsByStatus }`, avec `standName`, `exhibitorCount` et `hasNote`.
- [X] T070 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/schools/export.get.ts` (dépend de T061) : colonnes `Établissement;Téléphone;E-mail;Programmes;Précision « Autre »;Stand;Nombre d'exposants;Exposants;Statut;Note interne;Question;Date d'inscription`. Programmes joints par ` · `, exposants au format `Nom (contact)` joints par ` | `, statut en libellé français.
- [X] T071 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/exhibitors/export.get.ts` (dépend de T061) : « Liste des exposants » (FR-068a), une ligne par exposant des inscriptions **non annulées**, triée par établissement. Colonnes `Établissement;Stand;Nom & prénoms;Contact`, fichier `salm-<année>-exposants-<AAAA-MM-JJ>.csv`.
- [X] T072 [P] [US4] Créer `server/api/admin/salm/schools/[id].get.ts` : fiche complète, forme exacte de admin-api.md (`editionYear`, `stand { id, name, isVisible }`, exposants, `internalNote`).
- [X] T073 [P] [US4] Créer `server/api/admin/salm/schools/[id].patch.ts` : liste blanche `status` (∈ 4 valeurs) et `internalNote` (**2 000 caractères au plus**, chaîne vide → `null`), au moins un champ requis. Renvoie la fiche à jour ; `400 VALIDATION` avec codes et `404`.
- [X] T074 [P] [US4] Créer `server/api/admin/salm/schools/[id].delete.ts` : suppression définitive de l'inscription, exposants compris (FR-067a), `{ success: true }` ou `404`.
- [X] T075 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/purge.post.ts` (dépend de T062) : body `{ confirmYear }`. Renvoie `400 VALIDATION` s'il est absent, `400 CONFIRMATION_MISMATCH` s'il diffère de l'année, sinon appelle `purgeEditionPersonalData`. Réponse `{ purgedAt, deleted: { students, schools }, purgedStats }`.

### Interface admin

- [X] T076 [P] [US4] Ajouter dans `app/layouts/admin.vue` l'entrée `{ label: 'SALM', to: '/admin/salm', icon: <chemin SVG d'un badge ou d'un calendrier> }` au tableau `navItems`, après « Newsletter ».
- [X] T077 [US4] Créer `app/components/salm/admin-header.vue` (dépend de T063 et T064) :
  - sélecteur d'édition synchronisé avec `?edition=<année>` (par défaut `defaultEditionId`) ;
  - onglets « Étudiant·e·s » (`/admin/salm`) et « Établissements » (`/admin/salm/etablissements`) ;
  - 2 interrupteurs d'ouverture et de fermeture, `role="switch"` avec `aria-checked`, via `PATCH …/registrations`. Après la fin du salon : « Fermées automatiquement (salon terminé) » et interrupteurs désactivés ;
  - bloc conservation :
    - « Données personnelles à supprimer au plus tard le JJ/MM/AAAA », avec une alerte ambre si `exceeded` ;
    - si `canPurge`, bouton « Supprimer les données personnelles » qui ouvre une confirmation : texte d'effet, saisie de l'année, bouton final actif seulement si l'année est exacte ;
    - après la suppression, « Données personnelles supprimées le … » et les compteurs de `purgedStats`.
- [X] T078 [US4] Créer `app/pages/admin/salm/index.vue` (liste des étudiant·e·s), sur le modèle de `app/pages/admin/telechargements.vue` et `newsletter.vue` (dépend de T065 à T068 et T077) :
  - `definePageMeta({ layout: 'admin' })`, `<SalmAdminHeader>` ;
  - compteur « N inscrit·e·s » ;
  - recherche différée de 400 ms, filtre par niveau, tri par clic sur l'en-tête ;
  - tableau (N° de badge, Nom, Téléphone, Niveau, Date) ;
  - pagination « Page X sur Y — N résultats » ;
  - « Exporter CSV » via `window.open` avec les filtres courants ;
  - bouton « Badge » par ligne ;
  - suppression en 2 clics (« Confirmer » rouge pendant 3 s), puis `refresh()`.
- [X] T079 [US4] Créer `app/pages/admin/salm/etablissements/index.vue` (dépend de T069 à T071 et T077) : `<SalmAdminHeader>`, compteurs par statut cliquables comme filtre, recherche, tableau (Établissement, Stand, Exposants, Statut, Note, Date), lien vers la fiche, pagination, « Exporter CSV » et « Exporter la liste des exposants ».
- [X] T080 [US4] Créer `app/pages/admin/salm/etablissements/[id].vue` (dépend de T072 à T074) :
  - fiche : coordonnées, programmes avec la précision « Autre », exposants en lecture seule, stand (mention « masqué » si `isVisible` est faux), question, dates ;
  - sélecteur de statut et textarea de note interne (`maxlength="2000"`), « Enregistrer », bandeau de succès temporaire sur le modèle de `images-accueil.vue` ;
  - « Supprimer l'inscription » en 2 clics, puis retour à la liste ;
  - **aucun bouton « Badge »** (FR-047).
- [X] T081 [US4] Dérouler le quickstart, scénarios 4 et 4 bis, et corriger les écarts.

**Checkpoint** : back-office complet ; les inscriptions peuvent être fermées depuis l'admin.

---

## Phase 5 : finitions — mobile, SEO, accessibilité et quickstart

**But** : versions mobiles (D3), référencement, accessibilité AA et validation complète.

### Version mobile (< 768 px, référence 390 px ; FR-010a, D3)

- [X] T082 [P] Mettre à jour `app/components/salm/hero.vue` pour le mobile, selon `page-mobile.dc.html` : compte à rebours en ligne (« Ouverture dans N jours »), CTA empilés, bouton « Revivre le SALM <année> en vidéo », pas de vidéo de fond.
- [X] T083 [P] Mettre à jour `app/components/salm/participate.vue` pour le mobile : cartes empilées, textes de la maquette mobile.
- [X] T084 [P] Mettre à jour `app/components/salm/why.vue` pour le mobile : affiche **au-dessus** du texte, publics empilés.
- [X] T085 [P] Mettre à jour `app/components/salm/highlights.vue` pour le mobile : **carrousel horizontal** avec `scroll-snap`, conteneur `tabindex="0"`, `role="region"`, `aria-label="Programme d'activité"`, défilement aux flèches ← et →.
- [X] T086 [P] Mettre à jour `app/components/salm/chronogram.vue` pour le mobile : **onglets** « Jour 1 · ven. 12 » / « Jour 2 · sam. 13 », avec `role="tablist"`, `tab` (`aria-selected`, `aria-controls`) et `tabpanel`, flèches ← et →, Début et Fin (US2-7).
- [X] T087 [P] Mettre à jour `app/components/salm/videos.vue` pour le mobile : grille d'une colonne, lien « 9 vidéos → » vers `#canape`, toutes les vidéos listées.
- [X] T088 [P] Mettre à jour `app/components/salm/photos.vue` pour le mobile : **grille de 2 colonnes** pour l'aperçu, galerie avec balayage tactile.
- [X] T089 [P] Mettre à jour `app/components/salm/final-cta.vue` pour le mobile, selon la maquette mobile.
- [X] T090 [P] Mettre à jour `app/components/salm/student-form.vue` pour le mobile : colonne orange au-dessus du formulaire, aperçu du badge sous le bouton.
- [X] T091 [P] Mettre à jour `app/components/salm/school-form.vue` pour le mobile : colonne d'information au-dessus, indicateur d'étapes compact, lignes d'exposants empilées (nom, puis contact).
- [X] T092 [P] Vérifier `app/components/AppNavbar.vue` à 390 px, avec 6 liens : aucun défilement horizontal de la page. Si nécessaire, n'ajuster que l'espacement et le corps sous 640 px (texte ≥ 12 px, cible ≥ 24 px de haut), sans menu mobile (D2).

### SEO

- [X] T093 [P] Dans `app/pages/salm/index.vue`, ajouter `useSeoMeta` (titre « SALM <année> — Salon International des Licences et Masters · Le Carré des Études », description, `ogImage` = affiche, `twitterCard`) et un JSON-LD `Event` via `useHead` : `name`, `startDate` / `endDate`, `location` (lieu ou « Abidjan »), `organizer`, `eventAttendanceMode: OfflineEventAttendanceMode`.

### Accessibilité (FR-082, SC-010)

- [X] T094 [P] Dans `app/components/salm/hero.vue`, donner au `h1` le nom accessible « SALM <année> » (texte visuellement masqué ou `aria-label`), et respecter `prefers-reduced-motion` pour toute animation.
- [X] T095 [P] Dans `app/assets/css/salm.css`, ajouter un style de focus visible commun aux éléments interactifs SALM (`:focus-visible`, contour de 2 px contrasté sur fond orange, clair et sombre) et le verrouillage du défilement `body:has(dialog[open])`, s'il n'est pas déjà dans T029.
- [X] T096 Audit axe DevTools et navigation au clavier seul sur `/salm`, `/salm/inscription-etudiant`, `/salm/inscription-ecole` et `/salm/v/<token>`. Corriger dans les composants `app/components/salm/*.vue` concernés toute violation A ou AA, y compris les contrastes (blanc sur #D5570B, #F4792B sur #0B0B0D) (dépend de T082 à T095).

### Validation finale

- [X] T097 Dérouler **l'intégralité** de `specs/006-salm-inscriptions/quickstart.md`, scénarios 1 à 6 et déploiement, y compris Lighthouse mobile (LCP < 3 s, aucune requête vers `fonts.googleapis.com`, polices SALM absentes de `/` et `/magazine`) et la régression du module magazine. Consigner les écarts restants dans `specs/006-salm-inscriptions/checklists/revue.md` (section Notes).

---

## Dependencies & Execution Order

### Dépendances entre phases

```text
Phase 1 (fondations) ──► Phase 2 (MVP US1+US2) ──► mise en production ──► ouverture des inscriptions étudiantes
                    ├──► Phase 3 (US3)  ─┐
                    └──► Phase 4 (US4)  ─┴──► Phase 5 (finitions)
```

- **Phase 1** bloque tout. En interne : T013 → T014 → T020 et T022. T007 et T008 → T011 et T012. T021 → T022 → T023. T015 → T016.
- **Phase 2** dépend de la phase 1. US2 et US1 avancent en parallèle ; T048 réutilise `badge-card.vue` (T031) ; T051 à T053 sont indépendantes.
- **Phase 3** ne dépend que de la phase 1 et de T043 (`salm-registration.ts`). Elle peut démarrer en parallèle de la phase 2 si l'équipe le permet ; elle n'est pas requise pour ouvrir les inscriptions étudiantes.
- **Phase 4** ne dépend que de la phase 1, de T042 (PDF, pour T067) et de T061 et T062. Elle est indépendante de la phase 3, mais les listes d'établissements n'ont de données qu'après la phase 3.
- **Phase 5** retouche des composants des phases 2 et 3 : elle démarre après elles.

### Dépendances entre stories

- **US2** (page) et **US1** (inscription) forment le MVP ; les CTA de la page mènent au formulaire étudiant.
- **US3** est indépendante de US1 et US2 : seule la page `/salm` y mène (le lien existe dès T032 et T034).
- **US4** lit les données de US1 et US3, et réutilise `renderBadgePdf` de US1.

---

## Parallel Example

### Phase 1, en parallèle dès T001

```text
T002 nuxt.config.ts · T003 server/assets/fonts/salm/ · T004 public/fonts/salm/ + salm.css · T005 main.css
T006 public/salm/ · T007 shared/utils/study-levels.ts · T008 shared/utils/phone.ts · T009 shared/types/salm.ts
T010 shared/utils/salm.ts · T015 server/middleware/admin.ts · T017 login.post.ts · T018 docker-compose.yml + deploy.sh
T019 server/utils/rate-limit.ts · T021 prisma/seed/salm-data.ts
```

### Phase 2 (MVP), deux flux

```text
Flux US2 : T024, T025, T026, T028, T029, T030, T031, T034 à T040 en parallèle ; puis T027, T032 → T033, puis T041
Flux US1 : T042, T043 en parallèle ; puis T044, T045, T046, T047 en parallèle ; puis T048 → T049 ; T050 en parallèle
Prod     : T051, T052, T053 en parallèle, puis T054
```

### Phase 4, toutes les routes admin en parallèle

```text
T063 à T075 (13 fichiers distincts dans server/api/admin/salm/) après T061 et T062 ; puis T076 à T080
```

---

## Implementation Strategy

### MVP d'abord : ouvrir les inscriptions étudiantes

1. Phase 1 (fondations, seed 2027 avec inscriptions ouvertes).
2. Phase 2 : US2 et US1 en parallèle, puis T051 à T054.
3. **Arrêt et validation** : quickstart, scénarios 1 et 2, puis `./deploy.sh deploy` et `./deploy.sh seed`.
4. Annonce du lien « SALM 2027 ».

⚠️ **Mobile** : conformément à la demande, les adaptations mobiles fidèles à la maquette sont en phase 5. Le **socle mobile** (une colonne, aucun défilement horizontal à 360 et 390 px, FR-084) fait partie du MVP : T041, T048 et T049. Mais le public étudiant est majoritairement mobile : il est **recommandé de faire T082, T086 et T090 avant l'annonce publique**. Ce sont le hero, le chronogramme et le formulaire étudiant.

### Livraison incrémentale

| Étape | Livré | Effet |
|---|---|---|
| MVP | Phases 1 et 2 | Page, inscription étudiante, badge. L'admin consulte les données dans Prisma Studio si besoin. |
| +1 | Phase 3 | Formulaire établissement. Remplace le Google Form. |
| +2 | Phase 4 | Back-office complet : doublons, exports, statuts, fermeture, conservation des données. |
| +3 | Phase 5 | Mobile soigné, SEO, audit d'accessibilité, validation complète. |

### Points à surveiller

- **Données manquantes** : URL YouTube (vidéo récapitulative 2026, 9 vidéos du canapé), affiche et logo 2027. Sans elles, les sections concernées restent masquées. Les ajouter dans `prisma/seed/salm-data.ts` puis relancer `./deploy.sh seed`.
- **Décisions à valider par l'organisateur** (constat F6), avec l'échéance de chacune :
  - **D5, conservation de 12 mois** : **avant la mise en production du MVP** pour le texte de T048, sinon utiliser la version de repli ; avant la phase 3 pour T058 ; avant la phase 4 pour T062, T075 et T077 ;
  - **D13, liste des exposants** : avant la phase 3 pour T058, et avant la phase 4 pour T071.
- **T016 à T018** (sécurité de l'existant) sont des points signalés au plan, à retirer si le porteur de projet les refuse. Ils sont recommandés avant d'ouvrir des inscriptions qui contiennent des données personnelles.
