# Implementation Plan: Module SALM (1/3) — page publique, inscriptions et back-office des inscriptions

**Branch**: `006-salm-inscriptions` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-salm-inscriptions/spec.md`

## Summary

Le module comprend :
- une page `/salm` pilotée par la base de données, fidèle à la maquette ;
- l'inscription étudiante, avec un badge PDF de 10 × 15 cm (QR code de vérification) téléchargeable aussitôt et récupérable avec le téléphone et le nom ;
- l'inscription des établissements exposants en 3 étapes, sans badge ;
- un back-office de suivi : listes, recherche, exports CSV (dont la liste des exposants pour le pointage), statuts, suppression d'inscriptions, ouverture et fermeture des inscriptions, suppression des données personnelles d'une édition archivée (12 mois au plus).

Ce plan intègre les **décisions de revue D1 à D13** (spec, section Clarifications). D5 (conservation) et D13 (exposants le jour J) restent **à valider par l'organisateur**.

**Approche technique** :
- 9 modèles Prisma couvrant tout le futur périmètre de la feature B, avec quelques colonnes JSON là où une table serait superflue (YAGNI) ;
- un seed Prisma idempotent (éditions 2026 archivée et 2027 publiée) ;
- des routes Nitro publiques `/api/salm/*` et d'administration `/api/admin/salm/*`, ces dernières protégées toutes méthodes par le middleware existant ;
- un PDF généré à la volée avec `pdf-lib`, `fontkit` et `qrcode`, avec des polices embarquées ;
- une numérotation atomique par compteur d'édition dans une transaction ;
- deux jetons distincts (QR code et téléchargement) ;
- un anti-spam en trois couches : User-Agent, champ piège et limitation de débit en mémoire ;
- des polices web auto-hébergées, limitées au module ;
- une vidéo YouTube de fond conditionnelle, et une fenêtre `<dialog>` native accessible.

## Technical Context

**Language/Version**: TypeScript (ESM), Node 22 (image `node:22-slim`)

**Primary Dependencies**:
- Existantes : Nuxt 4.3.1, Vue 3.5, Tailwind CSS 4.2 (`@tailwindcss/vite`), Prisma 7.4 (`prisma-client` + `@prisma/adapter-better-sqlite3`), h3 (sessions).
- **Nouvelles** : `pdf-lib` ^1.17.1, `@pdf-lib/fontkit` ^1.1.1, `qrcode` ^1.5 (+ `@types/qrcode` en dev), `tsx` (dev, pour le seed).
- Aucun module Nuxt ajouté.

**Storage**: SQLite via Prisma 7 (`dev.db`, `/app/data/production.db` en production). Images du seed statiques dans `public/salm/`. Polices du PDF dans `server/assets/fonts/salm/`. Aucun fichier d'upload dans cette feature.

**Testing**: aucun test runner (constitution). Vérification par les scénarios de [quickstart.md](./quickstart.md).

**Target Platform**: serveur Nitro (Node) dans Docker derrière nginx. Navigateurs mobiles et de bureau récents : `<dialog>` et CSS `:has()` sont pris en charge par Chrome, Edge, Firefox et Safari ≥ 15.4.

**Project Type**: application web full-stack Nuxt (dossiers `app/`, `server/` et `shared/`).

**Performance Goals**:
- `/salm` : LCP inférieur à 3 s en 4G mobile (SC-006) ; le hero est rendu en SSR avec une image prioritaire, les iframes chargées à la demande.
- PDF : moins de 3 s (SC-002), environ 100 ms attendues.
- Inscription complète : moins de 60 s (SC-001).

**Constraints**:
- Image Docker légère : pas de navigateur headless ni de dépendance native nouvelle.
- Conteneur unique mono-processus, ce qui permet la limitation de débit en mémoire.
- Aucune donnée personnelle dans les réponses publiques, hors porteur du jeton de téléchargement.
- Accessibilité AA (FR-082).
- Français avec accents ; noms de fichiers en `[a-z0-9_-]`.

**Scale/Scope**:
- Quelques milliers d'inscriptions étudiantes et environ 100 établissements par édition. Le numéro de badge sur 6 chiffres va jusqu'à 999 999.
- Côté code : 4 pages publiques, 3 pages admin, 8 routes publiques et 13 routes admin.

Aucune inconnue ne reste : toutes les décisions sont dans [research.md](./research.md).

## Constitution Check

*GATE : passé avant la phase 0, puis revérifié après la conception (phase 1).*

| Principe | Vérification | Statut |
|---|---|---|
| **I. Nuxt Conventions First** | Routage par fichiers (`app/pages/salm/**`, `app/pages/admin/salm/**`). Routes Nitro dans `server/api/**`, utilitaires dans `server/utils/`, assets serveur Nitro (`server/assets`). Dossier `shared/` de Nuxt 4 pour le code commun app et serveur. Composable `useSalmStatus` fondé sur `useFetch`. Aucune abstraction qui contourne Nuxt. | ✅ |
| **II. Simplicity & YAGNI** | Chaque table est justifiée par un usage de la feature A ([research R7](./research.md#r7-modélisation-prisma-complète--justification-yagni)). Contacts, publics, programmes et exposants sont en JSON plutôt qu'en tables. Chaque nouvel utilitaire a au moins 2 usages réels : `rate-limit` (3 routes), `csv` (2 exports), `salm-badge-pdf` (public + admin), `modal-dialog` (vidéo + galerie), `admin-header` (3 pages admin), `shared/utils/*` (client + serveur). Pas de table de présences (feature C), pas d'upload (feature B). | ✅ |
| **III. Data Integrity via Prisma** | Tous les accès passent par `server/utils/prisma.ts`, y compris le seed, qui importe le singleton. Numérotation par transaction interactive Prisma, sans SQL brut. Une migration `add_salm_module` créée par `migrate dev` et appliquée par `migrate deploy`, déjà dans le `CMD` Docker. | ✅ |
| **IV. Consistent Toolchain** | `pnpm add` pour 3 dépendances et `pnpm add -D` pour 2, toutes justifiées (research R1, R8). Aucun module Nuxt, donc aucun `nuxi module add`. Tailwind reste un plugin Vite, avec les jetons `@theme` dans `main.css`. | ✅ |
| **V. Content-Centric UX** | SSR de `/salm` et des formulaires. Polices auto-hébergées, chargées seulement sur les pages SALM. Iframes YouTube différées ; vidéo de fond réservée aux écrans ≥ 768 px, sans `saveData` ni réduction des animations, et mise en pause possible. HTML sémantique (`section`, hiérarchie `h1`/`h2`/`h3`, `fieldset`/`legend`, `dialog`). | ✅ (la vidéo de fond automatique, demandée, est encadrée par ces conditions) |
| **Workflow** | Branche dédiée `006-salm-inscriptions`, commits conventionnels. `CLAUDE.md` mis à jour (commande de seed, dossier `shared/`, `./deploy.sh seed`). Séparation `app/`, `server/` et `shared/`. | ✅ |

**Conventions du dépôt (CLAUDE.md)** :
- Nouveaux fichiers en **kebab-case** `[a-z0-9-]`. Nuxt résout `components/salm/modal-dialog.vue` en `<SalmModalDialog>`. Les fichiers PascalCase existants ne sont pas renommés.
- Textes de l'interface avec accents ; interface étudiante au tutoiement, établissements au vouvoiement.
- **Avant de créer un composant**, un sous-agent a vérifié l'existant (inventaire dans [research R15](./research.md#r15-inventaire-de-lexistant-sous-agents-de-recherche)). Aucun composant réutilisable n'existe pour le dialogue accessible, le compte à rebours à jours ou l'aperçu de badge. `DownloadModal` et `RubriqueLightbox` ne sont pas accessibles et ne sont pas génériques.

**Réévaluation après la phase 1** : le modèle de données, les contrats et le quickstart ne créent aucune violation. **Aucune entrée dans Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/006-salm-inscriptions/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 : décisions R1 à R15
├── data-model.md        # Phase 1 : 9 modèles, invariants, esquisse Prisma, contenu du seed
├── quickstart.md        # Phase 1 : scénarios de vérification manuelle
├── contracts/
│   ├── public-api.md    # /api/salm/*
│   ├── admin-api.md     # /api/admin/salm/*
│   └── ui-routes.md     # pages publiques et admin, navigation, SEO, accessibilité
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks), pas encore créé
```

### Source Code (repository root)

```text
shared/                                   # NOUVEAU (Nuxt 4 : auto-import app + serveur, alias #shared)
├── utils/
│   ├── study-levels.ts                   # STUDY_LEVELS (extrait de DownloadModal + downloads/index.post.ts)
│   ├── phone.ts                          # IVORIAN_PHONE_REGEX (extrait), normalizeIvorianPhone, formatIvorianPhone
│   └── salm.ts                           # formatBadgeNumber, validateStudentName, nameMatchKey, nameSearchKey, parseYoutubeId, formatHour,
│                                         # SCHOOL_PROGRAMMES, SCHOOL_STATUSES (+ libellés), SLOT_KINDS, validateurs de champs
└── types/
    └── salm.ts                           # types des payloads publics/admin, SalmContact, SalmAudience, SalmExhibitor

prisma/
├── schema.prisma                         # + 9 modèles Salm*
├── migrations/<ts>_add_salm_module/      # généré par prisma migrate dev
├── seed.ts                               # NOUVEAU : point d'entrée `prisma db seed`
└── seed/
    ├── salm-data.ts                      # contenus 2026 et 2027 (brouillons + maquette), URL YouTube à compléter
    └── salm.ts                           # upserts idempotents (research R8)
prisma.config.ts                          # + migrations.seed = 'tsx prisma/seed.ts'

server/
├── middleware/admin.ts                   # + ADMIN_ALL_METHODS_PREFIXES = ['/api/admin/']
├── assets/fonts/salm/                    # NOUVEAU : TTF Montserrat, DM Sans, Yellowtail + OFL.txt
├── utils/
│   ├── rate-limit.ts                     # NOUVEAU : assertRateLimit(event|key, { max, windowMs }), IP via x-real-ip
│   ├── csv.ts                            # NOUVEAU : toCsv (BOM, « ; », anti-formule)
│   ├── salm-edition.ts                   # NOUVEAU : getPublishedEdition, getPreviousEdition, getEditionTimeline,
│   │                                     #           isRegistrationOpen (FR-053), serializers publics
│   ├── salm-registration.ts              # NOUVEAU : findOrCreateStudent (transaction R4, P2002), matchStudent,
│   │                                     #           assertHuman (honeypot, startedAt, isBot)
│   ├── salm-badge-pdf.ts                 # NOUVEAU : renderBadgePdf(registration, edition) → Uint8Array ; badgeQrSvg(url)
│   │                                     #           (100 × 150 mm, QR ≥ 25 mm, nom 25→14 pt / 2-3 lignes, repli des glyphes)
│   └── salm-purge.ts                     # NOUVEAU : computePurgedStats + purgeEditionPersonalData (transaction, R16)
├── api/salm/
│   ├── status.get.ts
│   ├── edition.get.ts
│   ├── students/index.post.ts
│   ├── students/recover.post.ts
│   ├── badges/[token].get.ts
│   ├── verify/[token].get.ts
│   ├── schools/index.post.ts
│   └── agenda.ics.get.ts
├── api/admin/salm/
│   ├── editions/index.get.ts
│   ├── editions/[editionId]/registrations.patch.ts
│   ├── editions/[editionId]/students/index.get.ts
│   ├── editions/[editionId]/students/export.get.ts
│   ├── editions/[editionId]/schools/index.get.ts
│   ├── editions/[editionId]/schools/export.get.ts
│   ├── students/[id]/badge.get.ts
│   ├── students/[id].delete.ts
│   ├── editions/[editionId]/exhibitors/export.get.ts   # liste des exposants (FR-068a)
│   ├── editions/[editionId]/purge.post.ts              # suppression des données personnelles (FR-065b)
│   ├── schools/[id].get.ts
│   ├── schools/[id].patch.ts
│   └── schools/[id].delete.ts                          # FR-067a
└── api/downloads/index.post.ts           # MODIFIÉ : importe STUDY_LEVELS / IVORIAN_PHONE_REGEX depuis #shared

app/
├── assets/css/
│   ├── main.css                          # + @theme jetons SALM (couleurs, familles de polices)
│   └── salm.css                          # NOUVEAU : @font-face (importé par les composants SALM uniquement)
├── composables/use-salm-status.ts        # NOUVEAU : useSalmStatus() (navbar + footer)
├── components/
│   ├── AppNavbar.vue                     # MODIFIÉ : navLinks computed + lien SALM conditionnel
│   ├── AppFooter.vue                     # MODIFIÉ : lien SALM conditionnel
│   ├── DownloadModal.vue                 # MODIFIÉ : constantes importées de shared/
│   └── salm/                             # NOUVEAU (kebab-case → <Salm…>)
│       ├── hero.vue                      # image SSR, vidéo de fond conditionnelle, pause, CTA, ancres
│       ├── countdown.vue                 # rendu client (R10)
│       ├── participate.vue               # « Deux façons de participer »
│       ├── why.vue                       # « Pourquoi le SALM ? » + affiche
│       ├── highlights.vue                # programme d'activité
│       ├── chronogram.vue                # 2 colonnes en desktop, onglets ARIA en mobile
│       ├── videos.vue                    # canapé : miniatures, puis fenêtre
│       ├── photos.vue                    # aperçu + galerie
│       ├── final-cta.vue                 # appel final + contacts
│       ├── modal-dialog.vue              # <dialog> natif accessible (vidéo + galerie)
│       ├── badge-card.vue                # visuel du badge (aperçu formulaire, carte « Deux façons », Félicitations)
│       ├── student-form.vue              # 3 champs + récupération (mode fermé), textes d'erreur au tutoiement
│       ├── school-form.vue               # 3 étapes, textes d'erreur au vouvoiement
│       └── admin-header.vue              # sélecteur d'édition, interrupteurs, onglets
├── layouts/admin.vue                     # MODIFIÉ : entrée « SALM » → /admin/salm
└── pages/
    ├── salm/
    │   ├── index.vue
    │   ├── inscription-etudiant.vue
    │   ├── inscription-ecole.vue
    │   └── v/[token].vue
    └── admin/salm/
        ├── index.vue                     # étudiant·e·s
        └── etablissements/
            ├── index.vue
            └── [id].vue

public/
├── fonts/salm/                           # NOUVEAU : woff2 Montserrat (variable), DM Sans (variable), Yellowtail
└── salm/
    ├── 2026/                             # photos du catalogue et image de secours de la vidéo récapitulative (seed)
    └── 2027/                             # affiche, temps forts (seed)

nuxt.config.ts                            # + runtimeConfig.public.siteUrl (NUXT_PUBLIC_SITE_URL)
Dockerfile                                # + COPY app/generated et server/utils/prisma.ts vers l'étape production (seed)
deploy.sh                                 # + commande `seed`
CLAUDE.md                                 # + commandes seed, dossier shared/, ./deploy.sh seed
```

**Structure Decision** : application Nuxt 4 unique, selon les conventions existantes du dépôt (`app/`, `server/` et `prisma/`), avec en plus le dossier `shared/` de Nuxt 4 pour le code commun au client et au serveur (constantes, normalisations, validateurs). Tous les nouveaux fichiers sont en kebab-case.

## Implementation Notes (ordre recommandé pour `/speckit-tasks`)

1. **Fondations** (bloquant) :
   - `shared/` (et refactor de `DownloadModal` et `downloads/index.post.ts`, sans changement de comportement) ;
   - modèles Prisma et migration ;
   - middleware admin ;
   - `runtimeConfig.public.siteUrl` ;
   - jetons `@theme` et `salm.css` ;
   - polices (web et PDF) ;
   - seed et images du seed.
2. **US2 — page `/salm`** : `GET /api/salm/status` et `/edition`, `useSalmStatus`, liens de la navbar et du pied de page, sections, `modal-dialog`, compte à rebours, vidéo de fond, SEO et JSON-LD. Livrable seul, avec les inscriptions fermées.
3. **US1 — étudiant·e** :
   - utilitaires `rate-limit`, `salm-registration` et `salm-badge-pdf` ;
   - routes `students`, `recover`, `badges` et `verify` ;
   - page d'inscription, écran Félicitations et page `/salm/v/[token]`.
4. **US3 — établissement** : route `schools`, `agenda.ics`, formulaire en 3 étapes.
5. **US4 — back-office** :
   - `csv.ts` et `salm-purge.ts` ;
   - 13 routes admin ;
   - entrée de menu, `admin-header`, 3 pages.
6. **Finitions** : `Dockerfile`, `deploy.sh seed`, `CLAUDE.md`, passage complet du quickstart (accessibilité, Lighthouse, régression magazine).

**Décisions de revue à respecter** (détail dans la spec, Clarifications) :
- D1 : visuel de la maquette pour le formulaire étudiant. Seuls les champs, les libellés, les exemples, les niveaux et le téléphone viennent de `DownloadModal`.
- D2 : navbar inchangée hormis le lien SALM, sans menu mobile.
- D3 : aucune section masquée sur mobile.
- D4 : bordures #8A847F au repos, #D5570B au focus.
- D6 : l'API renvoie des codes, et chaque formulaire a sa table de textes.
- D9 : liste blanche des champs, édition résolue côté serveur.
- D10 à D12 : règles du badge.
- D7, D8, D13 et D5 : suppression d'un établissement, mentions d'usage, liste des exposants, suppression des données.

**Points de vigilance** :
- `qrSvg` est injecté par `v-html` : il ne doit contenir que la sortie de `qrcode`, jamais de donnée saisie.
- Les routes publiques utilisent des `select` explicites, jamais d'objets Prisma complets.
- `lastBadgeSeq` n'est modifié **que** dans la transaction de création.
- Les créations d'inscriptions étudiantes passent par la file `withStudentCreationLock`, et les erreurs `P2002` sont traitées selon le champ en cause (research R4, constats F4 et F14 de l'analyse).
- Le socle mobile (une colonne, sans défilement horizontal à 360 et 390 px) fait partie du MVP ; les adaptations fidèles à la maquette mobile sont en phase 5.
- Le seed ne touche jamais au statut, aux interrupteurs, à `lastBadgeSeq` ni aux inscriptions après la création.
- Dates : toujours en UTC (Abidjan = UTC+0), avec `Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' })` pour l'affichage.

## Points signalés (hors périmètre, décision du porteur de projet)

1. **Données manquantes pour le seed** :
   - URL YouTube de la vidéo récapitulative 2026 et des 9 vidéos du canapé ;
   - titres et invités des vidéos ;
   - description et tarif des stands ;
   - affiche et logo 2027 officiels ;
   - photos HD ;
   - PDF du programme.
   
   Sans elles, les sections concernées sont masquées (FR-004).
2. **Incohérences des sources** (spec, section dédiée) : chevauchement du Jour 1, trou du Jour 2, e-mail `salm2026@`, lieu, horaires du hero, « Riviera ».
3. **Sécurité existante** (research R15) :
   - le mot de passe admin est écrit dans les logs par `login.post.ts` ;
   - `PUT /api/homepage-images/[slug]` n'est pas protégé ;
   - `NUXT_SESSION_SECRET` n'est pas défini en production.
   
   Recommandé avant l'ouverture des inscriptions, puisque le back-office donnera accès à des données personnelles.
4. **Décisions à valider par l'organisateur** : D5 (conservation de 12 mois au plus, suppression manuelle, nouvelles mentions d'usage) et D13 (pointage des exposants sur liste, sans badge ni QR code).

## Complexity Tracking

Aucune violation de la constitution : section sans objet.
