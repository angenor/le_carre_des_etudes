# Contrat — API d'administration des éditions et des contenus

**Préfixe** : `/api/admin/salm`. **Authentification** : session admin exigée pour toutes les méthodes par `server/middleware/admin.ts` (`ADMIN_ALL_METHODS_PREFIXES`). Sans session : `401` du middleware, inchangé.

**Conventions** (identiques au [contrat de la feature A](../../006-salm-inscriptions/contracts/admin-api.md)) :
- Erreurs : `createError({ statusCode, message: code, data: { code, errors?, count? } })` ; l'interface traduit les codes (`app/utils/salm-admin-errors.ts`).
- `:editionId` et `:id` sont des entiers (`400 INVALID_ID` sinon) ; ressource inconnue : `404 NOT_FOUND`.
- Validation : `400 VALIDATION` avec `errors: Record<champ, SalmFieldError | 'FILE_NOT_FOUND'>`. Les champs de tableaux sont nommés `contacts.2.value`, `audiences.0.title`.
- Corps : liste blanche de champs, tout autre champ est ignoré. Règles détaillées : [data-model.md § 4](../data-model.md#4-règles-de-validation-des-écritures-admin).
- Une écriture qui remplace ou retire un fichier libère l'ancien après validation ([research R3](../research.md#r3-nettoyage-des-fichiers-uploadés)).
- Noms de fichiers Nitro : même segment dynamique pour un même niveau (`days/[id].patch.ts` et `days/[id]/slots/…`), comme `students/[id]` dans la feature A.

Récapitulatif des routes :

| # | Méthode et chemin | Rôle | FR |
|---|---|---|---|
| 1 | `GET /editions` | Liste (étendue) | FR-110 |
| 2 | `POST /editions` | Créer | FR-111 |
| 3 | `GET /editions/:editionId` | Fiche complète | FR-112 à FR-173 |
| 4 | `PATCH /editions/:editionId` | Infos, textes, fichiers, contacts, publics, vidéo récapitulative | FR-112, FR-141 à FR-145, FR-161 |
| 5 | `DELETE /editions/:editionId` | Supprimer un brouillon | FR-119 |
| 6 | `POST /editions/:editionId/publish` | Publier | FR-115, FR-115a, FR-116 |
| 7 | `POST /editions/:editionId/archive` | Archiver | FR-117 |
| 8 | `POST /editions/:editionId/duplicate` | Dupliquer | FR-180 à FR-184 |
| 9 | `GET /editions/:editionId/preview` | Données de l'aperçu | FR-120 |
| 10 | `GET /editions/:editionId/stats` | Statistiques | FR-190 à FR-196 |
| 11 | `GET /summary` | Encart du tableau de bord | FR-197a |
| 12–14 | `POST /editions/:editionId/days`, `PATCH /days/:id`, `DELETE /days/:id` | Jours | FR-150, FR-151, FR-155 |
| 15–18 | `POST /days/:id/slots`, `PUT /days/:id/slots/order`, `PATCH /slots/:id`, `DELETE /slots/:id` | Créneaux | FR-152 à FR-154 |
| 19–22 | `POST /editions/:editionId/highlights`, `PUT …/highlights/order`, `PATCH /highlights/:id`, `DELETE /highlights/:id` | Temps forts | FR-146 |
| 23–26 | `POST /editions/:editionId/videos`, `PUT …/videos/order`, `PATCH /videos/:id`, `DELETE /videos/:id` | Vidéos du canapé | FR-162 |
| 27–30 | `POST /editions/:editionId/photos`, `PUT …/photos/order`, `PATCH /photos/:id`, `DELETE /photos/:id` | Photos | FR-163, FR-164 |
| 31–34 | `POST /editions/:editionId/stand-types`, `PUT …/stand-types/order`, `PATCH /stand-types/:id`, `DELETE /stand-types/:id` | Types de stands | FR-170 à FR-172 |
| — | `POST /api/upload` (catégorie `salm`) | Envoi de fichier (modifié) | FR-132, FR-143, FR-163 |

---

## 1. `GET /editions` (étendu)

Même réponse que dans la feature A (`SalmAdminEditionsResponse`), avec des champs **ajoutés** à chaque élément. Aucun champ existant n'est modifié : l'en-tête et les pages d'inscription continuent de fonctionner.

```json
{
  "data": [
    {
      "id": 3, "year": 2028, "status": "draft",
      "studentRegistrationOpen": false, "schoolRegistrationOpen": false,
      "endsAtIso": "2028-03-11T16:30:00Z", "ended": false,
      "counts": { "students": 0, "schools": 0 },
      "retention": { "deadlineIso": "2029-03-11T16:30:00Z", "exceeded": false, "canPurge": false, "purgedAt": null },
      "purgedStats": null,
      "venue": null, "city": "Abidjan",
      "firstDay": "2028-03-10", "lastDay": "2028-03-11", "dayCount": 2,
      "yearLocked": false, "canDelete": true, "canPublish": true
    }
  ],
  "defaultEditionId": 2
}
```

## 2. `POST /editions`

**Requête** : `{ "year": 2028, "organizerName"?: "…" }`

**201** : la fiche (forme du § 3). Statut `draft`, interrupteurs fermés. `salonName`, `organizerName` et `city` sont préremplis par l'édition d'année la plus élevée. S'il n'existe aucune édition, `salonName` et `city` prennent les valeurs par défaut du schéma, et `organizerName`, qui n'a pas de valeur par défaut, doit être fourni.

**Erreurs** : `400 VALIDATION` (`errors.year` : `REQUIRED`, `INVALID_FORMAT` ; `errors.organizerName` : `REQUIRED` quand aucune édition n'existe) ; `409 YEAR_TAKEN`.

## 3. `GET /editions/:editionId`

Fiche complète pour les écrans (`SalmAdminEditionDetail`).

```json
{
  "id": 3, "year": 2028, "status": "draft",
  "salonName": "Salon International des Licences et Masters de Côte d'Ivoire",
  "organizerName": "Sucrey Corporates Consulting", "city": "Abidjan", "venue": null,
  "tagline": "L'avenir se choisit maintenant !",
  "whyTitle": "…", "whyText": "…",
  "audiences": [{ "title": "Licencié·e·s", "text": "…" }],
  "contacts": [{ "kind": "phone", "value": "+225 07 68 01 14 09", "onBadge": true }],
  "poster": null,
  "programPdfPath": null,
  "recap": { "youtubeUrl": null, "youtubeId": null, "posterPath": null },
  "days": [
    { "id": 11, "date": "2028-03-10", "label": "Jour 1", "opensAt": "09:30", "closesAt": "16:00",
      "slots": [
        { "id": 81, "startTime": "11:00", "endTime": "11:10", "title": "Présentation du magazine Le Carré des Études",
          "kind": "presentation", "description": null, "isHighlighted": true }
      ] }
  ],
  "highlights": [{ "id": 21, "title": "LANCEMENT OFFICIEL", "imagePath": "/images/salm/2027/lancement.jpg", "imageAlt": "…" }],
  "videos": [],
  "photos": [],
  "standTypes": [{ "id": 7, "name": "STAND OR", "description": null, "priceLabel": null, "isVisible": true, "schoolCount": 0 }],
  "counts": { "students": 0, "schools": 0 },
  "yearLocked": false, "canDelete": true, "canPublish": true, "ended": false,
  "registrationOpen": { "students": false, "schools": false },
  "previousEdition": { "id": 2, "year": 2027 },
  "nextEditionYear": 2029
}
```

- Listes triées par `sortOrder`, puis `id` ; jours par date.
- `poster` : `{ "path", "alt" } | null`. `videos[]` : `{ id, youtubeUrl, youtubeId, title, guest, institution }`. `photos[]` : `{ id, imagePath, alt, caption }`.
- `registrationOpen` : ouverture effective (interrupteur, sauf si le salon est terminé), pour l'avertissement FR-173.

## 4. `PATCH /editions/:editionId`

**Requête** : au moins un des champs `year`, `salonName`, `organizerName`, `city`, `venue`, `tagline`, `whyTitle`, `whyText`, `audiences`, `contacts`, `posterPath`, `posterAlt`, `programPdfPath`, `recapVideoUrl`, `recapPosterPath`. Un champ absent n'est pas modifié ; `null` ou `""` efface un champ facultatif. `audiences` et `contacts` remplacent le tableau entier (ordre compris).

**200** : la fiche à jour (§ 3).

**Erreurs** : `400 VALIDATION` ; `409 YEAR_LOCKED` ; `409 YEAR_TAKEN`. Les champs `status`, interrupteurs, `lastBadgeSeq` et purge sont ignorés.

## 5. `DELETE /editions/:editionId`

**200** : `{ "success": true }`. Tous les fichiers de l'édition sont libérés (R3). **Erreurs** : `409 EDITION_NOT_DELETABLE` si `canDelete` est faux ; `404`.

## 6. `POST /editions/:editionId/publish`

Transaction décrite en [research R4](../research.md#r4-unicité-de-lédition-publiée-et-transitions-de-statut). Corps vide ; la confirmation se fait côté interface.

**200** : `{ "published": { "id": 3, "year": 2028 }, "archived": [{ "id": 2, "year": 2027 }] }` (`archived` est vide s'il n'y avait pas d'édition publiée, ou si l'édition l'était déjà).

**Erreurs** : `409 NO_DAYS` ; `409 EDITION_ENDED` (archivée dont le salon est terminé) ; `404`.

## 7. `POST /editions/:editionId/archive`

**200** : `{ "id": 2, "year": 2027, "status": "archived", "wasPublished": true }`. **Erreurs** : `409 ALREADY_ARCHIVED` ; `404`.

## 8. `POST /editions/:editionId/duplicate`

**201** : `{ "id": 4, "year": 2028, "copied": { "days": 2, "slots": 12, "highlights": 5, "standTypes": 3, "contacts": 4 } }`

**Erreurs** : `409 YEAR_TAKEN` (`data.year` = année cible) ; `404`. Correspondance des champs : [research R5](../research.md#r5-duplication-dune-édition).

## 9. `GET /editions/:editionId/preview`

**200** : exactement la forme publique `SalmEditionResponse` (`{ edition, previous }`) de `GET /api/salm/edition`, calculée pour cette édition quel que soit son statut, par la même fonction `loadEditionPayload` ([research R6](../research.md#r6-prévisualisation-dune-édition-non-publiée)). Types de stands visibles seulement, comme en public. En-tête `Cache-Control: private, no-store`.

## 10. `GET /editions/:editionId/stats`

**200** (`SalmAdminStats`) :

```json
{
  "edition": { "id": 2, "year": 2027, "opensAtIso": "2027-03-12T09:30:00Z" },
  "source": "live", "purgedAt": null,
  "stats": {
    "computedAt": "2027-02-01T10:00:00.000Z",
    "students": { "total": 482, "byStudyLevel": { "Licence (Bac+3)": 210 }, "byRegistrationDay": { "2026-10-02": 132 } },
    "schools": { "total": 37, "byStandType": { "STAND OR": 20 }, "byStatus": { "nouvelle": 20, "contactee": 9, "confirmee": 7, "annulee": 1 }, "exhibitors": 81 }
  },
  "standTypes": [{ "name": "STAND OR", "isVisible": true }, { "name": "STAND DIAMANT", "isVisible": true }, { "name": "STAND PREMIUM", "isVisible": false }],
  "comparison": {
    "year": 2026, "opensAtIso": null, "source": "purged", "purgedAt": "2027-04-02T10:00:00.000Z",
    "stats": { "…": "même forme" }
  }
}
```

- `stats` : `computePurgedStats` (exposants des inscriptions non annulées) pour `source = live`, `purgedStats` pour `source = purged`.
- `comparison` : règle `comparisonEdition` ([data-model § 3](../data-model.md#3-valeurs-dérivées-ajoutées-non-stockées)), ou `null`.
- `opensAtIso` est `null` sans jours : pas de courbe alignée pour cette édition.
- Aucune donnée personnelle (FR-196). `Cache-Control: private, no-store`.

## 11. `GET /summary`

**200** : `null` sans édition publiée, sinon :

```json
{ "year": 2027, "students": 482, "schools": 37, "comparison": { "year": 2026, "students": 431, "schools": 30 } }
```

`comparison` suit la même règle qu'au § 10 (`purgedStats` si l'édition de comparaison a été purgée), ou vaut `null`.

## 12–14. Jours

- `POST /editions/:editionId/days` — `{ "date": "2028-03-10", "label"?: "Jour 1", "opensAt": "09:30", "closesAt": "16:00" }` → **201** le jour. `label` absent : « Jour N » selon la position par date.
- `PATCH /days/:id` — mêmes champs, au moins un → **200** le jour.
- `DELETE /days/:id` → **200** `{ "success": true, "deletedSlots": 7 }`.

Toute écriture recalcule `sortOrder` des jours de l'édition par date. **Erreurs** : `400 VALIDATION` (`date` : `INVALID_FORMAT` ou `DUPLICATE` ; `closesAt` : `INVALID_FORMAT` si elle n'est pas postérieure à `opensAt`) ; `409 LAST_DAY_OF_PUBLISHED`.

L'avertissement « badges déjà émis » (FR-155) est affiché par l'interface à partir de `counts.students` de la fiche ; l'API ne bloque pas.

## 15–18. Créneaux

- `POST /days/:id/slots` — `{ startTime, endTime, title, kind, description?, isHighlighted? }` → **201** le créneau, placé en fin de jour.
- `PUT /days/:id/slots/order` — `{ "ids": [83, 81, 82] }` → **200** `{ "ids": [83, 81, 82] }`.
- `PATCH /slots/:id` — mêmes champs que la création, au moins un → **200**.
- `DELETE /slots/:id` → **200** `{ "success": true }`.

**Erreurs** : `400 VALIDATION` (`endTime` : `INVALID_FORMAT` si elle n'est pas postérieure à `startTime` ; `kind` : `INVALID_CHOICE`) ; `400 ORDER_MISMATCH`.

Les chevauchements ne sont **jamais** une erreur : l'interface les calcule avec `findSlotOverlaps`.

## 19–30. Temps forts, vidéos et photos (même forme)

| Liste | Création (`POST /editions/:editionId/<liste>`) | Modification (`PATCH /<liste>/:id`) |
|---|---|---|
| `highlights` | `{ title, imagePath, imageAlt? }` | mêmes champs |
| `videos` | `{ youtubeUrl, title?, guest?, institution? }` | mêmes champs |
| `photos` | `{ imagePath, alt?, caption? }` | `{ alt?, caption? }` (image non remplaçable : supprimer puis ajouter) |

- **201 / 200** : l'élément. `alt` et `imageAlt` absents sont préremplis ([data-model § 4](../data-model.md#4-règles-de-validation-des-écritures-admin)).
- Vidéos : la réponse peut porter `"warnings": ["DUPLICATE_VIDEO"]` ; l'enregistrement a bien eu lieu.
- `PUT /editions/:editionId/<liste>/order` — `{ "ids": [...] }` (liste complète) → **200**.
- `DELETE /<liste>/:id` → **200** `{ "success": true }` ; le fichier est libéré s'il n'est plus référencé.

**Erreurs** : `400 VALIDATION` (`imagePath` : `INVALID_FORMAT` ou `FILE_NOT_FOUND` ; `youtubeUrl` : `INVALID_FORMAT`) ; `400 ORDER_MISMATCH`.

## 31–34. Types de stands

- `POST /editions/:editionId/stand-types` — `{ name, description?, priceLabel?, isVisible? }` → **201**.
- `PATCH /stand-types/:id` — mêmes champs, au moins un → **200** (`schoolCount` inclus). Masquer ou réafficher = `{ "isVisible": false }`.
- `PUT /editions/:editionId/stand-types/order` — `{ "ids": [...] }` → **200**.
- `DELETE /stand-types/:id` → **200** `{ "success": true }`.

**Erreurs** : `400 VALIDATION` (`name` : `DUPLICATE` sans tenir compte de la casse) ; `409 STAND_TYPE_IN_USE` avec `data.count` (nombre d'établissements).

---

## `POST /api/upload` — catégorie `salm` (modifié)

Route existante, protégée par le middleware admin. Seules les règles de la catégorie `salm` sont nouvelles ; les autres catégories ne changent pas.

**Requête** : `multipart/form-data`, champs dans cet ordre : `category=salm`, `kind=image|pdf` (défaut `image`), puis `file`.

| `kind` | Formats (contenu réel) | Poids maximal |
|---|---|---|
| `image` | JPEG, PNG, WebP (`sharp().metadata().format`) | 5 Mo |
| `pdf` | signature `%PDF-` | 10 Mo |

**201** : `{ "path": "/uploads/salm/1759050000000-affiche-2028.jpg", "ogPath": null }`

**Erreurs** (catégorie `salm` uniquement, avec `data.code`) : `413 FILE_TOO_LARGE` ; `415 UNSUPPORTED_FORMAT` ; `422 CORRUPTED_FILE`. Le fichier refusé est supprimé du disque.

---

## Routes publiques

`GET /api/salm/edition` : **réponse inchangée**. Son implémentation passe par `loadEditionPayload({ status: 'published' })` ([research R6](../research.md#r6-prévisualisation-dune-édition-non-publiée)). Aucune autre route publique ne change.
