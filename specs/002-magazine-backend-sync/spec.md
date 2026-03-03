# Feature Specification: Synchronisation données magazine — Backend & Back Office

**Feature Branch**: `002-magazine-backend-sync`
**Created**: 2026-03-03
**Status**: Draft
**Input**: Adapter la structure de données backend et back office aux informations affichées dans AlaUneSection.vue et magazine/[id].vue. Ajouter la possibilité de mettre une édition à la une et de définir la prochaine date de sortie pour le décompteur.

## Contexte

Le composant `AlaUneSection.vue` affiche actuellement des données en dur (numéro, titre, sous-titre, description, date de disponibilité, lien PDF). Le modèle `Magazine` en base de données ne contient pas tous ces champs (pas de sous-titre, pas de date de disponibilité, pas de notion d'édition « à la une »). L'objectif est d'aligner la structure de données du backend avec les besoins des composants frontend, et de donner à l'administrateur le contrôle complet sur ces informations via le back office.

## User Scenarios & Testing

### User Story 1 — Mettre une édition à la une (Priority: P1)

L'administrateur souhaite sélectionner un magazine existant pour qu'il s'affiche dans la section « À la une » de la page d'accueil. Il doit pouvoir changer l'édition mise en avant à tout moment.

**Why this priority**: C'est le besoin central de la demande — sans cette fonctionnalité, la section « À la une » reste codée en dur.

**Independent Test**: Peut être testé en mettant un magazine à la une depuis le back office et en vérifiant que la page d'accueil affiche ce magazine.

**Acceptance Scenarios**:

1. **Given** l'administrateur est sur la page de gestion des magazines, **When** il clique sur « Mettre à la une » pour un magazine, **Then** ce magazine est marqué comme édition à la une et tout autre magazine précédemment à la une perd automatiquement ce statut (une seule édition à la une à la fois).
2. **Given** un magazine est marqué « à la une », **When** un visiteur accède à la page d'accueil, **Then** la section « À la une » affiche le titre, sous-titre, description, image de couverture et lien de téléchargement de ce magazine.
3. **Given** aucun magazine n'est marqué « à la une », **When** un visiteur accède à la page d'accueil, **Then** la section « À la une » ne s'affiche pas.

---

### User Story 2 — Définir la date de disponibilité et le décompteur (Priority: P1)

L'administrateur souhaite définir une date de disponibilité future pour un magazine. Tant que cette date n'est pas atteinte, un décompteur s'affiche sur la page d'accueil. Une fois la date passée, le bouton de téléchargement devient actif.

**Why this priority**: Le décompteur est un élément central du composant AlaUneSection qui crée de l'anticipation pour les lecteurs.

**Independent Test**: Peut être testé en définissant une date de disponibilité future et en vérifiant que le décompteur s'affiche et se met à jour en temps réel.

**Acceptance Scenarios**:

1. **Given** l'administrateur crée ou modifie un magazine, **When** il saisit une date de disponibilité future, **Then** cette date est enregistrée et utilisée pour le décompteur.
2. **Given** un magazine « à la une » a une date de disponibilité dans le futur, **When** un visiteur accède à la page d'accueil, **Then** le décompteur affiche les jours, heures, minutes et secondes restants, et le bouton de téléchargement est désactivé avec le libellé « Bientôt disponible ».
3. **Given** un magazine « à la une » a une date de disponibilité passée et un PDF associé, **When** un visiteur accède à la page d'accueil, **Then** le décompteur ne s'affiche plus et le bouton « Télécharger » est actif.
4. **Given** l'administrateur ne renseigne pas de date de disponibilité, **When** le magazine est affiché, **Then** le système considère le magazine comme immédiatement disponible (pas de décompteur).

---

### User Story 3 — Enrichir les informations du magazine avec un sous-titre (Priority: P2)

L'administrateur souhaite pouvoir renseigner un sous-titre pour chaque édition du magazine (ex : « Édition inaugurale », « Spécial orientation »). Ce sous-titre s'affiche dans la section « À la une » et sur la page de détail du magazine.

**Why this priority**: Le sous-titre enrichit l'affichage mais le magazine peut fonctionner sans.

**Independent Test**: Peut être testé en ajoutant un sous-titre lors de la création d'un magazine et en vérifiant qu'il apparaît sur la page d'accueil et la page de détail.

**Acceptance Scenarios**:

1. **Given** l'administrateur est sur le formulaire de création/modification d'un magazine, **When** il saisit un sous-titre, **Then** le sous-titre est enregistré.
2. **Given** un magazine « à la une » a un sous-titre défini, **When** un visiteur accède à la page d'accueil, **Then** le sous-titre s'affiche sous le titre du magazine.
3. **Given** un magazine n'a pas de sous-titre, **When** il s'affiche, **Then** l'espace du sous-titre est simplement absent (pas d'espace vide visible).

---

### User Story 4 — Cohérence page de détail du magazine (Priority: P2)

La page de détail d'un magazine (`/magazine/:id`) doit afficher les nouvelles informations ajoutées (sous-titre, date de disponibilité) de façon cohérente avec la section « À la une ».

**Why this priority**: Assure la cohérence entre la section « À la une » et la page de détail.

**Independent Test**: Peut être testé en accédant à la page de détail d'un magazine et en vérifiant que les nouvelles informations apparaissent correctement.

**Acceptance Scenarios**:

1. **Given** un magazine a un sous-titre, **When** un visiteur accède à sa page de détail, **Then** le sous-titre s'affiche sous le titre.
2. **Given** un magazine a une date de disponibilité future et pas de PDF, **When** un visiteur accède à sa page de détail, **Then** le bouton de téléchargement est désactivé avec la mention « Bientôt disponible » et la date de disponibilité est affichée.

---

### Edge Cases

- Que se passe-t-il si l'administrateur supprime un magazine qui est « à la une » ? La section « À la une » ne doit plus s'afficher sur la page d'accueil.
- Que se passe-t-il si la date de disponibilité est modifiée alors que le magazine est « à la une » ? Le décompteur doit refléter la nouvelle date au prochain chargement de la page.
- Que se passe-t-il si un magazine « à la une » n'a pas d'image de couverture ? Un placeholder visuel doit s'afficher (comportement existant sur la page de détail).
- Que se passe-t-il si un magazine est marqué « à la une » sans PDF et que la date de disponibilité est passée ? Le bouton de téléchargement reste désactivé (pas de PDF à télécharger).

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre de marquer un seul magazine comme « à la une ». Quand un magazine est mis à la une, tout magazine précédemment à la une perd automatiquement ce statut.
- **FR-002**: Le système DOIT stocker un sous-titre optionnel pour chaque magazine.
- **FR-003**: Le système DOIT stocker une date de disponibilité optionnelle pour chaque magazine, distincte de la date de publication.
- **FR-004**: Le système DOIT exposer un point d'accès pour récupérer le magazine « à la une » avec toutes ses informations (titre, sous-titre, description, image de couverture, date de disponibilité, lien PDF, version).
- **FR-005**: Le système DOIT permettre à l'administrateur de gérer le statut « à la une », le sous-titre et la date de disponibilité via le back office existant.
- **FR-006**: La section « À la une » de la page d'accueil DOIT afficher dynamiquement les données du magazine marqué à la une (au lieu de données codées en dur).
- **FR-007**: Le décompteur de la section « À la une » DOIT se calculer à partir de la date de disponibilité du magazine à la une.
- **FR-008**: Le bouton de téléchargement de la section « À la une » DOIT être actif uniquement si la date de disponibilité est passée ET que le magazine a un fichier PDF associé.
- **FR-009**: La page de détail du magazine DOIT afficher le sous-titre et la date de disponibilité lorsqu'ils sont définis.
- **FR-010**: Si aucun magazine n'est marqué « à la une », la section correspondante DOIT être masquée sur la page d'accueil.

### Key Entities

- **Magazine** (entité existante, enrichie) : Représente un numéro du magazine. Nouveaux attributs : sous-titre (texte, optionnel), date de disponibilité (date/heure, optionnelle), statut « à la une » (vrai/faux, un seul magazine à la fois peut avoir la valeur vrai).

## Success Criteria

### Measurable Outcomes

- **SC-001**: L'administrateur peut mettre un magazine à la une en moins de 3 clics depuis la liste des magazines.
- **SC-002**: Le changement d'édition à la une est visible sur la page d'accueil immédiatement après rafraîchissement de la page.
- **SC-003**: Le décompteur affiche le temps restant exact (à la seconde près) par rapport à la date de disponibilité définie par l'administrateur.
- **SC-004**: 100 % des informations affichées dans la section « À la une » proviennent des données stockées en base (aucune donnée codée en dur).
- **SC-005**: Le sous-titre s'affiche correctement à la une et sur la page de détail quand il est défini, et est absent sans espace vide résiduel quand il n'est pas défini.

## Assumptions

- Une seule édition peut être « à la une » à la fois (pas de rotation automatique ni de file d'attente).
- La date de disponibilité est optionnelle : si elle n'est pas définie, le magazine est considéré comme immédiatement disponible.
- Le sous-titre est optionnel et son absence ne doit pas affecter l'affichage.
- Le modèle de données existant (Magazine avec ses relations Download) reste intact — seuls de nouveaux champs sont ajoutés.
- Le système d'authentification admin existant (mot de passe unique + session) reste inchangé.
- Le PDF peut ne pas être encore uploadé même si la date de disponibilité est passée (le bouton reste désactivé dans ce cas).

## Out of Scope

- Planification automatique de la mise à la une (changement automatique par date).
- Historique des éditions mises à la une.
- Notification aux utilisateurs quand un magazine devient disponible.
- Prévisualisation live du rendu « à la une » dans le back office.
