# Research: Simplification des Rubriques

**Feature**: 004-rubriques-simplify
**Date**: 2026-03-04

## R1: Slugification de la version Magazine

**Decision**: Générer le slug à partir du champ `version` existant via une fonction de slugification simple.
**Rationale**: Le champ `version` est déjà unique dans le modèle Magazine. Il suffit de le transformer en slug URL-safe (minuscules, tirets, suppression des accents et caractères spéciaux). Pas de dépendance externe nécessaire.
**Alternatives considered**:
- Utiliser `name` : rejeté car `name` n'est pas unique (tous les magazines s'appellent probablement « Le Carré des Études »).
- Champ `slug` saisi manuellement : inutilement complexe, auto-génération préférable.

**Implementation**: Fonction utilitaire `slugify(text: string): string` dans `server/utils/slugify.ts`. Appliquée à `version` lors de la création/mise à jour du magazine.

## R2: Relation ContentItem → Magazine

**Decision**: Ajouter un champ `magazineId Int?` optionnel sur ContentItem avec relation Prisma vers Magazine.
**Rationale**: Relation optionnelle car les rubriques existantes n'ont pas de magazine associé. L'admin pourra sélectionner un magazine via un dropdown. La relation est simple (many-to-one : plusieurs rubriques peuvent pointer vers le même magazine).
**Alternatives considered**:
- Stocker le slug du magazine directement dans ContentItem : rejeté car cela duplique les données et casse si le slug change.
- Table de liaison intermédiaire : over-engineering pour une relation simple many-to-one.

## R3: Route `/magazine/[slug]` vs modification de `[id]`

**Decision**: Créer une nouvelle page `app/pages/magazine/[slug].vue` et un endpoint API `server/api/magazines/by-slug/[slug].get.ts`. Conserver `[id].vue` et `[id].get.ts` pour la rétro-compatibilité.
**Rationale**: La page `[id].vue` existante utilise un ID numérique. La convention Nuxt file-based routing ne permet pas de distinguer `[id]` de `[slug]` dans le même dossier sans logique de détection. Il est plus propre de garder les deux routes séparées. L'endpoint API utilise un sous-dossier `by-slug/` pour éviter l'ambiguïté avec l'endpoint `[id].get.ts` existant.
**Alternatives considered**:
- Remplacer `[id].vue` par `[slug].vue` et supprimer l'ancien : risque de casser des liens existants.
- Middleware de détection slug vs ID dans un seul fichier : complexité inutile.

## R4: Simplification du POST /api/rubriques

**Decision**: Rendre `title` et `description` optionnels (valeurs par défaut : chaîne vide) car le client n'utilise que l'image. Ajouter `magazineId` optionnel.
**Rationale**: Actuellement `title` et `description` sont requis. Pour le workflow simplifié (3 champs essentiels : type, order, image), ces champs ne sont plus renseignés par défaut. Ils restent en base pour l'évolution future.
**Alternatives considered**:
- Garder `title`/`description` requis et remplir des valeurs par défaut côté frontend : fragile, mieux vaut ajuster le backend.
- Supprimer les validations : risqué si les champs avancés sont utilisés à l'avenir. Mieux : les rendre optionnels avec défauts.

## R5: Affichage « Charger plus » côté client

**Decision**: Implémentation 100% côté client. L'API retourne toutes les rubriques groupées (pas de pagination serveur). Le composant Vue gère un compteur par section qui s'incrémente de 4 au clic.
**Rationale**: Avec un volume attendu de ~20-80 rubriques totales (5-20 par type), le payload est petit. Pas besoin de pagination serveur qui ajouterait de la complexité. Le rendu est SSR avec les 4 premiers items visibles, les suivants chargés côté client via un simple ref réactive.
**Alternatives considered**:
- Pagination serveur avec query params `?limit=4&offset=0` par type : over-engineering pour le volume actuel.
- Intersection Observer (infinite scroll) : moins intuitif qu'un bouton explicite pour un contenu éditorial.

## R6: Migration des magazines existants (slug)

**Decision**: La migration Prisma ajoute `slug String?` (optionnel d'abord), puis un script post-migration génère les slugs pour les magazines existants à partir de leur `version`, puis une seconde étape rend le champ `@unique`.
**Rationale**: On ne peut pas ajouter un champ `@unique` non-null sur une table existante avec des données sans fournir les valeurs. L'approche en 2 temps (ajout optionnel → peuplement → contrainte unique) est la pratique standard.
**Alternatives considered**:
- Migration manuelle SQL : viole le principe III (Data Integrity via Prisma).
- Slug nullable sans contrainte unique : risque de slugs dupliqués ou manquants.
