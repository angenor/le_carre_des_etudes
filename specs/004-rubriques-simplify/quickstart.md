# Quickstart: Simplification des Rubriques

**Feature**: 004-rubriques-simplify
**Date**: 2026-03-04

## Prérequis

- Node.js compatible Nuxt 4
- pnpm installé
- Base de données SQLite existante (`dev.db`)

## Démarrage

```bash
# 1. Checkout de la branche
git checkout 004-rubriques-simplify

# 2. Installer les dépendances (si nécessaire)
pnpm install

# 3. Appliquer la migration Prisma (slug Magazine + magazineId ContentItem)
pnpm prisma migrate dev

# 4. Régénérer le client Prisma
pnpm prisma generate

# 5. Lancer le serveur de développement
pnpm dev
```

## Vérification rapide

1. **Page publique rubriques** : http://localhost:3000/rubriques → Galerie d'images par catégorie (4 sections)
2. **Admin rubriques** : http://localhost:3000/admin/rubriques → Formulaire simplifié (3 champs essentiels + toggle avancé)
3. **Navigation rubrique → magazine** : Cliquer sur une image de rubrique → redirigé vers http://localhost:3000/magazine/[slug]
4. **Page magazine par slug** : http://localhost:3000/magazine/n-001 → Page de détail du magazine

## Fichiers clés modifiés/créés

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | Modifié — ajout `slug` (Magazine), `magazineId` (ContentItem) |
| `server/utils/slugify.ts` | Nouveau — fonction utilitaire de slugification |
| `server/api/magazines/by-slug/[slug].get.ts` | Nouveau — lookup magazine par slug |
| `server/api/magazines/index.post.ts` | Modifié — génération auto du slug |
| `server/api/magazines/[id].put.ts` | Modifié — support mise à jour slug |
| `server/api/rubriques/index.get.ts` | Modifié — inclure magazine dans la réponse |
| `server/api/rubriques/index.post.ts` | Modifié — title/description optionnels, magazineId |
| `server/api/rubriques/[id].put.ts` | Modifié — support magazineId |
| `app/pages/magazine/[slug].vue` | Nouveau — page détail magazine par slug |
| `app/pages/rubriques/index.vue` | Modifié — galerie images par catégorie |
| `app/pages/admin/rubriques.vue` | Modifié — formulaire simplifié + toggle avancé |
| `app/components/RubriqueCard.vue` | Modifié — simplifié en carte image |

## Notes

- Pas de nouvelle dépendance à installer
- Migration non-destructive : les données existantes restent intactes
- Les slugs sont générés automatiquement pour les magazines existants
- Les Layout* de 003-rubriques-redesign sont conservés mais non utilisés
- La page `/magazine/[id]` reste accessible (rétro-compatibilité)
