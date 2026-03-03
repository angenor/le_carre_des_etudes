# Research: 002-magazine-backend-sync

**Date**: 2026-03-03
**Feature**: Synchronisation données magazine — Backend & Back Office

## R-001: Stratégie pour le champ « à la une » (isFeatured)

**Decision**: Utiliser un champ booléen `isFeatured` directement sur le modèle Magazine, avec une logique applicative pour garantir l'unicité (un seul magazine à la une à la fois).

**Rationale**: Le projet utilise SQLite via Prisma 7. SQLite ne supporte pas les index partiels uniques (`@unique` conditionnel sur `isFeatured = true`). La contrainte d'unicité doit donc être gérée côté applicatif : avant de marquer un magazine comme « à la une », le serveur doit d'abord retirer le statut de tout magazine existant à la une, puis appliquer le nouveau statut. Cette opération sera faite dans une transaction Prisma pour garantir l'atomicité.

**Alternatives considered**:
- Table séparée `FeaturedMagazine` avec une seule ligne : surcoût inutile pour un simple flag, viole le principe YAGNI de la constitution.
- Colonne `featuredAt` (DateTime nullable) au lieu de booléen : plus complexe pour aucun bénéfice identifié, l'historique des mises à la une est hors scope.

## R-002: Nom des nouveaux champs Prisma

**Decision**: Utiliser `subtitle` (String?), `availableAt` (DateTime?), `isFeatured` (Boolean @default(false)).

**Rationale**: Cohérent avec les conventions de nommage camelCase du schéma Prisma existant (ex: `publishedAt`, `coverImage`, `pdfPath`). Les noms en anglais suivent la convention du schéma existant. Le frontend fera le mapping vers les noms français dans les composants Vue (convention existante : `publishedAt` affiché comme « Publié le... »).

**Alternatives considered**:
- Noms en français (`sousTitre`, `dateDisponibilite`, `estALaUne`) : incohérent avec le schéma existant qui utilise l'anglais.

## R-003: Endpoint dédié vs filtre sur l'existant

**Decision**: Créer un endpoint dédié `GET /api/magazines/featured` qui retourne le magazine à la une (ou `null`/404 si aucun).

**Rationale**: L'endpoint existant `GET /api/magazines` retourne la liste complète. Ajouter un paramètre de filtre `?featured=true` fonctionnerait mais oblige le frontend à extraire un élément d'un tableau. Un endpoint dédié est plus clair, plus performant (une seule requête Prisma `findFirst` au lieu de `findMany` + filtrage), et suit le pattern REST existant du projet.

**Alternatives considered**:
- Paramètre de query `?featured=true` sur `GET /api/magazines` : moins lisible, retourne un tableau pour un résultat unique.
- Inclure les nouveaux champs uniquement dans la réponse existante et laisser le frontend filtrer : charge inutile côté client.

## R-004: Gestion du toggle « à la une » dans le back office

**Decision**: Ajouter un bouton « Mettre à la une » / « Retirer de la une » dans la liste des magazines du back office (page admin/magazines.vue). Utiliser un endpoint `PUT /api/magazines/:id/featured` qui toggle le statut.

**Rationale**: Un bouton dédié dans la liste est plus rapide (1 clic) que d'ajouter un checkbox dans le formulaire d'édition (3+ clics : ouvrir le formulaire → cocher → sauvegarder). Cela satisfait le critère de succès SC-001 (< 3 clics). L'endpoint séparé permet de modifier le statut sans toucher aux autres données du magazine.

**Alternatives considered**:
- Checkbox dans le formulaire d'édition : trop de clics, l'administrateur doit ouvrir le formulaire complet juste pour changer le statut à la une.
- Endpoint PATCH au lieu de PUT : PATCH n'est pas utilisé ailleurs dans le projet, PUT est la convention existante.

## R-005: Approche frontend pour AlaUneSection

**Decision**: AlaUneSection effectuera un `useFetch` interne vers `GET /api/magazines/featured` au lieu de recevoir des props. Si aucun magazine n'est à la une, le composant ne rend rien.

**Rationale**: Le composant est actuellement self-contained (données en dur, aucun prop). Garder le fetch à l'intérieur du composant suit le même pattern self-contained et évite de modifier la page parent (`index.vue`). Le composant gère lui-même son état de chargement et son absence de données.

**Alternatives considered**:
- Passer les données via props depuis `index.vue` : nécessite de modifier la page parent et d'y ajouter un fetch. Plus de coordination entre fichiers pour un gain négligeable.
