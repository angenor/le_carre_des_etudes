# Quickstart: Dashboard Admin, Newsletter & Embellissement

**Branch**: `005-admin-dashboard-newsletter` | **Date**: 2026-03-04

## Prérequis

- Node.js compatible Nuxt 4
- pnpm installé
- chart.js et vue-chartjs déjà installés (`pnpm list chart.js vue-chartjs`)

## Démarrage

```bash
# 1. Basculer sur la branche
git checkout 005-admin-dashboard-newsletter

# 2. Installer les dépendances (si nécessaire)
pnpm install

# 3. Appliquer la migration Prisma (après ajout des modèles)
pnpm prisma migrate dev --name add-newsletter-and-visits

# 4. Régénérer le client Prisma
pnpm prisma generate

# 5. Lancer le serveur de développement
pnpm dev
```

## Vérification

### Newsletter (public)
1. Ouvrir http://localhost:3000
2. Scroller jusqu'au footer
3. Saisir un email et cliquer sur "S'inscrire"
4. Vérifier le message de confirmation
5. Réessayer avec le même email → message "déjà inscrit"

### Dashboard admin
1. Ouvrir http://localhost:3000/admin/login
2. Se connecter avec le mot de passe admin
3. Vérifier les graphiques (courbes téléchargements, répartition magazine, niveau d'étude, visites)
4. Vérifier les cartes de chiffres clés

### Liste téléchargements
1. Dans l'admin, cliquer sur "Téléchargements" dans la sidebar
2. Vérifier la liste paginée avec recherche et tri
3. Cliquer "Exporter CSV" et vérifier le fichier téléchargé

### Newsletter admin
1. Dans l'admin, cliquer sur "Newsletter" dans la sidebar
2. Vérifier la liste des emails inscrits
3. Cliquer "Exporter CSV" et vérifier le fichier
4. Supprimer un abonné et vérifier la mise à jour

### Thème admin
1. Vérifier que la sidebar a un fond sombre avec accents ambrés
2. Vérifier que les pages internes (magazines, rubriques, partenaires) gardent leur thème blanc/emerald

## Données de test

Pour générer des données de test, on peut utiliser Prisma Studio :

```bash
pnpm prisma studio
```

Ou insérer des données via les formulaires existants :
- Télécharger un magazine via le site public (remplit la table Download)
- S'inscrire à la newsletter via le footer
- Naviguer sur le site pour générer des PageVisit
