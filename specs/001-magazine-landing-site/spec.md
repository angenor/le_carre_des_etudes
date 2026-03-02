# Feature Specification: Site Vitrine Le Carré des Études

**Feature Branch**: `001-magazine-landing-site`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Site vitrine 4 pages pour le magazine
étudiant ivoirien Le Carré des Études — présentation, téléchargement,
interviews/rubriques, partenaires"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Découvrir le magazine (Priority: P1)

Un visiteur arrive sur le site et découvre Le Carré des Études
à travers une page d'accueil immersive présentant le magazine
avec une image de couverture, le slogan, et une accroche
invitant à en savoir plus. Il peut naviguer vers les autres
sections du site.

**Why this priority**: C'est la porte d'entrée du site. Sans
une première impression forte, les visiteurs ne poursuivent
pas leur navigation.

**Independent Test**: Le visiteur peut accéder à la page
d'accueil, voir la présentation visuelle du magazine, et
naviguer vers les autres pages du site.

**Acceptance Scenarios**:

1. **Given** un visiteur accède à l'URL du site,
   **When** la page d'accueil se charge,
   **Then** il voit une image de présentation du magazine,
   le nom "Le Carré des Études", une description courte,
   et une barre de navigation vers les autres pages.

2. **Given** un visiteur est sur la page d'accueil,
   **When** il clique sur un lien de navigation,
   **Then** il est redirigé vers la page correspondante.

3. **Given** un visiteur accède au site depuis un mobile,
   **When** la page se charge,
   **Then** la mise en page s'adapte à l'écran et reste
   lisible et navigable.

---

### User Story 2 - Télécharger le magazine (Priority: P1)

Un visiteur souhaite obtenir la version numérique gratuite
du magazine. Il accède à la page "Le Magazine", voit les
numéros disponibles, remplit un formulaire avec ses
informations personnelles (nom & prénoms, contact, niveau
d'étude, âge, filière actuelle), puis obtient le fichier
PDF du magazine à télécharger.

**Why this priority**: Le téléchargement est l'objectif
principal du site — il permet de distribuer le magazine
numériquement et de constituer une base de données de
lecteurs pour l'équipe éditoriale.

**Independent Test**: Un visiteur peut remplir le formulaire,
soumettre ses informations, et télécharger le magazine PDF.

**Acceptance Scenarios**:

1. **Given** un visiteur accède à la page "Le Magazine",
   **When** la page se charge,
   **Then** il voit la liste des magazines disponibles,
   chacun avec son nom, sa description, sa version et
   sa date de publication.

2. **Given** un visiteur clique sur "Télécharger" pour
   un magazine,
   **When** le formulaire s'affiche,
   **Then** il contient les champs : nom & prénoms,
   contact, niveau d'étude, âge, filière actuelle.

3. **Given** un visiteur remplit tous les champs et soumet
   le formulaire,
   **When** la validation réussit,
   **Then** ses informations sont enregistrées et le
   téléchargement du PDF démarre automatiquement.

4. **Given** un visiteur soumet le formulaire avec des
   champs obligatoires manquants ou invalides,
   **When** la validation s'exécute,
   **Then** des messages d'erreur clairs s'affichent
   sur les champs concernés et le formulaire n'est pas
   soumis.

---

### User Story 3 - Consulter les interviews et rubriques (Priority: P2)

Un visiteur souhaite avoir un avant-goût du contenu
éditorial du magazine. Il accède à la page "Interviews &
Rubriques" et consulte des extraits organisés en trois
catégories : Portrait, Parcours Inspirant et En Vedette,
présentés sous forme d'images avec titres et descriptions.

**Why this priority**: Cette page valorise le contenu et
incite au téléchargement, mais n'est pas bloquante pour
la distribution du magazine.

**Independent Test**: Un visiteur peut parcourir les
différentes rubriques et voir les images et descriptions
de chaque contenu éditorial.

**Acceptance Scenarios**:

1. **Given** un visiteur accède à la page Interviews &
   Rubriques,
   **When** la page se charge,
   **Then** il voit des sections distinctes pour
   "Portrait", "Parcours Inspirant" et "En Vedette",
   chacune avec au moins un élément affiché.

2. **Given** un visiteur consulte un élément de rubrique,
   **When** il regarde une carte de contenu,
   **Then** il voit une image, un titre et une courte
   description.

3. **Given** aucun contenu n'a été ajouté pour une
   rubrique,
   **When** la page se charge,
   **Then** la section de cette rubrique n'est pas
   affichée (pas de section vide).

---

### User Story 4 - Voir les partenaires (Priority: P3)

Un visiteur ou un potentiel partenaire accède à la page
"Partenaires" pour voir les organisations qui soutiennent
Le Carré des Études, présentées avec leurs logos et noms.

**Why this priority**: Important pour la crédibilité et
les relations partenaires, mais non essentiel pour la
fonctionnalité principale du site.

**Independent Test**: Un visiteur peut voir la liste des
partenaires avec leurs logos et noms.

**Acceptance Scenarios**:

1. **Given** un visiteur accède à la page Partenaires,
   **When** la page se charge,
   **Then** il voit une grille de logos de partenaires
   avec leurs noms.

2. **Given** aucun partenaire n'a été ajouté,
   **When** un visiteur accède à la page,
   **Then** un message indique qu'il n'y a pas encore
   de partenaires affichés.

---

### Edge Cases

- Que se passe-t-il si le fichier PDF d'un magazine
  n'est pas disponible ? Le bouton de téléchargement
  MUST être désactivé avec un message explicatif.
- Que se passe-t-il si un visiteur soumet un format
  de contact invalide ? Un message d'erreur indique
  le format attendu.
- Que se passe-t-il si les images ne chargent pas ?
  Un texte alternatif descriptif MUST être affiché.
- Comment le site se comporte-t-il sur une connexion
  lente ? Le contenu textuel MUST s'afficher en
  priorité grâce au rendu serveur (SSR).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le site MUST comporter 4 pages accessibles
  via une navigation commune : Accueil, Le Magazine,
  Interviews & Rubriques, Partenaires.
- **FR-002**: La page Accueil MUST afficher une image de
  présentation du magazine avec le nom "Le Carré des
  Études" et une accroche décrivant la mission du magazine.
- **FR-003**: La page Le Magazine MUST lister les numéros
  de magazine disponibles au téléchargement, chacun avec
  nom, description, version et date de publication.
- **FR-004**: Le système MUST capturer les informations
  suivantes avant tout téléchargement : nom & prénoms,
  contact, niveau d'étude, âge, filière actuelle.
- **FR-005**: Tous les champs du formulaire de
  téléchargement MUST être obligatoires et validés
  avant soumission.
- **FR-006**: Le système MUST enregistrer les informations
  du téléchargeur en base de données à chaque soumission
  de formulaire.
- **FR-007**: Le système MUST stocker les métadonnées
  des magazines : nom, description, version, date de
  création, et fichier PDF associé.
- **FR-008**: La page Interviews & Rubriques MUST
  présenter trois catégories de contenu éditorial :
  Portrait, Parcours Inspirant et En Vedette — chacune
  avec image, titre et description.
- **FR-009**: La page Partenaires MUST afficher les
  partenaires avec leur logo et leur nom.
- **FR-010**: Toutes les pages MUST être responsive
  (mobile, tablette, desktop).
- **FR-011**: Le site MUST être rendu côté serveur (SSR)
  pour le référencement et la performance.
- **FR-012**: La navigation MUST être présente sur toutes
  les pages et indiquer la page active.

### Key Entities

- **Magazine**: Représente un numéro du magazine
  disponible au téléchargement. Attributs : nom,
  description, version (ex: "N°1"), date de publication,
  fichier PDF.
- **Téléchargeur (Downloader)**: Personne qui remplit le
  formulaire pour télécharger un magazine. Attributs :
  nom & prénoms, contact, niveau d'étude, âge, filière
  actuelle, date de soumission, magazine téléchargé.
- **Rubrique (ContentItem)**: Contenu éditorial affiché
  sur la page Interviews. Attributs : type (portrait /
  parcours inspirant / en vedette), titre, description,
  image.
- **Partenaire (Partner)**: Organisation partenaire du
  magazine. Attributs : nom, logo (image).

### Assumptions

- Le magazine est distribué au format PDF uniquement.
- Aucune authentification utilisateur n'est requise ;
  le formulaire de téléchargement est la seule barrière
  avant accès au PDF.
- Le contenu (magazines, rubriques, partenaires) est
  géré directement en base de données pour la V1
  (pas de CMS externe).
- Le champ "contact" correspond à un numéro de
  téléphone (format ivoirien, ex: 07 XX XX XX XX).
- Le site est en français uniquement.
- Les fichiers PDF et images sont stockés localement
  sur le serveur (pas de CDN externe pour la V1).
- Un même visiteur peut télécharger plusieurs magazines
  en remplissant le formulaire à chaque fois (pas de
  mécanisme de session ou de compte).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visiteur peut découvrir le magazine et
  naviguer entre les 4 pages en moins de 10 secondes.
- **SC-002**: Un visiteur peut compléter le formulaire
  de téléchargement et obtenir le PDF en moins de
  2 minutes.
- **SC-003**: 100% des soumissions de formulaire valides
  sont enregistrées en base de données sans perte.
- **SC-004**: Le site s'affiche correctement sur les
  3 tailles d'écran principales (mobile 375px, tablette
  768px, desktop 1280px).
- **SC-005**: Le temps de chargement initial de chaque
  page est inférieur à 3 secondes sur une connexion 3G.
- **SC-006**: Le contenu éditorial (portraits, parcours
  inspirants, en vedette) est consultable sans interaction
  complexe (scroll uniquement).
- **SC-007**: Les partenaires sont identifiables
  visuellement (logo + nom) en un coup d'oeil.
