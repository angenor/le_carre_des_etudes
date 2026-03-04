# Research: Refonte des Rubriques

**Feature**: 003-rubriques-redesign
**Date**: 2026-03-04

## R1: Format de stockage du contenu riche

**Decision**: Stocker le contenu en **Markdown** (champ `content` de type `String`).

**Rationale**: Toast UI Editor produit du Markdown nativement (mode par défaut). Le ToastViewer existant accepte du Markdown et le rend en HTML côté client. Markdown est plus léger à stocker, lisible brut, et plus facile à migrer que du HTML. Le composant `ToastViewer.client.vue` existant gère déjà le rendu Markdown → HTML.

**Alternatives considered**:
- HTML pur : plus lourd, risque XSS si non sanitisé, moins lisible brut
- JSON (ProseMirror/TipTap) : nécessiterait un nouvel éditeur, complexité ajoutée

---

## R2: Stratégie de migration du type « portrait »

**Decision**: Mapper `portrait` → `parcours_inspirant` **au niveau de l'API** (couche de lecture), sans modifier les données en base.

**Rationale**: Migration non-destructive. L'API GET regroupe les items `portrait` avec `parcours_inspirant`. L'API POST n'accepte plus `portrait` comme type valide. Cela évite une migration de données et préserve l'historique.

**Alternatives considered**:
- Migration SQL pour renommer tous les `portrait` en `parcours_inspirant` : destructif, irréversible, et le type `portrait` pourrait être réintroduit plus tard
- Garder `portrait` comme 5e type affiché : ajouterait de la confusion et un 5e layout inutile

---

## R3: Architecture des composants de layout

**Decision**: Un composant de layout Vue dédié par type, placé dans `app/components/rubrique/`. Un seul `RubriqueCard.vue` avec des variantes conditionnelles par type.

**Rationale**: Chaque type a un design fondamentalement différent (fond sombre vs clair, portrait vs groupe, colonnes vs événement). Des composants séparés sont plus maintenables que des conditions imbriquées dans un seul composant géant. Les 4 layouts sont utilisés à la fois sur la page listing (premier item) et sur la page détail.

**Alternatives considered**:
- Composant unique avec `v-if` : trop complexe avec 4 layouts très différents, difficile à maintenir
- Slots dynamiques : sur-ingénierie pour 4 variantes connues

---

## R4: Champs optionnels vs modèle polymorphe

**Decision**: Ajouter les champs optionnels (`subtitle`, `content`, `eventDate`, `eventLocation`) directement au modèle `ContentItem` existant.

**Rationale**: SQLite ne supporte pas les types union/héritage. Avec seulement 4 champs optionnels, la complexité d'un modèle polymorphe (tables séparées par type) n'est pas justifiée. Prisma 7 gère bien les champs optionnels. La validation métier (quel champ est requis pour quel type) est faite dans l'API.

**Alternatives considered**:
- Tables séparées par type (ParcoursInspirant, EnVedette, etc.) : sur-ingénierie, multiplie les routes API et les requêtes
- Table de métadonnées clé-valeur : perte de typage, requêtes complexes

---

## R5: Rendu du contenu riche côté public

**Decision**: Utiliser le composant `ToastViewer.client.vue` existant pour le rendu du contenu Markdown dans les layouts de détail et les previews listing.

**Rationale**: Le composant existe déjà, est configuré en français, et gère le rendu Markdown → HTML. Étant `.client.vue`, il se charge uniquement côté client, ce qui est acceptable car le contenu principal (titre, image, description) est rendu côté serveur (SSR). Le contenu riche est un enrichissement progressif.

**Alternatives considered**:
- Rendu serveur du Markdown (avec marked/remark) : ajouterait une dépendance, risque de divergence de rendu avec l'éditeur
- Pas de viewer, rendu HTML brut : perte de cohérence de style avec l'éditeur

---

## R6: URL de la page de détail

**Decision**: Route dynamique `/rubriques/:id` via `app/pages/rubriques/[id].vue`.

**Rationale**: Suit le pattern existant du projet (`/magazine/[id].vue`). L'ID numérique est simple et suffisant. Le fichier `app/pages/rubriques.vue` existant reste la page listing — Nuxt gère la coexistence fichier + dossier.

**Alternatives considered**:
- Slug textuel (`/rubriques/kone-banassa-batisseuse-davenir`) : nécessiterait un champ slug, plus complexe, pas de bénéfice SEO significatif pour ce projet
- Route par type (`/rubriques/parcours-inspirant/1`) : complexité inutile

---

## R7: Limitation des items par section sur le listing

**Decision**: Limiter côté frontend à 4 items par section (1 layout magazine + 3 cards). Le lien « Voir tout » mène à une vue filtrée ou ancre.

**Rationale**: La limitation se fait côté client (slice des données) plutôt que côté API. L'API retourne toujours tous les items groupés. Cela simplifie l'API et permet au frontend de décider de l'affichage. Pour « Voir tout », une page dédiée par type n'est pas nécessaire — un simple scroll/filtre suffit pour le volume prévu (10-20 items par type).

**Alternatives considered**:
- Pagination API par type : sur-ingénierie pour le volume prévu
- Pas de limite : page trop longue si beaucoup de contenus
