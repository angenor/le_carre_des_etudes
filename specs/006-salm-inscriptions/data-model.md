# Data Model — Module SALM

**Feature**: `006-salm-inscriptions` · **Spec**: [spec.md](./spec.md) · **Research**: [research.md](./research.md) (R4 à R8)

Le modèle est **complet dès cette feature** (FR-005) : la feature B n'ajoutera que des écrans, et la feature C une table de présences rattachée à `SalmStudentRegistration`. La justification table par table au regard du principe YAGNI est dans [research.md § R7](./research.md#r7-modélisation-prisma-complète--justification-yagni).

## Conventions

- Même style que le schéma existant : `id Int @id @default(autoincrement())`, pas d'enum Prisma mais des **chaînes contrôlées par le code** (codes ASCII, libellés français dans `shared/utils/salm.ts`), `createdAt` et `updatedAt`.
- Préfixe `Salm` pour les modèles. Tables SQL au nom du modèle, comme l'existant.
- **Dates et heures** : Abidjan est à UTC+0 sans heure d'été. Un jour est une chaîne `YYYY-MM-DD` et une heure une chaîne `HH:MM` ; l'instant absolu est `new Date(`${date}T${time}:00Z`)`. Pas de fuseau stocké.
- **Ordre** : chaque liste ordonnable a un `sortOrder Int @default(0)`, trié par `sortOrder`, puis `id`.
- **Chemins d'images** : chemins publics (`/salm/2027/affiche.jpg` pour le seed, `/uploads/salm/…` pour la feature B).
- **Colonnes `Json`** : prises en charge sur SQLite par Prisma ≥ 6.2 ; leur forme est validée par le code (types TypeScript dans `shared/types/salm.ts`).

## Diagramme des relations

```text
SalmEdition 1 ─┬─< SalmDay 1 ──< SalmSlot
               ├─< SalmHighlight
               ├─< SalmVideo        (médias de l'édition d'ORIGINE)
               ├─< SalmPhoto        (médias de l'édition d'ORIGINE)
               ├─< SalmStandType 1 ──< SalmSchoolRegistration (onDelete: Restrict)
               ├─< SalmStudentRegistration
               └─< SalmSchoolRegistration
```

Suppression d'une édition : `Cascade` vers tout le contenu et les inscriptions. Aucun écran de la feature A ne supprime d'édition ; la feature B imposera sa propre confirmation.

---

## SalmEdition

Une occurrence annuelle du salon.

| Champ | Type | Contraintes / défaut | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `year` | Int | **unique** | 2027. Préfixe de badge `SALM27`, titres « Salm 2027 », « SALM 2027 » |
| `status` | String | `'draft'` · `'published'` · `'archived'`, défaut `'draft'` | Au plus une édition `published` (règle applicative, cf. Invariants) |
| `salonName` | String | défaut `"Salon International des Licences et Masters de Côte d'Ivoire"` | Surtitre du hero et du badge |
| `tagline` | String? | | « L'avenir se choisit maintenant ! » |
| `city` | String | défaut `'Abidjan'` | |
| `venue` | String? | | Lieu. Absent : « Lieu à confirmer, Abidjan » (FR-004) |
| `organizerName` | String | | « Sucrey Corporates Consulting » |
| `whyTitle` | String? | | « Le premier salon ivoirien dédié aux Licences, Masters et professionnels » |
| `whyText` | String? | | Paragraphe « Pourquoi le SALM ? » |
| `audiences` | Json | défaut `[]` | `{ title: string, text: string }[]` : les 3 cartes « Licencié·e·s », « Professionnel·le·s », « En reconversion » |
| `contacts` | Json | défaut `[]` | `{ kind: 'phone' \| 'email' \| 'address', value: string, onBadge?: boolean }[]`, ordonnés |
| `posterPath` | String? | | Affiche officielle (section « Pourquoi », `og:image`, fond de secours du hero) |
| `posterAlt` | String? | | Texte alternatif de l'affiche |
| `recapVideoUrl` | String? | URL YouTube valide | Vidéo récapitulative **de cette édition**, montrée dans le hero de l'édition **suivante** |
| `recapPosterPath` | String? | | Image de secours de cette vidéo (sinon, miniature YouTube) |
| `programPdfPath` | String? | | PDF du programme. Absent : bouton masqué (FR-015) |
| `studentRegistrationOpen` | Boolean | défaut `false` | Interrupteur admin (FR-050) |
| `schoolRegistrationOpen` | Boolean | défaut `false` | Interrupteur admin (FR-050) |
| `lastBadgeSeq` | Int | défaut `0` | Compteur monotone des badges (R4). **Jamais exposé publiquement, jamais décrémenté**, y compris après la suppression des données |
| `personalDataPurgedAt` | DateTime? | | Date de la suppression des données personnelles (FR-065b). Non nul : l'édition n'a plus d'inscriptions et l'action n'est plus proposée |
| `purgedStats` | Json? | | Compteurs agrégés anonymes enregistrés juste avant la suppression (forme ci-dessous). Lus par le back-office, et par les statistiques de la feature B |
| `createdAt` / `updatedAt` | DateTime | | |

**Valeurs dérivées** (non stockées) :
- dates de début et de fin : premier et dernier `SalmDay.date` ;
- plage horaire globale : `min(opensAt)` – `max(closesAt)` ;
- ouverture pour le compte à rebours : `jours[0].date + jours[0].opensAt` ;
- **fin du salon** : `dernierJour.date + dernierJour.closesAt` ;
- **inscriptions ouvertes effectives** (FR-053) : `toggle && now < finDuSalon` ;
- **date limite de conservation** (FR-065a) : fin du salon + 12 mois (même jour et même heure, un an plus tard) ; `null` si l'édition n'a pas de jours ;
- **suppression des données possible** (FR-065b) : `status = 'archived'` et `now ≥ finDuSalon` et `personalDataPurgedAt = null` ;
- **édition précédente** (FR-006) : `findFirst({ where: { year: { lt: N } }, orderBy: { year: 'desc' } })`, quel que soit son statut.

**Transitions de statut** (appliquées par la feature B ; la feature A ne les modifie que par le seed) :

```text
draft ──publier──> published ──archiver──> archived
                       ▲                        │
                       └──────republier─────────┘
```

Publier une édition dépublie l'édition publiée précédente (spec de la feature B).

## SalmDay

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK → SalmEdition, `onDelete: Cascade` | |
| `date` | String | `YYYY-MM-DD` ; **`@@unique([editionId, date])`** | `2027-03-12` |
| `label` | String | | « Jour 1 » |
| `opensAt` | String | `HH:MM` | `09:30` |
| `closesAt` | String | `HH:MM`, supérieur à `opensAt` | `16:00` (Jour 1), `16:30` (Jour 2) |
| `sortOrder` | Int | défaut 0 | |

Affichage dérivé : « Vendredi 12 mars 2027 » (`Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' })`), « ven. 12 » pour les onglets mobiles et le verso du badge.

## SalmSlot

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `dayId` | Int | FK → SalmDay, `onDelete: Cascade`, `@@index([dayId, sortOrder])` | |
| `startTime` / `endTime` | String | `HH:MM`, `endTime > startTime` | Affichés « 9h30 – 10h00 » |
| `title` | String | | « Cérémonie d'ouverture », « PANEL 1 » |
| `description` | String? | | Thème du panel, précisions |
| `kind` | String | `'ceremonie'` · `'panel'` · `'presentation'` · `'stands'` · `'pause'` · `'exposition'` | Style de la ligne (pause atténuée) |
| `isHighlighted` | Boolean | défaut `false` | « Présentation du magazine Le Carré des Études » en ambre (FR-014) |
| `sortOrder` | Int | défaut 0 | Ordre explicite. Les chevauchements (14h00 Panel 2 et Exposition) sont admis et affichés dans cet ordre |

## SalmHighlight (temps fort)

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK, `Cascade`, `@@index([editionId, sortOrder])` | |
| `title` | String | | « LANCEMENT OFFICIEL » |
| `imagePath` | String | | |
| `imageAlt` | String | | « Lancement officiel du SALM 2026 » |
| `sortOrder` | Int | défaut 0 | |

## SalmVideo (canapé)

Rattachée à l'édition **où elle a été tournée** (clarification Q2). Elle est affichée sur la page de l'édition suivante.

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK, `Cascade`, `@@index([editionId, sortOrder])` | Édition d'origine |
| `youtubeUrl` | String | URL YouTube dont l'identifiant est extractible (`parseYoutubeId`) | |
| `title` | String? | | Absent : « Vidéo 01 » |
| `guest` | String? | | Invité·e |
| `institution` | String? | | Établissement de l'invité·e |
| `thumbnailPath` | String? | | Sinon, miniature YouTube `hqdefault` |
| `sortOrder` | Int | défaut 0 | Numérotation 01, 02… |

## SalmPhoto (catalogue)

Rattachée à l'édition **où elle a été prise** (clarification Q2).

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK, `Cascade`, `@@index([editionId, sortOrder])` | Édition d'origine |
| `imagePath` | String | | |
| `alt` | String | | Texte alternatif obligatoire |
| `caption` | String? | | Légende facultative (feature B) |
| `sortOrder` | Int | défaut 0 | Les 4 premières forment l'aperçu |

## SalmStandType

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK, `Cascade` ; **`@@unique([editionId, name])`** | |
| `name` | String | | « STAND OR », « STAND DIAMANT », « STAND PREMIUM » |
| `description` | String? | | Surface, prestations |
| `priceLabel` | String? | | Tarif en texte libre (« 500 000 FCFA ») : aucun calcul, et la gestion des paiements est hors périmètre |
| `isVisible` | Boolean | défaut `true` | Un type masqué n'est plus proposé (US3-6) mais reste affiché sur les inscriptions existantes |
| `sortOrder` | Int | défaut 0 | |

Relation inverse : `schoolRegistrations SalmSchoolRegistration[]`, avec `onDelete: Restrict` côté inscription.

## SalmStudentRegistration

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK, `Cascade` | |
| `fullName` | String | 2 à 60 caractères après réduction des espaces ; au moins 2 lettres ; uniquement lettres (accents compris), espaces, `-`, `'`, `’`, `.` (FR-020a) | Tel que saisi (espaces multiples réduits) |
| `phone` | String | 10 chiffres normalisés (R6) ; **`@@unique([editionId, phone])`** | Unicité par édition (FR-025) |
| `studyLevel` | String | ∈ `STUDY_LEVELS` | |
| `badgeSeq` | Int | ≥ 1 ; **`@@unique([editionId, badgeSeq])`** | Numéro affiché `SALM27-000482` |
| `verifyToken` | String | **unique**, 22 caractères base64url | URL du QR code (R5) |
| `downloadToken` | String | **unique**, 22 caractères base64url | URL du PDF (R5). Jamais encodé dans le QR code |
| `nameSearch` | String | | `nameSearchKey(fullName)` : minuscules, sans accents (R6) |
| `createdAt` | DateTime | défaut `now()` ; `@@index([editionId, createdAt])` | |

**Règles** :
- La création passe **toujours** par la transaction de R4 : incrément de `lastBadgeSeq`, puis insertion.
- Aucune modification après création : pas de `updatedAt`, pas de route de mise à jour. Une nouvelle soumission ne modifie rien (FR-025).
- La suppression est définitive. Le numéro n'est jamais réattribué et les deux jetons deviennent invalides (FR-065). Même effet pour toutes les inscriptions de l'édition lors de la suppression des données personnelles (FR-065b).

## SalmSchoolRegistration

| Champ | Type | Contraintes | Rôle |
|---|---|---|---|
| `id` | Int | PK | |
| `editionId` | Int | FK, `Cascade` ; `@@index([editionId, status])`, `@@index([editionId, createdAt])` | |
| `name` | String | 2 à 150 caractères | Établissement |
| `phone` | String | 10 chiffres normalisés, fixes admis (R6) | |
| `email` | String | forme e-mail valide, 254 caractères au plus, en minuscules | |
| `programmes` | Json | `string[]` non vide, ⊂ `['BACHELOR','BTS','LICENCE','MASTER','AUTRE']`, sans doublon | Choix multiple (clarification Q3) |
| `otherProgramme` | String? | 120 caractères au plus ; seulement si `'AUTRE'` | « Précisez » |
| `exhibitors` | Json | `{ fullName: string, contact: string }[]`, **1 à 6** éléments ; `fullName` de 2 à 100 caractères, `contact` = téléphone normalisé | Exposants (R7) |
| `standTypeId` | Int | FK → SalmStandType, **`onDelete: Restrict`** ; le type doit appartenir à la même édition et être visible **au moment de l'inscription** | |
| `question` | String? | 1 000 caractères au plus | Question libre |
| `status` | String | `'nouvelle'` · `'contactee'` · `'confirmee'` · `'annulee'`, défaut `'nouvelle'` | Suivi admin |
| `internalNote` | String? | 2 000 caractères au plus | **Jamais exposée publiquement** |
| `createdAt` / `updatedAt` | DateTime | | |

**Suppression** (FR-067a) : suppression définitive de la ligne, exposants compris (JSON). Aucune modification des exposants par l'administration.

**Transitions de statut** : libres entre les 4 valeurs, sur décision de l'administrateur (aucun automatisme). Seule contrainte : l'état initial est toujours `nouvelle`.

Libellés affichés : Nouvelle · Contactée · Confirmée · Annulée.

---

## Invariants et règles transverses

| Invariant | Garanti par |
|---|---|
| Une inscription étudiante au plus par (édition, téléphone) | `@@unique([editionId, phone])`. En concurrence, l'erreur P2002 est traitée comme « déjà inscrit·e » |
| Numéros de badge uniques, séquentiels, jamais réutilisés | Compteur `lastBadgeSeq` dans la transaction, plus `@@unique([editionId, badgeSeq])` |
| Au plus une édition `published` | Règle applicative : le seed ne publie que 2027, la feature B dépubliera l'ancienne dans la même transaction. SQLite ne permet pas d'index partiel via Prisma, et c'est documenté comme tel. |
| Un type de stand choisi ne peut pas être supprimé | `onDelete: Restrict` |
| Aucune donnée personnelle dans les réponses publiques, hors porteur du `downloadToken` | Sélection explicite des champs (`select`) dans chaque route publique ; voir [contracts/public-api.md](./contracts/public-api.md) |
| Données personnelles conservées 12 mois au plus après le salon (FR-065a) | Date limite affichée dans le back-office, suppression par l'action FR-065b (aucune tâche planifiée) |
| Suppression des données seulement pour une édition archivée et terminée | Contrôle serveur dans la route de suppression, dans la même transaction que le calcul de `purgedStats` |
| Aucun badge pour un établissement ou un exposant (FR-047) | `SalmSchoolRegistration` n'a ni numéro, ni jeton, et aucune route de badge ne la lit |

## Esquisse Prisma (référence pour la migration `add_salm_module`)

```prisma
model SalmEdition {
  id                      Int      @id @default(autoincrement())
  year                    Int      @unique
  status                  String   @default("draft")
  salonName               String   @default("Salon International des Licences et Masters de Côte d'Ivoire")
  tagline                 String?
  city                    String   @default("Abidjan")
  venue                   String?
  organizerName           String
  whyTitle                String?
  whyText                 String?
  audiences               Json     @default("[]")
  contacts                Json     @default("[]")
  posterPath              String?
  posterAlt               String?
  recapVideoUrl           String?
  recapPosterPath         String?
  programPdfPath          String?
  studentRegistrationOpen Boolean  @default(false)
  schoolRegistrationOpen  Boolean  @default(false)
  lastBadgeSeq            Int      @default(0)
  personalDataPurgedAt    DateTime?
  purgedStats             Json?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  days                SalmDay[]
  highlights          SalmHighlight[]
  videos              SalmVideo[]
  photos              SalmPhoto[]
  standTypes          SalmStandType[]
  studentRegistrations SalmStudentRegistration[]
  schoolRegistrations  SalmSchoolRegistration[]
}

model SalmDay {
  id        Int         @id @default(autoincrement())
  editionId Int
  edition   SalmEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  date      String
  label     String
  opensAt   String
  closesAt  String
  sortOrder Int         @default(0)
  slots     SalmSlot[]

  @@unique([editionId, date])
}

model SalmSlot {
  id            Int     @id @default(autoincrement())
  dayId         Int
  day           SalmDay @relation(fields: [dayId], references: [id], onDelete: Cascade)
  startTime     String
  endTime       String
  title         String
  description   String?
  kind          String
  isHighlighted Boolean @default(false)
  sortOrder     Int     @default(0)

  @@index([dayId, sortOrder])
}

model SalmHighlight {
  id        Int         @id @default(autoincrement())
  editionId Int
  edition   SalmEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  title     String
  imagePath String
  imageAlt  String
  sortOrder Int         @default(0)

  @@index([editionId, sortOrder])
}

model SalmVideo {
  id            Int         @id @default(autoincrement())
  editionId     Int
  edition       SalmEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  youtubeUrl    String
  title         String?
  guest         String?
  institution   String?
  thumbnailPath String?
  sortOrder     Int         @default(0)

  @@index([editionId, sortOrder])
}

model SalmPhoto {
  id        Int         @id @default(autoincrement())
  editionId Int
  edition   SalmEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  imagePath String
  alt       String
  caption   String?
  sortOrder Int         @default(0)

  @@index([editionId, sortOrder])
}

model SalmStandType {
  id                  Int                      @id @default(autoincrement())
  editionId           Int
  edition             SalmEdition              @relation(fields: [editionId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  priceLabel          String?
  isVisible           Boolean                  @default(true)
  sortOrder           Int                      @default(0)
  schoolRegistrations SalmSchoolRegistration[]

  @@unique([editionId, name])
}

model SalmStudentRegistration {
  id            Int         @id @default(autoincrement())
  editionId     Int
  edition       SalmEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  fullName      String
  phone         String
  studyLevel    String
  badgeSeq      Int
  verifyToken   String      @unique
  downloadToken String      @unique
  nameSearch    String
  createdAt     DateTime    @default(now())

  @@unique([editionId, phone])
  @@unique([editionId, badgeSeq])
  @@index([editionId, createdAt])
}

model SalmSchoolRegistration {
  id             Int           @id @default(autoincrement())
  editionId      Int
  edition        SalmEdition   @relation(fields: [editionId], references: [id], onDelete: Cascade)
  name           String
  phone          String
  email          String
  programmes     Json
  otherProgramme String?
  exhibitors     Json
  standTypeId    Int
  standType      SalmStandType @relation(fields: [standTypeId], references: [id], onDelete: Restrict)
  question       String?
  status         String        @default("nouvelle")
  internalNote   String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([editionId, status])
  @@index([editionId, createdAt])
}
```

## Forme de `purgedStats` (FR-065b)

Calculée dans la transaction de suppression, juste avant les `deleteMany` :

```jsonc
{
  "computedAt": "2028-04-02T10:00:00.000Z",
  "students": {
    "total": 4821,
    "byStudyLevel": { "Licence (Bac+3)": 2104, "Master (Bac+5)": 1203 },
    "byRegistrationDay": { "2026-10-02": 132, "2026-10-03": 88 }   // date AAAA-MM-JJ (UTC = Abidjan)
  },
  "schools": {
    "total": 41,
    "byStandType": { "STAND OR": 20, "STAND DIAMANT": 14, "STAND PREMIUM": 7 },
    "byStatus": { "nouvelle": 0, "contactee": 3, "confirmee": 36, "annulee": 2 },
    "exhibitors": 97
  }
}
```

Aucun nom, téléphone, e-mail ni identifiant d'inscription n'y figure. Justification YAGNI : une colonne JSON sur l'édition plutôt qu'une table, car ces compteurs sont écrits une seule fois et lus d'un bloc.

## Données du seed (résumé ; source : `documentations/brouillons/` et la maquette)

| Édition | Statut | Contenu |
|---|---|---|
| **2026** | `archived` | `organizerName`. Médias : 4 à 6 photos issues de `maquette/images/` (textes alternatifs de la maquette), `recapPosterPath = /salm/2026/panel.jpg`. `recapVideoUrl` et les 9 vidéos restent vides tant que les URL ne sont pas fournies. Aucun jour. |
| **2027** | `published`, 2 toggles ouverts | Voir ci-dessous |

Contenu de l'édition 2027 :
- **Textes et contacts** :
  - tagline « L'avenir se choisit maintenant ! » ;
  - `venue = null` ;
  - `whyTitle`, `whyText` et 3 `audiences` repris de la maquette ;
  - `contacts` :
    - `+225 27 35 966 789` ;
    - `+225 07 68 011 409`, avec `onBadge` ;
    - `salm2026@sucreycorporates.com` (incohérence signalée dans la spec) ;
    - « Abidjan Cocody, Riviera Palmeraie » ;
  - `posterPath = /salm/2027/affiche.jpg` (à partir de `diplomee.jpg`).
- **Jours** :
  - Jour 1 : `2027-03-12`, 09:30–16:00 ;
  - Jour 2 : `2027-03-13`, 09:30–16:30.
- **Créneaux** : les 7 du Jour 1 et les 5 du Jour 2, tels que dans le chronogramme 2027, chevauchement et trou inclus. Le créneau « Présentation du magazine Le Carré des Études » (11:00–11:10) a `isHighlighted = true`.
- **Temps forts** : LANCEMENT OFFICIEL, CONFÉRENCE, VISITE DE STANDS, PANEL, RÉSEAUTAGE & PARTENARIAT, avec les photos de la maquette.
- **Stands** : STAND OR, STAND DIAMANT, STAND PREMIUM ; `description` et `priceLabel` vides.
