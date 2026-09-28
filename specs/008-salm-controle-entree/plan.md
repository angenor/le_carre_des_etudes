# Implementation Plan: Module SALM (3/3) — contrôle d'entrée le jour J

**Branch**: `008-salm-controle-entree` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-salm-controle-entree/spec.md`

## Summary

L'équipe contrôle l'entrée des étudiant·e·s au salon depuis ses propres téléphones :
- scan du QR code du badge, avec des résultats plein écran lisibles en extérieur ;
- saisie manuelle par numéro de badge ou par téléphone ;
- une entrée par badge et par jour de salon ;
- fonctionnement hors ligne complet ;
- accueil des non-inscrit·e·s par auto-inscription ou par inscription par l'équipe ;
- suivi des entrées par jour dans le back-office et l'export CSV.

L'URL du QR code ne révèle plus rien aux visiteurs non connectés.

Ce plan intègre les **5 clarifications du 2026-09-28** (spec, section Clarifications).

**Approche technique** :
- **Une migration** `add_salm_entries` : table `SalmEntry` avec `@@unique([registrationId, dayId])`, et colonne `SalmStudentRegistration.origin` ([data-model.md](./data-model.md)).
- **Routes Nitro sous `/api/admin/salm/control/*`**, protégées par le middleware admin existant, avec extension des routes de liste et d'export existantes ([contracts/](./contracts/)).
- **Réutilisations** :
  - le jeton `verifyToken` du QR code, tel quel ;
  - `validateStudent` / `createStudentRegistration` (avec un paramètre `origin`) ;
  - `studentWhere`, `toCsv`, `computePurgedStats`, `normalizeIvorianPhone`, `formatBadgeNumber`, `badgeQrSvg`.
- **Lecture du QR code** : `BarcodeDetector` natif, avec repli `jsqr` chargé à la demande (R1 bis). **Seule dépendance ajoutée.**
- **Double scan** : insertion optimiste ; la violation d'unicité (P2002) donne « déjà entré·e » avec l'heure existante (R4).
- **Hors ligne** (R5 à R7) :
  - précharge de la liste des badges, avec empreinte SHA-256 du jeton, nom et niveau, sans téléphone ;
  - en ligne d'abord avec un délai de 3 s, puis repli local ;
  - file dans `localStorage` et synchronisation qui garde l'heure la plus ancienne ;
  - service worker écrit à la main, limité à `/admin/salm/controle`.
- **Page `/salm/v/:token`** : rendu indépendant du jeton pour le public ; API publique de vérification supprimée ; validité réservée à l'admin (R12).

## Technical Context

**Language/Version** : TypeScript (ESM), Node 22 (image `node:22-slim`)

**Primary Dependencies** :
- **Existantes** : Nuxt 4.3.1, Vue 3.5, Tailwind CSS 4.2 (`@tailwindcss/vite`), Prisma 7.4.2 (`prisma-client` + `@prisma/adapter-better-sqlite3`), h3, `qrcode` 1.5 (serveur).
- **Ajoutée** : `jsqr` 1.4.0 (client, `import()` dynamique, repli iOS).
- **Aucun module Nuxt.**
- **API navigateur** : `getUserMedia`, `BarcodeDetector` (si présent), Web Crypto `subtle.digest`, Service Worker, Cache Storage, `localStorage`, Wake Lock, Vibration, Web Audio.

**Storage** :
- SQLite via Prisma 7 (`dev.db`, `/app/data/production.db`) : table `SalmEntry` et colonne `origin`.
- Sur les téléphones : `localStorage` (`salm-controle:v1:*`) et Cache Storage (`salm-controle-*`), effacés à la déconnexion et à la fin du salon.

**Testing** : aucun test runner (constitution). Recette par [quickstart.md](./quickstart.md), dont un parcours sur un vrai téléphone Android et un iPhone (§ 6).

**Target Platform** :
- serveur Nitro (Node) dans Docker derrière nginx, en HTTPS (Let's Encrypt, existant) ;
- page de contrôle : Chrome Android et Safari iOS à jour, écran de 390 px ;
- back-office : navigateurs de bureau.

**Project Type** : application web full-stack Nuxt (`app/`, `server/`, `shared/`).

**Performance Goals** :
- Résultat en moins d'une seconde après la lecture, en 4G (FR-211).
- Au moins 15 badges par minute par poste (SC-001).
- Compteurs à jour en moins de 30 s entre postes : rafraîchissement toutes les 15 s (FR-224).
- File hors ligne envoyée moins d'une minute après le retour du réseau (SC-005a).
- Précharge d'environ 120 Ko compressés pour 5 000 badges (R16).

**Constraints** :
- Conteneur unique mono-processus, SQLite à un seul écrivain : c'est lui qui sérialise les doubles scans (R4).
- Caméra seulement en contexte sécurisé : HTTPS de production obligatoire le jour J (R2, constat C4).
- Aucune donnée personnelle ni indication de validité accessible sans session (FR-222, FR-229).
- Aucun téléphone ni jeton en clair sur les postes (FR-230, R5).
- Nombre de postes non borné (FR-204a).
- Français avec accents ; fichiers en `[a-z0-9-]`.

**Scale/Scope** :
- De l'ordre de 5 000 inscrit·e·s par édition, 2 jours de salon, 1 à 10 postes (sans maximum).
- 1 page de contrôle et 1 affiche ; 5 composants ; 2 composables ; 1 service worker ; 8 routes nouvelles.
- 3 routes existantes modifiées et 1 route publique supprimée ; 1 page publique et 3 pages admin modifiées.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Évaluation | Statut |
|---|---|---|
| **I. Nuxt Conventions First** | Pages sous `app/pages/admin/salm/controle/`, layout nommé `app/layouts/salm-controle.vue`, composables auto-importés, routes Nitro sous `server/api/admin/salm/control/`, code commun dans `shared/utils/`, redirections par `routeRules`. Le service worker est un fichier statique de `public/`, mécanisme standard du navigateur, sans contournement de Nuxt. | ✅ |
| **II. Simplicity & YAGNI** | Une table et une colonne, seulement ce que la spec exige. Pas de journal des passages, pas d'identifiant d'appareil, pas de module PWA, pas d'IndexedDB. La logique hors ligne est la plus simple qui satisfasse la clarification Q2 (retenue par l'utilisateur) : fonction de résolution partagée serveur / client (`resolveControlResult`), utilisée par deux cas réels (en ligne et hors ligne). | ✅ |
| **III. Data Integrity via Prisma** | Tous les accès passent par `server/utils/prisma.ts` ; la migration est créée par `prisma migrate dev`. Aucune requête SQL brute : l'unicité passe par `@@unique`, les compteurs par `groupBy` et `count`. | ✅ |
| **IV. Consistent Toolchain** | `pnpm add jsqr` : besoin immédiat (iPhone sans `BarcodeDetector`), comparaison documentée (R1 bis). Aucun module Nuxt. Tailwind inchangé. | ✅ (dépendance justifiée) |
| **V. Content-Centric UX** | Pages publiques inchangées hors `/salm/v/:token` (rendue côté serveur, plus légère qu'avant). La page de contrôle est un outil interne, client-first par nature (caméra) : `jsqr` n'est chargé que sur ce poste et seulement en repli. HTML sémantique, `role="status"`, contrastes AAA. | ✅ |
| **Workflow** | Branche dédiée `008-salm-controle-entree` à créer avant l'implémentation (le dépôt est sur `main`). `CLAUDE.md` est mis à jour (dépendance, module, commandes de test sur téléphone). Commits conventionnels. | ✅ |

**Re-check après Phase 1** : aucun écart introduit par les contrats ou le modèle ; aucune ligne dans *Complexity Tracking*.

## Project Structure

### Documentation (this feature)

```text
specs/008-salm-controle-entree/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 (R1 à R17)
├── data-model.md        # Phase 1 : écarts (SalmEntry, origin, purgedStats, données locales)
├── quickstart.md        # Phase 1 : recette, dont le test sur un vrai téléphone
├── contracts/
│   ├── control-api.md   # Routes nouvelles /api/admin/salm/control/*
│   ├── admin-api.md     # Routes existantes modifiées ou supprimées
│   └── ui-routes.md     # Pages, layout, composants, textes, adresses courtes
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                                   # MODIFIÉ : SalmEntry, origin, relations
└── migrations/<horodatage>_add_salm_entries/       # NOUVEAU

shared/
├── utils/salm-control.ts                           # NOUVEAU : extractVerifyToken, parseControlQuery,
│                                                   #   badgeTokenHash, controlDayFor, resolveControlResult
└── types/salm.ts                                   # MODIFIÉ : types Control*, entriesByDay ;
                                                    #   SalmVerifyResponse supprimé

server/
├── api/admin/salm/control/
│   ├── snapshot.get.ts                             # NOUVEAU
│   ├── state.get.ts                                # NOUVEAU
│   ├── entries/index.post.ts                       # NOUVEAU
│   ├── entries/[id].delete.ts                      # NOUVEAU
│   ├── lookup.get.ts                               # NOUVEAU
│   ├── sync.post.ts                                # NOUVEAU
│   ├── registrations.post.ts                       # NOUVEAU
│   └── poster.get.ts                               # NOUVEAU
├── api/admin/salm/editions/[editionId]/students/
│   ├── index.get.ts                                # MODIFIÉ : days, entries, origin, filtre presence
│   └── export.get.ts                               # MODIFIÉ : colonnes Origine et Présent <jour>
├── api/salm/verify/[token].get.ts                  # SUPPRIMÉ (R12)
└── utils/
    ├── salm-control.ts                             # NOUVEAU : recordEntry (R4), mergeOfflineEntry (R5),
    │                                               #   controlContext (édition publiée + jour), snapshot
    ├── salm-registration.ts                        # MODIFIÉ : createStudentRegistration(…, { origin }),
    │                                               #   isUniqueViolation extrait pour recordEntry
    ├── salm-admin.ts                               # MODIFIÉ : studentWhere gère presence
    └── salm-purge.ts                               # MODIFIÉ : entriesByDay

app/
├── layouts/
│   ├── salm-controle.vue                           # NOUVEAU : plein écran, session tolérante, service worker
│   └── admin.vue                                   # MODIFIÉ : entrée « Contrôle d'entrée », ?redirect=
├── pages/
│   ├── admin/salm/controle/index.vue               # NOUVEAU
│   ├── admin/salm/controle/affiche.vue             # NOUVEAU
│   ├── admin/salm/index.vue                        # MODIFIÉ : compteurs, présence, filtre, « Sur place »
│   ├── admin/login.vue                             # MODIFIÉ : ?redirect=
│   └── salm/v/[token].vue                          # MODIFIÉ : page indépendante du jeton + encart admin
├── components/salm/
│   ├── control-scanner.vue                         # NOUVEAU
│   ├── control-result.vue                          # NOUVEAU
│   ├── control-counters.vue                        # NOUVEAU
│   ├── control-manual.vue                          # NOUVEAU
│   └── control-onsite.vue                          # NOUVEAU
├── composables/
│   ├── use-qr-reader.ts                            # NOUVEAU
│   ├── use-salm-control.ts                         # NOUVEAU
│   └── useAdmin.ts                                 # MODIFIÉ : logout efface les données du poste
└── utils/salm-control-storage.ts                   # NOUVEAU

public/salm-controle-sw.js                          # NOUVEAU (R6)
nuxt.config.ts                                      # MODIFIÉ : routeRules /controle, /inscription
package.json                                        # MODIFIÉ : jsqr
deploy.sh                                           # À VÉRIFIER : renouvellement du certificat (R2, C4)
CLAUDE.md                                           # MODIFIÉ : module de contrôle, test sur téléphone
```

**Structure Decision** : application Nuxt unique, comme les features A et B. Le contrôle d'entrée suit les conventions du module SALM :
- routes sous `/api/admin/salm/` (protection existante) ;
- composants kebab-case préfixés `Salm…` dans `app/components/salm/` ;
- logique serveur dans `server/utils/salm-*.ts` ;
- règles communes client / serveur dans `shared/`.

Les composants de contrôle n'importent **pas** `salm.css` (polices de la maquette publique) : ils utilisent les polices système de l'admin, plus lisibles à grande taille. Seule la page publique `/salm/v/:token` garde `salm.css`.

## Ordre de réalisation suggéré (pour `/speckit-tasks`)

1. **Fondations** :
   - migration `add_salm_entries` ;
   - `shared/utils/salm-control.ts` ;
   - `server/utils/salm-control.ts` (`recordEntry`, `controlContext`) ;
   - extraction de `isUniqueViolation`.
2. **US1 en ligne (P1)** : `entries` POST/DELETE, `snapshot`, `state`, layout `salm-controle`, page de contrôle, scanner, résultat, compteurs, `?redirect=` sur la connexion, entrée de menu, `/controle`.
3. **US2 (P1)** : `lookup`, composant de saisie manuelle, `?token=` sur la page de contrôle.
4. **FR-222 / FR-223** : page `/salm/v/:token`, suppression de l'API publique.
5. **Hors ligne (Q2)** : stockage local, empreinte, repli après 3 s, file, `sync`, service worker, « Prêt hors ligne », effacement.
6. **US3 (P2)** : liste et export étendus, filtre de présence, `entriesByDay`.
7. **US4 (P2)** : `registrations`, `poster`, composant d'inscription sur place, affiche, `/inscription`, `origin` dans la liste et l'export.
8. **Recette** [quickstart.md](./quickstart.md) § 2 à 7, dont un Android et un iPhone réels, et vérification du certificat de production.

## Risques et points d'attention

| Risque | Mesure |
|---|---|
| Certificat HTTPS expiré le jour J (renouvellement de `deploy.sh` incohérent avec `docker-compose.yml`, C4) : caméra bloquée | Contrôle de la date d'expiration à J-30 et J-3 (quickstart § 7) ; tâche de correction du renouvellement |
| jsQR insuffisant sur iPhone (reflets d'écran) | Critère mesuré en recette (quickstart 6.3) ; plan B `barcode-detector` (zxing-wasm auto-hébergé) derrière la même interface (R1 bis) |
| iOS purge la session ou le stockage | Retour après connexion (`?redirect=`), file conservée hors session ; ouverture de la page le matin même |
| Téléphone perdu avec la liste préchargée | Nom et niveau seulement, jetons hachés ; effacement à la déconnexion et à la fin du salon ; risque accepté (clarification Q2) |
| Horloge d'un téléphone décalée | Heure bornée au jour par le serveur ; avertissement au-delà de 5 min d'écart (R9) |
| Pas de vibration sur iPhone | Son activable et retour visuel suffisant seul (R11) |

## Complexity Tracking

Aucune violation de la constitution à justifier.
