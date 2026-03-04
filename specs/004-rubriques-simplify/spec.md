# Feature Specification: Simplification des Rubriques — Affichage Image-Only avec Lien Magazine

**Feature Branch**: `004-rubriques-simplify`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "Le client souhaite simplifier les rubriques : seules les images (format A4 vertical) contiennent les informations. Les 3 champs essentiels sont type, ordre d'affichage et image. Les champs supplémentaires (titre, description, contenu riche, etc.) restent en base pour évolution future mais sont masqués par défaut dans l'admin. La page publique affiche les images par catégorie. Chaque rubrique est liée à une édition du magazine et la navigation mène vers /magazine/[slug]/ au lieu d'une page de détail rubrique."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultation des rubriques en galerie d'images par catégorie (Priority: P1)

Un visiteur accède à la page des rubriques et découvre une galerie d'images au format A4 vertical, organisée en sections par type (En Vedette, Parcours Inspirant, Agenda & Opportunités, Focus). Chaque image représente un contenu éditorial complet du magazine. En cliquant sur une image, le visiteur est redirigé vers la page de l'édition du magazine correspondante (`/magazine/[slug]/`), où il peut consulter et télécharger le magazine complet.

**Why this priority** : C'est l'expérience principale pour les visiteurs — parcourir les rubriques visuellement et accéder au magazine associé.

**Independent Test** : Créer des rubriques avec des images et des liens vers des éditions de magazine, puis vérifier que la page `/rubriques` affiche les images par catégorie et que le clic mène à la bonne page magazine.

**Acceptance Scenarios** :

1. **Given** des rubriques de différents types existent avec des images, **When** un visiteur accède à `/rubriques`, **Then** les images sont affichées en sections distinctes par type dans l'ordre : En Vedette → Parcours Inspirant → Agenda & Opportunités → Focus.
2. **Given** une rubrique est liée à une édition de magazine, **When** le visiteur clique sur l'image, **Then** il est redirigé vers `/magazine/[slug]/` de l'édition correspondante.
3. **Given** aucune rubrique d'un type donné n'existe, **When** la page se charge, **Then** la section de ce type n'apparaît pas.
4. **Given** les images sont au format A4 vertical, **When** la page s'affiche sur mobile, tablette ou desktop, **Then** les images sont lisibles et bien proportionnées sur chaque format.

---

### User Story 2 - Administration simplifiée des rubriques (Priority: P1)

Un administrateur crée ou modifie une rubrique en remplissant uniquement les 3 champs essentiels : type, ordre d'affichage et image. Les champs supplémentaires hérités de la version précédente (titre, description, contenu riche, sous-titre, date événement, lieu) sont masqués par défaut derrière un bouton « Afficher les champs avancés ». L'administrateur associe chaque rubrique à une édition du magazine existante.

**Why this priority** : L'admin doit pouvoir créer rapidement des rubriques en se concentrant sur l'essentiel, sans être submergé par des champs inutilisés pour l'instant.

**Independent Test** : Créer une rubrique via l'admin avec uniquement les 3 champs essentiels + le lien magazine, vérifier la sauvegarde, puis vérifier que les champs avancés sont accessibles via le bouton.

**Acceptance Scenarios** :

1. **Given** un administrateur accède à la page de création de rubrique, **When** le formulaire s'affiche, **Then** seuls les champs type, ordre d'affichage, image et sélection du magazine sont visibles.
2. **Given** un administrateur veut renseigner des champs avancés, **When** il clique sur « Afficher les champs avancés », **Then** les champs titre, description, contenu riche, sous-titre, date événement et lieu apparaissent.
3. **Given** un administrateur remplit les 3 champs essentiels et sélectionne un magazine, **When** il soumet le formulaire, **Then** la rubrique est créée avec succès.
4. **Given** un administrateur édite une rubrique existante, **When** le formulaire s'ouvre, **Then** les champs essentiels sont préremplis et les champs avancés sont masqués (mais préremplis s'ils contiennent des données).

---

### User Story 3 - Navigation magazine via slug (Priority: P1)

La page de détail d'un magazine est accessible via son slug dans l'URL (`/magazine/[slug]/`) au lieu de son identifiant numérique. Chaque magazine possède un slug unique généré automatiquement à partir de son nom ou de sa version. Les anciennes URLs numériques restent fonctionnelles par rétro-compatibilité.

**Why this priority** : Les URLs avec slug sont plus lisibles, mémorisables et favorables au référencement. Ce changement est prérequis pour que les rubriques puissent pointer vers `/magazine/[slug]/`.

**Independent Test** : Accéder à un magazine via `/magazine/[slug]` et vérifier que la bonne page s'affiche avec tout le contenu.

**Acceptance Scenarios** :

1. **Given** un magazine avec un slug existe, **When** un visiteur accède à `/magazine/[slug]`, **Then** la page de détail du magazine s'affiche correctement.
2. **Given** un magazine est créé sans slug explicite, **When** il est sauvegardé, **Then** un slug est généré automatiquement à partir de sa version.
3. **Given** un slug n'existe pas, **When** un visiteur accède à `/magazine/[slug-inexistant]`, **Then** une page 404 est affichée.

---

### Edge Cases

- Que se passe-t-il quand une rubrique n'a pas d'image ? Un placeholder par défaut est affiché.
- Que se passe-t-il quand une rubrique n'est liée à aucun magazine ? L'image est affichée sans lien cliquable (pas de navigation).
- Que se passe-t-il quand le magazine lié à une rubrique est supprimé ? La rubrique reste visible mais le lien devient inactif.
- Comment les images A4 verticales s'affichent-elles sur mobile ? Elles sont redimensionnées proportionnellement en pleine largeur.
- Que se passe-t-il si deux magazines ont le même slug généré ? Impossible en pratique car le slug est dérivé de `version` qui est déjà unique.
- Les données existantes de type « portrait » restent traitées comme « parcours_inspirant » (rétro-compatibilité de 003-rubriques-redesign).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** : Le système DOIT afficher les rubriques sous forme de galerie d'images au format A4 vertical, organisée en sections par type.
- **FR-002** : Les sections DOIVENT apparaître dans l'ordre : En Vedette → Parcours Inspirant → Agenda & Opportunités → Focus. Les sections vides DOIVENT être masquées.
- **FR-003** : Chaque rubrique DOIT pouvoir être associée à une édition de magazine. Un clic sur l'image de la rubrique DOIT mener vers `/magazine/[slug]/` de l'édition associée.
- **FR-004** : Le formulaire admin DOIT afficher en priorité les 3 champs essentiels : type (un des 4 types), ordre d'affichage et image, ainsi que la sélection du magazine associé.
- **FR-005** : Les champs supplémentaires (titre, description, contenu riche, sous-titre, date événement, lieu) DOIVENT être masqués par défaut dans l'admin et révélés via un bouton « Afficher les champs avancés ».
- **FR-006** : Le système DOIT conserver tous les champs existants en base de données pour permettre une évolution future, même s'ils ne sont pas utilisés actuellement.
- **FR-007** : Chaque magazine DOIT avoir un slug unique utilisé dans l'URL `/magazine/[slug]`.
- **FR-008** : Le slug DOIT être généré automatiquement à partir de la version du magazine (champ `version`, déjà unique) lors de la création s'il n'est pas fourni explicitement.
- **FR-009** : Chaque section DOIT afficher un maximum de 4 images initialement, avec un bouton « Charger plus » pour révéler les images suivantes (par lot de 4) au sein de la même section.
- **FR-010** : L'affichage des images DOIT être responsive et adapté aux 3 formats d'écran (mobile 375px, tablette 768px, desktop 1280px+).
- **FR-011** : Les rubriques de type « portrait » existantes DOIVENT continuer à être traitées comme « parcours_inspirant » (rétro-compatibilité).

### Key Entities

- **Rubrique (ContentItem)** : Contenu éditorial du magazine représenté principalement par une image A4 verticale. Attributs essentiels : type (un des 4 types), ordre d'affichage, image. Attributs avancés (conservés pour évolution future) : titre, description, contenu riche, sous-titre, date événement, lieu. Relation : associée à une édition de magazine.
- **Magazine** : Édition du magazine. Attributs existants : nom, version, PDF, image de couverture, date de publication. Nouvel attribut : slug (identifiant URL unique).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Un administrateur peut créer une rubrique complète (image + type + ordre + magazine) en moins d'une minute.
- **SC-002** : La page `/rubriques` se charge en moins de 3 secondes avec 20 images de rubriques.
- **SC-003** : 100 % des clics sur une rubrique mènent à la page magazine correcte.
- **SC-004** : L'affichage est lisible et esthétique sur les 3 formats d'écran (mobile, tablette, desktop).
- **SC-005** : 100 % des données existantes (rubriques et magazines) restent accessibles après les modifications.
- **SC-006** : Les URLs `/magazine/[slug]` sont fonctionnelles pour tous les magazines existants.

## Clarifications

### Session 2026-03-04

- Q: Le slug du magazine doit-il être généré à partir du `name` ou de la `version` ? → A: À partir de la `version` (déjà unique, différencie chaque édition).
- Q: Faut-il limiter le nombre d'images par section sur la page listing ? → A: Oui, limiter à 4 images par section avec un bouton « Charger plus » pour afficher les suivantes dans la même section.

## Assumptions

- Les images des rubriques sont au format A4 vertical (portrait) et contiennent visuellement tout le contenu éditorial nécessaire.
- Les champs avancés existants (titre, description, contenu riche, etc.) sont conservés en base sans modification du schéma, pour permettre une évolution future.
- Le slug du magazine sera dérivé du champ `version` existant (déjà unique) via une fonction de slugification (minuscules, tirets, suppression des accents et caractères spéciaux).
- Les composants de layout spécialisés (LayoutParcours, LayoutVedette, etc.) créés dans 003-rubriques-redesign restent en place mais ne sont plus utilisés sur la page listing. Ils pourront être réactivés si le projet évolue.
- Le composant RubriqueCard existant sera remplacé par un affichage image simple sur la page listing.
