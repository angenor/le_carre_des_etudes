# Quickstart: 002-magazine-backend-sync

**Date**: 2026-03-03

## Prérequis

- Node.js compatible Nuxt 4
- pnpm installé
- Projet cloné et dépendances installées (`pnpm install`)

## Étapes de mise en route après implémentation

### 1. Appliquer la migration Prisma

```bash
pnpm prisma migrate dev --name add-magazine-featured-fields
```

Cela ajoute les colonnes `subtitle`, `availableAt`, `isFeatured` au modèle Magazine.

### 2. Régénérer le client Prisma

```bash
pnpm prisma generate
```

### 3. Lancer le serveur de développement

```bash
pnpm dev
```

### 4. Vérifier les changements

1. **Back office** : Aller sur `http://localhost:3000/admin/magazines`
   - Créer ou modifier un magazine → vérifier que les champs « Sous-titre » et « Date de disponibilité » apparaissent dans le formulaire
   - Cliquer sur « Mettre à la une » sur un magazine → vérifier le badge visuel

2. **API** : Tester le nouvel endpoint
   ```bash
   curl http://localhost:3000/api/magazines/featured
   ```

3. **Page d'accueil** : Aller sur `http://localhost:3000`
   - Si un magazine est à la une → la section affiche ses données dynamiques
   - Si date de disponibilité future → le décompteur s'affiche
   - Si aucun magazine à la une → la section est masquée

4. **Page de détail** : Aller sur `http://localhost:3000/magazine/1`
   - Vérifier que le sous-titre et la date de disponibilité s'affichent correctement

## Fichiers impactés

### Prisma
- `prisma/schema.prisma` — 3 nouveaux champs sur Magazine

### Server (Nitro)
- `server/api/magazines/featured.get.ts` — NOUVEAU
- `server/api/magazines/[id]/featured.put.ts` — NOUVEAU
- `server/api/magazines/[id]/featured.delete.ts` — NOUVEAU
- `server/api/magazines/index.post.ts` — accepte subtitle et availableAt
- `server/api/magazines/[id].put.ts` — accepte subtitle et availableAt
- `server/middleware/admin.ts` — protège les nouveaux endpoints d'écriture

### Frontend (Vue)
- `app/components/AlaUneSection.vue` — fetch API au lieu de données en dur
- `app/pages/magazine/[id].vue` — affiche subtitle et availableAt
- `app/pages/admin/magazines.vue` — nouveaux champs dans le formulaire + bouton « à la une »
