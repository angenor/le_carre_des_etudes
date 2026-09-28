# Contrat — API publique `/api/salm/*`

Aucune authentification. Ces routes ne correspondent à aucun préfixe de `server/middleware/admin.ts`.

## Conventions communes

- **Corps JSON** en UTF-8.
- **Liste blanche** (FR-081a) : chaque route `POST` ne lit que les champs listés dans sa section. Tout autre champ (`status`, `internalNote`, `badgeNumber`, `badgeSeq`, `editionId`, `id`…) est **ignoré**, sans erreur ni effet. Aucun objet reçu n'est transmis tel quel à Prisma.
- **Édition déterminée par le serveur** : toujours l'édition publiée ; les routes d'inscription exigent en plus que le type d'inscription concerné soit ouvert au sens effectif (FR-053). Le client n'envoie jamais d'identifiant d'édition.
- **Erreurs = codes, jamais de phrases** (FR-083, décision D6). Même structure que `server/api/downloads/index.post.ts`, mais `message` porte le code technique et non un texte à afficher :

  ```json
  { "statusCode": 400, "message": "VALIDATION", "data": { "code": "VALIDATION", "errors": { "fullName": "INVALID_CHARS", "phone": "INVALID_FORMAT" } } }
  ```

  Le client lit `error.data.data.code` et `error.data.data.errors`, puis affiche **ses propres textes** : tutoiement dans le formulaire étudiant, vouvoiement dans le formulaire établissement (tables de textes dans [ui-routes.md](./ui-routes.md#textes-des-erreurs-par-formulaire)).
- **Codes d'erreur par champ** : `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `INVALID_CHARS`, `INVALID_FORMAT`, `INVALID_CHOICE`, `TOO_MANY`, `DUPLICATE`.
- **Aucune donnée personnelle** n'est renvoyée, sauf à la personne qui vient de la saisir ou qui détient le `downloadToken`.

**Codes d'erreur transverses**

| HTTP | `data.code` | Quand |
|---|---|---|
| 400 | `REJECTED` | Robot : User-Agent suspect ou absent, champ `website` rempli, `startedAt` absent, trop récent (< 3 s) ou trop ancien (> 24 h). Aucune raison n'est donnée. |
| 400 | `VALIDATION` | Un ou plusieurs champs invalides : `data.errors` = `{ [champ]: codeChamp }` |
| 404 | `NO_EDITION` | Aucune édition publiée |
| 429 | `RATE_LIMITED` | Seuil dépassé (research R11) ; en-tête `Retry-After: <s>` |

---

## `GET /api/salm/status`

Donnée légère pour la navbar et le pied de page, sur toutes les pages publiques (FR-018). Utilisée par le composable `useSalmStatus()` (clé `useFetch` : `salm-status`).

**200**

```json
{ "published": true, "year": 2027 }
```

ou, sans édition publiée :

```json
{ "published": false, "year": null }
```

---

## `GET /api/salm/edition`

Contenu complet de l'édition publiée, pour `/salm` et les deux pages d'inscription. Rendu côté serveur.

**200**

```jsonc
{
  "edition": {
    "year": 2027,
    "salonName": "Salon International des Licences et Masters de Côte d'Ivoire",
    "tagline": "L'avenir se choisit maintenant !",
    "city": "Abidjan",
    "venue": null,                       // null → « Lieu à confirmer »
    "organizerName": "Sucrey Corporates Consulting",
    "whyTitle": "…", "whyText": "…",
    "audiences": [{ "title": "Licencié·e·s", "text": "Trouver le Master qui prolonge votre parcours" }],
    "contacts": [{ "kind": "phone", "value": "+225 07 68 011 409", "onBadge": true }],
    "poster": { "path": "/salm/2027/affiche.jpg", "alt": "…" },          // ou null
    "programPdfPath": null,
    "days": [
      {
        "date": "2027-03-12", "label": "Jour 1", "opensAt": "09:30", "closesAt": "16:00",
        "slots": [
          { "startTime": "11:00", "endTime": "11:10", "title": "Présentation du magazine Le Carré des Études",
            "description": null, "kind": "presentation", "isHighlighted": true }
        ]
      }
    ],
    "highlights": [{ "title": "LANCEMENT OFFICIEL", "imagePath": "/salm/2027/lancement.jpg", "imageAlt": "…" }],
    "standTypes": [{ "id": 3, "name": "STAND OR", "description": null, "priceLabel": null }],   // visibles uniquement
    "registration": {
      "students": { "open": true },      // toggle ET avant la fin du salon (FR-053)
      "schools":  { "open": true }
    },
    "timeline": {                          // dérivés côté serveur
      "opensAtIso": "2027-03-12T09:30:00Z",
      "endsAtIso": "2027-03-13T16:30:00Z",
      "hoursLabel": "9h30 – 16h30"
    }
  },
  "previous": {                            // édition précédente (FR-006), ou null
    "year": 2026,
    "recapVideo": { "youtubeId": "…", "posterPath": "/salm/2026/panel.jpg" },   // null si aucune vidéo
    "videos": [{ "youtubeId": "…", "title": null, "guest": null, "institution": null, "thumbnailUrl": "https://i.ytimg.com/vi/…/hqdefault.jpg" }],
    "photos": [{ "imagePath": "/salm/2026/stands.jpg", "alt": "Stands du SALM 2026", "caption": null }]
  }
}
```

**200 sans édition publiée** : `{ "edition": null, "previous": null }`. `/salm` affiche alors le message d'attente (FR-019), sans page d'erreur.

Champs **jamais** exposés : `id` de l'édition, `status`, `lastBadgeSeq`, `purgedStats`, les toggles bruts, toute inscription.

---

## `POST /api/salm/students`

Inscription étudiante, ou récupération implicite du badge quand le numéro existe déjà (FR-020 à FR-029).

**Champs acceptés (liste blanche)** : `fullName`, `phone`, `studyLevel`, `website`, `startedAt`.

```json
{ "fullName": "Kouassi Aya Marie", "phone": "07 12 34 56 78", "studyLevel": "Licence (Bac+3)", "website": "", "startedAt": 1790000000000 }
```

**Validation** (fonctions de `shared/utils/`, identiques côté client) :

| Champ | Règle | Codes |
|---|---|---|
| `fullName` | Obligatoire. Après réduction des espaces : 2 à 60 caractères, au moins 2 lettres, uniquement lettres Unicode (accents compris), espaces, `-`, `'`, `’`, `.` (FR-020a) | `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `INVALID_CHARS` |
| `phone` | Obligatoire, `normalizeIvorianPhone` ≠ `null` (01, 05, 07, 27) | `REQUIRED`, `INVALID_FORMAT` |
| `studyLevel` | ∈ `STUDY_LEVELS` | `REQUIRED`, `INVALID_CHOICE` |

**Traitement** :
1. Limitation de débit par IP.
2. Contrôles anti-robots.
3. Édition publiée ; sinon 404.
4. Validation.
5. Recherche d'une inscription existante par (édition, téléphone normalisé) :
   - **si elle existe** et que `nameMatchKey` est égal : **200** `existing`, même si les inscriptions sont fermées ;
   - **si elle existe** et que le nom diffère : on compte l'échec pour ce téléphone, puis **409** ;
   - **sinon**, si les inscriptions étudiantes ne sont pas ouvertes au sens effectif : **403** ;
   - **sinon**, création dans la transaction (research R4). Sur `P2002` (téléphone, en concurrence), on reprend à l'étape 5.

**201 `created`** / **200 `existing`**

```json
{
  "status": "created",
  "badge": {
    "number": "SALM27-000482",
    "fullName": "Kouassi Aya Marie",
    "studyLevel": "Licence (Bac+3)",
    "qrSvg": "<svg …>…</svg>",
    "downloadUrl": "/api/salm/badges/2bQm…22car"
  }
}
```

- `status: "existing"` : l'interface affiche son texte « déjà inscrit·e ». `fullName` et `studyLevel` sont ceux **enregistrés** ; le nom saisi est équivalent par construction.
- `qrSvg` est produit par le serveur (bibliothèque `qrcode`) et inséré par `v-html` : c'est une sortie de confiance, sans donnée utilisateur.

**Erreurs spécifiques**

| HTTP | `data.code` | Quand |
|---|---|---|
| 403 | `REGISTRATION_CLOSED` | Nouveau numéro alors que les inscriptions étudiantes sont fermées |
| 409 | `NAME_MISMATCH` | Numéro déjà inscrit sous un autre nom. Le nom enregistré n'est jamais renvoyé. |
| 429 | `RATE_LIMITED` | Aussi après 5 `NAME_MISMATCH` en 1 heure pour le même téléphone |

---

## `POST /api/salm/students/recover`

Récupération d'un badge quand les inscriptions sont fermées (formulaire réduit Nom & prénoms + téléphone). Mêmes contrôles anti-robots et mêmes limites.

**Champs acceptés** : `fullName`, `phone`, `website`, `startedAt` (mêmes règles que ci-dessus).

**Réponses** :

| HTTP | Contenu |
|---|---|
| 200 | `{ "status": "existing", "badge": { … } }`, même forme que ci-dessus |
| 404 `NOT_FOUND` | Aucune inscription pour ce numéro dans l'édition publiée |
| 409 `NAME_MISMATCH` | Comme ci-dessus |
| 400, 429 | Comme ci-dessus |

---

## `GET /api/salm/badges/:downloadToken`

PDF du badge (FR-030 à FR-031). `:downloadToken` fait 22 caractères base64url.

**200** :
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="badge-salm27-000482.pdf"`
- `Cache-Control: private, no-store`
- `X-Robots-Tag: noindex`

Corps : 2 pages de **100 × 150 mm exactement** (283,46 × 425,20 pt). QR code d'au moins 25 mm plus sa zone de silence. Nom entier, sans troncature (FR-030b). Caractères manquants remplacés par leur forme sans accent (FR-030c). Voir research R1 et R2.

**404** `BADGE_NOT_FOUND` : jeton inconnu, inscription supprimée ou données de l'édition supprimées.

---

## `GET /api/salm/verify/:verifyToken`

Page de vérification ouverte par le QR code (FR-028). **Aucune donnée personnelle.**

| HTTP | Contenu |
|---|---|
| 200, badge valide | `{ "valid": true, "edition": { "year": 2027, "salonName": "…" } }` |
| 200, badge invalide | `{ "valid": false, "edition": null }` : jeton inconnu, inscription supprimée ou données de l'édition supprimées. Pas de 404, afin que la page affiche un état « Badge invalide » maîtrisé. |

La feature C ajoutera, **sous `/api/admin/salm/*`**, la consultation détaillée pour le personnel authentifié. Elle ne concerne pas les exposants (FR-047).

---

## `POST /api/salm/schools`

Inscription d'un établissement (FR-040 à FR-047). Les 3 étapes sont gérées côté client, avec **un seul envoi** à la fin de l'étape 2. Aucun badge, numéro ni jeton n'est créé (FR-047).

**Champs acceptés (liste blanche)** : `name`, `phone`, `email`, `programmes`, `otherProgramme`, `exhibitors[].fullName`, `exhibitors[].contact`, `standTypeId`, `question`, `website`, `startedAt`. Les objets de `exhibitors` sont eux aussi réduits à leurs 2 champs.

```json
{
  "name": "Université [NOM]",
  "phone": "+225 27 22 00 00 00",
  "email": "contact@etablissement.ci",
  "programmes": ["LICENCE", "MASTER", "AUTRE"],
  "otherProgramme": "Certificats professionnels",
  "exhibitors": [ { "fullName": "Yao Konan", "contact": "07 00 00 00 01" } ],
  "standTypeId": 3,
  "question": "",
  "website": "",
  "startedAt": 1790000000000
}
```

**Validation**

| Champ | Règle | Codes |
|---|---|---|
| `name` | 2 à 150 caractères | `REQUIRED`, `TOO_SHORT`, `TOO_LONG` |
| `phone` | `normalizeIvorianPhone(…, { landline: true })` (01, 05, 07, 21, 25, 27) | `REQUIRED`, `INVALID_FORMAT` |
| `email` | Forme valide, 254 caractères au plus | `REQUIRED`, `INVALID_FORMAT`, `TOO_LONG` |
| `programmes` | Non vide, valeurs ∈ `SCHOOL_PROGRAMMES`, sans doublon | `REQUIRED`, `INVALID_CHOICE`, `DUPLICATE` |
| `otherProgramme` | Facultatif, 120 caractères au plus, ignoré si `AUTRE` n'est pas coché | `TOO_LONG` |
| `exhibitors` | 1 à 6 éléments | `REQUIRED`, `TOO_MANY` |
| `exhibitors.N.fullName` | 2 à 100 caractères | `REQUIRED`, `TOO_SHORT`, `TOO_LONG` |
| `exhibitors.N.contact` | Téléphone ivoirien valide (fixes admis) | `REQUIRED`, `INVALID_FORMAT` |
| `standTypeId` | Entier, type **visible** de l'édition publiée | `REQUIRED`, `INVALID_CHOICE` |
| `question` | Facultatif, 1 000 caractères au plus | `TOO_LONG` |

**201**

```json
{
  "status": "created",
  "summary": {
    "name": "Université [NOM]",
    "standName": "STAND OR",
    "exhibitorCount": 1,
    "programmes": ["LICENCE", "MASTER", "AUTRE"],
    "otherProgramme": "Certificats professionnels"
  }
}
```

**Erreurs** : 403 `REGISTRATION_CLOSED`, 400 `VALIDATION`, 400 `REJECTED`, 404 `NO_EDITION`, 429 `RATE_LIMITED`.

Aucune unicité n'est imposée (spec, Assumptions) et aucun e-mail n'est envoyé (FR-045).

---

## `GET /api/salm/agenda.ics`

Fichier calendrier de l'édition publiée, pour « Ajouter à mon agenda » (US3-8).

**200** :
- `Content-Type: text/calendar; charset=utf-8`
- `Content-Disposition: attachment; filename="salm-2027.ics"`

Contenu : un `VEVENT` par jour, avec `DTSTART` et `DTEND` en UTC (`20270312T093000Z`), `SUMMARY:SALM 2027 — Jour 1`, `LOCATION` (lieu ou « Lieu à confirmer, Abidjan ») et un `UID` stable (`salm-2027-2027-03-12@lecarredesetudes.com`).

**404** `NO_EDITION`.
