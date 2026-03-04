# Data Model: Refonte des Rubriques

**Feature**: 003-rubriques-redesign
**Date**: 2026-03-04

## ContentItem (modified)

Modèle existant étendu avec 4 nouveaux champs optionnels.

### Schema Prisma

```prisma
model ContentItem {
  id            Int       @id @default(autoincrement())
  type          String    // 'parcours_inspirant', 'en_vedette', 'agenda_et_opportunites', 'focus'
  title         String
  description   String    // Résumé court (existant, conservé)
  content       String?   // NEW — Contenu riche en Markdown (corps de l'article)
  subtitle      String?   // NEW — Sous-titre (nom/titre personne, pour Parcours Inspirant)
  eventDate     DateTime? // NEW — Date de l'événement (pour Agenda & Opportunités)
  eventLocation String?   // NEW — Lieu de l'événement (pour Agenda & Opportunités)
  imagePath     String
  order         Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Champs par type

| Champ | parcours_inspirant | en_vedette | agenda_et_opportunites | focus |
|-------|:------------------:|:----------:|:---------------------:|:-----:|
| title | requis | requis | requis | requis |
| description | requis | requis | requis | requis |
| content | optionnel | optionnel | optionnel | optionnel |
| subtitle | optionnel | — | — | — |
| eventDate | — | — | optionnel | — |
| eventLocation | — | — | optionnel | — |
| imagePath | requis | requis | requis | requis |
| order | requis (défaut: 0) | requis (défaut: 0) | requis (défaut: 0) | requis (défaut: 0) |

### Types valides

```typescript
const VALID_TYPES = ['parcours_inspirant', 'en_vedette', 'agenda_et_opportunites', 'focus'] as const
type RubriqueType = typeof VALID_TYPES[number]
```

### Rétro-compatibilité

- Le type `portrait` n'est plus accepté en création/modification
- Les items existants avec `type = 'portrait'` sont traités comme `parcours_inspirant` en lecture
- Mapping effectué dans l'API GET (pas de migration de données)

### Migration Prisma

Ajout de 4 colonnes optionnelles au modèle `ContentItem` :
- `content String?`
- `subtitle String?`
- `eventDate DateTime?`
- `eventLocation String?`

Migration non-destructive — tous les nouveaux champs sont optionnels, les données existantes restent intactes.

### Validation métier (API)

```
POST /api/rubriques:
  - type: requis, doit être dans VALID_TYPES
  - title: requis, non vide
  - description: requis, non vide
  - imagePath: requis, non vide
  - content: optionnel (Markdown)
  - subtitle: optionnel (ignoré si type ≠ parcours_inspirant)
  - eventDate: optionnel (ignoré si type ≠ agenda_et_opportunites)
  - eventLocation: optionnel (ignoré si type ≠ agenda_et_opportunites)
  - order: optionnel, défaut 0
```
