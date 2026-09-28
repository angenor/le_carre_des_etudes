# Contrat — API d'administration `/api/admin/salm/*`

**Authentification** : toutes les méthodes sur `/api/admin/*` exigent la session admin (`useSession(event, sessionConfig)` et `session.data.admin`). C'est la nouvelle règle `ADMIN_ALL_METHODS_PREFIXES` de `server/middleware/admin.ts` (research R13). Sans session, la réponse est celle du middleware existant :

```json
{ "statusCode": 401, "statusMessage": "Non autorisé", "data": { "message": "Non autorisé" } }
```

**Aucune route admin ne produit de badge pour un établissement ou un exposant** (FR-047) : les seules routes de badge sont `GET /api/salm/badges/:downloadToken` et `GET /api/admin/salm/students/:id/badge`, qui ne lisent que `SalmStudentRegistration`.

**Conventions** (identiques aux routes admin existantes) :
- Listes paginées : `{ data, total, page, limit }`, avec `page ≥ 1` (défaut 1) et `1 ≤ limit ≤ 100` (défaut 20).
- Erreurs : `createError({ statusCode, message, data: { code, errors? } })`.
- `:editionId` et `:id` sont des entiers ; toute autre valeur donne `400 INVALID_ID`.
- Inconnu : `404 NOT_FOUND` (« Édition introuvable. », « Inscription introuvable. »).

---

## Éditions et ouverture des inscriptions

### `GET /api/admin/salm/editions`

Sélecteur d'édition (FR-061) et en-tête du back-office.

**200**

```json
{
  "data": [
    {
      "id": 2, "year": 2027, "status": "published",
      "studentRegistrationOpen": true, "schoolRegistrationOpen": true,
      "endsAtIso": "2027-03-13T16:30:00Z", "ended": false,
      "counts": { "students": 482, "schools": 37 },
      "retention": { "deadlineIso": "2028-03-13T16:30:00Z", "exceeded": false, "canPurge": false, "purgedAt": null },
      "purgedStats": null
    },
    { "id": 1, "year": 2026, "status": "archived", "studentRegistrationOpen": false, "schoolRegistrationOpen": false, "endsAtIso": null, "ended": true,
      "counts": { "students": 0, "schools": 0 },
      "retention": { "deadlineIso": null, "exceeded": false, "canPurge": false, "purgedAt": null },
      "purgedStats": null }
  ],
  "defaultEditionId": 2
}
```

- Tri : `year` décroissant.
- `defaultEditionId` : l'édition publiée, sinon la plus récente.
- `ended` vaut `true` si la fin du salon est passée, ou si l'édition n'a pas de jours.
- `retention` (FR-065a, FR-065b) :
  - `deadlineIso` : fin du salon + 12 mois (`null` sans jours) ;
  - `exceeded` : date limite dépassée alors que des données subsistent ; le back-office l'affiche comme alerte ;
  - `canPurge` : `status = 'archived'`, salon terminé et données pas encore supprimées ;
  - `purgedAt` : date de la suppression, ou `null`.
- `purgedStats` : compteurs agrégés conservés après suppression (forme dans [data-model.md](../data-model.md#forme-de-purgedstats-fr-065b)), sinon `null`.

### `PATCH /api/admin/salm/editions/:editionId/registrations`

Ouverture et fermeture séparées (FR-050, FR-069).

**Requête** (au moins un champ) : `{ "studentRegistrationOpen": false }` ou `{ "schoolRegistrationOpen": true }`

**200** : `{ "studentRegistrationOpen": false, "schoolRegistrationOpen": true, "ended": false }`

**Erreurs** :
- 400 `VALIDATION` : aucun booléen fourni.
- 404.
- 409 `EDITION_ENDED` quand on tente d'**ouvrir** après la fin du salon : « Le salon est terminé : les inscriptions sont fermées automatiquement. » (FR-053). La fermeture reste toujours acceptée.

### `POST /api/admin/salm/editions/:editionId/purge`

Suppression des données personnelles d'une édition (FR-065b, décision D5 à valider).

**Requête** : `{ "confirmYear": 2026 }`. La valeur doit être égale à l'année de l'édition ; c'est la confirmation saisie dans l'interface.

**Traitement**, en une seule transaction :
1. Contrôler que l'édition est archivée, que le salon est terminé et que `personalDataPurgedAt` est `null`.
2. Calculer `purgedStats`.
3. Supprimer les `SalmStudentRegistration` et `SalmSchoolRegistration` de l'édition (exposants compris).
4. Renseigner `personalDataPurgedAt` et `purgedStats`.

`lastBadgeSeq` n'est pas modifié.

**200** : `{ "purgedAt": "…", "deleted": { "students": 4821, "schools": 41 }, "purgedStats": { … } }`

**Erreurs** :

| HTTP | `data.code` | Quand |
|---|---|---|
| 400 | `VALIDATION` | `confirmYear` absent |
| 400 | `CONFIRMATION_MISMATCH` | Année différente de celle de l'édition |
| 404 | | Édition introuvable |
| 409 | `EDITION_NOT_ARCHIVED` | Édition publiée ou en brouillon |
| 409 | `EDITION_NOT_ENDED` | Salon pas encore terminé |
| 409 | `ALREADY_PURGED` | Données déjà supprimées |

---

## Étudiant·e·s

### `GET /api/admin/salm/editions/:editionId/students`

Liste (FR-062).

**Paramètres de requête** :

| Paramètre | Rôle |
|---|---|
| `page`, `limit` | Pagination |
| `search` | Si, une fois retirés les espaces et `+`, il ne reste que des chiffres : recherche dans `phone` (préfixe `225` retiré). Sinon : `nameSearchKey(search)` recherché dans `nameSearch`. Insensible à la casse, aux accents et aux espaces. |
| `studyLevel` | ∈ `STUDY_LEVELS`, combinable avec `search` |
| `sortBy` | `createdAt` (défaut), `fullName` ou `badgeSeq` |
| `sortOrder` | `asc` ou `desc` (défaut) |

**200**

```json
{
  "data": [
    { "id": 912, "badgeNumber": "SALM27-000482", "fullName": "Kouassi Aya Marie", "phone": "07 12 34 56 78",
      "studyLevel": "Licence (Bac+3)", "createdAt": "2026-10-02T14:03:11.000Z" }
  ],
  "total": 1, "page": 1, "limit": 20,
  "grandTotal": 482
}
```

`total` compte les résultats filtrés, `grandTotal` l'ensemble de l'édition (compteur « 482 inscrit·e·s »).

### `GET /api/admin/salm/editions/:editionId/students/export`

CSV (FR-063). Mêmes paramètres `search` et `studyLevel` que la liste, sans pagination.

- En-têtes : `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="salm-2027-etudiants-AAAA-MM-JJ.csv"`.
- Format : BOM, séparateur `;`, `\r\n`, champs entre guillemets, neutralisation des formules (research R12).
- Colonnes : `N° de badge;Nom & prénoms;Téléphone;Niveau d'étude;Date d'inscription` (date au format `JJ/MM/AAAA HH:MM`, heure d'Abidjan).

### `GET /api/admin/salm/students/:id/badge`

Même PDF que la route publique (FR-064), généré par le même utilitaire. Mêmes en-têtes ; 404 si l'inscription est introuvable.

### `DELETE /api/admin/salm/students/:id`

Suppression d'un doublon (FR-065). La confirmation se fait côté interface (double clic, comme `newsletter.vue`).

**200** : `{ "success": true }`. Les deux jetons deviennent invalides et `lastBadgeSeq` n'est pas modifié.

**404** si introuvable.

---

## Établissements

### `GET /api/admin/salm/editions/:editionId/schools`

Liste (FR-066).

**Paramètres de requête** :

| Paramètre | Rôle |
|---|---|
| `page`, `limit` | Pagination |
| `status` | ∈ `nouvelle`, `contactee`, `confirmee`, `annulee` |
| `search` | Nom de l'établissement ou e-mail (`contains`, insensible à la casse ASCII) |
| `sortBy` | `createdAt` (défaut) ou `name` |
| `sortOrder` | `asc` ou `desc` |

**200**

```json
{
  "data": [
    { "id": 41, "name": "Université [NOM]", "standName": "STAND OR", "exhibitorCount": 2,
      "status": "nouvelle", "hasNote": false, "createdAt": "2026-10-05T09:12:00.000Z" }
  ],
  "total": 1, "page": 1, "limit": 20,
  "countsByStatus": { "nouvelle": 20, "contactee": 9, "confirmee": 7, "annulee": 1 }
}
```

### `GET /api/admin/salm/schools/:id`

Fiche (FR-067).

**200**

```json
{
  "id": 41, "editionYear": 2027,
  "name": "Université [NOM]", "phone": "27 22 00 00 00", "email": "contact@etablissement.ci",
  "programmes": ["LICENCE", "MASTER", "AUTRE"], "otherProgramme": "Certificats professionnels",
  "exhibitors": [{ "fullName": "Yao Konan", "contact": "07 00 00 00 01" }],
  "stand": { "id": 3, "name": "STAND OR", "isVisible": true },
  "question": null,
  "status": "contactee", "internalNote": "Rappeler lundi.",
  "createdAt": "…", "updatedAt": "…"
}
```

### `PATCH /api/admin/salm/schools/:id`

Suivi (FR-067).

**Requête** (au moins un champ) : `{ "status": "contactee", "internalNote": "Rappeler lundi." }`
- `status` ∈ les 4 valeurs.
- `internalNote` : chaîne de 2 000 caractères au plus ; une chaîne vide efface la note (`null`).

**200** : la fiche à jour (même forme que `GET`).

**Erreurs** : 400 `VALIDATION` (`errors.status`, `errors.internalNote`), 404.

### `DELETE /api/admin/salm/schools/:id`

Suppression d'une inscription établissement complète, exposants compris (FR-067a). La confirmation se fait côté interface. Aucune route ne permet de modifier les exposants.

**200** : `{ "success": true }`. **404** si l'inscription est introuvable.

### `GET /api/admin/salm/editions/:editionId/exhibitors/export`

« Liste des exposants » pour le pointage à l'accueil exposants (FR-068a, décision D13 à valider).

- Une ligne par exposant des inscriptions **non annulées**, triée par établissement puis par ordre de saisie.
- Nom de fichier : `salm-2027-exposants-AAAA-MM-JJ.csv`.
- Colonnes : `Établissement;Stand;Nom & prénoms;Contact` (contact au format `07 00 00 00 01`).
- Même format CSV que les autres exports (BOM, `;`, anti-formule).

### `GET /api/admin/salm/editions/:editionId/schools/export`

CSV (FR-068). Mêmes filtres `status` et `search` ; même format que l'export des étudiants.

- Nom de fichier : `salm-2027-etablissements-AAAA-MM-JJ.csv`.
- Colonnes : `Établissement;Téléphone;E-mail;Programmes;Précision « Autre »;Stand;Nombre d'exposants;Exposants;Statut;Note interne;Question;Date d'inscription`.
- `Programmes` : valeurs jointes par ` · `.
- `Exposants` : `Nom (contact)` joints par ` | `.
- `Statut` : libellé français.
