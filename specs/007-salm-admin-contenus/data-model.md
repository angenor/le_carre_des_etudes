# Data Model — écarts avec la feature A

**Feature** : `007-salm-admin-contenus` · **Référence** : [006 data-model.md](../006-salm-inscriptions/data-model.md) · **Research** : [research.md](./research.md)

Ce document ne décrit **que les écarts** avec le modèle de la feature A. Tout ce qui n'y figure pas est inchangé.

## 1. Schéma : aucun changement

**Aucune modification de `prisma/schema.prisma`, aucune migration** (justification : [research R16](./research.md#r16-pas-de-migration)). Les 9 modèles `Salm*` couvrent déjà le périmètre de la feature. L'unicité de l'édition publiée reste une règle applicative, désormais appliquée par une transaction ([R4](./research.md#r4-unicité-de-lédition-publiée-et-transitions-de-statut)).

## 2. Transitions de statut (écart : elles deviennent effectives)

```text
            publier (≥ 1 jour)
  draft ──────────────────────────> published
    │                                  │  ▲
    │ archiver                archiver │  │ republier, si le salon n'est pas terminé
    ▼                                  ▼  │
  archived <────────────────────── archived
```

| Transition | Condition | Effet de bord |
|---|---|---|
| `draft → published` | au moins un jour | L'édition `published` précédente passe à `archived` (même transaction) |
| `archived → published` | au moins un jour et `now < fin du salon` | Idem |
| `draft → archived` | aucune | — |
| `published → archived` | aucune | Plus aucune édition publiée |
| `published → published` | — | Sans effet (idempotent) |
| Toute autre | — | `409 INVALID_TRANSITION` |

Les interrupteurs d'inscription, les inscriptions et `lastBadgeSeq` ne sont jamais modifiés par une transition (FR-118).

## 3. Valeurs dérivées ajoutées (non stockées)

| Valeur | Définition | Usage |
|---|---|---|
| `firstDay` / `lastDay` | `min(days.date)` / `max(days.date)` | Liste des éditions (FR-110, FR-113) |
| `everRegistered` | `_count.studentRegistrations + _count.schoolRegistrations > 0` **ou** `lastBadgeSeq > 0` **ou** `personalDataPurgedAt ≠ null` | Base des deux règles suivantes |
| `yearLocked` | `everRegistered` | Verrouillage de l'année (FR-114) |
| `canDelete` | `status = 'draft'` et non `everRegistered` | Suppression d'une édition (FR-119) |
| `canPublish` | `status ≠ 'published'`, au moins un jour, et pas (`archived` et salon terminé) | Bouton « Publier » (FR-115, FR-115a, FR-116) |
| `previousEdition` | Règle de la feature A : `year < N`, la plus récente, quel que soit le statut | Rappel « médias affichés » dans la fiche (FR-160) |
| `nextEditionYear` | `min(year) > N` si elle existe, sinon `N + 1` | Libellé « s'affichent sur la page du SALM <année> » (FR-160) |
| `comparisonEdition` | `year < N`, la plus récente ayant au moins une inscription **ou** des `purgedStats` | Statistiques (FR-193) |
| `standType.schoolCount` | `_count.schoolRegistrations` | Suppression refusée, « Choisi par N établissements » (FR-172) |
| Chevauchements | `findSlotOverlaps(slots d'un jour)` : `a.start < b.end && b.start < a.end` | Avertissements (FR-153) |

Une inscription établissement supprimée ne laisse pas de trace dans `lastBadgeSeq` : un brouillon qui n'a reçu que des inscriptions établissements, toutes supprimées ensuite, redevient supprimable. Ce cas est jugé négligeable, car un brouillon ne reçoit pas d'inscriptions publiques.

## 4. Règles de validation des écritures admin

Tous les corps de requête passent par une **liste blanche** de champs ([R15](./research.md#r15-sécurité-des-chemins-de-fichiers-et-des-champs)). Codes d'erreur de champ : `SalmFieldError` existant (`REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `INVALID_FORMAT`, `INVALID_CHOICE`, `TOO_MANY`, `DUPLICATE`), plus `FILE_NOT_FOUND`.

### SalmEdition (`PATCH`)

| Champ | Règle |
|---|---|
| `year` | Entier de 2020 à 2100, unique (`DUPLICATE`) ; refusé si `yearLocked` (`409 YEAR_LOCKED`) |
| `salonName` | Requis, 2 à 150 caractères |
| `organizerName` | Requis, 2 à 150 caractères |
| `city` | Requis, 2 à 80 caractères |
| `venue`, `tagline` | Facultatifs, 200 et 150 caractères au plus ; chaîne vide → `null` |
| `whyTitle` | Facultatif, 200 caractères au plus |
| `whyText` | Facultatif, 2 000 caractères au plus, texte brut ([R9](./research.md#r9-texte--pourquoi-le-salm---pas-déditeur-riche)) |
| `audiences` | Tableau de 0 à 6 `{ title: 1–80, text: 1–300 }` ; ordre = ordre du tableau |
| `contacts` | Tableau de 0 à 8 `{ kind, value, onBadge? }` (règles ci-dessous) ; ordre = ordre du tableau |
| `posterPath` | Chemin image SALM valide ([R15](./research.md#r15-sécurité-des-chemins-de-fichiers-et-des-champs)) ou `null` ; `posterAlt` est requis s'il est présent (prérempli « Affiche du SALM <année> ») |
| `programPdfPath` | Chemin PDF `/uploads/salm/…` ou `null` |
| `recapVideoUrl` | URL YouTube valide ([R7](./research.md#r7-extraction-et-validation-des-url-youtube)), stockée sous forme canonique, ou `null` |
| `recapPosterPath` | Chemin image SALM valide ou `null` |

**Contacts** ([R13](./research.md#r13-contacts-validateurs-partagés-et-libellés)) :

| `kind` | `value` |
|---|---|
| `phone` | `normalizeIvorianPhone(value, { landline: true })` non nul ; stocké `+225 XX XX XX XX XX` |
| `email` | `isValidEmail`, 254 caractères au plus, en minuscules |
| `address` | 2 à 200 caractères |

`onBadge` : seulement sur `kind = 'phone'` (sinon `INVALID_CHOICE`) ; au plus un contact, le dernier marqué du tableau l'emporte.

Remplacer ou retirer `posterPath`, `recapPosterPath` ou `programPdfPath` déclenche `releaseSalmFiles` sur l'ancien chemin, après écriture ([R3](./research.md#r3-nettoyage-des-fichiers-uploadés)).

### SalmDay

| Champ | Règle |
|---|---|
| `date` | `YYYY-MM-DD` valide, unique dans l'édition (`DUPLICATE`) |
| `label` | 1 à 40 caractères ; prérempli « Jour N », N étant la position par date |
| `opensAt`, `closesAt` | `HH:MM` (00:00 à 23:59), `closesAt > opensAt` |
| `sortOrder` | Recalculé par date à chaque création, modification ou suppression d'un jour de l'édition |

Suppression refusée (`409 LAST_DAY_OF_PUBLISHED`) si l'édition est publiée et qu'il s'agit de son dernier jour (FR-151).

### SalmSlot

| Champ | Règle |
|---|---|
| `startTime`, `endTime` | `HH:MM`, `endTime > startTime` ; hors des horaires du jour : accepté |
| `title` | Requis, 1 à 150 caractères |
| `kind` | ∈ `SLOT_KINDS` |
| `description` | Facultative, 1 000 caractères au plus |
| `isHighlighted` | Booléen, plusieurs autorisés |
| `sortOrder` | À la création : fin de liste ; ensuite, route d'ordre |

### SalmHighlight

`title` requis (1 à 100) ; `imagePath` requis (chemin image SALM valide) ; `imageAlt` requis, 1 à 200 caractères (prérempli par le titre).

### SalmVideo

`youtubeUrl` requis (canonique) ; `title`, `guest` et `institution` facultatifs, 150 caractères au plus. Un identifiant déjà présent dans l'édition est **accepté**, et la réponse porte `warnings: ['DUPLICATE_VIDEO']`. `thumbnailPath` n'est pas exposé par les écrans.

### SalmPhoto

`imagePath` requis (chemin image SALM valide) ; `alt` requis, 1 à 200 caractères (prérempli « Photo du SALM <année> n° <position> ») ; `caption` facultative, 200 caractères au plus. Création en fin de catalogue.

### SalmStandType

| Champ | Règle |
|---|---|
| `name` | Requis, 1 à 60 caractères ; unique dans l'édition **sans tenir compte de la casse** (contrôle applicatif, `DUPLICATE`), en plus de `@@unique([editionId, name])` |
| `description` | Facultative, 500 caractères au plus |
| `priceLabel` | Facultatif, 60 caractères au plus |
| `isVisible` | Booléen |

Suppression refusée (`409 STAND_TYPE_IN_USE`, avec `data.count`) si `schoolCount > 0`. La contrainte `onDelete: Restrict` reste le filet de sécurité.

## 5. Duplication : correspondance des champs

Voir [research R5](./research.md#r5-duplication-dune-édition) (tableau complet). En résumé :
- **copiés** : textes, contacts, publics, temps forts (fichiers partagés), types de stands, jours (dates + 364 jours) et créneaux ;
- **jamais copiés** : lieu, affiche, PDF, médias, inscriptions, compteurs, interrupteurs et purge ;
- `status = 'draft'`, `year = source + 1`.

## 6. Références de fichiers

Colonnes qui référencent un fichier et participent au comptage de [R3](./research.md#r3-nettoyage-des-fichiers-uploadés) : `SalmEdition.posterPath`, `recapPosterPath`, `programPdfPath` ; `SalmHighlight.imagePath` ; `SalmPhoto.imagePath` ; `SalmVideo.thumbnailPath`.

| Préfixe | Origine | Suppression physique |
|---|---|---|
| `/images/salm/…` | Seed, fichiers statiques versionnés | Jamais |
| `/uploads/salm/…` | Back-office (volume Docker `uploads`) | Quand plus aucune colonne ne le référence |

## 7. Écart sur `purgedStats` (forme inchangée)

`schools.exhibitors` compte désormais les exposants des inscriptions **non annulées** uniquement, dans `computePurgedStats` (utilisé pour les statistiques en direct comme pour la purge). Aucune purge n'a encore eu lieu : aucune donnée existante n'est concernée ([R11](./research.md#r11-statistiques)).

## 8. Seed

Comportement modifié ([R12](./research.md#r12-seed-après-la-feature-b--création-seule)) : une édition du jeu initial n'est créée que si son année est absente ; une édition existante n'est plus jamais réécrite.

## 9. Types partagés ajoutés (`shared/types/salm.ts`)

| Type | Rôle |
|---|---|
| `SalmAdminEditionListItem` | `SalmAdminEdition` enrichi : `venue`, `city`, `firstDay`, `lastDay`, `dayCount`, `yearLocked`, `canDelete`, `canPublish` |
| `SalmAdminEditionDetail` | Fiche complète : champs éditables, `days[].slots[]`, `highlights`, `videos` (`youtubeId` dérivé), `photos`, `standTypes[]` (avec `schoolCount`), dérivés du § 3, `counts` |
| `SalmAdminStats` | `{ edition: { id, year, opensAtIso }, source: 'live' \| 'purged', purgedAt, stats: SalmPurgedStats, standTypes: { name, isVisible }[], comparison: { year, opensAtIso, source, purgedAt, stats } \| null }` |
| `SalmAdminSummary` | `{ year, students, schools, comparison: { year, students, schools } \| null } \| null` |
| `SalmAdminWarning` | `'DUPLICATE_VIDEO'` |

Formes JSON exactes : [contracts/admin-api.md](./contracts/admin-api.md).
