# API Contracts: Rubriques

**Feature**: 003-rubriques-redesign
**Date**: 2026-03-04

## Types partagés

```typescript
interface ContentItem {
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
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}

type GroupedRubriques = Record<string, ContentItem[]>
```

---

## GET /api/rubriques

**Modifié** — Ajoute 2 nouveaux types et retourne les nouveaux champs.

**Auth**: Public

**Response** `200`:
```json
{
  "en_vedette": [ContentItem, ...],
  "parcours_inspirant": [ContentItem, ...],
  "agenda_et_opportunites": [ContentItem, ...],
  "focus": [ContentItem, ...]
}
```

**Comportement**:
- Items triés par `order` ASC dans chaque groupe
- Items de type `portrait` sont inclus dans le groupe `parcours_inspirant`
- Groupes vides retournés comme tableaux vides `[]`

---

## GET /api/rubriques/:id

**Nouveau** — Retourne une rubrique unique pour la page de détail.

**Auth**: Public

**Params**: `id` (integer)

**Response** `200`:
```json
{
  "id": 1,
  "type": "parcours_inspirant",
  "title": "Koné Banassa, Bâtisseuse d'Avenir",
  "description": "Résumé court...",
  "content": "# Contenu Markdown complet...",
  "subtitle": "Par Sucrey Corporates",
  "eventDate": null,
  "eventLocation": null,
  "imagePath": "/uploads/rubriques/123-image.jpg",
  "order": 1,
  "createdAt": "2026-03-04T10:00:00.000Z",
  "updatedAt": "2026-03-04T10:00:00.000Z"
}
```

**Response** `404`:
```json
{ "statusCode": 404, "message": "Rubrique non trouvée" }
```

**Comportement**:
- Si l'item a `type = 'portrait'`, retourne `type = 'parcours_inspirant'`

---

## POST /api/rubriques

**Modifié** — Accepte 4 types et les nouveaux champs.

**Auth**: Admin (session)

**Body**:
```json
{
  "type": "agenda_et_opportunites",
  "title": "SALM 2026",
  "description": "Salon des Licences et Masters...",
  "content": "# Contenu riche en Markdown...",
  "imagePath": "/uploads/rubriques/123-salm.jpg",
  "subtitle": null,
  "eventDate": "2026-03-13T00:00:00.000Z",
  "eventLocation": "Noom Hotel, Abidjan Plateau",
  "order": 1
}
```

**Validation**:
| Champ | Règle |
|-------|-------|
| type | Requis, un de: `parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus` |
| title | Requis, non vide après trim |
| description | Requis, non vide après trim |
| content | Optionnel, string |
| subtitle | Optionnel, string (pertinent uniquement pour `parcours_inspirant`) |
| eventDate | Optionnel, ISO 8601 (pertinent uniquement pour `agenda_et_opportunites`) |
| eventLocation | Optionnel, string (pertinent uniquement pour `agenda_et_opportunites`) |
| imagePath | Requis, non vide après trim |
| order | Optionnel, integer, défaut 0 |

**Response** `201`: ContentItem créé
**Response** `400`: Erreur de validation

---

## PUT /api/rubriques/:id

**Modifié** — Supporte les nouveaux champs.

**Auth**: Admin (session)

**Body**: Tous les champs optionnels (mise à jour partielle)

**Response** `200`: ContentItem mis à jour
**Response** `404`: Rubrique non trouvée
**Response** `400`: Erreur de validation

---

## DELETE /api/rubriques/:id

**Inchangé** — Supprime la rubrique et son image.

**Auth**: Admin (session)

**Response** `200`: `{ "success": true }`
**Response** `404`: Rubrique non trouvée
