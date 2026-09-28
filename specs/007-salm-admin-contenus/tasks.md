---

description: "Liste des tâches — Module SALM (2/3) : back-office des éditions et des contenus, statistiques"
---

# Tasks: Module SALM (2/3) — back-office des éditions et des contenus, statistiques

**Input**: documents de conception de `/specs/007-salm-admin-contenus/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/admin-api.md](./contracts/admin-api.md), [contracts/ui-routes.md](./contracts/ui-routes.md), [quickstart.md](./quickstart.md)

**Tests** : aucun test automatisé (pas de test runner, constitution). La vérification se fait par les scénarios de [quickstart.md](./quickstart.md), en phase 8.

**Organisation** : phases dans l'ordre demandé : éditions (US1) → contenus (US2, un sous-ensemble par type de contenu) → duplication (US3) → statistiques (US4) → vérification du quickstart.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichier distinct, aucune dépendance envers une tâche non terminée).
- **[Story]** : user story de la spec (US1 à US4).
- Chemins relatifs à la racine du dépôt. Nouveaux fichiers en kebab-case `[a-z0-9-]`. Interface en français avec accents.

## Conventions communes à toutes les routes admin (à appliquer sans les répéter)

- Routes sous `server/api/admin/salm/**` : protégées toutes méthodes par `server/middleware/admin.ts` (rien à ajouter).
- Erreurs : `adminError(statusCode, code)` de `server/utils/salm-admin.ts` ; validation : `400` avec `data: { code: 'VALIDATION', errors }` (réutiliser `validationError` de `server/utils/salm-registration.ts` ou un équivalent local à `salm-content.ts`) ; `parseIdParam(event, 'editionId' | 'id')` pour les paramètres.
- Corps lu par `((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>`, puis **liste blanche** des champs (research R15).
- Après toute écriture qui remplace ou retire un fichier : `releaseSalmFiles([ancienChemin])` **après** l'écriture en base (research R3).
- Réponses et formes JSON : [contracts/admin-api.md](./contracts/admin-api.md). Règles de champs : [data-model.md § 4](./data-model.md#4-règles-de-validation-des-écritures-admin).

---

## Phase 1: Setup

**Purpose** : protéger les saisies du back-office avant tout développement.

- [X] T001 Passer le seed en **création seule** dans `prisma/seed/salm.ts` (research R12) :
  - pour chaque édition de `salm-data.ts`, `findUnique({ where: { year } })` ;
  - si l'édition existe : `console.log(\`SALM ${year} déjà présent : ignoré (contenu géré dans le back-office)\`)` et passer à la suivante, **sans aucune écriture** (ni édition, ni jours, créneaux, temps forts, vidéos, photos ou stands) ;
  - sinon : création complète comme aujourd'hui (statut initial, interrupteurs, jours, créneaux, temps forts, vidéos, photos, stands).
  
  Supprimer la logique d'`upsert` et de `deleteMany` devenue inutile.
- [X] T002 [P] Réécrire l'en-tête de `prisma/seed/salm-data.ts` : ce fichier initialise une base neuve. Une fois une édition créée, son contenu se gère dans le back-office (« SALM › Éditions ») et le seed ne la modifie plus.

---

## Phase 2: Foundational (prérequis bloquants)

**Purpose** : utilitaires partagés, validateurs et composants transverses utilisés par toutes les stories.

**⚠️ CRITICAL** : aucune story ne commence avant la fin de cette phase.

- [X] T003 [P] Compléter `shared/utils/salm.ts` :
  - **`parseYoutubeId(raw)` durci**, qui remplace la regex actuelle (research R7) :
    - `new URL(raw.trim())`, avec `https://` ajouté si le schéma manque ; `null` si l'analyse échoue ;
    - hôte, sans `www.` ni `m.`, ∈ `youtube.com`, `music.youtube.com`, `youtube-nocookie.com`, `youtu.be` ;
    - identifiant : `youtu.be/<id>` → 1ᵉʳ segment ; `/watch` → `searchParams.get('v')` ; `/embed/<id>`, `/shorts/<id>`, `/live/<id>` → 2ᵉ segment ;
    - identifiant valide si `/^[A-Za-z0-9_-]{11}$/`, sinon `null`.
  - `canonicalYoutubeUrl(id)` → `https://www.youtube.com/watch?v=<id>`.
  - `isValidEmail(value)` : `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` et 254 caractères au plus.
  - `SLOT_KIND_LABELS` : `{ ceremonie: 'Cérémonie', panel: 'Panel', presentation: 'Présentation', stands: 'Stands', pause: 'Pause', exposition: 'Exposition' }`.
  - `findSlotOverlaps(slots: { id, startTime, endTime }[])` → `Map<id, id[]>`, **strict** (`a.startTime < b.endTime && b.startTime < a.endTime`, comparaison de chaînes `HH:MM`) : des créneaux qui se touchent ne se chevauchent pas.
- [X] T004 [P] Ajouter les types d'administration à `shared/types/salm.ts`, formes exactes de [contracts/admin-api.md](./contracts/admin-api.md) :
  - `SalmAdminEditionListItem` (`SalmAdminEdition` + `venue`, `city`, `firstDay`, `lastDay`, `dayCount`, `yearLocked`, `canDelete`, `canPublish`) ;
  - `SalmAdminEditionDetail` (§ 3 du contrat) ;
  - `SalmAdminStats` (§ 10) ;
  - `SalmAdminSummary` (§ 11) ;
  - `SalmAdminWarning = 'DUPLICATE_VIDEO'` ;
  - `SalmAdminEditionsResponse.data` typé `SalmAdminEditionListItem[]`.
- [X] T005 Dans `server/utils/salm-registration.ts`, remplacer la constante privée `EMAIL_REGEX` (l.330) par `isValidEmail` de `#shared/utils/salm`, sans changement de comportement (dépend de T003).
- [X] T006 [P] Créer `server/utils/salm-files.ts` (research R3, R15) :
  - `isSalmImagePath(p)` : `/^\/(uploads|images)\/salm\/[a-z0-9][a-z0-9._\/-]*\.(jpe?g|png|webp)$/i`, et `!p.includes('..')` ;
  - `isSalmPdfPath(p)` : `/^\/uploads\/salm\/[a-z0-9][a-z0-9._-]*\.pdf$/i` ;
  - `salmFileExists(p)` : pour `/uploads/salm/…`, `access(join(process.cwd(), 'public', p))` ; pour `/images/salm/…`, `true` ;
  - `releaseSalmFiles(paths: (string | null | undefined)[])` :
    1. ne garder que les chemins qui commencent par `/uploads/salm/` (**jamais `/images/salm/`**) ;
    2. pour chacun, compter les références restantes dans `SalmEdition.posterPath`, `recapPosterPath`, `programPdfPath`, `SalmHighlight.imagePath`, `SalmPhoto.imagePath` et `SalmVideo.thumbnailPath` ;
    3. si le total est 0, `unlink` dans un `try/catch` silencieux.
- [X] T007 [P] Ajouter la catégorie `salm` à `server/api/upload/index.post.ts` (research R2, contrat « POST /api/upload ») :
  - `salm` dans `ALLOWED_CATEGORIES` ;
  - lire le champ `kind` (`image` par défaut, ou `pdf`) comme `category` ;
  - limite Busboy de **10 Mo** pour `salm` (50 Mo inchangés pour les autres catégories) ;
  - après écriture, pour `salm` uniquement :
    - `kind = image` : `sharp(filePath).metadata()` doit réussir, avec `format ∈ ['jpeg','png','webp']`, sinon `415 UNSUPPORTED_FORMAT` (ou `422 CORRUPTED_FILE` si `metadata()` échoue) ; poids ≤ 5 Mo, sinon `413 FILE_TOO_LARGE` ;
    - `kind = pdf` : les 5 premiers octets valent `%PDF-` (sinon `415 UNSUPPORTED_FORMAT`) et poids ≤ 10 Mo ;
    - en cas de refus, `unlink` du fichier ; erreurs `createError({ statusCode, message: code, data: { code } })` ;
    - **pas de génération OG** (`ogPath: null`).
  
  Comportement strictement inchangé pour `magazines`, `rubriques`, `partenaires` et `homepage`.
- [X] T008 Créer `server/utils/salm-content.ts`, partie **édition** (data-model § 4, dépend de T003 et T006). `validateEditionPatch(body, edition)` renvoie `{ data, errors }`, avec la liste blanche `year`, `salonName`, `organizerName`, `city`, `venue`, `tagline`, `whyTitle`, `whyText`, `audiences`, `contacts`, `posterPath`, `posterAlt`, `programPdfPath`, `recapVideoUrl`, `recapPosterPath`. Règles :
  - `year` : « Entier de 2020 à 2100, unique (`DUPLICATE`) ; refusé si `yearLocked` (`409 YEAR_LOCKED`) » ;
  - `salonName` : « Requis, 2 à 150 caractères » ; `organizerName` : « Requis, 2 à 150 caractères » ; `city` : « Requis, 2 à 80 caractères » ;
  - `venue`, `tagline` : « Facultatifs, 200 et 150 caractères au plus ; chaîne vide → `null` » ;
  - `whyTitle` : 200 au plus ; `whyText` : « 2 000 caractères au plus, texte brut » ;
  - `audiences` : « Tableau de 0 à 6 `{ title: 1–80, text: 1–300 }` » ;
  - `contacts` : « Tableau de 0 à 8 `{ kind, value, onBadge? }` » :
    - `phone` : `normalizeIvorianPhone(value, { landline: true })` non nul, stocké `'+225 ' + formatIvorianPhone(n)` ;
    - `email` : `isValidEmail`, en minuscules ;
    - `address` : « 2 à 200 caractères » ;
    - `onBadge` : seulement sur `phone` (sinon `INVALID_CHOICE`), au plus un, le dernier marqué l'emporte ;
  - `posterPath` et `recapPosterPath` : `isSalmImagePath` et `salmFileExists` (sinon `INVALID_FORMAT` / `FILE_NOT_FOUND`) ou `null` ; `posterAlt` requis si `posterPath` (1 à 200 caractères, défaut « Affiche du SALM <année> ») ;
  - `programPdfPath` : `isSalmPdfPath` et `salmFileExists`, ou `null` ;
  - `recapVideoUrl` : `parseYoutubeId` non nul → `canonicalYoutubeUrl`, ou `null`.
  
  Clés d'erreur des tableaux : `contacts.2.value`, `audiences.0.title`.
- [X] T009 Compléter `server/utils/salm-content.ts`, partie **éléments** (data-model § 4) :
  - `validateDay` : `date` `YYYY-MM-DD` valide ; `label` 1 à 40 caractères (défaut « Jour N » selon la position par date) ; `opensAt` et `closesAt` en `HH:MM` avec « `closesAt > opensAt` » (sinon `INVALID_FORMAT` sur `closesAt`) ;
  - `validateSlot` : `startTime` et `endTime` en `HH:MM` avec « `endTime > startTime` » ; `title` « Requis, 1 à 150 caractères » ; `kind ∈ SLOT_KINDS` ; `description` « 1 000 caractères au plus » ; `isHighlighted` booléen ;
  - `validateHighlight` : `title` requis (1 à 100) ; `imagePath` requis (`isSalmImagePath` + `salmFileExists`) ; `imageAlt` 1 à 200 (défaut : le titre) ;
  - `validateVideo` : `youtubeUrl` requis → canonique ; `title`, `guest`, `institution` facultatifs, « 150 caractères au plus » ;
  - `validatePhoto` : `imagePath` requis (création seulement) ; `alt` 1 à 200 (défaut « Photo du SALM <année> n° <position> ») ; `caption` « 200 caractères au plus » ;
  - `validateStandType` : `name` « Requis, 1 à 60 caractères ; unique dans l'édition sans tenir compte de la casse » (`DUPLICATE`) ; `description` 500 au plus ; `priceLabel` 60 au plus ; `isVisible` booléen.
  
  Chaque validateur accepte un mode `partial` pour les `PATCH` (au moins un champ).
- [X] T010 Compléter `server/utils/salm-content.ts`, partie **lecture et ordre** (data-model § 3, contrat § 3) :
  - `applyOrder(tx, model: 'salmHighlight' | 'salmVideo' | 'salmPhoto' | 'salmStandType' | 'salmSlot', scopeWhere, ids)` : vérifie que `ids` est exactement l'ensemble des ids du périmètre (sinon `400 ORDER_MISMATCH`), puis `update({ sortOrder: index })` pour chacun, dans une `$transaction` ;
  - `nextSortOrder(model, scopeWhere)` : `max + 1` ;
  - `resortDays(tx, editionId)` : `sortOrder` des jours par date croissante ;
  - `editionFlags(edition, counts, now)` → `everRegistered`, `yearLocked`, `canDelete`, `canPublish` (règles exactes de data-model § 3) ;
  - `getEditionDetail(id)` → `SalmAdminEditionDetail` :
    - listes triées par `sortOrder` puis `id`, jours par date ;
    - `standTypes[].schoolCount` via `_count` ;
    - `videos[].youtubeId` via `parseYoutubeId` ;
    - `registrationOpen` via `isRegistrationOpen` ;
    - `previousEdition` via la règle de `getPreviousEdition` ;
    - `nextEditionYear` : plus petite année > N, sinon N + 1.
- [X] T011 [P] Créer `app/utils/salm-admin-errors.ts` (research R10) :
  - `salmAdminErrorMessage(code)` et `salmFieldErrorMessage(field, code)`, qui couvrent :
    - `YEAR_TAKEN` « Une édition <année> existe déjà. » ;
    - `YEAR_LOCKED` ;
    - `NO_DAYS` « Ajoutez au moins un jour au chronogramme avant de publier. » ;
    - `EDITION_ENDED`, `INVALID_TRANSITION`, `ALREADY_ARCHIVED`, `EDITION_NOT_DELETABLE`, `LAST_DAY_OF_PUBLISHED` ;
    - `STAND_TYPE_IN_USE` « Choisi par N établissement(s) : vous pouvez seulement le masquer. » ;
    - `ORDER_MISMATCH` ;
    - `FILE_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `CORRUPTED_FILE`, avec les formats et poids (« JPEG, PNG ou WebP, 5 Mo au plus » ; « PDF, 10 Mo au plus ») ;
    - `FILE_NOT_FOUND` ;
    - l'URL YouTube (« Saisissez l'adresse d'une vidéo YouTube (ex. https://youtu.be/…). ») ;
    - l'e-mail (« Adresse e-mail invalide. ») ;
    - `REQUIRED`, `TOO_LONG`, `DUPLICATE` et `INVALID_FORMAT` par champ ;
    - la session expirée (401 : « Votre session a expiré. Reconnectez-vous. ») ;
    - le texte générique de secours.
- [X] T012 [P] Créer `app/composables/use-salm-upload.ts` : `useSalmUpload()` → `upload(file, kind: 'image' | 'pdf', onProgress?)`, qui renvoie `Promise<{ path }>`.
  - Pré-contrôle client : type `image/jpeg|png|webp` et ≤ 5 Mo pour une image ; `application/pdf` et ≤ 10 Mo pour un PDF.
  - `XMLHttpRequest` vers `/api/upload`, `FormData` dans l'ordre `category=salm`, `kind`, `file` (pattern `uploadFile` de `app/pages/admin/magazines.vue`) avec progression.
  - Rejet avec un `code` traduisible par `salmAdminErrorMessage`.
- [X] T013 [P] Créer `app/components/salm/admin-order-buttons.vue` :
  - props `index`, `count`, `label` ; émet `move` (`-1 | 1`) ;
  - deux `<button type="button">` « Monter » et « Descendre », `aria-label="Monter « <label> »"` et « Descendre « <label> » », désactivés en tête et en fin de liste ;
  - expose `focus(direction)` pour que le parent replace le focus après le déplacement.
- [X] T014 Créer `app/components/salm/admin-image-field.vue` (dépend de T012) :
  - props `modelValue` (chemin ou `null`), `alt`, `label`, `defaultAlt`, `required`, `decorative` ; émet `update:modelValue` et `update:alt` ;
  - aperçu `<img>`, bouton-fichier « Choisir une image » / « Remplacer » (`accept="image/jpeg,image/png,image/webp"`), « Retirer » si non requis ;
  - champ « Texte alternatif » requis quand une image est présente, prérempli par `defaultAlt` ; **absent si `decorative`**, remplacé par la mention « Image décorative : aucun texte alternatif nécessaire. » (FR-133) ;
  - `<progress>` pendant l'envoi ; erreur sous le champ (`aria-describedby`, `aria-invalid`).
- [X] T015 [P] Ajouter les sous-entrées SALM dans `app/layouts/admin.vue` (contrats/ui-routes « Navigation ») :
  - `navItems` accepte `children?: { label, to, match }[]` ;
  - sous « SALM » : « Inscriptions » (`/admin/salm`, active si le chemin vaut `/admin/salm` ou commence par `/admin/salm/etablissements`), « Éditions » (`/admin/salm/editions`, préfixe), « Statistiques » (`/admin/salm/statistiques`) ;
  - rendu indenté sous l'entrée parente, toujours visible, `aria-current="page"` et `text-amber-400` sur la sous-entrée active.

**Checkpoint** : utilitaires, validateurs, upload `salm` et composants transverses prêts.

---

## Phase 3: User Story 1 — Gérer les éditions (Priority: P1) 🎯 MVP

**Goal** : lister, créer, modifier, publier (une seule à la fois), archiver, republier, supprimer un brouillon vierge, prévisualiser.

**Independent Test** :
- Sur les éditions du seed : archiver 2027 (`/salm` affiche le message d'attente), puis la republier.
- Créer 2028, renseigner lieu et slogan, la prévisualiser.
- La publication d'un nouveau brouillon demande au moins un jour ; elle est vérifiable de bout en bout dès la sous-phase Chronogramme (T042 à T050). Voir quickstart, scénario 1.

### Implementation for User Story 1

- [X] T016 [P] [US1] Créer `server/utils/salm-lifecycle.ts` (research R4, data-model § 2) (FR-115, FR-115a, FR-116, FR-117, FR-118, FR-119) :
  - `publishEdition(id)` : `$transaction` interactive qui
    1. charge l'édition avec ses jours ;
    2. refuse avec `409 NO_DAYS` s'il n'y a aucun jour ;
    3. refuse avec `409 EDITION_ENDED` si `status = 'archived'` et `isEditionEnded(days)` ;
    4. si l'édition est déjà publiée, renvoie sans effet ;
    5. sinon `updateMany({ where: { status: 'published', id: { not: id } }, data: { status: 'archived' } })` (en récupérant d'abord ces éditions), puis `update(id → 'published')`.
    
    Renvoie `{ published: { id, year }, archived: [{ id, year }] }`.
  - `archiveEdition(id)` : `409 ALREADY_ARCHIVED` si déjà archivée ; renvoie `{ id, year, status, wasPublished }`.
  - `deleteDraftEdition(id)` :
    - `409 EDITION_NOT_DELETABLE` si `!editionFlags(...).canDelete` ;
    - collecte tous les chemins de fichiers de l'édition (affiche, image de secours, PDF, temps forts, photos, miniatures) ;
    - `delete` (cascade), puis `releaseSalmFiles(chemins)`.
  
  Aucune transition ne modifie les interrupteurs, les inscriptions ni `lastBadgeSeq`.
- [X] T017 [P] [US1] Dans `server/utils/salm-edition.ts`, extraire `loadEditionPayload(where: Prisma.SalmEditionWhereInput)`. Elle reprend le `select` inline de `getPublicEditionPayload` (l.135-180), `getPreviousEdition(edition.year)`, `serializePublicEdition` et `serializePreviousEdition`, et renvoie `SalmEditionResponse`. `getPublicEditionPayload()` devient `loadEditionPayload({ status: 'published' })`, avec la même sortie qu'avant. (FR-120, FR-121)
- [X] T018 [US1] Étendre `server/api/admin/salm/editions/index.get.ts` (contrat § 1) (FR-110, FR-113, FR-114, FR-119) :
  - ajouter au `select` `venue`, `city`, `lastBadgeSeq` et `days.date` ;
  - ajouter à chaque élément `venue`, `city`, `firstDay`, `lastDay`, `dayCount`, et `yearLocked` / `canDelete` / `canPublish` via `editionFlags` ;
  - ne modifier aucun champ existant (l'en-tête des inscriptions en dépend).
- [X] T019 [P] [US1] Créer `server/api/admin/salm/editions/index.post.ts` (contrat § 2) (FR-111) :
  - corps `{ year, organizerName? }` ; `year` entier de 2020 à 2100, sinon `400 VALIDATION` ;
  - `409 YEAR_TAKEN` si l'année existe, erreur `P2002` comprise ;
  - préremplissage de `salonName`, `organizerName` et `city` depuis l'édition d'année la plus élevée ; s'il n'y en a aucune, `organizerName` est requis (`errors.organizerName = 'REQUIRED'`) ;
  - `status: 'draft'`, interrupteurs `false` ;
  - **201** avec `getEditionDetail`.
- [X] T020 [P] [US1] Créer `server/api/admin/salm/editions/[editionId]/index.get.ts` : **200** `getEditionDetail(editionId)`, `404` sinon. (FR-112)
- [X] T021 [P] [US1] Créer `server/api/admin/salm/editions/[editionId]/index.patch.ts` (contrat § 4) (FR-112, FR-114, FR-136, FR-141 à FR-145, FR-161) :
  - `validateEditionPatch` : au moins un champ, `400 VALIDATION` ; `409 YEAR_LOCKED` ; `409 YEAR_TAKEN`, `P2002` compris ;
  - `update` puis `releaseSalmFiles` des anciens `posterPath`, `recapPosterPath` et `programPdfPath` remplacés ou retirés ;
  - **200** `getEditionDetail`.
  
  Ignorer `status`, les interrupteurs, `lastBadgeSeq`, `personalDataPurgedAt` et `purgedStats`.
- [X] T022 [P] [US1] Créer `server/api/admin/salm/editions/[editionId]/index.delete.ts` : `deleteDraftEdition` → **200** `{ success: true }`. (FR-119)
- [X] T023 [P] [US1] Créer `server/api/admin/salm/editions/[editionId]/publish.post.ts` : `publishEdition` → **200** (contrat § 6). (FR-115, FR-115a, FR-116)
- [X] T024 [P] [US1] Créer `server/api/admin/salm/editions/[editionId]/archive.post.ts` : `archiveEdition` → **200** (contrat § 7). (FR-117)
- [X] T025 [P] [US1] Créer `server/api/admin/salm/editions/[editionId]/preview.get.ts` (dépend de T017) (FR-100, FR-120) :
  - `404` si l'édition n'existe pas ;
  - sinon `loadEditionPayload({ id })` ;
  - `setHeader(event, 'Cache-Control', 'private, no-store')`.
- [X] T026 [P] [US1] Créer `app/components/salm/edition-view.vue` en déplaçant **tel quel** le gabarit de `app/pages/salm/index.vue` : les sections `SalmHero` → `SalmFinalCta` avec leurs `v-if`, et le message d'attente sans édition. (FR-120)
  - Props : `edition: SalmPublicEdition | null`, `previous: SalmPreviousEdition | null`.
  - Importer `~/assets/css/salm.css`.
- [X] T027 [US1] Modifier `app/pages/salm/index.vue` pour rendre `<SalmEditionView :edition :previous />` (dépend de T026), en conservant `useFetch` (clé `salm-edition`), le préchargement de police, `useSeoMeta` et le JSON-LD. Le HTML rendu de `/salm` doit rester identique (quickstart 5.4). (FR-120)
- [X] T028 [US1] Créer `app/pages/admin/salm/editions/index.vue` (contrats/ui-routes « Liste des éditions »), `definePageMeta({ layout: 'admin' })` et `useFetch('/api/admin/salm/editions', { key: 'salm-admin-editions' })` (FR-110, FR-111, FR-115, FR-117, FR-119, FR-131) :
  - **Tableau** : Année · Statut (pastilles Brouillon gris, Publiée vert, Archivée ambre) · Dates (`formatDateRange` ou « — ») · Lieu (`venueLabel`) · Inscriptions.
  - **Actions** :
    - « Gérer » ;
    - « Prévisualiser » (si l'édition n'est pas publiée), ou « Voir la page » (si publiée) ;
    - « Publier » (`canPublish`) ;
    - « Archiver » (si non archivée) ;
    - « Supprimer » (`canDelete`).
  - **Confirmations** `confirm()` aux textes exacts de ui-routes :
    - pour la publication, nom de l'édition archivée par effet de bord, et avertissement « Le SALM <A> est terminé : les inscriptions resteront fermées. » pour un brouillon au salon passé ;
    - pour l'archivage de l'édition publiée, texte spécifique.
  - **Création** : formulaire en ligne « Nouvelle édition » (Année ; Organisateur si la liste est vide), puis `navigateTo` vers la fiche.
  - **Messages** : bandeau de succès 3 s `role="status"`, erreur `role="alert"` traduite par `salmAdminErrorMessage`, puis `refreshNuxtData('salm-admin-editions')` après chaque action.
  - État vide « Aucune édition. Créez la première. »
- [X] T029 [P] [US1] Créer `app/components/salm/admin-edition-general.vue` (FR-112, FR-114) :
  - prop `edition: SalmAdminEditionDetail` ; émet `saved` ;
  - champs Année (`inputmode="numeric"`, désactivé si `yearLocked`, avec « L'année ne peut plus changer : des badges SALM<AA> ont déjà été émis. »), Intitulé du salon, Organisateur, Ville, Lieu (aide : vide = « Lieu à confirmer »), Slogan ;
  - « Enregistrer » → `PATCH /api/admin/salm/editions/:id` ;
  - erreurs sous chaque champ ; saisie conservée en cas d'échec.
- [X] T030 [US1] Créer `app/pages/admin/salm/editions/[id]/index.vue` (contrats/ui-routes « Fiche d'une édition »), `layout: 'admin'` et `useFetch` de `GET /api/admin/salm/editions/:id` (clé `salm-admin-edition-<id>`) (FR-112, FR-115, FR-116, FR-117) :
  - **En-tête** : « SALM <année> », pastille de statut, « ← Toutes les éditions » ; « Prévisualiser » ou « Voir la page », « Publier » et « Archiver » avec les mêmes règles et confirmations que T028 ; rappel « Ajoutez au moins un jour… » si aucun jour.
  - **Sous-navigation** `<nav aria-label="Sections de l'édition">` par `?section=` (`aria-current` sur la section active), avec pour l'instant la seule section `general` → `<SalmAdminEditionGeneral>`. Les autres sections sont ajoutées par les tâches « Brancher » de la phase 4.
  - Sur `saved` : `refresh()` et `refreshNuxtData('salm-admin-editions')`, puis bandeau de succès 3 s.
- [X] T031 [P] [US1] Créer `app/pages/admin/salm/editions/[id]/apercu.vue` (research R6, contrats/ui-routes « Aperçu ») (FR-100, FR-120) :
  - `definePageMeta({ layout: 'default' })` ;
  - `onMounted` : `useAdmin().checkSession()`, puis `navigateTo('/admin/login')` si l'utilisateur n'est pas connecté ;
  - `useFetch('/api/admin/salm/editions/<id>/preview')` et `useSeoMeta({ robots: 'noindex, nofollow' })`, sans JSON-LD ;
  - si la requête échoue (401 lors du rendu serveur sans session, ou 404), **n'afficher aucun contenu de l'édition** : seulement « Chargement… » pendant la redirection vers la connexion, ou « Édition introuvable. » pour un 404 ;
  - bandeau fixe `bg-gray-950 text-white` : « Aperçu — cette édition n'est pas publiée. », ou « … est archivée. », avec le lien « ← Retour à l'édition » ;
  - `<SalmEditionView>` dans un conteneur avec `@click.capture` : si la cible est un lien dont le `href` commence par `/salm/inscription-`, `preventDefault()` et message `role="status"` « Les inscriptions ne sont pas disponibles dans l'aperçu. ».

**Checkpoint** : US1 utilisable sur les éditions existantes. L'archivage et la republication de 2027 se reflètent immédiatement sur `/salm` et la navbar.

---

## Phase 4: User Story 2 — Gérer les contenus d'une édition (Priority: P1)

**Goal** : chaque type de contenu de `/salm` est modifiable depuis la fiche d'une édition.

**Independent Test** : quickstart, scénario 2. Chaque sous-ensemble ci-dessous est livrable et vérifiable seul.

**Parallélisme** : les sous-ensembles 4.1 à 4.6 touchent des fichiers distincts (routes et composant de section) et peuvent être menés en parallèle après la phase 3. Seules les tâches « Brancher » modifient le même fichier (`app/pages/admin/salm/editions/[id]/index.vue`) : les exécuter l'une après l'autre.

### 4.1 Textes, affiche et PDF du programme

- [X] T032 [P] [US2] Créer `app/components/salm/admin-edition-texts.vue` (contrats/ui-routes, section `textes`) (FR-130, FR-133, FR-141 à FR-143) :
  - Titre et paragraphe « Pourquoi le SALM ? » (`<textarea maxlength="2000">`, compteur visible au-delà de 1 800 caractères).
  - Publics cibles :
    - liste de `{ title, text }` (80 et 300 caractères au plus), 6 au plus ;
    - ajout, retrait (`confirm()`) et ordre par `SalmAdminOrderButtons`, avec focus conservé et annonce `aria-live="polite"` « « <titre> » déplacé en position N sur M ».
  - Affiche : `<SalmAdminImageField>` (`defaultAlt` « Affiche du SALM <année> »).
  - PDF du programme :
    - envoi par `useSalmUpload().upload(file, 'pdf')` ;
    - lien « Ouvrir » ;
    - « Retirer » (`confirm()`).
  - « Enregistrer » → un seul `PATCH` avec `whyTitle`, `whyText`, `audiences`, `posterPath`, `posterAlt` et `programPdfPath`.
  - Erreurs par champ (`audiences.0.title`…) ; émet `saved`.
- [X] T033 [US2] Brancher la section `textes` (libellé « Textes et affiche ») dans `app/pages/admin/salm/editions/[id]/index.vue`.

### 4.2 Contacts

- [X] T034 [P] [US2] Créer `app/components/salm/admin-edition-contacts.vue` (contrats/ui-routes, section `contacts`) (FR-130, FR-144, FR-145) :
  - lignes Type (`<select>` Téléphone / E-mail / Adresse) · Valeur · case « Imprimé sur le badge » (téléphones uniquement ; cocher une case décoche les autres) ;
  - ordre par `SalmAdminOrderButtons` ; retrait (`confirm()`) ; 8 contacts au plus ;
  - avertissement « Aucun contact n'est imprimé sur le badge. » ;
  - « Enregistrer » → `PATCH { contacts }` ;
  - erreurs `contacts.N.value`, avec « Adresse e-mail invalide. » et le format de téléphone ; émet `saved`.
- [X] T035 [US2] Brancher la section `contacts` (libellé « Contacts ») dans `app/pages/admin/salm/editions/[id]/index.vue`.

### 4.3 Temps forts

- [X] T036 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/highlights/index.post.ts` (FR-146) :
  - `validateHighlight` : titre requis 1 à 100, `imagePath` requis, `imageAlt` 1 à 200 avec défaut = titre ;
  - `sortOrder = nextSortOrder` ;
  - **201** avec l'élément.
- [X] T037 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/highlights/order.put.ts` : `{ ids }` → `applyOrder('salmHighlight', { editionId }, ids)` → **200** `{ ids }`. (FR-130)
- [X] T038 [P] [US2] Créer `server/api/admin/salm/highlights/[id].patch.ts` : `validateHighlight` partiel → `update`, puis `releaseSalmFiles([ancien imagePath])` si l'image change → **200**. (FR-136, FR-146)
- [X] T039 [P] [US2] Créer `server/api/admin/salm/highlights/[id].delete.ts` : `delete`, puis `releaseSalmFiles([imagePath])` → **200** `{ success: true }`. (FR-131, FR-146)
- [X] T040 [P] [US2] Créer `app/components/salm/admin-edition-highlights.vue` (contrats/ui-routes, section `temps-forts`) (FR-130, FR-131, FR-133, FR-146) :
  - cartes photo, titre et texte alternatif ;
  - formulaire en ligne d'ajout et de modification avec `<SalmAdminImageField required>` ;
  - ordre par `SalmAdminOrderButtons` (`PUT …/order`, mise à jour optimiste, rechargement en cas d'erreur) ;
  - suppression `confirm('Supprimer le temps fort « <titre> » ?')` ;
  - émet `saved`.
- [X] T041 [US2] Brancher la section `temps-forts` (libellé « Temps forts ») dans `app/pages/admin/salm/editions/[id]/index.vue`.

### 4.4 Chronogramme (jours et créneaux)

- [X] T042 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/days/index.post.ts` (FR-150) :
  - `validateDay`, avec `DUPLICATE` si la date existe dans l'édition ;
  - `label` absent → « Jour N » selon la position par date ;
  - création puis `resortDays` dans une transaction → **201**.
- [X] T043 [P] [US2] Créer `server/api/admin/salm/days/[id].patch.ts` : `validateDay` partiel (`closesAt > opensAt` évalué sur les valeurs fusionnées ; une nouvelle `date` déjà prise par un autre jour de l'édition → `DUPLICATE`) → `update` puis `resortDays` → **200**. (FR-150, FR-155)
- [X] T044 [P] [US2] Créer `server/api/admin/salm/days/[id].delete.ts` (FR-151) :
  - `409 LAST_DAY_OF_PUBLISHED` si l'édition est publiée et qu'il ne reste qu'un jour ;
  - compte des créneaux, `delete` (cascade), puis `resortDays` → **200** `{ success: true, deletedSlots }`.
- [X] T045 [P] [US2] Créer `server/api/admin/salm/days/[id]/slots/index.post.ts` : `validateSlot` (fin postérieure au début, titre 1 à 150, `kind ∈ SLOT_KINDS`, description 1 000 au plus), `sortOrder = nextSortOrder` → **201**. (FR-152)
- [X] T046 [P] [US2] Créer `server/api/admin/salm/days/[id]/slots/order.put.ts` : `{ ids }` → `applyOrder('salmSlot', { dayId }, ids)` → **200**. (FR-130, FR-154)
- [X] T047 [P] [US2] Créer `server/api/admin/salm/slots/[id].patch.ts` : `validateSlot` partiel (fin postérieure au début sur les valeurs fusionnées) → **200**. (FR-152)
- [X] T048 [P] [US2] Créer `server/api/admin/salm/slots/[id].delete.ts` → **200** `{ success: true }`. (FR-152)
- [X] T049 [P] [US2] Créer `app/components/salm/admin-edition-chronogram.vue` (contrats/ui-routes, section `chronogramme`) (FR-150 à FR-155) :
  - **Un bloc par jour** :
    - `formatDayLong`, libellé, horaires ;
    - « N chevauchement(s) » via `findSlotOverlaps` ;
    - modifier le jour ;
    - supprimer le jour, avec `confirm('Supprimer le <libellé> et ses N créneaux ?')`.
  - **Créneaux du jour** : heures (`formatHour`), titre, type (`SLOT_KIND_LABELS`), « Mis en avant », description ; ordre par `SalmAdminOrderButtons` ; « Trier par heure » (tri client par début, fin puis ordre actuel, puis `PUT …/slots/order`).
  - **Chevauchements** : sous chaque créneau concerné, texte ambre « Chevauche : <titre>, <début> – <fin> ».
  - **Formulaires en ligne** d'ajout et de modification de jour et de créneau (`<input type="date">`, `<input type="time">`, `<select>` des types).
  - Si `counts.students > 0`, avertissement FR-155 avant toute modification ou suppression de jour : « <N> badges ont déjà été émis : ceux déjà téléchargés portent les anciennes dates. ».
  - Émet `saved`.
- [X] T050 [US2] Brancher la section `chronogramme` (libellé « Chronogramme ») dans `app/pages/admin/salm/editions/[id]/index.vue`.

### 4.5 Types de stands

- [X] T051 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/stand-types/index.post.ts` (FR-170) :
  - `validateStandType` : nom 1 à 60, unique sans tenir compte de la casse ; description 500 au plus ; tarif 60 au plus ;
  - `sortOrder = nextSortOrder` → **201**.
- [X] T052 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/stand-types/order.put.ts` : `applyOrder('salmStandType', { editionId }, ids)` → **200**. (FR-130)
- [X] T053 [P] [US2] Créer `server/api/admin/salm/stand-types/[id].patch.ts` : `validateStandType` partiel (la visibilité se change par `{ isVisible }`) → **200**, avec l'élément et `schoolCount`. (FR-170, FR-171)
- [X] T054 [P] [US2] Créer `server/api/admin/salm/stand-types/[id].delete.ts` : `_count.schoolRegistrations > 0` → `409 STAND_TYPE_IN_USE` avec `data.count` ; sinon `delete` → **200** `{ success: true }`. (FR-172)
- [X] T055 [P] [US2] Créer `app/components/salm/admin-edition-stands.vue` (contrats/ui-routes, section `stands`) (FR-170 à FR-173) :
  - liste nom · description · tarif · « Visible » / « Masqué » · « Choisi par N établissement(s) » ;
  - boutons « Masquer » / « Réafficher » ;
  - suppression désactivée avec l'explication si `schoolCount > 0`, sinon `confirm()` ;
  - formulaire en ligne d'ajout et de modification ; ordre par `SalmAdminOrderButtons` ;
  - avertissement FR-173 « Aucun type de stand visible : les établissements ne peuvent pas s'inscrire. » si aucun type n'est visible et `registrationOpen.schools` ;
  - émet `saved`.
- [X] T056 [US2] Brancher la section `stands` (libellé « Types de stands ») dans `app/pages/admin/salm/editions/[id]/index.vue`.

### 4.6 Médias produits pendant l'édition (vidéo récapitulative, canapé, photos)

- [X] T057 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/videos/index.post.ts` (FR-134, FR-162) :
  - `validateVideo` : URL canonique ; titre, invité et établissement 150 au plus ;
  - `sortOrder = nextSortOrder` ;
  - si le même identifiant YouTube existe déjà dans l'édition, ajouter `warnings: ['DUPLICATE_VIDEO']` à la réponse **201**.
- [X] T058 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/videos/order.put.ts` : `applyOrder('salmVideo', { editionId }, ids)` → **200**. (FR-130)
- [X] T059 [P] [US2] Créer `server/api/admin/salm/videos/[id].patch.ts` : `validateVideo` partiel → **200**, avec le même avertissement de doublon. (FR-134, FR-162)
- [X] T060 [P] [US2] Créer `server/api/admin/salm/videos/[id].delete.ts` : `delete`, puis `releaseSalmFiles([thumbnailPath])` → **200** `{ success: true }`. (FR-162)
- [X] T061 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/photos/index.post.ts` (FR-163) :
  - `validatePhoto` : `imagePath` requis ; `alt` par défaut « Photo du SALM <année> n° <position> » ; légende 200 au plus ;
  - `sortOrder = nextSortOrder` → **201**.
- [X] T062 [P] [US2] Créer `server/api/admin/salm/editions/[editionId]/photos/order.put.ts` : `applyOrder('salmPhoto', { editionId }, ids)` → **200**. (FR-130)
- [X] T063 [P] [US2] Créer `server/api/admin/salm/photos/[id].patch.ts` : seulement `alt` (1 à 200) et `caption` (200 au plus) → **200**. (FR-164)
- [X] T064 [P] [US2] Créer `server/api/admin/salm/photos/[id].delete.ts` : `delete`, puis `releaseSalmFiles([imagePath])` → **200** `{ success: true }`. (FR-164)
- [X] T065 [P] [US2] Créer `app/components/salm/admin-youtube-field.vue` (FR-134) :
  - props `modelValue`, `label` ; émet `update:modelValue` ;
  - `<input type="url">` ;
  - à la sortie du champ (`blur`) et au collage (`paste`), `parseYoutubeId` :
    - si l'identifiant est valide, miniature `https://i.ytimg.com/vi/<id>/hqdefault.jpg` (`alt=""`) ;
    - sinon, erreur sous le champ « Saisissez l'adresse d'une vidéo YouTube (ex. https://youtu.be/…). » (`aria-describedby`, `aria-invalid`).
- [X] T066 [US2] Créer `app/components/salm/admin-edition-media.vue` (contrats/ui-routes, section `medias` ; dépend de T065) (FR-160 à FR-164) :
  - **Encadré FR-160**, textes exacts de ui-routes : `nextEditionYear`, et `previousEdition` avec son lien `?section=medias`.
  - **Vidéo récapitulative** : `<SalmAdminYoutubeField>` et image de secours `<SalmAdminImageField decorative>` (aucun texte alternatif, FR-133), enregistrées par `PATCH { recapVideoUrl, recapPosterPath }`.
  - **Vidéos du canapé** : liste miniature · titre (ou « Vidéo NN ») · invité·e · établissement ; formulaire en ligne ; avertissement « Cette vidéo figure déjà dans la liste. » si `warnings` contient `DUPLICATE_VIDEO` ; ordre ; suppression `confirm()`.
  - **Photos** :
    - `<input type="file" multiple accept="image/jpeg,image/png,image/webp">` stylé « Ajouter des photos » ; 50 fichiers au plus par sélection, l'excédent étant listé comme refusé ;
    - envoi **séquentiel** (`useSalmUpload().upload`, puis `POST …/photos`) avec `<progress>` et « Envoi N / M » en `aria-live="polite"` ;
    - récapitulatif final des photos ajoutées et des fichiers refusés avec leur raison ;
    - grille avec légende et texte alternatif modifiables (`PATCH`), ordre par `SalmAdminOrderButtons`, suppression `confirm()`.
  - Émet `saved`.
- [X] T067 [US2] Brancher la section `medias` (libellé « Médias produits ») dans `app/pages/admin/salm/editions/[id]/index.vue`.

**Checkpoint** : US1 et US2 complètes : l'équipe prépare et publie une édition sans développeur.

---

## Phase 5: User Story 3 — Dupliquer une édition (Priority: P2)

**Goal** : créer l'édition N + 1 en brouillon, avec la structure de l'édition N, sans médias ni inscriptions.

**Independent Test** : quickstart, scénario 3 (dupliquer 2027 → 2028, vérifier les champs copiés et non copiés, les dates au même jour de la semaine, 0 inscription, et l'indépendance des fichiers partagés).

- [X] T068 [US3] Ajouter `duplicateEdition(sourceId)` à `server/utils/salm-lifecycle.ts` (research R5, table de correspondance) (FR-180 à FR-184) :
  - lecture de la source avec jours, créneaux, temps forts et stands ;
  - `409 YEAR_TAKEN` (avec `data.year`) si `year + 1` existe ;
  - une seule écriture imbriquée `prisma.salmEdition.create`, dont les données sont :
    - `year + 1`, `status: 'draft'` ;
    - `salonName`, `organizerName`, `city`, `tagline`, `whyTitle`, `whyText`, `audiences`, `contacts` ;
    - `days: { create: [{ date: +364 jours en UTC, label, opensAt, closesAt, sortOrder, slots: { create: [...] } }] }` ;
    - `highlights: { create }` (même `imagePath`) ;
    - `standTypes: { create }` (nom, description, tarif, visibilité, ordre).
  - Ne **jamais** copier `venue`, `posterPath`, `posterAlt`, `programPdfPath`, `recapVideoUrl`, `recapPosterPath`, les vidéos, les photos ni les inscriptions. Laisser les valeurs par défaut pour les interrupteurs, `lastBadgeSeq`, `personalDataPurgedAt` et `purgedStats`.
  - `P2002` sur `year` → `409 YEAR_TAKEN`.
  - Renvoie `{ id, year, copied: { days, slots, highlights, standTypes, contacts } }`.
- [X] T069 [US3] Créer `server/api/admin/salm/editions/[editionId]/duplicate.post.ts` : `duplicateEdition` → **201** (contrat § 8 ; dépend de T068). (FR-180)
- [X] T070 [US3] Ajouter l'action « Dupliquer vers <A+1> » dans `app/pages/admin/salm/editions/index.vue` (FR-180) :
  - désactivée avec « Une édition <A+1> existe déjà. » si l'année est prise ;
  - `confirm('Créer le SALM <A+1> à partir du SALM <A> ? Les textes, contacts, temps forts, chronogramme et types de stands seront recopiés, sans médias ni inscriptions.')` ;
  - puis `navigateTo('/admin/salm/editions/<id>?duplique=<A>')`.
- [X] T071 [US3] Dans `app/pages/admin/salm/editions/[id]/index.vue`, afficher le message persistant « Édition <année> créée à partir de <A>. Vérifiez les dates, le lieu et l'affiche. » lorsque `?duplique=<A>` est présent (FR-182), fermable, et ajouter l'action « Dupliquer vers <année+1> » dans l'en-tête avec les mêmes règles que T070. (FR-182)

**Checkpoint** : la préparation d'une nouvelle édition prend quelques minutes (SC-002).

---

## Phase 6: User Story 4 — Statistiques SALM (Priority: P3)

**Goal** : suivre les inscriptions d'une édition, les comparer à l'édition précédente, et voir un résumé sur le tableau de bord.

**Independent Test** : quickstart, scénario 4.

- [X] T072 [P] [US4] Dans `server/utils/salm-purge.ts`, `computePurgedStats` : `schools.exhibitors` ne compte plus que les exposants des inscriptions dont `status !== 'annulee'` (ajouter `status` au `select` du `findMany` des établissements). Typer le premier paramètre pour accepter `prisma` comme `tx` (`Tx | typeof prisma`). Forme `SalmPurgedStats` inchangée (research R11). (FR-192)
- [X] T073 [US4] Créer `server/utils/salm-stats.ts` (dépend de T072) (FR-190, FR-193, FR-195, FR-196) :
  - `findComparisonEdition(year)` : `year < N`, tri décroissant ; première édition avec `_count.studentRegistrations + _count.schoolRegistrations > 0`, ou `purgedStats ≠ null` ; sinon `null`.
  - `editionStatsBlock(edition)` → `{ source, purgedAt, stats, opensAtIso }` :
    - `purgedStats` si `personalDataPurgedAt`, sinon `computePurgedStats(prisma, id)` ;
    - `opensAtIso` via `getEditionTimeline(days).opensAt`.
  - `getEditionStats(editionId)` → `SalmAdminStats` : `standTypes` de l'édition (`name`, `isVisible`, triés) et `comparison`.
  - `getDashboardSummary()` → `SalmAdminSummary` : `null` sans édition publiée ; sinon deux `count` (ou `purgedStats`) et le même bloc pour l'édition de comparaison.
  
  Aucune donnée personnelle dans les sorties (FR-196).
- [X] T074 [P] [US4] Créer `server/api/admin/salm/editions/[editionId]/stats.get.ts` : `getEditionStats` → **200**, `Cache-Control: private, no-store` (contrat § 10). (FR-190 à FR-196)
- [X] T075 [P] [US4] Créer `server/api/admin/salm/summary.get.ts` : `getDashboardSummary` → **200** (`null` possible, contrat § 11). (FR-197a)
- [X] T076 [US4] Créer `app/pages/admin/salm/statistiques.vue` (contrats/ui-routes « Statistiques »), `layout: 'admin'` (FR-190 à FR-197) :
  - **Sélection** : `<select>` d'édition synchronisé avec `?edition=<année>` (défaut `defaultEditionId`), `useFetch` des stats.
  - **Mentions** : « Chiffres conservés après suppression des données personnelles le JJ/MM/AAAA » pour une source `purged`, pour l'édition choisie comme pour l'édition de comparaison.
  - **Cartes de totaux** (étudiant·e·s, établissements, exposants hors annulations) avec « <valeur> · ±N % par rapport à <année> » et l'écart en nombre ; « — » si la référence vaut 0.
  - **Graphiques** `vue-chartjs`, éléments déjà enregistrés par `app/plugins/chartjs.client.ts`, dans `<ClientOnly>` :
    - `Line` des inscriptions par jour d'inscription et de leur cumul (2 axes) ;
    - `Line` des cumuls alignés sur « J-n avant l'ouverture » (n = jours entre la date d'inscription et `opensAtIso`, en UTC), seulement si les deux `opensAtIso` existent ;
    - `Bar` horizontal par niveau avec les 6 `STUDY_LEVELS` (0 compris), deux séries en cas de comparaison.
    
    Chaque graphique est suivi de `<details><summary>Voir les données</summary><table>` (FR-197).
  - **Tableaux** par type de stand (« (masqué) » si `isVisible` est faux) et par statut (`SCHOOL_STATUS_LABELS`), avec colonnes année, année de comparaison et écart.
  - **États vides** : « Aucune inscription pour le SALM <année>. » ; aucune comparaison si `comparison` est `null`.
- [X] T077 [P] [US4] Modifier `app/pages/admin/index.vue` (FR-197a) : `useFetch('/api/admin/salm/summary')` et, sous la grille des cartes de résumé, une carte « SALM <année> » **seulement si le résumé n'est pas `null`**. Elle contient (FR-197a) :
  - les totaux étudiant·e·s et établissements (`toLocaleString('fr-FR')`) ;
  - l'écart avec l'édition de comparaison, si elle existe ;
  - le lien « Voir les statistiques SALM → » vers `/admin/salm/statistiques`.
  
  Aucun autre changement sur la page.

**Checkpoint** : les quatre stories sont fonctionnelles.

---

## Phase 7: Polish & documentation

- [X] T078 [P] Mettre à jour `CLAUDE.md` :
  - commande de seed : « crée les éditions absentes ; n'écrase jamais une édition existante » (ligne `pnpm prisma db seed` et ligne `./deploy.sh seed`) ;
  - section Module SALM : écrans « SALM › Éditions » et « Statistiques », page d'aperçu `/admin/salm/editions/:id/apercu`, catégorie d'upload `salm` (JPEG, PNG, WebP de 5 Mo au plus ; PDF de 10 Mo au plus ; fichiers dans `public/uploads/salm/`, libérés quand plus rien ne les référence) ;
  - ligne « Recent Changes » pour `007-salm-admin-contenus`.
- [X] T079 [P] Mettre à jour le texte d'aide de la commande `seed` dans `deploy.sh` : « Initialiser les éditions SALM absentes (n'écrase jamais le contenu géré dans le back-office) ».
- [X] T080 Lancer `pnpm build` et corriger toute erreur de compilation ou de type dans les fichiers de cette feature (`server/api/admin/salm/**`, `server/utils/salm-*.ts`, `app/components/salm/admin-*.vue`, `app/pages/admin/salm/**`).

---

## Phase 8: Vérification (quickstart.md)

**Purpose** : valider la feature de bout en bout, selon [quickstart.md](./quickstart.md). Chaque tâche consigne les écarts constatés et les corrige dans le fichier fautif avant d'être cochée.

- [X] T081 Exécuter le scénario 0 de `specs/007-salm-admin-contenus/quickstart.md` (seed en création seule : sortie « déjà présent : ignoré », saisies et identifiants conservés).
- [X] T082 Exécuter le scénario 1 (éditions) de `specs/007-salm-admin-contenus/quickstart.md`, y compris :
  - `select count(*) from SalmEdition where status='published'` = 1 après chaque publication, **y compris après deux publications simultanées** (SC-004) ;
  - le 401 de l'aperçu hors session ;
  - le 409 `EDITION_ENDED`.
- [X] T083 Exécuter le scénario 2 (contenus) de `specs/007-salm-admin-contenus/quickstart.md`, y compris :
  - les refus d'upload (plus de 5 Mo, `.heic`, `faux.jpg`) sans fichier résiduel dans `public/uploads/salm/` ;
  - les URL YouTube refusées ;
  - les chevauchements strict et contigu ;
  - le stand utilisé non supprimable ;
  - l'envoi des 20 photos en moins de 2 minutes (SC-006) ;
  - le parcours clavier de l'ordre (SC-011).
- [X] T084 Exécuter le scénario 3 (duplication) de `specs/007-salm-admin-contenus/quickstart.md`, y compris :
  - le vendredi 12 mars 2027 → vendredi 10 mars 2028 ;
  - 0 inscription ;
  - l'indépendance des photos partagées après remplacement (FR-136).
- [X] T085 Exécuter le scénario 4 (statistiques) de `specs/007-salm-admin-contenus/quickstart.md`, y compris :
  - les exposants hors annulations ;
  - la comparaison avec une édition purgée ;
  - l'encart du tableau de bord ;
  - le temps d'affichage inférieur à 3 s avec 5 000 inscriptions (SC-010).
- [X] T086 Exécuter le scénario 5 (accès et non-régression) de `specs/007-salm-admin-contenus/quickstart.md` :
  - 401 sans session sur `PATCH /api/admin/salm/editions/:id` et `POST /api/upload` ;
  - liste blanche (`status` et `lastBadgeSeq` ignorés) ;
  - chemins d'image arbitraires refusés ;
  - **HTML de `/salm` identique** avant et après le refactor (`diff`) ;
  - back-office des inscriptions intact ;
  - aperçu accessible en mode maintenance ;
  - upload `magazines` inchangé (image OG générée).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** : aucune dépendance. **À faire en premier** : le seed en création seule protège les saisies de test.
- **Phase 2 (Foundational)** : dépend de la phase 1 et bloque toutes les stories. Ordre interne :
  - T003 → T005 et T008 ;
  - T006 → T008 ;
  - T008 → T009 → T010 (même fichier) ;
  - T012 → T014.
- **Phase 3 (US1)** : dépend de la phase 2.
- **Phase 4 (US2)** : dépend de T020, T021 et T030 (fiche, `PATCH` et page de la phase 3). Les sous-ensembles 4.1 à 4.6 sont indépendants entre eux, sauf les tâches « Brancher » (même fichier, à sérialiser).
- **Phase 5 (US3)** : dépend de T016 (fichier `salm-lifecycle.ts`), T028 et T030 (pages modifiées). Indépendante de la phase 4 sur le plan fonctionnel, mais la vérification de la copie est plus parlante une fois les contenus éditables.
- **Phase 6 (US4)** : dépend seulement de la phase 2 (T004 pour les types) et de T015 (menu). Elle peut être menée en parallèle des phases 3 à 5.
- **Phase 7** : après les stories retenues.
- **Phase 8** : en dernier.

### Dépendances internes notables

- T017 → T025 (aperçu) ; T026 → T027 et T031.
- T016 → T022, T023, T024 ; T016 → T068 (même fichier).
- T010 (`applyOrder`, `nextSortOrder`, `resortDays`, `getEditionDetail`) → toutes les routes de la phase 4.
- T065 → T066.
- T072 → T073 → T074, T075 → T076, T077.

### Parallel Opportunities

- **Phase 2** : T003, T004, T006, T007, T011, T012, T013 et T015 en parallèle (fichiers distincts).
- **Phase 3** : T016, T017, T019 à T024 et T026 en parallèle ; puis T025, T027, T029 et T031 ; T028 et T030 ensuite.
- **Phase 4** : les 6 sous-ensembles en parallèle. Dans chacun, toutes les routes `[P]` et le composant de section en parallèle, puis la tâche « Brancher ».
- **Phase 6** : T074, T075 et T077 en parallèle après T073.

---

## Parallel Example: User Story 2 (sous-ensemble Temps forts, en parallèle du Chronogramme)

```text
# Routes et composant « Temps forts » :
T036 server/api/admin/salm/editions/[editionId]/highlights/index.post.ts
T037 server/api/admin/salm/editions/[editionId]/highlights/order.put.ts
T038 server/api/admin/salm/highlights/[id].patch.ts
T039 server/api/admin/salm/highlights/[id].delete.ts
T040 app/components/salm/admin-edition-highlights.vue

# En même temps, routes et composant « Chronogramme » :
T042 … T048 server/api/admin/salm/{editions/[editionId]/days, days, days/[id]/slots, slots}/…
T049 app/components/salm/admin-edition-chronogram.vue

# Puis, l'un après l'autre (même fichier) :
T041, puis T050 : branchement dans app/pages/admin/salm/editions/[id]/index.vue
```

---

## Implementation Strategy

### MVP (US1 seule)

1. Phases 1 et 2.
2. Phase 3 (US1) : publication unique, archivage, republication et aperçu sur les éditions existantes.
3. **Stop et vérification** : quickstart, scénario 1 (sauf la publication d'un nouveau brouillon, qui attend le chronogramme).

### Livraison incrémentale

1. MVP (US1).
2. US2, sous-ensemble par sous-ensemble, dans l'ordre d'utilité pour l'équipe : **Chronogramme** (débloque la publication d'un nouveau brouillon) → Textes et affiche → Contacts → Stands → Temps forts → Médias.
3. US3 (duplication) avant la préparation de l'édition 2028.
4. US4 (statistiques), à tout moment après la phase 2.
5. Phases 7 et 8.

### Répartition possible entre plusieurs développeurs

Après les phases 1 à 3 :
- **A** : chronogramme et stands ;
- **B** : textes, contacts et temps forts ;
- **C** : médias ;
- **D** : statistiques (phase 6), puis duplication.

Les tâches « Brancher » sont sérialisées sur la fiche d'édition.

---

## Notes

- [P] = fichiers distincts, sans dépendance envers une tâche non terminée.
- Une tâche = un fichier (ou une partie nommée d'un fichier partagé, comme T008 à T010).
- Aucune migration Prisma dans cette feature (research R16) : `pnpm prisma migrate dev` doit rester « Already in sync ».
- Commits conventionnels (`feat(salm): …`), un commit par tâche ou par sous-ensemble cohérent.
