# Feature Specification: Refonte des Rubriques avec Affichage Spécialisé par Type

**Feature Branch**: `003-rubriques-redesign`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Intégrer les 4 types de rubriques (Parcours Inspirant, En Vedette, Agenda & Opportunités, Focus) avec un affichage spécialisé et stylé pour chaque type, en s'appuyant sur @toast-ui/editor pour le contenu riche."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultation des rubriques avec mise en page spécialisée par type (Priority: P1)

Un visiteur du site accède à la page des rubriques et découvre chaque contenu présenté dans un style visuel unique correspondant à son type :

- **Parcours Inspirant** : mise en page sombre et élégante, fond brun/noir, portrait photo à gauche, nom et titre de la personne en sous-titre, texte biographique long en colonnes, typographie serif stylisée.
- **En Vedette** : style journal/presse, titre « EN VEDETTE » imposant, photo d'article, disposition deux colonnes, accents orange sur fond clair.
- **Agenda & Opportunités** : style promotionnel/événementiel, image de couverture grande, date et lieu de l'événement mis en valeur, tons orange vifs.
- **Focus** : style informatif/académique structuré, titre « FOCUS » en gras, listes à puces, photo de groupe, disposition deux colonnes claire.

**Why this priority** : C'est la fonctionnalité principale demandée — chaque type de rubrique doit avoir son propre rendu visuel distinct, ce qui est le coeur de la valeur ajoutée.

**Independent Test** : Créer un contenu de chaque type et vérifier que la page rubriques affiche chacun avec son layout spécifique et identifiable.

**Acceptance Scenarios** :

1. **Given** un contenu de type « Parcours Inspirant » existe, **When** un visiteur accède à la page rubriques, **Then** ce contenu s'affiche avec un fond sombre, un portrait photo et du texte en colonnes.
2. **Given** un contenu de type « En Vedette » existe, **When** un visiteur accède à la page rubriques, **Then** ce contenu s'affiche dans un style journal avec titre imposant et disposition colonnes.
3. **Given** un contenu de type « Agenda & Opportunités » existe, **When** un visiteur accède à la page rubriques, **Then** ce contenu s'affiche en style événementiel avec image large et informations date/lieu.
4. **Given** un contenu de type « Focus » existe, **When** un visiteur accède à la page rubriques, **Then** ce contenu s'affiche en style informatif structuré avec listes et photo.
5. **Given** plusieurs types de rubriques existent, **When** un visiteur défile la page, **Then** chaque section est visuellement distincte et identifiable sans lire le label.

---

### User Story 2 - Prise en charge des 4 types avec champs spécifiques (Priority: P1)

Le système reconnaît et gère 4 types de rubriques : `parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus`. Chaque type possède des champs communs (titre, image, contenu riche, ordre) et des champs spécifiques :

- **Parcours Inspirant** : sous-titre (nom et titre de la personne)
- **Agenda & Opportunités** : date de l'événement, lieu

L'administrateur sélectionne le type lors de la création, et le formulaire s'adapte pour afficher les champs correspondants.

**Why this priority** : L'extension du modèle de données à 4 types avec champs spécifiques est un prérequis pour les autres fonctionnalités.

**Independent Test** : Créer un contenu de chaque type via l'admin et vérifier la sauvegarde et récupération correcte de tous les champs.

**Acceptance Scenarios** :

1. **Given** un administrateur est sur la page de création, **When** il sélectionne le type « Agenda & Opportunités », **Then** les champs date et lieu apparaissent dans le formulaire.
2. **Given** un administrateur crée un « Parcours Inspirant », **When** il remplit le sous-titre, **Then** ce sous-titre est sauvegardé et récupérable.
3. **Given** les 4 types sont disponibles dans le sélecteur, **When** l'administrateur choisit « Focus », **Then** seuls les champs communs apparaissent (pas de champs date/lieu/sous-titre).
4. **Given** des contenus de type « portrait » existent en base, **When** l'API retourne les rubriques, **Then** ces contenus sont traités comme « parcours_inspirant ».

---

### User Story 3 - Rédaction de contenu riche avec éditeur stylisé (Priority: P2)

Un administrateur rédige le corps d'une rubrique à l'aide d'un éditeur de texte riche. Il peut formater le texte avec titres, gras, italique, listes, images intégrées, liens, etc. Le contenu est sauvegardé et rendu fidèlement côté public.

**Why this priority** : Les rubriques contiennent du contenu éditorial long et formaté. L'éditeur riche est essentiel pour la qualité du contenu, mais l'existant (ToastEditor/ToastViewer) fournit déjà une base.

**Independent Test** : Rédiger un article avec mise en forme riche dans l'admin et vérifier le rendu sur la page publique.

**Acceptance Scenarios** :

1. **Given** un administrateur rédige une rubrique, **When** il utilise l'éditeur riche, **Then** il peut appliquer titres, gras, italique, listes et intégrer des images.
2. **Given** un contenu riche est sauvegardé, **When** un visiteur consulte la rubrique, **Then** tous les formatages sont préservés et rendus correctement.
3. **Given** un administrateur édite une rubrique existante, **When** l'éditeur s'ouvre, **Then** le contenu existant est chargé avec ses formatages intacts.

---

### User Story 4 - Page de détail d'une rubrique (Priority: P2)

Un visiteur clique sur une rubrique depuis la page de listing pour accéder à une page de détail dédiée. Cette page affiche le contenu complet dans la mise en page spécialisée correspondant au type, avec tout le contenu riche rendu.

**Why this priority** : La page listing montre un aperçu. Le contenu riche complet nécessite une page dédiée pour une lecture confortable.

**Independent Test** : Cliquer sur une rubrique et vérifier que la page de détail affiche le contenu complet avec la mise en page du type.

**Acceptance Scenarios** :

1. **Given** un visiteur est sur la page rubriques, **When** il clique sur un contenu, **Then** il est redirigé vers la page de détail de cette rubrique.
2. **Given** la page de détail d'un « Parcours Inspirant » est affichée, **Then** la mise en page sombre avec portrait, sous-titre et texte en colonnes est visible.
3. **Given** la page de détail d'un « Agenda & Opportunités » est affichée, **Then** la date et le lieu sont mis en évidence.

---

### Edge Cases

- Que se passe-t-il quand une rubrique n'a pas d'image ? Un placeholder par défaut est affiché selon le type.
- Que se passe-t-il quand le contenu riche est vide ? Seuls le titre et l'image sont affichés.
- Que se passe-t-il quand il n'y a aucune rubrique d'un type donné ? La section correspondante n'apparaît pas sur la page.
- Comment les anciens contenus de type « portrait » sont-ils gérés ? Ils sont traités comme « parcours_inspirant » par rétro-compatibilité.
- Comment le contenu multi-colonnes s'affiche-t-il sur mobile ? Il passe en colonne unique avec adaptation responsive.
- Que se passe-t-il si un « Agenda & Opportunités » a une date passée ? Il reste visible mais peut être affiché différemment (estompé ou marqué « passé »).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** : Le système DOIT gérer 4 types de rubriques : `parcours_inspirant`, `en_vedette`, `agenda_et_opportunites`, `focus`.
- **FR-002** : Chaque type de rubrique DOIT avoir un rendu visuel distinct sur la page publique, inspiré des maquettes magazine fournies.
- **FR-003** : Le système DOIT stocker du contenu riche (Markdown/HTML) pour chaque rubrique via un champ dédié, en plus du champ description existant (utilisé comme résumé/extrait).
- **FR-004** : L'interface admin DOIT proposer un éditeur de texte riche pour la rédaction du contenu des rubriques.
- **FR-005** : Le type « Agenda & Opportunités » DOIT inclure des champs pour la date de l'événement et le lieu.
- **FR-006** : Le type « Parcours Inspirant » DOIT inclure un champ sous-titre pour le nom et titre de la personne profilée.
- **FR-007** : La page de listing DOIT regrouper les contenus par type avec un en-tête de section visuellement distinct pour chaque type.
- **FR-008** : Chaque rubrique DOIT avoir une page de détail accessible depuis le listing, affichant le contenu complet dans la mise en page spécialisée du type.
- **FR-009** : L'affichage DOIT être responsive et lisible sur mobile (375px), tablette (768px) et desktop (1280px+).
- **FR-010** : La page listing DOIT afficher le premier item de chaque section en layout magazine (inspiré des captures du magazine physique), et les items suivants en cards stylisées différentes selon le type.
- **FR-011** : Le formulaire admin DOIT adapter dynamiquement ses champs en fonction du type sélectionné.
- **FR-012** : Les anciens contenus de type « portrait » DOIVENT être traités comme « parcours_inspirant » pour la rétro-compatibilité.

### Key Entities

- **Rubrique (ContentItem)** : Article de magazine. Attributs : type (un des 4 types), titre, sous-titre (optionnel — Parcours Inspirant), contenu riche (corps de l'article), image principale, description (résumé court), date d'événement (optionnel — Agenda & Opportunités), lieu (optionnel — Agenda & Opportunités), ordre d'affichage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Les 4 types de rubriques sont visuellement distincts — un utilisateur peut identifier le type d'une rubrique sans lire le label de catégorie.
- **SC-002** : Le contenu riche créé dans l'éditeur admin est rendu fidèlement sur la page publique (formatages, images, listes préservés à 100 %).
- **SC-003** : La page de listing des rubriques se charge en moins de 3 secondes avec 20 contenus.
- **SC-004** : L'affichage est lisible et esthétique sur les 3 formats d'écran (mobile, tablette, desktop).
- **SC-005** : Un administrateur peut créer une rubrique complète (avec contenu riche) en moins de 5 minutes.
- **SC-006** : 100 % des contenus existants restent accessibles et correctement affichés après la migration.

## Clarifications

### Session 2026-03-04

- Q: Sur la page listing, quel style d'affichage pour chaque rubrique ? → A: Mix — le premier item de chaque section s'affiche en layout magazine (inspiré des captures), les suivants en cards stylisées par type. Le layout magazine complet est aussi utilisé sur la page de détail.
- Q: Dans quel ordre les 4 types de rubriques apparaissent-ils sur la page listing ? → A: En Vedette → Parcours Inspirant → Agenda & Opportunités → Focus.

## Assumptions

- Le type « portrait » existant est fonctionnellement équivalent à « parcours_inspirant » et sera traité comme tel.
- Les composants ToastEditor.client.vue et ToastViewer.client.vue existants seront réutilisés pour l'édition et le rendu du contenu riche.
- L'identité visuelle des 4 types est inspirée des captures du magazine physique fournies (capture1-4.jpeg), adaptée au web.
- Le champ `description` existant sera conservé comme résumé/extrait, et un nouveau champ `content` contiendra le contenu riche complet.
- La palette de couleurs du projet (ambre/orange sur fond sombre) est conservée comme base, avec des variations par type de rubrique.
