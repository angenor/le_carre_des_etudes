# Data Model: Site Vitrine Le Carré des Études

**Branch**: `001-magazine-landing-site`
**Date**: 2026-03-02

## Entity Relationship Overview

```text
Magazine 1──N Download (a magazine has many downloads)
ContentItem (standalone, no relationships)
Partner (standalone, no relationships)
```

## Entities

### Magazine

Represents a published issue of the magazine available
for download.

| Field        | Type     | Constraints                    |
|-------------|----------|--------------------------------|
| id          | Int      | PK, auto-increment             |
| name        | String   | Required, e.g. "Le Carré des Études" |
| description | String   | Required, short summary        |
| version     | String   | Required, e.g. "N°1"          |
| pdfPath     | String   | Required, path to PDF file in `public/uploads/magazines/` |
| coverImage  | String   | Optional, path to cover image  |
| publishedAt | DateTime | Required, publication date     |
| createdAt   | DateTime | Default: now()                 |
| updatedAt   | DateTime | Auto-updated                   |

**Validation rules**:
- `name` must not be empty
- `version` must be unique (no duplicate magazine issues)
- `pdfPath` must point to an existing file

**Lifecycle**: Created by admin → visible on public site →
can be updated/deleted by admin. If a magazine has no
pdfPath, the download button is disabled on the public
page (edge case from spec).

---

### Download

Records each form submission when a visitor downloads a
magazine. Serves as the lead-capture data store.

| Field        | Type     | Constraints                    |
|-------------|----------|--------------------------------|
| id          | Int      | PK, auto-increment             |
| fullName    | String   | Required (nom & prénoms)       |
| contact     | String   | Required (Ivorian phone: 10 digits, starts with 01/05/07/27) |
| studyLevel  | String   | Required (from predefined list) |
| age         | Int      | Required, positive integer     |
| fieldOfStudy| String   | Required (free text)           |
| magazineId  | Int      | FK → Magazine.id, required     |
| createdAt   | DateTime | Default: now()                 |

**Validation rules**:
- `fullName` must not be empty
- `contact` must match Ivorian phone regex:
  `^(01|05|07|27)\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$`
- `studyLevel` must be one of: "Terminale / Futur bachelier",
  "BTS / DUT (Bac+2)", "Licence (Bac+3)", "Master (Bac+5)",
  "Doctorat", "Autre"
- `age` must be between 15 and 99
- `magazineId` must reference an existing Magazine

**Identity rule**: No uniqueness constraint on downloader
data — the same person can download multiple times
(spec assumption).

---

### ContentItem

Represents an editorial content piece displayed on the
Interviews & Rubriques page.

| Field       | Type     | Constraints                    |
|------------|----------|--------------------------------|
| id         | Int      | PK, auto-increment             |
| type       | String   | Required, one of: "portrait", "parcours_inspirant", "en_vedette" |
| title      | String   | Required                       |
| description| String   | Required, short text           |
| imagePath  | String   | Required, path to image in `public/uploads/rubriques/` |
| order      | Int      | Default: 0, for display ordering within type |
| createdAt  | DateTime | Default: now()                 |
| updatedAt  | DateTime | Auto-updated                   |

**Validation rules**:
- `type` must be one of the three allowed values
- `title` must not be empty
- `imagePath` must point to an uploaded image

**Display rule**: Content items are grouped by `type`
on the public page. If no items exist for a type, that
section is hidden (spec acceptance scenario US3-3).

---

### Partner

Represents an organization partnering with the magazine.

| Field     | Type     | Constraints                    |
|----------|----------|--------------------------------|
| id       | Int      | PK, auto-increment             |
| name     | String   | Required                       |
| logoPath | String   | Required, path to logo in `public/uploads/partenaires/` |
| url      | String   | Optional, partner website URL  |
| order    | Int      | Default: 0, for display ordering |
| createdAt| DateTime | Default: now()                 |
| updatedAt| DateTime | Auto-updated                   |

**Validation rules**:
- `name` must not be empty
- `logoPath` must point to an uploaded image

---

## Prisma Schema (target)

```prisma
model Magazine {
  id          Int        @id @default(autoincrement())
  name        String
  description String
  version     String     @unique
  pdfPath     String
  coverImage  String?
  publishedAt DateTime
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  downloads   Download[]
}

model Download {
  id           Int      @id @default(autoincrement())
  fullName     String
  contact      String
  studyLevel   String
  age          Int
  fieldOfStudy String
  magazineId   Int
  magazine     Magazine @relation(fields: [magazineId], references: [id])
  createdAt    DateTime @default(now())
}

model ContentItem {
  id          Int      @id @default(autoincrement())
  type        String
  title       String
  description String
  imagePath   String
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Partner {
  id        Int      @id @default(autoincrement())
  name      String
  logoPath  String
  url       String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Note**: The existing `User` model from the initial
migration will be removed as it is not part of this
feature's requirements. Admin authentication uses a
single shared password (env var), not a User table.
