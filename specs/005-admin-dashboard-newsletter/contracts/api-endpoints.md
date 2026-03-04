# API Contracts: Dashboard Admin, Newsletter & Embellissement

**Branch**: `005-admin-dashboard-newsletter` | **Date**: 2026-03-04

## Endpoints publics (pas d'authentification)

### POST /api/newsletter — Inscription newsletter

**Accès** : Public
**Description** : Enregistre un email pour la newsletter

**Request Body** :
```json
{
  "email": "visiteur@example.com"
}
```

**Réponses** :

| Code | Condition | Body |
|------|-----------|------|
| 201  | Email enregistré | `{ "success": true, "message": "Inscription réussie ! Vous recevrez nos prochaines éditions." }` |
| 400  | Email invalide ou manquant | `{ "message": "Adresse email invalide" }` |
| 409  | Email déjà inscrit | `{ "message": "Cette adresse email est déjà inscrite à notre newsletter." }` |

---

### POST /api/visits — Enregistrement de visite

**Accès** : Public
**Description** : Enregistre une visite de page (fire-and-forget depuis le client)

**Request Body** :
```json
{
  "path": "/magazines/v1"
}
```

**Réponses** :

| Code | Condition | Body |
|------|-----------|------|
| 201  | Visite enregistrée | `{ "success": true }` |
| 400  | Path manquant | `{ "message": "Le chemin de la page est requis" }` |

---

## Endpoints admin (authentification requise)

### GET /api/stats/summary — Chiffres clés

**Accès** : Admin (session)
**Description** : Retourne les totaux pour les cartes du dashboard

**Réponse 200** :
```json
{
  "totalDownloads": 142,
  "totalVisits": 3580,
  "totalSubscribers": 56,
  "totalMagazines": 3
}
```

---

### GET /api/stats/downloads — Graphique téléchargements

**Accès** : Admin (session)
**Query params** :
- `period` : `7d` | `30d` | `90d` | `12m` (défaut: `30d`)

**Réponse 200** :
```json
{
  "labels": ["2026-02-03", "2026-02-04", "..."],
  "datasets": [
    {
      "label": "Téléchargements",
      "data": [5, 12, 3, "..."]
    }
  ],
  "byMagazine": [
    { "name": "Édition V1", "count": 85 },
    { "name": "Édition V2", "count": 57 }
  ],
  "byStudyLevel": [
    { "level": "Licence (Bac+3)", "count": 45 },
    { "level": "Master (Bac+5)", "count": 38 },
    { "level": "BTS / DUT (Bac+2)", "count": 30 }
  ]
}
```

---

### GET /api/stats/visits — Graphique visites

**Accès** : Admin (session)
**Query params** :
- `period` : `7d` | `30d` | `90d` | `12m` (défaut: `30d`)

**Réponse 200** :
```json
{
  "labels": ["2026-02-03", "2026-02-04", "..."],
  "datasets": [
    {
      "label": "Visites",
      "data": [120, 95, 140, "..."]
    }
  ]
}
```

---

### GET /api/downloads — Liste des téléchargements

**Accès** : Admin (session)
**Query params** :
- `page` : numéro de page (défaut: 1)
- `limit` : éléments par page (défaut: 20, max: 100)
- `search` : recherche textuelle (nom, contact, filière)
- `sortBy` : champ de tri (`fullName` | `contact` | `age` | `studyLevel` | `fieldOfStudy` | `createdAt`, défaut: `createdAt`)
- `sortOrder` : `asc` | `desc` (défaut: `desc`)

**Réponse 200** :
```json
{
  "data": [
    {
      "id": 1,
      "fullName": "Kouamé Yao",
      "contact": "07 12 34 56 78",
      "age": 22,
      "studyLevel": "Licence (Bac+3)",
      "fieldOfStudy": "Sciences économiques",
      "magazine": { "id": 1, "name": "Édition V1" },
      "createdAt": "2026-02-15T10:30:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/downloads/export — Export CSV téléchargements

**Accès** : Admin (session)
**Description** : Exporte TOUS les téléchargements en CSV (ignore pagination)

**Headers réponse** :
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="telechargements-YYYY-MM-DD.csv"`

**Contenu CSV** :
```csv
"Nom complet","Contact","Âge","Niveau d'étude","Filière","Magazine","Date"
"Kouamé Yao","07 12 34 56 78",22,"Licence (Bac+3)","Sciences économiques","Édition V1","2026-02-15"
```

---

### GET /api/newsletter — Liste des abonnés

**Accès** : Admin (session)
**Query params** :
- `page` : numéro de page (défaut: 1)
- `limit` : éléments par page (défaut: 20, max: 100)

**Réponse 200** :
```json
{
  "data": [
    {
      "id": 1,
      "email": "visiteur@example.com",
      "createdAt": "2026-02-20T14:00:00.000Z"
    }
  ],
  "total": 56,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/newsletter/export — Export CSV abonnés

**Accès** : Admin (session)

**Headers réponse** :
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="newsletter-YYYY-MM-DD.csv"`

**Contenu CSV** :
```csv
"Email","Date d'inscription"
"visiteur@example.com","2026-02-20"
```

---

### DELETE /api/newsletter/:id — Suppression abonné

**Accès** : Admin (session)

**Réponses** :

| Code | Condition | Body |
|------|-----------|------|
| 200  | Abonné supprimé | `{ "success": true }` |
| 404  | ID non trouvé | `{ "message": "Abonné non trouvé" }` |

---

## Mise à jour du middleware admin

Nouvelles routes protégées à ajouter dans `server/middleware/admin.ts` :

```
/api/newsletter   → GET, DELETE protégés (POST reste public)
/api/downloads    → GET protégé (POST reste public, existant)
/api/stats/*      → GET protégé
```

Pattern de protection :
- Routes `/api/newsletter` : POST = public, GET/DELETE = admin
- Routes `/api/downloads` : POST = public (existant), GET = admin
- Routes `/api/stats/*` : toutes protégées
- Routes `/api/visits` : POST = public (tracking)
