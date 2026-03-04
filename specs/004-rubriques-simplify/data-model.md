# Data Model: Simplification des Rubriques

**Feature**: 004-rubriques-simplify
**Date**: 2026-03-04

## Modifications au schéma existant

### Magazine — Ajout du champ `slug`

```prisma
model Magazine {
  id            Int        @id @default(autoincrement())
  name          String
  description   String
  version       String     @unique
  slug          String     @unique       // NOUVEAU — généré à partir de `version`
  subtitle      String?
  pdfPath       String
  coverImage    String?
  coverImageOg  String?
  publishedAt   DateTime
  availableAt   DateTime?
  isFeatured    Boolean    @default(false)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  downloads     Download[]
  contentItems  ContentItem[]            // NOUVEAU — relation inverse
}
```

**Champ ajouté** :
- `slug String @unique` — Identifiant URL-friendly dérivé de `version`. Généré automatiquement via `slugify(version)`. Unique car `version` est déjà unique.
- `contentItems ContentItem[]` — Relation inverse (un magazine peut avoir plusieurs rubriques).

**Règles de validation** :
- `slug` : requis, unique, format `[a-z0-9-]+`, généré automatiquement si non fourni.
- Pas de suppression en cascade des ContentItems si un magazine est supprimé (les rubriques restent avec `magazineId = null`).

### ContentItem — Ajout du champ `magazineId`

```prisma
model ContentItem {
  id            Int       @id @default(autoincrement())
  type          String
  title         String    @default("")   // MODIFIÉ — défaut vide (optionnel dans le workflow simplifié)
  description   String    @default("")   // MODIFIÉ — défaut vide (optionnel dans le workflow simplifié)
  content       String?
  subtitle      String?
  eventDate     DateTime?
  eventLocation String?
  imagePath     String
  order         Int       @default(0)
  magazineId    Int?                     // NOUVEAU — FK optionnelle vers Magazine
  magazine      Magazine? @relation(fields: [magazineId], references: [id], onDelete: SetNull)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Champs ajoutés/modifiés** :
- `magazineId Int?` — Clé étrangère optionnelle vers Magazine. Permet d'associer une rubrique à une édition du magazine.
- `magazine Magazine?` — Relation Prisma. `onDelete: SetNull` : si le magazine est supprimé, `magazineId` passe à `null` (la rubrique reste visible sans lien).
- `title @default("")` — Le titre devient optionnel dans le workflow simplifié (valeur par défaut : chaîne vide).
- `description @default("")` — Idem pour la description.

**Types de rubrique** (inchangés) :
- `parcours_inspirant`
- `en_vedette`
- `agenda_et_opportunites`
- `focus`
- `portrait` (mappé vers `parcours_inspirant` côté API)

## Stratégie de migration

### Étape 1 : Ajout des champs

```sql
ALTER TABLE Magazine ADD COLUMN slug TEXT;
ALTER TABLE ContentItem ADD COLUMN magazineId INTEGER REFERENCES Magazine(id) ON DELETE SET NULL;
```

### Étape 2 : Peuplement des slugs existants

Script post-migration : pour chaque magazine existant, générer `slug = slugify(version)`.

### Étape 3 : Contrainte unique sur slug

```sql
CREATE UNIQUE INDEX Magazine_slug_key ON Magazine(slug);
```

**Note** : Ces étapes sont gérées par Prisma `migrate dev`. La génération des slugs pour les données existantes sera faite via un script séparé ou dans la migration elle-même.

## Diagramme de relations

```
Magazine (1) ←──── (0..*) ContentItem
   │                    │
   ├── slug (unique)    ├── magazineId? (FK)
   ├── version (unique) ├── type
   └── ...              ├── imagePath
                        ├── order
                        └── ... (champs avancés)
```
