---

description: "Liste des tâches : Module SALM (3/3) — contrôle d'entrée le jour J"
---

# Tasks: Module SALM (3/3) — contrôle d'entrée le jour J

**Input**: documents de conception de `specs/008-salm-controle-entree/`

**Prerequisites** : [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/control-api.md](./contracts/control-api.md), [contracts/admin-api.md](./contracts/admin-api.md), [contracts/ui-routes.md](./contracts/ui-routes.md), [quickstart.md](./quickstart.md)

**Tests** : pas de test runner (constitution) et aucun test automatisé demandé. La validation se fait par les scénarios de [quickstart.md](./quickstart.md), dont le test sur un vrai téléphone (phase 8).

**Organization** : ordre des phases demandé :
1. table des passages et API ;
2. page de contrôle mobile (scan) ;
3. saisie manuelle ;
4. compteurs et colonne « présent » dans la liste et l'export ;
5. test sur téléphone.

Deux phases **ajoutées** couvrent le reste de la spec clarifiée : le mode hors ligne (clarification Q2) et l'accueil des non-inscrit·e·s (US4, clarification Q3). Elles se placent avant le test sur téléphone, qui les valide aussi.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichier distinct, aucune dépendance sur une tâche non terminée).
- **[Story]** : user story de la spec (US1 scan, US2 saisie manuelle, US3 suivi, US4 non-inscrit·e·s).
- Chemins relatifs à la racine du dépôt. Conventions : routes Nitro sous `server/api/admin/salm/`, composants kebab-case dans `app/components/salm/` (auto-importés `<Salm…>`), code commun dans `shared/` (`#shared/...` côté serveur), français avec accents, noms de fichiers en `[a-z0-9-]`.

---

## Phase 1 : Setup

**Purpose** : branche, dépendance, types partagés.

- [X] T001 Créer la branche `008-salm-controle-entree` depuis `main` (le dépôt est sur `main`) et y commiter `specs/008-salm-controle-entree/`, ainsi que les ajouts 008 de `CLAUDE.md`
- [X] T002 Ajouter la dépendance `jsqr` (1.4.x) avec `pnpm add jsqr` : `package.json` et `pnpm-lock.yaml` (research R1 bis ; aucun module Nuxt)
- [X] T003 [P] Ajouter à `shared/types/salm.ts` les types de [contracts/control-api.md](./contracts/control-api.md) :
  - `SalmControlPerson`, `SalmControlDay`, `SalmControlCounter` (`{ dayId, entries }`) ;
  - `SalmControlResult` (`status: 'entered' | 'already' | 'refused' | 'valid_trial'`, `reason: 'OTHER_EDITION' | 'INVALID' | null`, `otherEditionYear`, `day`, `person?`, `entry?`, `counters`) ;
  - `SalmControlSnapshot`, `SalmControlState`, `SalmControlLookup` ;
  - `SalmControlSyncItem` et `SalmControlSyncResult` (`status: 'created' | 'merged' | 'ignored'`, `reason?: 'UNKNOWN_BADGE' | 'OUT_OF_EDITION' | 'INVALID_ITEM'`) ;
  - `SalmControlPoster`.

  Ajouter aussi le champ facultatif `entriesByDay?: Record<string, number>` dans `SalmPurgedStats.students`.

---

## Phase 2 : Fondations — table des passages et API (bloquant)

**Purpose** : modèle `SalmEntry`, règles communes client et serveur, routes de contrôle utilisées par toutes les stories.

**⚠️ CRITICAL** : aucune story ne peut commencer avant la fin de cette phase.

### Table des passages

- [X] T004 Modifier `prisma/schema.prisma` selon [data-model.md](./data-model.md#esquisse-prisma-référence-pour-la-migration-add_salm_entries) :
  - nouveau modèle `SalmEntry`, avec les champs `id`, `registrationId`, `dayId`, `enteredAt DateTime`, `mode String` (« `'scan'` · `'manual'` »), `offline Boolean @default(false)` et `createdAt DateTime @default(now())` ;
  - relations `registration` → `SalmStudentRegistration` et `day` → `SalmDay`, toutes deux en **`onDelete: Cascade`** ;
  - **`@@unique([registrationId, dayId])`** et `@@index([dayId, enteredAt])` ;
  - sur `SalmStudentRegistration` : `origin String @default("online")` (« `'online'` · `'onsite'`, défaut `'online'` ») et la relation `entries SalmEntry[]` ;
  - sur `SalmDay` : la relation `entries SalmEntry[]`.
- [X] T005 Générer la migration avec `pnpm prisma migrate dev --name add_salm_entries`, puis vérifier le SQL dans `prisma/migrations/<horodatage>_add_salm_entries/migration.sql` : `ALTER TABLE` de `SalmStudentRegistration` avec `DEFAULT 'online'` (lignes existantes), index unique `SalmEntry_registrationId_dayId_key`, clés étrangères `ON DELETE CASCADE`. Lancer ensuite `pnpm prisma generate`.

### Règles communes (client et serveur)

- [X] T006 [P] Créer `shared/utils/salm-control.ts` avec les fonctions pures suivantes, sans accès à la base :
  - `extractVerifyToken(text: string): string | null` : cherche `/\/salm\/v\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/` dans le texte lu, **quel que soit le domaine** (R10).
  - `parseControlQuery(q: string, year: number)` → `{ kind: 'badge', seq } | { kind: 'phone', phone } | null`.
    - Numéro de badge accepté sans tenir compte des majuscules, espaces et tirets : `SALM27-000482`, `salm27 482`, `000482`, `482`.
    - Un préfixe `SALMxx` différent des deux derniers chiffres de `year` donne `null`.
    - Sinon, `normalizeIvorianPhone` de `shared/utils/phone.ts`.
  - `controlDayFor(days: { id, date }[], now = new Date())` : jour dont `date === now.toISOString().slice(0, 10)`, sinon `null` (mode essai, R9).
  - `badgeTokenHash(token: string): Promise<string>` : `base64url(SHA-256(token)[0..16])` via `globalThis.crypto.subtle.digest`, disponible dans Node 22 et en contexte sécurisé.
  - `resolveControlResult(input)` : règles communes au serveur et au mode hors ligne. Entrées : badge trouvé, son édition, l'édition publiée, le jour contrôlé, une entrée existante. Sortie : `status` et `reason` de [control-api.md](./contracts/control-api.md#objet-controlresult).
  - `formatEntryTime(iso: string)` → `« 09h42 »` (UTC = Abidjan).

### Services serveur

- [X] T007 Extraire dans `server/utils/salm-registration.ts` la fonction exportée `isUniqueViolation(error, fields: string[]): boolean` à partir de `uniqueViolationField()` (forme de `meta` variable avec l'adaptateur better-sqlite3), en gardant le comportement de `createStudentRegistration` identique.
- [X] T008 Créer `server/utils/salm-control.ts` :
  - `getControlContext()` : édition publiée (`id`, `year`, jours triés par date, `endsAt` via `getEditionTimeline`), jour contrôlé (`controlDayFor`), heure du serveur. Lève `adminError(404, 'NO_PUBLISHED_EDITION')` sans édition publiée.
  - `toControlPerson(registration, year)` : `registrationId`, `fullName`, `studyLevel`, `badgeNumber` (`formatBadgeNumber`). **Jamais** le téléphone (FR-230).
  - `getDayCounters(editionId)` : `groupBy dayId` sur `SalmEntry` pour les jours de l'édition, 0 pour un jour sans entrée.
  - `recordEntry({ registrationId, dayId, mode, enteredAt = new Date(), offline = false })`, insertion optimiste (R4) :
    - `create` → `{ created: true, entry }` ;
    - sur `isUniqueViolation(e, ['registrationId', 'dayId'])`, relire l'entrée existante → `{ created: false, entry }`.
  - `buildControlResult(...)` : assemble un `SalmControlResult` à partir de `resolveControlResult`, de la personne, de l'entrée et des compteurs.
- [X] T009 Ajouter à `server/utils/salm-control.ts` la fonction `buildSnapshot(ctx)` pour `GET /control/snapshot` :
  - `badges` des seules inscriptions de l'édition publiée, sous la forme `{ h: await badgeTokenHash(verifyToken), seq, name: fullName, level: studyLevel }` ;
  - `entries` `{ id, h, dayId, at }` des jours de l'édition ;
  - `counters`, `days`, `todayDayId`, `serverTime`, `edition: { id, year, endsAt }` ;
  - `registration: { url: `${getSiteUrl(event)}/inscription`, qrSvg: await badgeQrSvg(url) }`.

  Aucun `phone`, `verifyToken` ni `downloadToken` dans la sortie.

### API de contrôle ([contracts/control-api.md](./contracts/control-api.md))

- [X] T010 [P] Créer `server/api/admin/salm/control/snapshot.get.ts` : `getControlContext()` puis `buildSnapshot()`, en-tête `Cache-Control: private, no-store`.
- [X] T011 [P] Créer `server/api/admin/salm/control/state.get.ts` :
  - paramètre `afterId` : entier ≥ 0, sinon 0 ;
  - réponse : `serverTime`, `todayDayId`, `counters`, et `entries` `{ id, h, dayId, at }` d'`id > afterId` pour les jours de l'édition publiée, triées par `id` croissant, 500 au plus, avec `hasMore` ;
  - en-tête `no-store`.
- [X] T012 [P] Créer `server/api/admin/salm/control/entries/index.post.ts`.
  - **Corps (liste blanche)** : exactement un de `token` (`^[A-Za-z0-9_-]{22}$`, `mode = 'scan'`) ou `registrationId` (entier, `mode = 'manual'`) ; sinon `400 VALIDATION`.
  - **Avec `token`** : `findUnique({ verifyToken })`.
    - Jeton inconnu → `refused` / `INVALID`.
    - Édition ≠ publiée → `refused` / `OTHER_EDITION`, avec `otherEditionYear`.
  - **Avec `registrationId`** : l'inscription doit appartenir à l'édition publiée, sinon `404 NOT_FOUND`.
  - **Jour contrôlé `null`** → `valid_trial`, sans écriture (FR-212).
  - **Sinon** : `recordEntry` → `entered` ou `already`, avec l'heure existante (R4).
  - Réponse : `SalmControlResult` complet, avec les compteurs.
- [X] T013 [P] Créer `server/api/admin/salm/control/entries/[id].delete.ts` :
  - `parseIdParam` ;
  - entrée inconnue → `404 NOT_FOUND` ;
  - `day.date` ≠ date du jour (UTC) → `409 NOT_TODAY` ;
  - sinon `delete` et réponse `{ counters }` (FR-217).
- [X] T014 [P] Créer `server/api/admin/salm/control/lookup.get.ts`, sans aucune écriture.
  - **`q`** : `parseControlQuery(q, ctx.edition.year)`.
    - `null` → `400 INVALID_QUERY`.
    - `badge` → `findUnique({ editionId_badgeSeq })`.
    - `phone` → `findUnique({ editionId_phone })`.
    - Aucun résultat → `{ found: false }`, sans autre détail (FR-221).
  - **`token`** : toutes éditions, avec `validity: 'valid' | 'other_edition' | 'invalid'` et `otherEditionYear` (FR-223).
  - **Réponse** : `{ found, validity, otherEditionYear, person?, today: { day, entry } }`. `person` est absent si `validity ≠ 'valid'`. Jamais de téléphone.

**Checkpoint** : `curl` avec le cookie de session admin sur chaque route. Sans cookie : 401. Deux `POST /control/entries` concurrents sur le même jeton : une réponse `entered` et une `already` avec le même `enteredAt`, et une seule ligne `SalmEntry` (quickstart § 2, double scan).

---

## Phase 3 : User Story 1 — Scanner un badge à l'entrée (Priority: P1) 🎯 MVP

**Goal** : page de contrôle mobile qui lit le QR code en continu, affiche le résultat plein écran et enregistre l'entrée du jour, en ligne.

**Independent Test** : quickstart § 2.1 à 2.11 sur ordinateur avec webcam, avec un jour de salon temporaire à la date du jour : vert, ambre après 10 s, lecture ignorée pendant 5 s, rouge « autre édition », rouge « pas un badge SALM », mode essai, annulation.

### Accès, connexion et navigation

- [X] T015 [P] [US1] Modifier `app/pages/admin/login.vue` : après connexion, `navigateTo(redirect)` si `route.query.redirect` est une chaîne qui commence par `/admin/` et ne contient ni `//` ni `\`, sinon `/admin` (R8, pas de redirection ouverte).
- [X] T016 [P] [US1] Modifier `app/layouts/admin.vue` :
  - la redirection vers la connexion transmet `?redirect=<route.fullPath>` ;
  - ajouter l'entrée `{ label: 'Contrôle d'entrée', to: '/admin/salm/controle', match: (p) => p.startsWith('/admin/salm/controle') }` dans les enfants de la section « SALM », après « Inscriptions ».
- [X] T017 [P] [US1] Ajouter dans `nuxt.config.ts`, sous `nitro.routeRules`, la redirection `'/controle': { redirect: { to: '/admin/salm/controle', statusCode: 302 } }` (FR-201).
- [X] T018 [P] [US1] Créer `app/layouts/salm-controle.vue`, plein écran sombre (`bg-slate-950 text-white min-h-dvh`), sans barre latérale.
  - **Session** : `useAdmin().checkSession()`. Si `admin: false`, `navigateTo('/admin/login?redirect=' + route.fullPath)`.
  - **Tête de page** (`useHead`) : `robots: noindex, nofollow`, `theme-color`, viewport `viewport-fit=cover`.
  - **Contenu** : un `<slot />`.

  La tolérance au réseau et le service worker sont ajoutés en phase 6 (T047).

### Lecture du QR code et retours

- [X] T019 [P] [US1] Créer `app/composables/use-qr-reader.ts` (R1 bis, R2).
  - **Flux vidéo** : `start(videoEl)` appelle `getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })`. `stop()` arrête les pistes.
  - **Moteur** : `BarcodeDetector` natif si `getSupportedFormats()` contient `qr_code`. Sinon `const { default: jsQR } = await import('jsqr')`, sur un recadrage central de 640 px au plus dessiné dans un `OffscreenCanvas` ou un `canvas` masqué, avec `inversionAttempts: 'dontInvert'`.
  - **Boucle** : environ 8 images par seconde, via `requestVideoFrameCallback` s'il existe, sinon `requestAnimationFrame` ralenti. Émet `onRead(text)`.
  - **Veille** : arrêt sur `visibilitychange` caché, reprise au retour (FR-214).
  - **Erreurs** : `NotAllowedError`, `NotFoundError`, `NotReadableError` et API absente sont exposées dans `error: 'denied' | 'missing' | 'busy' | 'unsupported'`.
- [X] T020 [P] [US1] Créer `app/composables/use-control-feedback.ts` (R11) :
  - `vibrate(kind)`, avec les motifs `[80]` (entered), `[80, 80, 80]` (already), `[400]` (refused), si `navigator.vibrate` existe ;
  - `beep(kind)` par `AudioContext` (3 fréquences distinctes, 150 ms), activé par un geste et désactivable ; préférence gardée dans `localStorage` `salm-controle:v1:prefs`, lue et écrite dans un `try/catch` ;
  - `keepAwake()` : `navigator.wakeLock.request('screen')`, redemandé à chaque `visibilitychange` visible, sans erreur si l'API manque.

### Composants de la page

- [X] T021 [P] [US1] Créer `app/components/salm/control-scanner.vue` (`<SalmControlScanner>`) :
  - `<video autoplay muted playsinline>` plein cadre, cadre de visée et invite « Présentez le QR code du badge » ;
  - bouton « Activer la caméra » tant que le flux n'a pas démarré ;
  - utilise `useQrReader` ; émet `read(text)` et `unavailable(reason)` ;
  - messages de caméra refusée ou absente de [ui-routes.md § Textes](./contracts/ui-routes.md#textes-vouvoiement-de-léquipe-fr-231).
- [X] T022 [P] [US1] Créer `app/components/salm/control-result.vue` (`<SalmControlResult>`) : couche plein écran au-dessus de la caméra, région `role="status"` avec `aria-live="assertive"`.
  - **Palette** (R11) :
    - vert `#14532D`, texte blanc ;
    - ambre `#FBBF24`, texte `#1C1917` ;
    - rouge `#991B1B`, texte blanc ;
    - neutre `#334155`, texte blanc.
  - **Contenu** : icône de 72 px ; mot d'état en capitales de 44 px (`ENTRÉE VALIDÉE`, `DÉJÀ ENTRÉ·E AUJOURD'HUI`, `BADGE REFUSÉ`, `NON VÉRIFIÉ`, `VALIDE (ESSAI)`) ; détail de 24 px ; nom en capitales de 30 px avec retour à la ligne, jamais tronqué ; « niveau · numéro » en 22 px.
  - **Actions** de 56 px dans le tiers bas : « Annuler cette entrée » (émet `cancel`), « Réessayer » ou « Se reconnecter », et « Retour au scan ».
  - Aucune donnée personnelle pour `refused` (FR-207, FR-208).
- [X] T023 [P] [US1] Créer `app/components/salm/control-counters.vue` (`<SalmControlCounters>`) : bandeau haut avec le jour contrôlé (« Jour 1 · ven. 12 mars » via `formatDayShort` de `shared/utils/salm.ts`), le compteur du jour en grand et ceux des autres jours en petit (FR-224), et le bandeau permanent « Aucun jour de salon aujourd'hui : mode essai, aucune entrée n'est enregistrée » quand `todayDayId` est `null`. Les emplacements « HORS LIGNE » et « Prêt hors ligne » sont prévus mais seront alimentés en phase 6.

### État du poste et page

- [X] T024 [US1] Créer `app/composables/use-salm-control.ts`, partie **en ligne** :
  - **Précharge** : `snapshot` au montage, puis toutes les 5 min.
  - **Côté navigateur uniquement** : `snapshot`, `state`, `lookup` et `entries` sont appelés dans `onMounted` ou par des actions (`$fetch`), **jamais** par un `useFetch` ou `useAsyncData` exécuté pendant le rendu serveur. La page HTML, que le service worker met en cache, ne doit contenir aucun nom, niveau ni numéro de badge (S2).
  - **Rafraîchissement** : `state?afterId=` toutes les 15 s, pour les compteurs et le dernier `id` vu (FR-224).
  - **Lecture** : `onRead(text)`.
    1. Ignorer le même texte dans les 5 s suivant son résultat, et toute lecture pendant un appel en cours (R10).
    2. `extractVerifyToken` : `null` → résultat local `refused` « Ce QR code n'est pas un badge SALM », sans appel.
    3. Sinon `POST /control/entries { token }` avec `AbortController` de 3 s.
    4. Déclencher `vibrate` et `beep`.
  - **Annulation** : `cancelEntry(id)`, après confirmation, via `DELETE /control/entries/:id`.
  - **Erreurs** : 401 → résultat neutre `NON VÉRIFIÉ` « Session expirée » avec l'action « Se reconnecter » (vers `/admin/login?redirect=/admin/salm/controle`). Réseau, délai dépassé ou 5xx → `NON VÉRIFIÉ` « Réseau indisponible » avec « Réessayer ». Le repli local est ajouté en phase 6.
  - **Jour contrôlé** réévalué chaque minute (changement de date à minuit).
- [X] T025 [US1] Créer `app/pages/admin/salm/controle/index.vue` avec `definePageMeta({ layout: 'salm-controle' })`, aucun appel de données pendant le rendu serveur (le HTML rendu ne contient que la structure et les libellés : voir T024, S2), `useSeoMeta` (titre « Contrôle d'entrée · SALM ») et la structure de [ui-routes.md](./contracts/ui-routes.md#écran-de-contrôle--structure-390--844-tenue-dune-main) :
  - `<SalmControlCounters>` en haut ;
  - `<SalmControlScanner>` sur environ 60 % de la hauteur ;
  - tiers bas : boutons de 56 px « Saisie manuelle » et « Pas de badge ? », désactivés jusqu'aux phases 4 et 7 ;
  - `<SalmControlResult>` en surcouche.

  Branchée sur `useSalmControl` et `useControlFeedback` (`keepAwake` au démarrage). Message « Aucune édition SALM publiée : rien à contrôler » sur `404 NO_PUBLISHED_EDITION`, **sans** activer la caméra. Aucune largeur fixe : utilisable de 360 à 430 px, sans défilement horizontal (FR-203).

**Checkpoint** : quickstart § 2.1 à 2.11 réussis ; la page reste accessible avec le mode maintenance actif (`/admin` toujours autorisé par `server/middleware/maintenance.ts`, FR-204).

---

## Phase 4 : User Story 2 — Retrouver un inscrit sans QR code lisible (Priority: P1)

**Goal** : saisie manuelle par numéro de badge ou par téléphone, fiche puis « Valider l'entrée » ; URL du QR code sans indication de validité pour le public, avec validité et « Contrôler ce badge » pour l'admin.

**Independent Test** : quickstart § 3.1 à 3.5 et § 4, avec le `diff` des deux pages et la 404 de l'ancienne API publique.

- [X] T026 [P] [US2] Créer `app/components/salm/control-manual.vue` (`<SalmControlManual>`) : panneau ancré en bas de l'écran.
  - **Champ unique** « Numéro de badge ou téléphone », `inputmode="tel"`, `autocomplete="off"`, avec le focus automatique et le bouton « Rechercher » (56 px).
  - **Recherche** : appelle `GET /control/lookup?q=`.
    - `400 INVALID_QUERY` → « Saisissez un numéro de badge (ex. 482 ou SALM27-000482) ou un téléphone (ex. 07 12 34 56 78) ».
    - `{ found: false }` → « Aucun inscrit avec ce numéro pour le SALM {année} ».
  - **Fiche** : nom, niveau, numéro, puis :
    - « Pas encore entré·e aujourd'hui » avec le bouton « Valider l'entrée », qui émet `validate(registrationId)` ;
    - ou « Déjà entré·e aujourd'hui à 09h42 » avec « Annuler cette entrée ».
  - Bouton « Retour au scan ».
- [X] T027 [US2] Brancher la saisie manuelle dans `app/composables/use-salm-control.ts` : `validateManual(registrationId)` envoie `POST /control/entries { registrationId }` et affiche le même `<SalmControlResult>` qu'un scan (FR-220). La lecture caméra est suspendue tant que le panneau est ouvert.
- [X] T028 [US2] Modifier `app/pages/admin/salm/controle/index.vue` :
  - activer « Saisie manuelle », qui ouvre `<SalmControlManual>` ;
  - `?token=<jeton>` dans l'URL ouvre directement la fiche via `GET /control/lookup?token=`, **sans** enregistrer d'entrée (FR-223) ;
  - retirer le paramètre de l'URL après lecture (`router.replace`).
- [X] T029 [P] [US2] Réécrire `app/pages/salm/v/[token].vue` (R12, FR-222). Pour tout visiteur non connecté, la page a un rendu **indépendant du jeton** :
  - elle charge uniquement `GET /api/salm/edition` ;
  - elle affiche « Ce QR code est un badge du SALM {année} », « Présentez-le à l'entrée. », les jours (`formatDayLong` et `formatHour` de `shared/utils/salm.ts`), le lieu (`venueLabel`) et le lien « Découvrir le SALM {année} » vers `/salm` ;
  - sans édition publiée : « La prochaine édition du SALM sera bientôt annoncée » et le lien vers `/salm` ;
  - aucune icône ni couleur de validité ; styles `salm.css` conservés ; `robots: noindex, nofollow` conservé.

  Après hydratation (`onMounted`), si `useAdmin().checkSession()` est vrai, un encart admin appelle `GET /api/admin/salm/control/lookup?token=`. Il affiche « Badge valide » (avec le nom), « Badge d'une autre édition (SALM {année}) » ou « Badge invalide », et, pour un badge de l'édition publiée, le bouton « Contrôler ce badge » vers `/admin/salm/controle?token=…` (FR-223).
- [X] T030 [P] [US2] Supprimer `server/api/salm/verify/[token].get.ts` et le type `SalmVerifyResponse` de `shared/types/salm.ts`. Vérifier avec `grep -rn "salm/verify\|SalmVerifyResponse" app server shared` qu'il ne reste aucun usage (contracts/admin-api.md, route supprimée).

**Checkpoint** : quickstart § 3 et § 4. Les pages de `/salm/v/<jeton valide>` et `/salm/v/AAAAAAAAAAAAAAAAAAAAAA` sont identiques (au jeton près) ; `/api/salm/verify/…` répond 404.

---

## Phase 5 : User Story 3 — Suivre les entrées par jour (Priority: P2)

**Goal** : compteurs d'entrées par jour dans le back-office, heure d'entrée par ligne, filtre de présence, colonnes « Présent » dans l'export CSV, et compteurs conservés après la suppression des données personnelles.

**Independent Test** : quickstart § 5.1 à 5.3 et 5.9 (10 inscriptions, 4 entrées le Jour 1, 3 le Jour 2 : compteurs, filtre « Présent·e le Jour 1 » = 4 lignes, export avec les bons « Oui »).

- [X] T031 [US3] Modifier `studentWhere()` dans `server/utils/salm-admin.ts` pour le paramètre de requête `presence`, de la forme `present:<dayId>` ou `absent:<dayId>`, avec `dayId` entier :
  - `present` → `where.entries = { some: { dayId } }` ;
  - `absent` → `where.entries = { none: { dayId } }` ;
  - valeur mal formée : ignorée.

  Le filtre se combine avec `search` et `studyLevel` (FR-226). La vérification que le jour appartient à l'édition est faite par la route.
- [X] T032 [US3] Modifier `server/api/admin/salm/editions/[editionId]/students/index.get.ts` ([contracts/admin-api.md](./contracts/admin-api.md)) :
  - charger les jours de l'édition (`id`, `label`, `date`, par date) et ignorer un `presence` dont le `dayId` n'en fait pas partie ;
  - `select` supplémentaire : `entries: { select: { dayId: true, enteredAt: true } }` ;
  - ajouter à chaque ligne `entries: { [dayId]: ISO }` ;
  - ajouter à la réponse `days: [{ id, label, date, entries }]`. Le compte porte sur **toutes** les entrées du jour, indépendamment des filtres (`getDayCounters` de `server/utils/salm-control.ts`).
- [X] T033 [US3] Modifier `server/api/admin/salm/editions/[editionId]/students/export.get.ts` :
  - même filtre `presence` que la liste ;
  - une colonne par jour de salon par date croissante, d'en-tête `Présent ${label} (${JJ/MM/AAAA})` (ex. `Présent Jour 1 (12/03/2027)`), valant `Oui` ou `Non` ;
  - colonnes présentes même sans aucune entrée (FR-227, US3-6) ;
  - `toCsv` inchangé.
- [X] T034 [P] [US3] Mettre à jour `SalmAdminStudentRow` dans `shared/types/salm.ts` : `entries: Record<string, string>`. Ajouter le type de réponse de liste avec `days: { id: number; label: string; date: string; entries: number }[]`.
- [X] T035 [US3] Modifier `app/pages/admin/salm/index.vue`. **En-tête** :
  - à côté de « {grandTotal} inscrit·e·s », un compteur par jour : « Jour 1 · ven. 12 : 1 204 entrées » (`formatDayTab` ou `formatDayShort`) (FR-225) ;
  - nouveau `<select>` « Présence » avec les options « Tous », puis « Présent·e le {label} » et « Absent·e le {label} » pour chaque jour ; il remet `page` à 1 et est ajouté à `query`, à `watch` et aux paramètres de `exportCsv()`.

  **Tableau** : une colonne par jour (en-tête = libellé du jour), valant `formatEntryTime(row.entries[dayId])` ou « — ». La table défile horizontalement dans son conteneur si besoin, sans défilement horizontal de la page.
- [X] T036 [P] [US3] Modifier `computePurgedStats()` dans `server/utils/salm-purge.ts` : ajouter `students.entriesByDay`, un objet `{ 'AAAA-MM-JJ': n }` obtenu par `groupBy` de `SalmEntry` sur `dayId` pour les jours de l'édition, puis converti en date du jour (FR-228). Aucun autre changement : la cascade des `deleteMany` supprime les entrées dans la même transaction.
- [X] T037 [US3] Vérifier la synchronisation entre postes sur la page de contrôle, déjà branchée en T024 : deux navigateurs ouverts, une entrée sur l'un, le compteur de l'autre change en moins de 30 s (US3-2). Corriger `app/composables/use-salm-control.ts` si nécessaire.

**Checkpoint** : quickstart § 5.1, 5.2, 5.3 et 5.9 ; SC-008 : le compteur de la page de contrôle, celui du back-office et le nombre de « Oui » de l'export sont égaux.

---

## Phase 6 : Mode hors ligne (US1 et US2, clarification Q2)

**Goal** : le contrôle continue sans réseau à partir d'une liste préchargée, les entrées sont gardées sur le téléphone puis envoyées au retour du réseau, et la page se rouvre hors ligne (FR-232 à FR-239).

**Independent Test** : quickstart § 6.8 à 6.14, en mode avion sur un navigateur de bureau (outils de développement › réseau « Offline ») puis sur téléphone.

### Serveur

- [X] T038 [US1] Ajouter `mergeOfflineEntry(item, ctx)` dans `server/utils/salm-control.ts` (R5, FR-235) :
  - **Inscription** : par `seq` uniquement (`findUnique({ editionId_badgeSeq })` de l'édition publiée). La file ne transporte **jamais** le jeton (S1). Absente → `ignored` / `UNKNOWN_BADGE`.
  - **Jour** : `dayId` doit appartenir à l'édition publiée, sinon `ignored` / `OUT_OF_EDITION`.
  - **Heure** : `scannedAt` est borné à `[date du jour 00:00:00Z, min(maintenant, date du jour 23:59:59Z)]`.
  - **Écriture** : `recordEntry({ …, enteredAt, offline: true })` → `created`. Si l'entrée existait déjà (doublon rejeté par la contrainte unique), mise à jour **conditionnelle et atomique**, sans lecture préalable : `prisma.salmEntry.updateMany({ where: { registrationId, dayId, enteredAt: { gt: enteredAt } }, data: { enteredAt, mode, offline: true } })`, puis `merged`, que la mise à jour ait touché une ligne ou non. Deux synchronisations concurrentes aboutissent ainsi toujours à l'heure la plus ancienne (U1). **Interdit** : lire l'heure existante puis faire un `update` sans condition.
- [X] T039 [US1] Créer `server/api/admin/salm/control/sync.post.ts` :
  - **Validation du corps** : `entries` est un tableau de 1 à 200 éléments. Pour chaque élément :
    - `clientId` : chaîne de 1 à 64 caractères ;
    - `seq` : entier ≥ 1 (numéro de badge dans l'édition publiée) ; tout autre champ, dont `token`, est ignoré (liste blanche) ;
    - `dayId` : entier ;
    - `scannedAt` : date ISO valide ;
    - `mode` : `'scan'` ou `'manual'`.

    Un élément invalide donne `ignored` / `INVALID_ITEM`, sans faire échouer le lot.
  - **Traitement** : les éléments passent par `mergeOfflineEntry` un par un.
  - **Réponse** : `{ results, counters }`.

### Client

- [X] T040 [P] [US1] Créer `app/utils/salm-control-storage.ts` (R7) :
  - fonctions `readSnapshot`, `writeSnapshot`, `readQueue`, `writeQueue` (écriture **synchrone**), `readSessionMarker`, `writeSessionMarker({ checkedAt, editionEndsAt })`, `clearControlData()` ;
  - clés `salm-controle:v1:snapshot`, `:queue`, `:session` et `:prefs` ;
  - chaque accès dans un `try/catch` ; `isStorageAvailable()` pour afficher « Mode hors ligne indisponible sur ce navigateur (navigation privée ?) » ;
  - `clearControlData()` supprime aussi les caches `salm-controle-*` (`caches.keys()`).
- [X] T041 [US1] Étendre `app/composables/use-salm-control.ts`, **précharge et repli local** :
  - enregistrer la précharge avec `writeSnapshot`, mettre à jour `editionEndsAt` du marqueur de session à partir de `snapshot.edition.endsAt` (utilisé par l'effacement de fin de salon, T043), et fusionner les `entries` reçues par `state` ;
  - si `navigator.onLine === false`, sur erreur réseau, délai de 3 s dépassé ou réponse 5xx, calculer `h = await badgeTokenHash(token)` et chercher le badge dans la précharge ;
  - `resolveControlResult` avec les entrées connues du poste (précharge et file) ;
  - `entered` → **d'abord** `writeQueue([...queue, { clientId: crypto.randomUUID(), seq: badge.seq, dayId, scannedAt: new Date().toISOString(), mode: 'scan' }])`, **puis** affichage vert (SC-005). La file ne contient **jamais** le jeton lu sur le QR code (S1) ; le jeton reste seulement en mémoire, le temps de calculer `h`, et n'est jamais écrit ;
  - badge absent de la précharge → neutre `NON VÉRIFIÉ` « Badge absent de la liste hors ligne » ;
  - aucune précharge disponible → `NON VÉRIFIÉ` « Réseau indisponible » (US1-16, US1-17).
- [X] T042 [US1] Étendre `app/composables/use-salm-control.ts`, **synchronisation et annulation** :
  - envoyer la file par lots de 200 via `POST /control/sync` à l'événement `online`, au montage et toutes les 15 s tant qu'elle n'est pas vide ;
  - retirer de la file tous les `clientId` présents dans `results` ; en cas d'erreur, garder la file intacte ;
  - annuler une entrée encore dans la file la retire localement ; annuler une entrée déjà envoyée exige le réseau (FR-237) ;
  - compteurs hors ligne = dernier total connu plus les entrées de la file, marqués « hors ligne ».
- [X] T043 [US1] Étendre `app/composables/use-salm-control.ts`, **indicateurs et effacement** :
  - `offline`, `pendingCount`, `readyOffline` (service worker qui contrôle la page, précharge de moins de 5 min, moteur de lecture chargé) et `snapshotAt` ;
  - avertissement « L'heure de ce téléphone diffère de {n} min de celle du serveur. Réglez l'heure automatique. » si `|serverTime − Date.now()| > 5 min` (R9) ;
  - **effacement à la fin du salon** (FR-239) :
    - au montage, **avant tout affichage**, si `editionEndsAt` (précharge ou marqueur de session) est dépassé : tenter une dernière synchronisation de la file si le réseau le permet, puis `clearControlData()` ;
    - pendant que la page est ouverte : un minuteur (`setTimeout` jusqu'à `editionEndsAt`, recalculé à chaque précharge et plafonné à 24 h) déclenche la même séquence, puis affiche « Le SALM {année} est terminé : les données de contrôle ont été effacées de ce téléphone » ;
    - `app/layouts/admin.vue` appelle aussi `clearControlData()` au chargement si le marqueur de session indique une fin de salon dépassée : un téléphone qui ne rouvre que le back-office est effacé aussi.
- [X] T044 [US2] Étendre la saisie manuelle hors ligne dans `app/components/salm/control-manual.vue` et `app/composables/use-salm-control.ts` (FR-237, US2-6a) :
  - hors ligne, un numéro de badge est cherché dans la précharge par `seq` (`parseControlQuery`), et « Valider l'entrée » ajoute `{ clientId, seq, dayId, scannedAt, mode: 'manual' }` à la file ;
  - un téléphone saisi affiche « Recherche par téléphone indisponible hors ligne : utilisez le numéro de badge ».
- [X] T045 [P] [US1] Brancher dans `app/components/salm/control-counters.vue` les états `offline`, `pendingCount`, `readyOffline` et `snapshotAt` : « HORS LIGNE · {n} entrée(s) en attente d'envoi » en bandeau ambre permanent, « Prêt hors ligne · liste du {HH:MM} » discret.

### Page hors ligne

- [X] T046 [P] [US1] Créer `public/salm-controle-sw.js` (R6) :
  - `CACHE = 'salm-controle-v1'` ;
  - `install` : `skipWaiting()` ; `activate` : suppression des autres caches `salm-controle-*`, puis `clients.claim()` ;
  - `fetch` :
    - navigation vers `/admin/salm/controle*` : réseau d'abord avec mise en cache, repli sur le cache ;
    - `/_nuxt/*` : cache d'abord, avec mise en cache ;
    - `/api/*` : jamais intercepté.
  - `message` `{ type: 'precache', urls }` : `cache.addAll(urls)` ;
  - `message` `{ type: 'clear' }` : `caches.delete(CACHE)`.
- [X] T047 [US1] Compléter `app/layouts/salm-controle.vue` (R8) :
  - **Session tolérante au réseau** :
    - `/api/auth/me` répond → `writeSessionMarker` ;
    - échec réseau avec un marqueur présent → la page s'ouvre (mode hors ligne) ;
    - échec réseau sans marqueur → « Connexion requise : ouvrez cette page avec du réseau » ;
    - `admin: false` → connexion avec `redirect`.
  - **Service worker** : `navigator.serviceWorker.register('/salm-controle-sw.js', { scope: '/admin/salm/controle' })`. Une fois qu'il contrôle la page, lui envoyer `precache` avec les URL `/_nuxt/` de `performance.getEntriesByType('resource')`, et précharger le morceau `jsqr` (`import('jsqr')`).
- [X] T048 [US1] Modifier `logout()` dans `app/composables/useAdmin.ts` (FR-238, FR-239) :
  - si `readQueue().length > 0`, `confirm("{n} entrée(s) ne sont pas encore envoyées. Si vous vous déconnectez maintenant, elles seront perdues.")` ; en cas d'annulation, rien n'est fait ;
  - sinon, ou après confirmation, `clearControlData()` et message `{ type: 'clear' }` au service worker s'il existe, avant l'appel existant à `/api/auth/logout`.

  Ajouter un `beforeunload` sur la page de contrôle quand la file n'est pas vide, dans `app/pages/admin/salm/controle/index.vue`.

**Checkpoint** : quickstart § 6.8 à 6.14 en navigateur de bureau (réseau « Offline », rechargement hors ligne, retour en ligne, double validation sur deux profils).

---

## Phase 7 : User Story 4 — Accueillir un·e étudiant·e non inscrit·e (Priority: P2)

**Goal** : QR code et adresse du formulaire public, affiche A4, inscription par l'équipe avec entrée validée dans la foulée, origine « Sur place » dans le back-office.

**Independent Test** : quickstart § 5.4 à 5.8 (inscription de « Traoré Awa », `05 01 02 03 04`, BTS / DUT (Bac+2)).

- [X] T049 [P] [US4] Ajouter dans `nuxt.config.ts`, sous `nitro.routeRules`, la redirection `'/inscription': { redirect: { to: '/salm/inscription-etudiant', statusCode: 302 } }` (FR-240).
- [X] T050 [US4] Modifier `createStudentRegistration(editionId, data, options?: { origin?: 'online' | 'onsite' })` dans `server/utils/salm-registration.ts` : `origin` vaut `'online'` par défaut et est écrit dans le `create` ; l'appel existant de `server/api/salm/students/index.post.ts` reste inchangé.
- [X] T051 [US4] Créer `server/api/admin/salm/control/registrations.post.ts` ([control-api.md](./contracts/control-api.md#post-apiadminsalmcontrolregistrations)).
  - **Validation** :
    - liste blanche `fullName`, `phone`, `studyLevel`, `informed` ;
    - `validateStudent(pickStudentFields(body))`, **sans** `assertHuman` ;
    - `informed !== true` → `validationError({ informed: 'REQUIRED' })` (FR-243).
  - **Contexte** : `getControlContext()`. Jour contrôlé `null` → `409 NOT_A_SALON_DAY` (FR-246) ; l'interrupteur public n'est pas consulté.
  - **Création** : `createStudentRegistration(ctx.edition.id, data, { origin: 'onsite' })`.
    - `existing` → **200** `{ created: false, lookup }`, même forme que `GET /control/lookup` pour ce téléphone (FR-245).
    - `created` → `recordEntry({ mode: 'manual' })`, puis **201** `SalmControlResult` avec `created: true`.
    - Échec de l'entrée → **201** avec `entryError: 'INTERNAL'`.
- [X] T052 [P] [US4] Créer `server/api/admin/salm/control/poster.get.ts` : `{ year, url: `${getSiteUrl(event)}/inscription`, qrSvg: await badgeQrSvg(url) }` pour l'édition publiée (FR-241). Disponible aussi en mode essai.
- [X] T053 [P] [US4] Créer `app/pages/admin/salm/controle/affiche.vue`, avec `definePageMeta({ layout: false })`, la vérification de session par `useAdmin().checkSession()` (sinon connexion avec `redirect`), `robots: noindex`.
  - **Contenu** : page A4 avec `@page { size: A4; margin: 15mm }`, titre « Pas encore inscrit·e ? », sous-titre « Obtenez votre badge SALM {année} en 1 minute », QR code d'au moins 80 mm (`v-html` du `qrSvg`, contenu produit par le serveur) et adresse courte en gros caractères.
  - **Écran** : bouton « Imprimer » (`window.print()`), masqué à l'impression.
- [X] T054 [P] [US4] Créer `app/components/salm/control-onsite.vue` (`<SalmControlOnsite>`).
  - **Vue « Pas de badge ? »** : adresse courte et QR code en grand, issus de `snapshot.registration` pour fonctionner hors ligne (FR-240), lien « Affiche d'inscription » vers `/admin/salm/controle/affiche` (nouvel onglet), bouton « Inscrire la personne ».
  - **Formulaire** : « Nom & prénoms » (60 caractères au plus), « Numéro de téléphone » (`inputmode="tel"`) et « Niveau d'étude » (`STUDY_LEVELS` de `shared/utils/study-levels.ts`). Au-dessus de la case obligatoire « La personne a été informée de l'usage de ses données », le texte de la mention d'usage : « Tes informations servent uniquement à émettre ton badge, à organiser l'accueil du salon et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l'événement. » Bouton « Inscrire et valider l'entrée ».
  - **Erreurs** : sous chaque champ, codes traduits au vouvoiement (mêmes codes que le formulaire public).
  - **Disponibilité** : formulaire masqué en mode essai (US4-8) ; hors ligne, il est remplacé par « Inscription sur place indisponible hors ligne : réessayez au retour du réseau » (US4-7).
- [X] T055 [US4] Brancher l'inscription sur place dans `app/composables/use-salm-control.ts` (`registerOnsite(fields)`) et `app/pages/admin/salm/controle/index.vue`.
  - Activer « Pas de badge ? », qui ouvre `<SalmControlOnsite>`.
  - Réponse **201** : `<SalmControlResult>` vert, avec en détail « Communiquez le numéro {badgeNumber} à la personne. Son badge se récupère sur /salm avec son nom et son téléphone. » (FR-244).
  - Réponse **200** `created: false` : ouvrir la fiche de `<SalmControlManual>` avec `lookup`.
  - Présence de `entryError` : fiche avec « Valider l'entrée ».
- [X] T056 [US4] Ajouter l'origine à la liste et à l'export (FR-247) :
  - `server/api/admin/salm/editions/[editionId]/students/index.get.ts` : `origin` dans le `select` et la réponse ;
  - `server/api/admin/salm/editions/[editionId]/students/export.get.ts` : colonne `Origine` (`En ligne` · `Sur place`) après les colonnes existantes et avant les colonnes `Présent …` ;
  - `SalmAdminStudentRow.origin` dans `shared/types/salm.ts` ;
  - `app/pages/admin/salm/index.vue` : pastille « Sur place » à côté du nom.

**Checkpoint** : quickstart § 5.4 à 5.8.

---

## Phase 8 : Test sur téléphone et finitions

**Purpose** : recette complète sur de vrais téléphones, préparation de la production et documentation.

- [X] T057 [P] Vérifier puis corriger la fonction `ssl()` et la ligne cron de renouvellement dans `deploy.sh` (constat C4 de research.md) :
  - arrêter et redémarrer le service `nginx` (qui occupe le port 80), pas `app` ;
  - écrire les certificats là où nginx les lit (volume externe `le_carre_des_etudes_letsencrypt` monté sur `/etc/letsencrypt`), par exemple avec `certbot` en conteneur, `-v le_carre_des_etudes_letsencrypt:/etc/letsencrypt` ;
  - ou passer au mode `--webroot`, avec la `location /.well-known/acme-challenge/` correspondante dans `nginx.conf`.

  Vérifier la date d'expiration actuelle : `echo | openssl s_client -connect lecarredesetudes.com:443 2>/dev/null | openssl x509 -noout -enddate`.
- [X] T058 [P] Mettre à jour `CLAUDE.md`, section Architecture : un paragraphe « Contrôle d'entrée SALM (008) » qui décrit :
  - `/admin/salm/controle` (layout `salm-controle`, adresse courte `/controle`) et l'affiche `/admin/salm/controle/affiche` ;
  - les routes `server/api/admin/salm/control/*` et `server/utils/salm-control.ts` ;
  - le code commun `shared/utils/salm-control.ts` ;
  - `SalmEntry` et son unicité (inscription, jour) ;
  - le service worker `public/salm-controle-sw.js`, de portée limitée, et les données locales `salm-controle:v1:*` effacées à la déconnexion ;
  - le test sur téléphone (`pnpm dev --https --host` ou tunnel) ;
  - la suppression de `GET /api/salm/verify/:token`.
- [X] T059 Contrôle de conformité : `pnpm build` sans erreur de type. Puis `grep -rn "phone" server/api/admin/salm/control/ server/utils/salm-control.ts` : aucun téléphone ne doit figurer dans une réponse, hors de la normalisation de la requête (FR-230). Enfin, `grep -rn "verifyToken\|downloadToken"` dans les mêmes fichiers : aucune sortie ne doit exposer ces jetons.
- [X] T060 Recette de bureau : [quickstart.md](./quickstart.md) § 1 à 5 en entier, y compris le double scan concurrent par `curl` (§ 2) et le `diff` des pages de vérification (§ 4). Noter les écarts dans `specs/008-salm-controle-entree/checklists/recette.md`.
- [ ] T061 **Test sur un vrai téléphone Android (Chrome)** : [quickstart.md](./quickstart.md) § 6.1 à 6.14, via `pnpm dev --https --host` ou un tunnel `cloudflared`.
  - 15 badges par minute (SC-001) ;
  - lecture à bout de bras en extérieur (SC-006) ;
  - écran maintenu allumé, 3 motifs de vibration ;
  - mode avion, réouverture de la page, synchronisation en moins d'une minute (SC-005a) ;
  - déconnexion qui efface les données (`chrome://inspect`).

  Consigner les résultats dans `specs/008-salm-controle-entree/checklists/recette.md`.
- [ ] T062 **Test sur un vrai iPhone (Safari)**, même parcours § 6.1 à 6.14 : vidéo intégrée (`playsinline`), caméra arrière, lecture par le repli `jsqr` du premier coup sur tous les badges imprimés et affichés, son sans vibration, Wake Lock, réouverture hors ligne. **Critère de plan B (R1 bis)** : si un badge n'est pas lu du premier coup, ouvrir une tâche de remplacement du repli par `barcode-detector` (zxing-wasm auto-hébergé) dans `app/composables/use-qr-reader.ts`. Consigner dans `specs/008-salm-controle-entree/checklists/recette.md`.
- [ ] T063 Test à plusieurs postes, **au moins 6 téléphones mélangés** Android et iPhone (SC-003) : enchaîner des scans simultanés, dont 2 téléphones sur le même badge au même instant, en ligne puis en mode avion. Vérifier dans le back-office une seule entrée par badge et par jour, à l'heure la plus ancienne. Consigner dans `specs/008-salm-controle-entree/checklists/recette.md`.
- [X] T064 Contrôle d'accessibilité et de lisibilité à 390 px sur `app/pages/admin/salm/controle/index.vue` :
  - parcours complet au clavier (Tab, Entrée) avec un focus visible ;
  - annonce des résultats par VoiceOver et TalkBack (`role="status"`) ;
  - zones tactiles de 48 px au moins, aucun défilement horizontal ;
  - palette AAA conforme à R11.

  Corriger dans les composants `app/components/salm/control-*.vue` si besoin.

  *Fait en navigateur (clavier, zones tactiles, 360 à 430 px, contrastes, région `role="status"`). L'écoute réelle avec VoiceOver et TalkBack reste à faire pendant T061 et T062.*

---

## Dependencies & Execution Order

### Dépendances entre phases

| Phase | Dépend de | Remarque |
|---|---|---|
| 1 Setup | — | T001 d'abord |
| 2 Fondations (table et API) | 1 | **Bloque tout** : T004 → T005 → T007 → T008 → T009 ; T006 en parallèle de T004 et T005 ; T010 à T014 après T008 et T009 |
| 3 US1 Scan (MVP) | 2 | T024 après T019 et T020 ; T025 après T021 à T024 |
| 4 US2 Saisie manuelle | 2, 3 (page et composable) | T029 et T030 indépendants de la phase 3 |
| 5 US3 Suivi | 2 | Indépendante des phases 3 et 4 côté back-office (T031 à T036) ; T037 nécessite la phase 3 |
| 6 Hors ligne | 3, 4 | Étend les mêmes fichiers (`use-salm-control.ts`, layout, page) |
| 7 US4 Non-inscrit·e·s | 2, 3 ; T056 après T032 et T033 (mêmes fichiers) | T054 et T055 hors ligne après la phase 6 |
| 8 Téléphone et finitions | toutes | T057 et T058 réalisables à tout moment |

### Dépendances au sein des stories

- **US1** :
  - T015, T016, T017, T018, T019, T020, T021, T022 et T023 sont parallèles (fichiers distincts) ;
  - T024 dépend de T019 et T020 ;
  - T025 dépend de T018 et T021 à T024.
- **US2** : T026, T029 et T030 sont parallèles ; T027 puis T028 (même composable, puis même page).
- **US3** :
  - T031 → T032 → T033 (même filtre, puis routes) ;
  - T034 et T036 sont parallèles ;
  - T035 après T032 et T034.
- **Hors ligne** :
  - T040 et T046 sont parallèles, T045 aussi (fichier distinct) ;
  - T038 → T039 ;
  - T041 → T042 → T043 → T044 (même composable) ;
  - T047 après T040 et T046 ; T048 après T040.
- **US4** :
  - T049, T052, T053 et T054 sont parallèles ;
  - T050 → T051 ;
  - T055 après T051 et T054 ;
  - T056 après T032 et T033.

### Fichiers modifiés par plusieurs tâches (jamais en parallèle)

| Fichier | Tâches |
|---|---|
| `app/composables/use-salm-control.ts` | T024, T027, T037, T041, T042, T043, T044, T055 |
| `app/pages/admin/salm/controle/index.vue` | T025, T028, T048, T055 |
| `server/utils/salm-control.ts` | T008, T009, T038 |
| `server/utils/salm-registration.ts` | T007, T050 |
| `server/api/admin/salm/editions/[editionId]/students/index.get.ts` | T032, T056 |
| `server/api/admin/salm/editions/[editionId]/students/export.get.ts` | T033, T056 |
| `shared/types/salm.ts` | T003, T030, T034, T056 |
| `app/pages/admin/salm/index.vue` | T035, T056 |
| `nuxt.config.ts` | T017, T049 |
| `app/layouts/salm-controle.vue` | T018, T047 |
| `app/components/salm/control-counters.vue` | T023, T045 |
| `app/components/salm/control-manual.vue` | T026, T044 |
| `app/layouts/admin.vue` | T016, T043 |

---

## Parallel Example

```text
# Phase 2, une fois T004 et T005 faits :
T006 shared/utils/salm-control.ts          (déjà lancée en parallèle de T004)
# Après T008 et T009 :
T010 control/snapshot.get.ts  |  T011 control/state.get.ts  |  T012 control/entries/index.post.ts
T013 control/entries/[id].delete.ts  |  T014 control/lookup.get.ts

# Phase 3 (US1), toutes en même temps :
T015 login.vue | T016 layouts/admin.vue | T017 nuxt.config.ts | T018 layouts/salm-controle.vue
T019 use-qr-reader.ts | T020 use-control-feedback.ts | T021 control-scanner.vue
T022 control-result.vue | T023 control-counters.vue

# Phase 4 (US2) :
T026 control-manual.vue | T029 salm/v/[token].vue | T030 suppression de l'API publique

# Phase 5 (US3), en parallèle de la phase 4 (sauf T034, qui touche shared/types/salm.ts comme T030) :
T031 salm-admin.ts | T036 salm-purge.ts   puis T034 après T030

# Phase 6 (hors ligne) :
T040 salm-control-storage.ts | T045 control-counters.vue | T046 public/salm-controle-sw.js

# Phase 7 (US4) :
T049 nuxt.config.ts | T052 control/poster.get.ts | T053 controle/affiche.vue | T054 control-onsite.vue
```

---

## Implementation Strategy

### MVP : phases 1 à 3 (scan en ligne)

1. Setup, puis fondations (table `SalmEntry` et API de contrôle).
2. Page de contrôle avec scan, résultats plein écran, compteurs du jour et annulation.
3. **Stop et validation** : quickstart § 2, puis un premier essai sur téléphone (§ 6.1 à 6.7).

Le MVP permet déjà un contrôle réel si le réseau du lieu tient.

### Livraison incrémentale

| Étape | Apport | Validation |
|---|---|---|
| Phases 1 à 3 | Scan en ligne, une entrée par jour, double scan sûr | quickstart § 2 |
| + Phase 4 | Saisie manuelle ; URL du QR code sans validité pour le public (FR-222) | quickstart § 3 et 4 |
| + Phase 5 | Compteurs, présence dans la liste, export CSV | quickstart § 5.1 à 5.3 et 5.9 |
| + Phase 6 | Contrôle sans réseau, page rouvrable hors ligne | quickstart § 6.8 à 6.14 |
| + Phase 7 | Affiche, inscription sur place, origine | quickstart § 5.4 à 5.8 |
| + Phase 8 | Recette Android, iPhone et 6 postes ; certificat HTTPS sûr | quickstart § 6 et 7 |

### Parallélisation à plusieurs

Après la phase 2 :
- une personne sur la page de contrôle (phases 3 puis 6) ;
- une deuxième sur le back-office (phase 5, T031 à T036) et sur `/salm/v/:token` (T029, T030) ;
- une troisième sur `deploy.sh` (T057), puis sur l'inscription sur place côté serveur (T050 à T052).

---

## Notes

- **[P]** = fichier distinct et aucune dépendance sur une tâche en cours ; les fichiers partagés sont listés ci-dessus.
- Pas de tâche de test automatisé (non demandé, pas de runner) ; la recette est en phase 8.
- Commits conventionnels (`feat(salm): …`) à la fin de chaque phase ; ne pas fusionner avant la réussite de T061 à T063.
- Le jour de salon temporaire créé pour la recette (quickstart § 1) doit être supprimé avant la mise en production.
