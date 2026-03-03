# API Contracts: 002-magazine-backend-sync

**Date**: 2026-03-03

## Nouvel endpoint

### GET /api/magazines/featured

Retourne le magazine marqué « à la une », ou null si aucun.

**Auth**: Public (GET)

**Response 200** (magazine trouvé) :
```json
{
  "id": 1,
  "name": "Le Carré des Études",
  "description": "Découvrez notre tout premier numéro...",
  "version": "N°01",
  "subtitle": "Édition inaugurale",
  "pdfPath": "/uploads/magazines/1234567-magazine.pdf",
  "coverImage": "/uploads/magazines/1234567-couverture.jpg",
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "availableAt": "2026-03-13T00:00:00.000Z",
  "isFeatured": true
}
```

**Response 200** (aucun magazine à la une) :
```json
null
```

---

### PUT /api/magazines/:id/featured

Marque un magazine comme « à la une ». Retire automatiquement le statut de tout autre magazine.

**Auth**: Admin (session requise)

**Request body** : aucun

**Response 200** :
```json
{
  "id": 1,
  "name": "Le Carré des Études",
  "version": "N°01",
  "isFeatured": true
}
```

**Response 404** :
```json
{
  "message": "Magazine introuvable"
}
```

---

### DELETE /api/magazines/:id/featured

Retire le statut « à la une » d'un magazine (sans le supprimer).

**Auth**: Admin (session requise)

**Request body** : aucun

**Response 200** :
```json
{
  "id": 1,
  "isFeatured": false
}
```

---

## Endpoints modifiés

### POST /api/magazines

**Nouveaux champs acceptés dans le body** (tous optionnels) :

```json
{
  "name": "Le Carré des Études",
  "description": "...",
  "version": "N°02",
  "pdfPath": "/uploads/magazines/...",
  "coverImage": "/uploads/magazines/...",
  "publishedAt": "2026-06-01",
  "subtitle": "Spécial orientation",
  "availableAt": "2026-06-15T00:00:00"
}
```

- `subtitle` : String optionnel. Si absent ou vide → null.
- `availableAt` : DateTime optionnel au format ISO 8601. Si absent → null (immédiatement disponible).
- `isFeatured` n'est **PAS** accepté ici — le statut à la une se gère uniquement via l'endpoint dédié.

**Response** : Magazine complet (incluant les nouveaux champs).

---

### PUT /api/magazines/:id

**Nouveaux champs acceptés dans le body** (tous optionnels) :

```json
{
  "subtitle": "Nouveau sous-titre",
  "availableAt": "2026-06-15T00:00:00"
}
```

- `subtitle` : Si fourni (même vide) → met à jour. Si clé absente → pas de modification.
- `availableAt` : Si fourni → met à jour. Si null explicite → supprime la date. Si clé absente → pas de modification.
- `isFeatured` n'est **PAS** accepté ici.

**Response** : Magazine complet (incluant les nouveaux champs).

---

### GET /api/magazines & GET /api/magazines/:id

**Response enrichie** — les nouveaux champs sont inclus dans la réponse :

```json
{
  "id": 1,
  "name": "Le Carré des Études",
  "description": "...",
  "version": "N°01",
  "subtitle": "Édition inaugurale",
  "pdfPath": "/uploads/magazines/...",
  "coverImage": "/uploads/magazines/...",
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "availableAt": "2026-03-13T00:00:00.000Z",
  "isFeatured": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Pas de changement de comportement : les endpoints retournent déjà tous les champs du modèle via Prisma. Les nouveaux champs seront automatiquement inclus.
