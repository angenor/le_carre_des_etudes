# API Routes Contract

**Branch**: `001-magazine-landing-site`
**Date**: 2026-03-02

All routes are Nitro server routes under `server/api/`.
Admin routes require a valid session (set via login).

---

## Public Routes

### GET /api/magazines

Returns all published magazines.

**Response** `200`:
```json
[
  {
    "id": 1,
    "name": "Le Carré des Études",
    "description": "Premier numéro...",
    "version": "N°1",
    "pdfPath": "/uploads/magazines/carre-n1.pdf",
    "coverImage": "/uploads/magazines/cover-n1.jpg",
    "publishedAt": "2026-03-01T00:00:00.000Z"
  }
]
```

---

### GET /api/magazines/:id

Returns a single magazine by ID.

**Response** `200`: Single magazine object (same shape).
**Response** `404`: `{ "message": "Magazine non trouvé" }`

---

### POST /api/downloads

Creates a download record and returns the PDF URL.

**Request body**:
```json
{
  "fullName": "Kouassi Aya Marie",
  "contact": "0712345678",
  "studyLevel": "Licence (Bac+3)",
  "age": 22,
  "fieldOfStudy": "Droit",
  "magazineId": 1
}
```

**Validation**:
- All fields required
- `contact`: Ivorian phone format (10 digits, starts 01/05/07/27)
- `studyLevel`: must be in predefined list
- `age`: integer, 15–99
- `magazineId`: must exist and have a pdfPath

**Response** `201`:
```json
{
  "id": 42,
  "pdfUrl": "/uploads/magazines/carre-n1.pdf"
}
```

**Response** `400`: `{ "message": "Validation error", "errors": { "contact": "Format invalide" } }`
**Response** `404`: `{ "message": "Magazine non trouvé" }`

---

### GET /api/rubriques

Returns all content items, grouped by type.

**Response** `200`:
```json
{
  "portrait": [
    {
      "id": 1,
      "type": "portrait",
      "title": "Amina Diallo",
      "description": "Parcours d'une étudiante...",
      "imagePath": "/uploads/rubriques/amina.jpg",
      "order": 1
    }
  ],
  "parcours_inspirant": [],
  "en_vedette": []
}
```

---

### GET /api/partenaires

Returns all partners ordered by `order` field.

**Response** `200`:
```json
[
  {
    "id": 1,
    "name": "Université FHB",
    "logoPath": "/uploads/partenaires/uhfb.png",
    "url": "https://example.com",
    "order": 1
  }
]
```

---

## Auth Route

### POST /api/auth/login

Authenticates admin with shared password.

**Request body**:
```json
{
  "password": "the-admin-password"
}
```

**Response** `200`: `{ "success": true }`
(Sets a server-side session cookie)

**Response** `401`: `{ "message": "Mot de passe incorrect" }`

---

## Admin Routes (require session)

All admin routes return `401` if no valid session.

### POST /api/magazines

Creates a new magazine.

**Request body**: Magazine fields (name, description,
version, pdfPath, coverImage?, publishedAt)

**Response** `201`: Created magazine object.
**Response** `400`: Validation errors.

### PUT /api/magazines/:id

Updates an existing magazine.

**Response** `200`: Updated magazine object.
**Response** `404`: Magazine not found.

### DELETE /api/magazines/:id

Deletes a magazine and its file.

**Response** `200`: `{ "success": true }`
**Response** `404`: Magazine not found.

---

### POST /api/rubriques

Creates a new content item.

**Request body**: ContentItem fields (type, title,
description, imagePath, order?)

**Response** `201`: Created content item.

### PUT /api/rubriques/:id

Updates an existing content item.

**Response** `200`: Updated content item.

### DELETE /api/rubriques/:id

Deletes a content item and its image.

**Response** `200`: `{ "success": true }`

---

### POST /api/partenaires

Creates a new partner.

**Request body**: Partner fields (name, logoPath, url?,
order?)

**Response** `201`: Created partner.

### PUT /api/partenaires/:id

Updates an existing partner.

**Response** `200`: Updated partner.

### DELETE /api/partenaires/:id

Deletes a partner and its logo.

**Response** `200`: `{ "success": true }`

---

### POST /api/upload

Uploads a file (PDF, image) to `public/uploads/`.

**Request**: `multipart/form-data` with fields:
- `file`: The file to upload
- `category`: One of "magazines", "rubriques", "partenaires"

**Response** `201`:
```json
{
  "path": "/uploads/magazines/filename.pdf"
}
```

**Response** `400`: Invalid file type or missing fields.
