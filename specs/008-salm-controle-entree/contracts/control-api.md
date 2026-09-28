# Contrat — API du contrôle d'entrée `/api/admin/salm/control/*`

**Feature** : `008-salm-controle-entree` · Research : R4, R5, R9, R12, R13

Toutes ces routes sont sous `/api/admin/` : **toute méthode est protégée** par `server/middleware/admin.ts` (401 sans session admin), et elles restent accessibles en mode maintenance (`server/middleware/maintenance.ts`). Elles portent toujours sur l'**édition publiée** : aucun `editionId` n'est accepté (FR-202).

## Conventions

- **Erreurs** : `adminError(status, code, message)` (forme de `server/utils/salm-admin.ts`) ; le client affiche ses propres textes à partir de `data.code`. Codes communs :
  - `401` : session absente ou expirée (middleware) ;
  - `404 NO_PUBLISHED_EDITION` : aucune édition publiée ;
  - `400 VALIDATION`, avec `data.errors` par champ (même forme que 006).
- **Heures** : ISO 8601 UTC dans les réponses ; le client affiche `HH:MM` (heure d'Abidjan = UTC).
- **Aucun téléphone** d'inscrit·e dans les réponses (FR-230). Aucun `verifyToken` ni `downloadToken`, sauf l'empreinte `h` de la précharge.
- `Cache-Control: private, no-store` sur toutes les réponses.

### Objet `ControlPerson`

```jsonc
{ "registrationId": 812, "fullName": "Kouassi Aya Marie", "studyLevel": "Licence (Bac+3)", "badgeNumber": "SALM27-000482" }
```

### Objet `ControlDay`

```jsonc
{ "id": 14, "label": "Jour 1", "date": "2027-03-12" }
```

### Objet `ControlResult`

Réponse commune à l'enregistrement d'une entrée (scan ou fiche) et à l'inscription sur place.

```jsonc
{
  "status": "entered",          // "entered" | "already" | "refused" | "valid_trial"
  "reason": null,               // si "refused" : "OTHER_EDITION" | "INVALID"
  "otherEditionYear": null,     // si reason = "OTHER_EDITION" : 2026
  "day": { "id": 14, "label": "Jour 1", "date": "2027-03-12" },   // null en mode essai
  "person": { /* ControlPerson */ },                               // absent si "refused" (FR-207)
  "entry": { "id": 5531, "enteredAt": "2027-03-12T09:42:10.000Z" },// si "entered" ou "already"
  "counters": [ { "dayId": 14, "entries": 1205 }, { "dayId": 15, "entries": 0 } ]
}
```

| `status` | Condition | Écriture |
|---|---|---|
| `entered` | Badge de l'édition publiée, jour de salon, pas encore d'entrée ce jour | 1 `SalmEntry` créée |
| `already` | Entrée existante ce jour (y compris gagnée par un autre poste au même instant, R4) | aucune |
| `refused` / `OTHER_EDITION` | Jeton connu, inscription d'une autre édition que la publiée | aucune |
| `refused` / `INVALID` | Jeton au bon format mais inconnu (inscription supprimée, données de l'édition supprimées) | aucune |
| `valid_trial` | Badge de l'édition publiée, **aucun jour de salon aujourd'hui** (mode essai, FR-212) | aucune |

Le cas « Ce QR code n'est pas un badge SALM » (`NOT_A_BADGE`) est traité **par le client**, sans appel (`extractVerifyToken`, R10). Le serveur répond `refused` / `INVALID` si un jeton mal formé lui parvient.

---

## `GET /api/admin/salm/control/snapshot`

Précharge du poste (FR-232). Appelée à l'ouverture de la page, puis toutes les 5 minutes en ligne.

**200** :

```jsonc
{
  "serverTime": "2027-03-12T08:01:00.000Z",
  "edition": { "id": 3, "year": 2027, "endsAt": "2027-03-13T16:30:00.000Z" },
  "days": [ { "id": 14, "label": "Jour 1", "date": "2027-03-12" }, { "id": 15, "label": "Jour 2", "date": "2027-03-13" } ],
  "todayDayId": 14,                                 // null → mode essai
  "badges": [ { "h": "Qm9uam91ci4uLg", "seq": 482, "name": "Kouassi Aya Marie", "level": "Licence (Bac+3)" } ],
  "entries": [ { "id": 5531, "h": "Qm9uam91ci4uLg", "dayId": 14, "at": "2027-03-12T09:42:10.000Z" } ],
  "counters": [ { "dayId": 14, "entries": 1205 }, { "dayId": 15, "entries": 0 } ],
  "registration": { "url": "https://lecarredesetudes.com/inscription", "qrSvg": "<svg …/>" }
}
```

- `h` : `base64url(SHA-256(verifyToken)[0..16])`. Le client calcule la même empreinte avec `crypto.subtle.digest` (fonction partagée `badgeTokenHash`, `shared/utils/salm-control.ts`).
- `badges` : **uniquement** les inscriptions de l'édition publiée. Sans téléphone.
- `404 NO_PUBLISHED_EDITION` : la page affiche « Aucune édition SALM publiée : rien à contrôler » (edge case).

## `GET /api/admin/salm/control/state?afterId=<int>`

Rafraîchissement entre postes toutes les 15 s (FR-224, FR-236).

**200** :

```jsonc
{
  "serverTime": "…",
  "todayDayId": 14,
  "counters": [ { "dayId": 14, "entries": 1210 }, { "dayId": 15, "entries": 0 } ],
  "entries": [ { "id": 5532, "h": "…", "dayId": 14, "at": "…" } ],   // id > afterId, 500 au plus, par id croissant
  "hasMore": false
}
```

Les annulations ne sont pas transmises ici. Elles disparaissent du poste à la précharge suivante (R5).

## `POST /api/admin/salm/control/entries`

Enregistre l'entrée du jour, en ligne (FR-205 à FR-215, FR-220).

**Corps (liste blanche)**, exactement un des deux :

| Champ | Type | Cas |
|---|---|---|
| `token` | string, `^[A-Za-z0-9_-]{22}$` | Scan du QR code : `mode = 'scan'` |
| `registrationId` | int | Bouton « Valider l'entrée » d'une fiche (saisie manuelle, « Contrôler ce badge ») : `mode = 'manual'` |

**200** : `ControlResult`.

**Erreurs** :
- `400 VALIDATION` : ni `token` ni `registrationId`, ou les deux ;
- `404 NOT_FOUND` : `registrationId` inconnu ou d'une autre édition (fiche périmée).

Idempotence : un second appel identique renvoie `already` avec la même heure.

## `DELETE /api/admin/salm/control/entries/:id`

Annule une entrée du **jour contrôlé** (FR-217).

- **200** : `{ "counters": [ … ] }`.
- **404 NOT_FOUND** : entrée inconnue ou déjà annulée.
- **409 NOT_TODAY** : le jour de l'entrée n'est pas la date du jour.

## `GET /api/admin/salm/control/lookup`

Fiche d'un·e inscrit·e, **sans rien enregistrer** : saisie manuelle (FR-218 à FR-221) et page `/salm/v/:token` d'un admin connecté (FR-223).

**Paramètres**, exactement un :

| Paramètre | Interprétation (fonction partagée `parseControlQuery`) |
|---|---|
| `q` | Numéro de badge : `SALM27-000482`, `salm27 482`, `000482` ou `482` (préfixe différent de l'édition publiée : aucun résultat). Sinon, téléphone ivoirien normalisé par `normalizeIvorianPhone` (FR-021 de 006). Sinon, `400 INVALID_QUERY` |
| `token` | Jeton de vérification. Toutes éditions : il sert à afficher la validité à l'admin |

**200** :

```jsonc
{
  "found": true,
  "validity": "valid",                  // "valid" | "other_edition" | "invalid" (token seulement)
  "otherEditionYear": null,
  "person": { /* ControlPerson */ },    // absent si validity ≠ "valid"
  "today": { "day": { /* ControlDay */ }, "entry": { "id": 5531, "enteredAt": "…" } }   // entry null si pas encore entré·e ; day null en mode essai
}
```

`{ "found": false }` pour un `q` sans résultat dans l'édition publiée, sans autre détail (FR-221).

## `POST /api/admin/salm/control/sync`

Envoi des entrées enregistrées hors ligne (FR-234, FR-235).

**Corps** :

```jsonc
{
  "entries": [
    { "clientId": "b1f4…", "seq": 517, "dayId": 14, "scannedAt": "2027-03-12T09:55:02.000Z", "mode": "scan" },
    { "clientId": "c9a0…", "seq": 482, "dayId": 14, "scannedAt": "…", "mode": "manual" }
  ]
}
```

- 1 à 200 éléments. `clientId` : chaîne de 1 à 64 caractères, unique par poste, qui sert seulement à relier les statuts renvoyés aux éléments de la file.
- Chaque élément désigne le badge par son **numéro** `seq` (entier ≥ 1, dans l'édition publiée), **jamais par son jeton** : le poste a lu le numéro dans la précharge au moment du scan (R5). Un champ `token` éventuel est ignoré (liste blanche).
- `scannedAt` est **borné** à `[date du jour 00:00Z, min(maintenant, date du jour 23:59:59Z)]` (R9).

**200** :

```jsonc
{
  "results": [
    { "clientId": "b1f4…", "status": "created" },       // nouvelle entrée
    { "clientId": "c9a0…", "status": "merged" },        // entrée existante ; enteredAt = min(existant, reçu)
    { "clientId": "…",     "status": "ignored", "reason": "UNKNOWN_BADGE" }   // ou OUT_OF_EDITION, INVALID_ITEM
  ],
  "counters": [ … ]
}
```

Le client retire de sa file **tous** les éléments présents dans `results`, quel que soit leur statut. Une erreur 5xx ou réseau conserve la file intacte.

## `POST /api/admin/salm/control/registrations`

Inscription sur place par l'équipe, puis entrée du jour (FR-242 à FR-246).

**Corps (liste blanche)** : `fullName`, `phone`, `studyLevel`, `informed`.
- Même validation que `POST /api/salm/students` (FR-020 à FR-022 de 006), mêmes codes d'erreur.
- `informed` doit valoir `true`, sinon `errors.informed = 'REQUIRED'`.
- **Aucun** contrôle anti-robot.

**Réponses** :
- **201** : `ControlResult` (`status: "entered"`), avec en plus `"created": true`. L'inscription est créée avec `origin = 'onsite'`.
- **200** : téléphone déjà inscrit à l'édition publiée. `{ "created": false, "lookup": { /* réponse de GET lookup */ } }` : rien n'est créé ni modifié (FR-245).
- **201** avec `"entryError": "INTERNAL"` : l'inscription est créée mais l'entrée n'a pas pu être écrite ; le client propose « Valider l'entrée » sur la fiche.
- **409 NOT_A_SALON_DAY** : pas de jour de salon aujourd'hui (FR-246). L'interrupteur des inscriptions publiques n'est **pas** consulté.
- **400 VALIDATION**.

## `GET /api/admin/salm/control/poster`

Données de l'affiche d'inscription imprimable (FR-241) : `{ "year": 2027, "url": "https://lecarredesetudes.com/inscription", "qrSvg": "<svg …/>" }`. Disponible même en mode essai.
