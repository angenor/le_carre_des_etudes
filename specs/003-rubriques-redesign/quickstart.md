# Quickstart: Refonte des Rubriques

**Feature**: 003-rubriques-redesign
**Date**: 2026-03-04

## Prérequis

- Node.js compatible Nuxt 4
- pnpm installé
- Base de données SQLite existante (`dev.db`)

## Démarrage

```bash
# 1. Checkout de la branche
git checkout 003-rubriques-redesign

# 2. Installer les dépendances (si nécessaire)
pnpm install

# 3. Appliquer la migration Prisma (nouveaux champs ContentItem)
pnpm prisma migrate dev

# 4. Régénérer le client Prisma
pnpm prisma generate

# 5. Lancer le serveur de développement
pnpm dev
```

## Vérification rapide

1. **Page publique** : http://localhost:3000/rubriques → Affichage par sections avec layouts spécialisés
2. **Admin** : http://localhost:3000/admin/rubriques → Formulaire avec 4 types et éditeur riche
3. **Page détail** : Cliquer sur une rubrique → http://localhost:3000/rubriques/[id]

## Fichiers clés modifiés/créés

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | Modifié — 4 nouveaux champs optionnels |
| `server/api/rubriques/index.get.ts` | Modifié — 4 types, mapping portrait |
| `server/api/rubriques/index.post.ts` | Modifié — validation 4 types + nouveaux champs |
| `server/api/rubriques/[id].get.ts` | Nouveau — endpoint détail |
| `server/api/rubriques/[id].put.ts` | Modifié — nouveaux champs |
| `app/pages/rubriques.vue` | Modifié — redesign complet |
| `app/pages/rubriques/[id].vue` | Nouveau — page détail |
| `app/pages/admin/rubriques.vue` | Modifié — formulaire dynamique + éditeur riche |
| `app/components/RubriqueCard.vue` | Modifié — variantes par type |
| `app/components/rubrique/Layout*.vue` | Nouveau — 4 composants de layout |

## Notes

- Pas de nouvelle dépendance à installer (Toast UI Editor déjà en place)
- Migration non-destructive : les données existantes restent intactes
- Les items de type `portrait` sont automatiquement mappés vers `parcours_inspirant`
