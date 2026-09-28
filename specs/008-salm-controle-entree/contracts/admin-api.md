# Contrat — routes existantes modifiées

**Feature** : `008-salm-controle-entree` · Research : R12, R14, R15

Ce document décrit les **écarts** par rapport aux contrats de la feature A ([`specs/006-salm-inscriptions/contracts/admin-api.md`](../../006-salm-inscriptions/contracts/admin-api.md) et [`public-api.md`](../../006-salm-inscriptions/contracts/public-api.md)). Les routes nouvelles sont dans [control-api.md](./control-api.md).

---

## `GET /api/admin/salm/editions/:editionId/students` (modifiée)

**Nouveau paramètre de requête** :

| Paramètre | Valeurs | Effet |
|---|---|---|
| `presence` | `present:<dayId>` · `absent:<dayId>` | Filtre sur la présence un jour donné (FR-226), combiné à `search` et `studyLevel` dans `studentWhere()`. Un `dayId` qui n'appartient pas à l'édition est ignoré |

**Réponse : champs ajoutés**

```jsonc
{
  "data": [
    {
      "id": 812,
      "badgeNumber": "SALM27-000482",
      "fullName": "Kouassi Aya Marie",
      "phone": "07 12 34 56 78",
      "studyLevel": "Licence (Bac+3)",
      "createdAt": "…",
      "origin": "online",                              // nouveau : "online" | "onsite"
      "entries": { "14": "2027-03-12T09:42:10.000Z" }  // nouveau : heure d'entrée par dayId ; jour absent = pas d'entrée
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 20,
  "grandTotal": 482,
  "days": [                                            // nouveau : jours de salon de l'édition, par date
    { "id": 14, "label": "Jour 1", "date": "2027-03-12", "entries": 1204 },
    { "id": 15, "label": "Jour 2", "date": "2027-03-13", "entries": 987 }
  ]
}
```

- `days[].entries` compte **toutes** les entrées du jour de l'édition, indépendamment des filtres (FR-225). Le compteur de résultats reste `total`.
- Une édition dont les données ont été supprimées : `data` est vide et `days[].entries` vaut 0. Les compteurs conservés sont lus ailleurs (statistiques).

## `GET /api/admin/salm/editions/:editionId/students/export` (modifiée)

- Même paramètre `presence` que la liste (FR-227).
- **Colonnes ajoutées**, à la suite des colonnes existantes :

| En-tête | Valeur |
|---|---|
| `Origine` | `En ligne` · `Sur place` |
| `Présent <label> (<JJ/MM/AAAA>)`, une colonne par jour de salon, par date croissante (ex. `Présent Jour 1 (12/03/2027)`) | `Oui` · `Non` |

Les colonnes de jour sont présentes même sans aucune entrée (US3-6). Le séparateur, l'encodage et la date de fichier ne changent pas (`toCsv`, séparateur point-virgule, BOM UTF-8).

## `DELETE /api/admin/salm/students/:id` (comportement)

Aucun changement de contrat. Les entrées de l'inscription sont supprimées **par cascade** (FR-228).

## `POST /api/admin/salm/editions/:editionId/purge` (comportement)

Aucun changement de contrat. `purgedStats.students.entriesByDay` est ajouté aux compteurs conservés (voir [data-model.md](../data-model.md#forme-modifiée--salmpurgedstats-json-de-salmeditionpurgedstats)). Les entrées sont supprimées par cascade dans la même transaction.

## `GET /api/admin/salm/editions/:editionId/stats` (comportement)

Aucun changement de contrat ni d'affichage. `computePurgedStats()` calcule aussi `entriesByDay` ; la vue statistiques de la feature B ne l'affiche pas (hors périmètre).

---

## `GET /api/salm/verify/:token` (publique) — **supprimée**

Cette route révélait la validité d'un jeton (`{ valid, edition }`), ce que FR-222 interdit. Elle est supprimée avec le type `SalmVerifyResponse` de `shared/types/salm.ts`.

- La page `/salm/v/:token` n'utilise plus que `GET /api/salm/edition` (publique, existante), qui ne dépend pas du jeton.
- Pour un administrateur connecté, la validité passe par `GET /api/admin/salm/control/lookup?token=` ([control-api.md](./control-api.md#get-apiadminsalmcontrollookup)).
- Après suppression, une requête vers l'ancienne adresse obtient la 404 standard de Nitro, identique pour tout jeton.

## `POST /api/auth/login` (inchangée)

Le retour vers la page demandée est géré côté client (`?redirect=` sur `/admin/login`), voir [ui-routes.md](./ui-routes.md).
