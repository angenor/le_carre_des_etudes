# API Contracts: Simplification des Rubriques

**Feature**: 004-rubriques-simplify
**Date**: 2026-03-04

## Types partagés

```typescript
interface ContentItemWithMagazine {
  id: number
  type: 'parcours_inspirant' | 'en_vedette' | 'agenda_et_opportunites' | 'focus'
  title: string
  description: string
  content: string | null
  subtitle: string | null
  eventDate: string | null    // ISO 8601
  eventLocation: string | null
  imagePath: string
  order: number
  magazineId: number | null
  magazine: { id: number; slug: string; name: string } | null  // inclus pour navigation
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}

type GroupedRubriques = Record<string, ContentItemWithMagazine[]>

interface Magazine {
  id: number
  name: string
  description: string
  version: string
  slug: string                // NOUVEAU
  subtitle: string | null
  pdfPath: string
  coverImage: string | null
  coverImageOg: string | null
  publishedAt: string         // ISO 8601
  availableAt: string | null  // ISO 8601
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}
```

---

## GET /api/rubriques

**Modifié** — Inclut le magazine associé dans la réponse.

**Auth**: Public

**Response** `200`:
```json
{
  "en_vedette": [ContentItemWithMagazine, ...],
  "parcours_inspirant": [ContentItemWithMagazine, ...],
  "agenda_et_opportunites": [ContentItemWithMagazine, ...],
  "focus": [ContentItemWithMagazine, ...]
}
```

**Comportement**:
- Items triés par `order` ASC dans chaque groupe
- Items de type `portrait` inclus dans le groupe `parcours_inspirant`
- Chaque item inclut `magazine: { id, slug, name }` si associé, sinon `magazine: null`
- Groupes vides retournés comme tableaux vides `[]`

---

## POST /api/rubriques

**Modifié** — `title` et `description` deviennent optionnels, `magazineId` ajouté.

**Auth**: Admin (session)

**Body**:
```json
{
  "type": "en_vedette",
  "imagePath": "/uploads/rubriques/123-image.jpg",
  "order": 1,
  "magazineId": 5,
  "title": "",
  "description": "",
  "content": null,
  "subtitle": null,
  "eventDate": null,
  "eventLocation": null
}
```

**Validation**:
| Champ         | Règle                                                                  |
|---------------|------------------------------------------------------------------------|
| type          | Requis, un de: `parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus` |
| imagePath     | Requis, non vide après trim                                            |
| order         | Optionnel, integer, défaut 0                                           |
| magazineId    | Optionnel, integer, doit référencer un Magazine existant si fourni     |
| title         | Optionnel, string, défaut `""`                                         |
| description   | Optionnel, string, défaut `""`                                         |
| content       | Optionnel, string                                                      |
| subtitle      | Optionnel, string (pertinent pour `parcours_inspirant`)                |
| eventDate     | Optionnel, ISO 8601 (pertinent pour `agenda_et_opportunites`)          |
| eventLocation | Optionnel, string (pertinent pour `agenda_et_opportunites`)            |

**Response** `201`: ContentItemWithMagazine créé
**Response** `400`: Erreur de validation

---

## PUT /api/rubriques/:id

**Modifié** — Supporte `magazineId`.

**Auth**: Admin (session)

**Body**: Tous les champs optionnels (mise à jour partielle). `magazineId` peut être `null` pour dissocier.

**Response** `200`: ContentItemWithMagazine mis à jour
**Response** `404`: Rubrique non trouvée
**Response** `400`: Erreur de validation

---

## GET /api/magazines/by-slug/:slug

**Nouveau** — Retourne un magazine par son slug.

**Auth**: Public

**Params**: `slug` (string)

**Response** `200`:
```json
{
  "id": 5,
  "name": "Le Carré des Études",
  "version": "N°001",
  "slug": "n-001",
  "description": "Première édition...",
  "subtitle": null,
  "pdfPath": "/uploads/magazines/n001.pdf",
  "coverImage": "/uploads/magazines/n001-cover.jpg",
  "coverImageOg": null,
  "publishedAt": "2026-01-15T00:00:00.000Z",
  "availableAt": null,
  "isFeatured": true,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

**Response** `404`:
```json
{ "statusCode": 404, "message": "Magazine non trouvé" }
```

---

## POST /api/magazines

**Modifié** — Génère automatiquement le slug.

**Auth**: Admin (session)

**Body** (ajout):
```json
{
  "name": "Le Carré des Études",
  "version": "N°002",
  "slug": null,
  ...
}
```

**Comportement**:
- Si `slug` est absent ou `null`, généré automatiquement via `slugify(version)`
- Si `slug` est fourni, utilisé tel quel (après slugification)
- Validation d'unicité du slug

**Response** `201`: Magazine avec slug

---

## PUT /api/magazines/:id

**Modifié** — Supporte la mise à jour du slug.

**Auth**: Admin (session)

**Body**: `slug` optionnel. Si `version` est mise à jour et `slug` non fourni, le slug est régénéré.

**Response** `200`: Magazine mis à jour

---

## Endpoints inchangés

- `GET /api/rubriques/:id` — Inchangé
- `DELETE /api/rubriques/:id` — Inchangé
- `GET /api/magazines` — Inchangé (inclut désormais `slug` dans la réponse)
- `GET /api/magazines/:id` — Inchangé (rétro-compatibilité)
- `GET /api/magazines/featured` — Inchangé
- `DELETE /api/magazines/:id` — Inchangé
