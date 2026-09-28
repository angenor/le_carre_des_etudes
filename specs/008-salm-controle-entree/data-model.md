# Data Model — écarts de la feature C (contrôle d'entrée)

**Feature** : `008-salm-controle-entree` · **Spec** : [spec.md](./spec.md) · **Research** : [research.md](./research.md) (R3, R5, R7, R13, R15)

Ce document ne décrit que les **écarts** par rapport au modèle de la feature A ([`specs/006-salm-inscriptions/data-model.md`](../006-salm-inscriptions/data-model.md)), inchangé par la feature B. Les conventions restent celles de 006 :
- identifiant `Int` auto-incrémenté ;
- chaînes contrôlées par le code plutôt qu'enums Prisma ;
- dates en UTC (heure d'Abidjan) ;
- tables au nom du modèle.

**Une migration** : `add_salm_entries`, qui ajoute la table `SalmEntry` et la colonne `SalmStudentRegistration.origin`.

## Diagramme des relations (ajouts en gras)

```text
SalmEdition 1 ─┬─< SalmDay 1 ──────────────┐
               │                           │
               └─< SalmStudentRegistration 1 ──< **SalmEntry** >── 1 SalmDay
                     + **origin**
```

`SalmEntry` relie une inscription à un jour de salon : au plus une ligne par couple.

---

## Nouveau modèle : SalmEntry

Entrée validée d'un badge un jour de salon (FR-215, FR-216).

| Champ | Type | Contraintes / défaut | Rôle |
|---|---|---|---|
| `id` | Int | PK | Curseur du rafraîchissement entre postes (`afterId`, R5) |
| `registrationId` | Int | FK → `SalmStudentRegistration`, **`onDelete: Cascade`** | Inscrit·e entré·e |
| `dayId` | Int | FK → `SalmDay`, **`onDelete: Cascade`** | Jour de salon. Le jour appartient à l'édition de l'inscription (contrôle applicatif) |
| `enteredAt` | DateTime | | Heure du **premier** passage validé : l'heure du serveur en ligne, l'heure du scan (bornée, R9) hors ligne. Lors d'une fusion, la plus ancienne est retenue (FR-235) |
| `mode` | String | `'scan'` · `'manual'` | `manual` couvre la saisie manuelle et l'inscription sur place |
| `offline` | Boolean | défaut `false` | Enregistrée d'abord sur le téléphone puis synchronisée |
| `createdAt` | DateTime | défaut `now()` | Date d'écriture en base (diffère de `enteredAt` pour une entrée synchronisée) |

**Contraintes et index** :
- **`@@unique([registrationId, dayId])`** : une entrée par badge et par jour, garantie par la base, y compris avec des postes concurrents (R4).
- `@@index([dayId, enteredAt])` : compteurs par jour, liste de présence.
- L'index de `registrationId` est couvert par la contrainte unique (préfixe).

**Règles** :
- **Création** : seulement si le jour contrôlé appartient à l'**édition publiée** et à l'édition de l'inscription. Jamais en mode essai (R9), et jamais depuis la page publique `/salm/v/:token` (FR-222a).
- **Doublon** (P2002 sur `[registrationId, dayId]`) :
  - en ligne, pas d'écriture et réponse « déjà entré·e » avec l'`enteredAt` existant ;
  - en synchronisation, `enteredAt = min(existant, reçu)`, par une mise à jour **conditionnelle atomique** (`updateMany` avec `where: { registrationId, dayId, enteredAt: { gt: reçu } }`), jamais par une lecture suivie d'une écriture ; `mode` et `offline` restent ceux de la ligne existante si elle est la plus ancienne, sinon ceux de l'entrée reçue.
- **Annulation** (FR-217) : suppression de la ligne, possible seulement si `day.date` est la date du jour. Pas d'historique.
- **Aucune** colonne ne désigne l'appareil ou la personne qui contrôle (FR-216).
- **Suppression** :
  - en cascade avec l'inscription (FR-065 de 006, FR-228) ;
  - en cascade avec le jour (suppression d'un jour dans la feature B) ;
  - par les `deleteMany` de la suppression des données personnelles (FR-065b de 006).

**Transitions** : aucun statut. Une ligne existe (présent·e ce jour) ou n'existe pas (absent·e).

---

## Modèle modifié : SalmStudentRegistration

| Champ ajouté | Type | Contraintes / défaut | Rôle |
|---|---|---|---|
| `origin` | String | `'online'` · `'onsite'`, **défaut `'online'`** | Inscription par le formulaire public ou par l'équipe sur place (FR-247). Les lignes existantes prennent `'online'` à la migration |

| Relation ajoutée | Rôle |
|---|---|
| `entries SalmEntry[]` | Entrées de l'inscrit·e, une par jour au plus |

Règles inchangées :
- téléphone unique par édition ;
- numéro de badge séquentiel jamais réutilisé ;
- jetons `verifyToken` et `downloadToken` ;
- aucune modification après création.

L'inscription sur place passe par la **même** création atomique que le formulaire public (research R13), avec `origin = 'onsite'`.

## Modèle modifié : SalmDay

| Relation ajoutée | Rôle |
|---|---|
| `entries SalmEntry[]` | Entrées de ce jour. La suppression d'un jour (feature B) supprime ses entrées |

La feature B permet de **modifier la date** d'un jour d'une édition qui a des inscriptions, avec un avertissement. Les entrées suivent le jour (par `dayId`), pas la date. Aucun changement n'est demandé à la feature B.

## Forme modifiée : `SalmPurgedStats` (JSON de `SalmEdition.purgedStats`)

Champ ajouté, **facultatif** (les compteurs déjà conservés ne l'ont pas) :

```jsonc
{
  "students": {
    "total": 4821,
    "byStudyLevel": { "…": 0 },
    "byRegistrationDay": { "…": 0 },
    "entriesByDay": { "2027-03-12": 3104, "2027-03-13": 2687 }   // nouveau (FR-228)
  }
}
```

Calculé dans la transaction de suppression, juste avant les `deleteMany` (R15). Aucune donnée personnelle.

## Esquisse Prisma (référence pour la migration `add_salm_entries`)

```prisma
model SalmStudentRegistration {
  // … champs existants inchangés …
  origin        String      @default("online")
  entries       SalmEntry[]
}

model SalmDay {
  // … champs existants inchangés …
  entries   SalmEntry[]
}

model SalmEntry {
  id             Int                     @id @default(autoincrement())
  registrationId Int
  registration   SalmStudentRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  dayId          Int
  day            SalmDay                 @relation(fields: [dayId], references: [id], onDelete: Cascade)
  enteredAt      DateTime
  mode           String
  offline        Boolean                 @default(false)
  createdAt      DateTime                @default(now())

  @@unique([registrationId, dayId])
  @@index([dayId, enteredAt])
}
```

---

## Données locales du poste de contrôle (hors base, research R5 et R7)

Ce ne sont pas des tables, mais des structures stockées dans le `localStorage` du téléphone, sous les clés `salm-controle:v1:*`. Elles sont effacées à la déconnexion, à la fin du dernier jour de salon si la page de contrôle est ouverte (minuteur), sinon à la première ouverture de la page ou de l'admin qui suit la fin du salon (FR-239).

| Clé | Contenu | Données personnelles |
|---|---|---|
| `snapshot` | Édition (année, jours), `badges: { h, seq, name, level }[]`, `entries: { h, dayId, at, id }[]`, compteurs, QR code d'inscription (SVG), `serverTime`, `fetchedAt` | Nom et niveau. **Jamais** le téléphone ni le jeton : `h` = SHA-256 du `verifyToken`, tronqué à 16 octets et encodé en base64url |
| `queue` | `{ clientId, seq, dayId, scannedAt, mode }[]` : entrées validées hors ligne, en attente d'envoi | Le numéro de badge seulement (`seq`, lu dans la précharge après le scan). **Jamais le jeton** : un téléphone perdu ne permet pas de refabriquer un badge. Retiré après la synchronisation |
| `session` | `{ checkedAt, editionEndsAt }` : dernière vérification de session réussie | Aucune |
| `prefs` | `{ sound: boolean }` | Aucune |

## Invariants ajoutés

| Invariant | Garanti par |
|---|---|
| Au plus une entrée par badge et par jour, quel que soit le nombre de postes | `@@unique([registrationId, dayId])` + traitement de P2002 (R4) |
| Heure retenue = premier passage, même après une synchronisation différée | Fusion `min(enteredAt)` dans `POST /control/sync` (R5) |
| Aucune entrée hors d'un jour de salon de l'édition publiée | Contrôle serveur à chaque écriture ; mode essai sans écriture (R9) |
| Suppression d'une inscription ou des données d'une édition = suppression de ses entrées | `onDelete: Cascade` |
| Nombre d'entrées par jour conservé après suppression des données personnelles | `purgedStats.students.entriesByDay` (R15) |
| Aucune donnée sur la validité d'un jeton pour un visiteur non connecté | Suppression de `GET /api/salm/verify/:token` ; page `/salm/v/:token` sans lecture du jeton (R12) |
| Aucun téléphone d'inscrit·e sur les postes de contrôle | Précharge et réponses de contrôle sans `phone` (FR-230) |
| Aucun jeton de vérification en clair sur les postes | Précharge avec l'empreinte `h` ; file hors ligne avec le seul numéro de badge `seq` (R5) |
