# Data Model: 002-magazine-backend-sync

**Date**: 2026-03-03
**Feature**: Synchronisation données magazine — Backend & Back Office

## Entité modifiée : Magazine

### Champs existants (inchangés)

| Champ        | Type     | Contraintes            | Description                        |
|-------------|----------|------------------------|------------------------------------|
| id          | Int      | PK, auto-increment     | Identifiant unique                 |
| name        | String   | requis                 | Nom du magazine                    |
| description | String   | requis                 | Description du numéro              |
| version     | String   | requis, unique         | Numéro de version (ex: « N°01 »)  |
| pdfPath     | String   | requis                 | Chemin vers le fichier PDF         |
| coverImage  | String?  | optionnel              | Chemin vers l'image de couverture  |
| publishedAt | DateTime | requis                 | Date de publication                |
| createdAt   | DateTime | auto (now)             | Date de création                   |
| updatedAt   | DateTime | auto (updatedAt)       | Date de dernière modification      |

### Nouveaux champs

| Champ       | Type      | Contraintes                    | Description                                                     |
|------------|-----------|--------------------------------|-----------------------------------------------------------------|
| subtitle   | String?   | optionnel                      | Sous-titre de l'édition (ex: « Édition inaugurale »)            |
| availableAt| DateTime? | optionnel                      | Date de disponibilité future ; si null → immédiatement dispo    |
| isFeatured | Boolean   | défaut: false                  | Indique si ce magazine est l'édition « à la une »               |

### Contraintes métier

- **Unicité du `isFeatured`** : Au plus un magazine peut avoir `isFeatured = true` à un instant donné. Cette contrainte est gérée côté applicatif (transaction Prisma) car SQLite ne supporte pas les index partiels uniques.
- **`availableAt` null** : Si `availableAt` est null, le magazine est considéré comme immédiatement disponible (pas de décompteur).
- **`subtitle` null** : Si `subtitle` est null, le sous-titre n'est pas affiché (pas d'espace vide résiduel).

### Relations (inchangées)

- **Magazine → Download** : 1:N (cascade delete). Un magazine peut avoir zéro ou plusieurs téléchargements.

## Schéma Prisma (changements)

```prisma
model Magazine {
  id          Int        @id @default(autoincrement())
  name        String
  description String
  version     String     @unique
  subtitle    String?                    // NOUVEAU
  pdfPath     String
  coverImage  String?
  publishedAt DateTime
  availableAt DateTime?                  // NOUVEAU
  isFeatured  Boolean    @default(false) // NOUVEAU
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  downloads   Download[]
}
```

## Migration

La migration ajoutera 3 colonnes au modèle Magazine :
- `subtitle` : String nullable, défaut null
- `availableAt` : DateTime nullable, défaut null
- `isFeatured` : Boolean, défaut false

Aucune donnée existante n'est impactée : les nouvelles colonnes ont des valeurs par défaut compatibles.
