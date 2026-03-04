# Feature Specification: Dashboard Admin, Newsletter & Embellissement

**Feature Branch**: `005-admin-dashboard-newsletter`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "Dashboard admin avec graphiques Chart.js/vue-chartjs (téléchargements par jour/mois, visites plateforme, etc.), liste des téléchargements avec infos formulaire, newsletter simple (capture emails sans SMTP), inscription newsletter dans le footer, embellissement de l'interface admin pour refléter le design du front office"

## Clarifications

### Session 2026-03-04

- Q: Le thème sombre admin s'applique-t-il à toutes les pages ou seulement au layout ? → A: Layout/sidebar seulement — les pages internes (magazines, rubriques, partenaires) gardent le thème actuel blanc/emerald.
- Q: La liste des téléchargements doit-elle aussi avoir un export CSV comme la newsletter ? → A: Oui, ajouter un bouton export CSV sur la page des téléchargements.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tableau de bord analytique avec graphiques (Priority: P1)

En tant qu'administrateur, je veux voir des graphiques interactifs sur le tableau de bord pour comprendre d'un coup d'oeil les performances de la plateforme : nombre de téléchargements des magazines (par jour, par semaine, par mois), répartition par magazine, répartition par niveau d'étude, et nombre de visites de la plateforme.

**Why this priority**: Le tableau de bord est la première page vue par l'administrateur. Des graphiques pertinents remplacent le contenu actuel (simples cartes de liens) et offrent une valeur immédiate pour le pilotage de la plateforme.

**Independent Test**: Peut être testé en se connectant à l'admin et en vérifiant que les graphiques s'affichent correctement avec les données existantes de la table Download. On peut créer quelques enregistrements de test et vérifier que les courbes se mettent à jour.

**Acceptance Scenarios**:

1. **Given** l'administrateur est connecté, **When** il accède au tableau de bord, **Then** il voit un graphique en courbes montrant le nombre de téléchargements par jour sur les 30 derniers jours
2. **Given** l'administrateur est sur le tableau de bord, **When** il change le filtre de période (7 jours, 30 jours, 90 jours, 12 mois), **Then** le graphique des téléchargements se met à jour selon la période sélectionnée
3. **Given** des téléchargements existent dans la base, **When** l'administrateur consulte le tableau de bord, **Then** il voit un graphique en barres ou en anneau montrant la répartition des téléchargements par magazine
4. **Given** des téléchargements existent dans la base, **When** l'administrateur consulte le tableau de bord, **Then** il voit un graphique montrant la répartition des téléchargeurs par niveau d'étude
5. **Given** le suivi des visites est actif, **When** l'administrateur consulte le tableau de bord, **Then** il voit un graphique en courbes du nombre de visites par jour sur la période sélectionnée
6. **Given** l'administrateur est sur le tableau de bord, **When** il consulte les chiffres clés, **Then** il voit des cartes résumées affichant : total téléchargements, total visites, total abonnés newsletter, nombre de magazines publiés

---

### User Story 2 - Liste des téléchargeurs avec détails du formulaire (Priority: P2)

En tant qu'administrateur, je veux accéder depuis la barre latérale à une page listant toutes les personnes ayant téléchargé un magazine, avec l'ensemble des informations qu'elles ont remplies dans le formulaire de téléchargement (nom, contact, âge, niveau d'étude, filière, magazine téléchargé, date).

**Why this priority**: Ces données sont essentielles pour connaître l'audience et prendre des décisions éditoriales. Le modèle Download existe déjà en base, il faut juste une interface de consultation.

**Independent Test**: Peut être testé en créant des enregistrements Download dans la base puis en vérifiant que la page admin affiche la liste complète avec toutes les colonnes d'information.

**Acceptance Scenarios**:

1. **Given** l'administrateur est connecté, **When** il clique sur "Téléchargements" dans la barre latérale, **Then** il accède à une page affichant la liste de tous les téléchargements
2. **Given** la liste des téléchargements est affichée, **When** l'administrateur consulte un enregistrement, **Then** il voit : nom complet, contact, âge, niveau d'étude, filière, nom du magazine, date de téléchargement
3. **Given** la liste contient de nombreux enregistrements, **When** l'administrateur fait défiler la page, **Then** les données sont paginées pour maintenir la performance
4. **Given** la liste des téléchargements est affichée, **When** l'administrateur utilise la barre de recherche, **Then** il peut filtrer par nom, contact ou filière
5. **Given** la liste des téléchargements est affichée, **When** l'administrateur clique sur un en-tête de colonne, **Then** la liste se trie selon cette colonne (ascendant/descendant)
6. **Given** la liste des téléchargements est affichée, **When** l'administrateur clique sur "Exporter CSV", **Then** un fichier CSV contenant tous les téléchargements avec leurs détails est téléchargé

---

### User Story 3 - Inscription à la newsletter dans le footer (Priority: P2)

En tant que visiteur de la plateforme, je veux pouvoir m'inscrire à la newsletter depuis le footer du site pour être alerté de la sortie des prochaines éditions du magazine. L'inscription consiste simplement à saisir mon adresse email.

**Why this priority**: La newsletter est un canal de fidélisation essentiel. L'intégration dans le footer garantit sa visibilité sur toutes les pages. Pas de SMTP nécessaire pour l'instant : les emails sont capturés en base et les envois se feront manuellement.

**Independent Test**: Peut être testé en saisissant un email dans le formulaire du footer et en vérifiant que l'email est bien enregistré en base de données via la page admin.

**Acceptance Scenarios**:

1. **Given** un visiteur est sur n'importe quelle page du site, **When** il regarde le footer, **Then** il voit un champ de saisie email avec un bouton d'inscription à la newsletter
2. **Given** le visiteur saisit un email valide et soumet le formulaire, **When** le serveur traite la requête, **Then** l'email est enregistré en base de données et un message de confirmation s'affiche
3. **Given** le visiteur saisit un email déjà enregistré, **When** il soumet le formulaire, **Then** un message l'informe qu'il est déjà inscrit (sans erreur technique)
4. **Given** le visiteur saisit un email invalide, **When** il soumet le formulaire, **Then** un message d'erreur explicite s'affiche et rien n'est enregistré
5. **Given** le visiteur ne saisit rien, **When** il clique sur le bouton d'inscription, **Then** un message demande de saisir une adresse email

---

### User Story 4 - Gestion des abonnés newsletter dans l'admin (Priority: P3)

En tant qu'administrateur, je veux voir la liste des emails inscrits à la newsletter depuis l'interface admin, pouvoir les consulter et les exporter pour envoyer manuellement les notifications.

**Why this priority**: Complète la fonctionnalité newsletter en offrant un moyen de consulter et exploiter les emails collectés.

**Independent Test**: Peut être testé en inscrivant quelques emails via le footer puis en vérifiant leur apparition dans la page admin newsletter.

**Acceptance Scenarios**:

1. **Given** l'administrateur est connecté, **When** il clique sur "Newsletter" dans la barre latérale, **Then** il accède à une page listant tous les emails inscrits avec la date d'inscription
2. **Given** des emails sont inscrits, **When** l'administrateur consulte la liste, **Then** il voit chaque email avec sa date d'inscription
3. **Given** la liste des abonnés est affichée, **When** l'administrateur clique sur "Exporter CSV", **Then** un fichier CSV contenant tous les emails et dates est téléchargé
4. **Given** un abonné souhaite se désinscrire, **When** l'administrateur supprime l'entrée, **Then** l'email est retiré de la liste

---

### User Story 5 - Embellissement de l'interface admin (Priority: P3)

En tant qu'administrateur, je veux que l'interface d'administration adopte un design cohérent avec le front office (thème sombre avec accents ambrés) pour une expérience visuelle professionnelle et harmonieuse.

**Why this priority**: L'embellissement améliore l'expérience utilisateur admin et renforce l'identité visuelle de la marque. Il est priorisé après les fonctionnalités car il ne bloque aucune autre fonctionnalité.

**Independent Test**: Peut être testé visuellement en comparant l'interface admin avant/après et en vérifiant la cohérence avec le thème du front office.

**Acceptance Scenarios**:

1. **Given** l'administrateur accède à l'admin, **When** la page se charge, **Then** la barre latérale et le header utilisent un fond sombre avec des accents ambrés cohérents avec le front office
2. **Given** l'administrateur navigue entre les pages admin, **When** il observe le layout, **Then** la sidebar, le fond de page et les éléments de navigation utilisent la palette sombre/ambrée, tandis que le contenu des pages existantes (magazines, rubriques, partenaires) conserve son thème actuel
3. **Given** l'administrateur est sur mobile, **When** il ouvre le menu, **Then** le menu mobile reprend le même thème sombre avec accents ambrés

---

### User Story 6 - Suivi des visites de la plateforme (Priority: P3)

En tant que système, je dois enregistrer les visites de la plateforme (pages vues) afin de fournir des statistiques de fréquentation dans le tableau de bord admin.

**Why this priority**: Les statistiques de visites enrichissent le tableau de bord mais nécessitent un mécanisme de collecte côté serveur. C'est un complément aux téléchargements déjà trackés.

**Independent Test**: Peut être testé en visitant plusieurs pages du site puis en vérifiant que les visites apparaissent dans le graphique du tableau de bord.

**Acceptance Scenarios**:

1. **Given** un visiteur accède à une page du site, **When** la page se charge, **Then** une visite est enregistrée en base avec la page visitée et la date
2. **Given** le même visiteur recharge la même page, **When** la page se charge à nouveau, **Then** une nouvelle visite est comptabilisée
3. **Given** des visites sont enregistrées, **When** l'administrateur consulte le tableau de bord, **Then** le graphique des visites reflète les données réelles

---

### Edge Cases

- Que se passe-t-il quand la base de données ne contient aucun téléchargement ? Les graphiques doivent afficher un état vide lisible (message "Aucune donnée disponible" ou graphique à zéro)
- Que se passe-t-il quand un email très long (>254 caractères) est soumis pour la newsletter ? Le système doit le rejeter avec un message d'erreur
- Que se passe-t-il quand de nombreuses visites sont enregistrées simultanément ? Le système doit supporter l'écriture concurrente sans erreur
- Que se passe-t-il quand le filtre de période ne contient aucune donnée ? Le graphique doit afficher une courbe à zéro sur la période sélectionnée
- Que se passe-t-il quand l'administrateur exporte une newsletter vide ? Le CSV exporté doit contenir uniquement l'en-tête des colonnes

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher un graphique en courbes des téléchargements par jour/semaine/mois avec filtrage par période (7j, 30j, 90j, 12 mois)
- **FR-002**: Le système DOIT afficher un graphique de répartition des téléchargements par magazine (barres ou anneau)
- **FR-003**: Le système DOIT afficher un graphique de répartition des téléchargeurs par niveau d'étude
- **FR-004**: Le système DOIT afficher des cartes de chiffres clés : total téléchargements, total visites, total abonnés newsletter, nombre de magazines publiés
- **FR-005**: Le système DOIT enregistrer les visites de pages et afficher un graphique de fréquentation dans le tableau de bord
- **FR-006**: Le système DOIT fournir une page admin listant tous les téléchargements avec les colonnes : nom, contact, âge, niveau d'étude, filière, magazine, date
- **FR-007**: La liste des téléchargements DOIT être paginée, triable par colonne, filtrable par recherche textuelle et exportable en CSV
- **FR-008**: Le footer du site DOIT contenir un formulaire d'inscription à la newsletter avec un champ email et un bouton de soumission
- **FR-009**: Le système DOIT valider le format email avant enregistrement et rejeter les doublons avec un message explicite
- **FR-010**: Le système DOIT fournir une page admin listant tous les abonnés newsletter avec la possibilité d'exporter en CSV
- **FR-011**: L'administrateur DOIT pouvoir supprimer un abonné newsletter de la liste
- **FR-012**: La barre latérale admin DOIT inclure des liens vers "Téléchargements" et "Newsletter"
- **FR-013**: Le layout admin (sidebar, header, fond de page) DOIT adopter le thème sombre avec accents ambrés du front office. Les pages internes existantes (magazines, rubriques, partenaires) conservent leur thème actuel blanc/emerald
- **FR-014**: Les graphiques DOIVENT utiliser Chart.js via vue-chartjs (déjà installé dans le projet)
- **FR-015**: Le suivi des visites DOIT être léger et ne pas impacter les performances du site pour les visiteurs

### Key Entities

- **NewsletterSubscriber** : Représente un abonné à la newsletter. Attributs : adresse email (unique), date d'inscription
- **PageVisit** : Représente une visite de page. Attributs : chemin de la page visitée, date/heure de la visite
- **Download** (existant) : Représente un téléchargement de magazine avec les informations du formulaire. Déjà en base avec : nom complet, contact, niveau d'étude, filière, âge, magazine associé, date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: L'administrateur peut visualiser les tendances de téléchargements sur différentes périodes en moins de 3 secondes après chargement de la page
- **SC-002**: L'administrateur peut retrouver un téléchargeur spécifique par recherche en moins de 5 secondes
- **SC-003**: Un visiteur peut s'inscrire à la newsletter en moins de 15 secondes (saisie email + clic)
- **SC-004**: L'administrateur peut exporter la liste complète des abonnés newsletter en un clic
- **SC-005**: L'interface admin est visuellement cohérente avec le front office (même palette de couleurs, même esprit graphique)
- **SC-006**: Les graphiques du tableau de bord s'affichent sans erreur même avec zéro données
- **SC-007**: Le formulaire newsletter rejette 100% des emails invalides ou en doublon avec un message compréhensible
- **SC-008**: La page des téléchargements supporte l'affichage de plus de 500 enregistrements sans dégradation perceptible
