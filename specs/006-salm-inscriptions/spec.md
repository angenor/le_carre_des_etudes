# Feature Specification: Module SALM (1/3) — page publique, inscriptions et back-office des inscriptions

**Feature Branch**: `006-salm-inscriptions`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Module « SALM », partie 1/3 : page publique, inscriptions et back-office des inscriptions. Page /salm de l'édition active conforme à la maquette validée (documentations/SALM/maquette/), inscription étudiant·e avec badge PDF nominatif à QR code, inscription des établissements exposants (confirmation de présence, sans badge), back-office de suivi des inscriptions, modèle de données multi-édition anticipant les features B (administration des contenus) et C (contrôle d'entrée)."

## Contexte

Le SALM (Salon International des Licences et Masters de Côte d'Ivoire) est organisé par **Sucrey Corporates Consulting**. Le magazine Le Carré des Études y est présenté (Jour 1, 11h00). La prochaine édition est le **SALM 2027 : vendredi 12 et samedi 13 mars 2027, Abidjan, lieu à confirmer**.

Le module est découpé en trois features :

| Feature | Périmètre |
|---|---|
| **A — cette spec** | Modèle multi-édition complet, édition 2027 initialisée par un jeu de données initial, page `/salm`, inscription étudiant·e + badge, inscription établissement, back-office des inscriptions |
| B — plus tard | Écrans d'administration des éditions et des contenus, duplication d'une édition, statistiques |
| C — plus tard | Contrôle d'entrée par scan du QR code le jour J |

Le module doit servir pour les éditions suivantes **sans redéveloppement** : tout ce qui change d'une édition à l'autre (dates, lieu, textes, chronogramme, médias, stands, contacts) est une donnée, jamais du code.

**Références** :

- Maquette validée de la partie publique : `documentations/SALM/maquette/` (`README.md`, puis `page-desktop.dc.html`, `page-mobile.dc.html`, `inscription-etudiant.dc.html`, `inscription-ecole.dc.html`, `badge-etudiant.dc.html`). Ces fichiers font foi pour les textes, la structure et les styles.
- Contenus sources : `documentations/brouillons/` (onglet SALM, chronogramme 2027, badge 2026).
- Formulaire de référence étudiant : le formulaire de téléchargement du magazine déjà en ligne (mêmes trois champs, mêmes règles).
- Back-office : pas de maquette, reprendre les patterns de l'administration existante.

**Publics** :

- **Étudiant·e·s** : s'inscrivent et reçoivent un badge d'entrée nominatif.
- **Établissements** (universités, grandes écoles) : s'inscrivent comme exposants **uniquement pour confirmer leur présence**. Ils ne reçoivent **aucun badge**.
- **Administrateurs du site** : consultent et suivent les inscriptions.

## Clarifications

### Session 2026-09-27

- Q: Pour re-télécharger un badge existant, faut-il seulement le même numéro de téléphone, ou aussi le même nom ? → A: Téléphone + nom. Le badge n'est rendu que si le nom saisi correspond au nom enregistré (comparaison insensible à la casse, aux accents, aux espaces et à l'ordre des mots) ; sinon, message neutre sans révéler le nom enregistré.
- Q: Où sont rattachés les vidéos « canapé », les photos et la vidéo du hero montrées sur la page de l'édition N ? → A: À l'édition N-1, où ils ont été produits. La page de l'édition N affiche automatiquement les médias de l'édition précédente (la plus récente antérieure à N) ; le seed crée une édition 2026 archivée qui porte les médias 2026.
- Q: Un établissement peut-il cocher plusieurs programmes proposés ou un seul ? → A: Plusieurs (au moins un), comme dans la maquette ; « Précisez » facultatif si « Autre » est coché.
- Q: Faut-il un plafond d'inscriptions étudiantes ou une fermeture automatique des inscriptions ? → A: Pas de plafond. Ouverture et fermeture manuelles, et fermeture automatique des deux types d'inscription à la fin du dernier jour du salon.
- Q: Combien de temps conserver les données personnelles des inscrits après le salon, et que faire ensuite ? → A: Conservation illimitée, sans anonymisation ni purge automatique. **Remplacée par la décision de revue D5** (conservation de 12 mois au plus).

### Décisions de revue 2026-09-27 (checklist `checklists/revue.md`)

- **D1 — Style du formulaire étudiant** (CHK005) : la maquette fait foi pour le visuel (fond clair, accent #D5570B, colonne orange à gauche, aperçu du badge). Du formulaire magazine (`DownloadModal`), on reprend seulement les champs, les libellés, les exemples de saisie, la liste des niveaux et la validation du téléphone, pas son style.
- **D2 — Navigation mobile** (CHK003) : l'en-tête de la maquette mobile n'est pas contractuel. La navbar actuelle est conservée telle quelle ; seul le lien « SALM <année> » est ajouté, et elle doit rester utilisable à 390 px.
- **D3 — Sections sur mobile** (CHK002) : aucune section n'est masquée ; toutes passent sur une colonne (affiche au-dessus du texte pour « Pourquoi le SALM ? », carrousel horizontal pour le programme, grille de 2 colonnes pour les photos).
- **D4 — Contraste des champs** (CHK009) : bordure au repos #8A847F (3,7:1 sur blanc), bordure au focus #D5570B.
- **D5 — Conservation** (CHK029) *[à valider par l'organisateur]* : données personnelles conservées 12 mois au plus après la fin du salon. Une action du back-office, sur une édition archivée et avec confirmation, supprime les inscriptions en conservant des compteurs agrégés. Pas de tâche planifiée. Nouvelle mention d'usage étudiante.
- **D6 — Registre des messages** (CHK048) : l'API renvoie des codes d'erreur, pas des phrases ; chaque formulaire affiche son propre texte (tutoiement côté étudiant, vouvoiement côté établissement).
- **D7 — Suppression d'un établissement** (CHK031) : l'admin peut supprimer une inscription établissement complète, exposants compris, avec confirmation. La modification des exposants par l'admin est hors périmètre.
- **D8 — Mention d'usage établissement** (CHK030) : même principe que pour l'étudiant·e, au vouvoiement, en bas de la dernière étape de saisie.
- **D9 — Liste blanche des champs** (CHK021) : les routes publiques n'acceptent qu'une liste blanche de champs ; tout autre champ est ignoré. L'édition est toujours déterminée côté serveur.
- **D10 — Nom long** (CHK036) : saisie limitée à 60 caractères ; sur le badge, police réduite jusqu'à 14 pt sur 2 lignes au plus, puis 3 lignes à 14 pt si nécessaire ; jamais de troncature.
- **D11 — Caractères du nom** (CHK037) : lettres (accents compris), espaces, traits d'union, apostrophes et points uniquement ; polices couvrant le Latin étendu ; un caractère absent de la police est remplacé par sa forme sans accent, dans le PDF seulement.
- **D12 — Impression** (CHK034) : PDF exactement 100 × 150 mm ; QR code d'au moins 25 mm, plus sa marge blanche ; consigne d'impression à 100 % sur l'écran « Félicitations ».
- **D13 — Exposants le jour J** (CHK041) *[à valider par l'organisateur]* : pas de badge ; pointage à l'accueil exposants sur une liste nominative exportée du back-office ; aucun contrôle par QR code, y compris dans la feature C.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Inscription étudiant·e et badge d'entrée (Priority: P1)

Un·e étudiant·e arrive sur la page SALM, clique sur « Étudiant·e : obtenir mon badge » et remplit trois champs : Nom & prénoms, Numéro de téléphone, Niveau d'étude. Pendant la saisie, un aperçu du badge se met à jour (nom en majuscules, niveau). À la validation, un écran « Félicitations, ton badge est prêt ! » propose immédiatement le téléchargement du badge en PDF (10 × 15 cm, recto/verso). S'il ou elle se réinscrit plus tard avec le même numéro et le même nom, le badge existant lui est rendu (parcours « badge perdu »).

**Why this priority**: C'est la raison d'être du module pour le magazine : faire venir les étudiant·e·s au salon et leur donner un titre d'entrée. Sans cette story, rien ne justifie d'ouvrir les inscriptions.

**Independent Test**: Avec l'édition 2027 initialisée et les inscriptions étudiantes ouvertes, remplir le formulaire avec des données valides, télécharger le PDF et vérifier le recto (nom en majuscules, niveau, numéro SALM27-XXXXXX, QR code lisible menant à une URL de vérification) et le verso (jours, horaires, lieu, contact). Refaire l'inscription avec le même numéro et le même nom : le même badge (même numéro) est rendu ; avec le même numéro et un autre nom : aucun badge n'est rendu.

**Acceptance Scenarios**:

1. **Given** les inscriptions étudiantes de l'édition active sont ouvertes, **When** l'étudiant·e saisit « Kouassi Aya Marie », **Then** l'aperçu du badge affiche « KOUASSI AYA MARIE » sans attendre la validation.
2. **Given** le formulaire est rempli avec un nom, le numéro « 07 12 34 56 78 » et le niveau « Licence (Bac+3) », **When** l'étudiant·e clique sur « Obtenir mon badge », **Then** l'écran « Félicitations » s'affiche avec le badge, le bouton « Télécharger mon badge (PDF) », la consigne « Imprime à 100 % (sans ajustement à la page) ou présente-le sur ton téléphone », le rappel des dates et du lieu, et le lien « Inscrire une autre personne ».
3. **Given** l'écran « Félicitations » est affiché, **When** l'étudiant·e clique sur « Télécharger mon badge (PDF) », **Then** un PDF de 10 × 15 cm de deux faces est téléchargé : recto avec le nom en majuscules, le niveau, le numéro unique (ex. « SALM27-000482 ») et un QR code ; verso avec les jours et horaires de chaque jour, le lieu et le contact de l'organisateur.
4. **Given** 481 étudiant·e·s sont déjà inscrit·e·s à l'édition 2027, **When** un·e nouvel·le étudiant·e s'inscrit, **Then** son numéro de badge est « SALM27-000482 ».
5. **Given** « Kouassi Aya Marie » est déjà inscrite avec le numéro « 0712345678 », **When** le formulaire est soumis à nouveau avec « 07 12 34 56 78 » et le nom « aya marie KOUASSI », **Then** aucune nouvelle inscription n'est créée et l'écran indique « Tu es déjà inscrit·e » et propose de télécharger le badge existant, avec son numéro d'origine.
6. **Given** « Kouassi Aya Marie » est déjà inscrite avec le numéro « 0712345678 », **When** le formulaire est soumis avec ce numéro et le nom « Koné Ibrahim », **Then** aucune inscription n'est créée ni modifiée, aucun badge n'est rendu, et le message « Ce numéro est déjà inscrit sous un autre nom. Vérifie l'orthographe ou contacte l'organisateur. » s'affiche sans révéler le nom enregistré.
7. **Given** le numéro « 08 12 34 56 78 » (préfixe non ivoirien), **When** l'étudiant·e valide, **Then** une erreur liée au champ téléphone indique le format attendu (« Commence par 01, 05, 07 ou 27, suivi de 8 chiffres. ») et le formulaire n'est pas envoyé.
8. **Given** un champ obligatoire est vide, **When** l'étudiant·e valide, **Then** l'erreur est affichée sous le champ concerné, annoncée aux technologies d'assistance, et le focus est placé sur le premier champ en erreur.
9. **Given** le nom « Kouassi Aya 😀 » ou « K0uassi #1 », **When** l'étudiant·e valide, **Then** une erreur liée au champ indique que seuls les lettres, espaces, traits d'union, apostrophes et points sont acceptés ; au-delà de 60 caractères, la saisie est bloquée et signalée.
10. **Given** le QR code d'un badge, **When** il est scanné avec un téléphone quelconque, **Then** il ouvre une URL de vérification propre à ce badge, impossible à deviner à partir du numéro de badge ou du nom, et la page ouverte ne révèle aucune donnée personnelle.

---

### User Story 2 — Page publique de l'édition active `/salm` (Priority: P1)

Un visiteur (étudiant·e, parent, établissement) ouvre `/salm` depuis la barre de navigation (« SALM 2027 ») et découvre l'édition : hero plein écran avec la vidéo de l'édition précédente, compte à rebours, dates, lieu, horaires et deux appels à l'action ; « Deux façons de participer » ; « Pourquoi le SALM ? » avec l'affiche officielle ; programme d'activité (5 temps forts) ; chronogramme jour par jour avec la présentation du magazine Le Carré des Études mise en avant ; « Le canapé du SALM » (vidéos lues dans une fenêtre sans quitter la page) ; catalogue photos ; appel final avec les contacts de l'organisateur. La page est conforme à `page-desktop.dc.html` et `page-mobile.dc.html`.

**Why this priority**: La page est la porte d'entrée des deux parcours d'inscription et la vitrine du partenariat magazine × SALM. Elle est livrable seule (avec les inscriptions fermées) pour annoncer l'édition.

**Independent Test**: Avec l'édition 2027 publiée par le jeu de données initial, ouvrir `/salm` sur ordinateur (1440 px) et sur mobile (390 px), comparer section par section avec la maquette, ouvrir une vidéo du canapé au clavier puis la fermer avec Échap. Modifier ensuite une donnée de l'édition (ex. le slogan) directement dans les données : la page reflète le changement sans modification de code.

**Acceptance Scenarios**:

1. **Given** l'édition 2027 est publiée, **When** un visiteur consulte n'importe quelle page publique du site, **Then** la barre de navigation contient un lien « SALM 2027 » menant à `/salm`.
2. **Given** aucune édition n'est publiée, **When** un visiteur consulte le site, **Then** le lien SALM n'apparaît pas dans la barre de navigation, et `/salm` affiche un message sobre indiquant que la prochaine édition sera bientôt annoncée.
3. **Given** nous sommes 167 jours avant le 12 mars 2027 à 9h30 (heure d'Abidjan), **When** le visiteur ouvre `/salm`, **Then** le hero affiche « OUVERTURE DANS 167 jours » et « Compte à rebours jusqu'au 12 mars 2027, 9h30 ».
4. **Given** le hero est affiché, **When** le visiteur active « Revivre le SALM 2026 », **Then** la vidéo de l'édition précédente se lit en plein écran dans une fenêtre accessible, sans quitter la page.
5. **Given** la section « Le canapé du SALM » liste 9 vidéos, **When** le visiteur active une vidéo au clavier, **Then** une fenêtre s'ouvre avec la vidéo, le focus y est placé, Tab reste dans la fenêtre, Échap ou le bouton « Fermer » la ferme, la lecture s'arrête et le focus revient sur la vidéo d'origine.
6. **Given** le chronogramme contient le créneau « Présentation du magazine Le Carré des Études » marqué « mis en avant », **When** le visiteur consulte le chronogramme, **Then** ce créneau est visuellement distingué (accent ambre du site) des autres créneaux.
7. **Given** un écran mobile (390 px), **When** le visiteur consulte le chronogramme, **Then** il est présenté en onglets « Jour 1 · ven. 12 » / « Jour 2 · sam. 13 », utilisables au clavier et correctement annoncés comme onglets.
8. **Given** les inscriptions étudiantes sont fermées, **When** le visiteur consulte `/salm`, **Then** les appels à l'action étudiants sont remplacés par un message indiquant que les inscriptions sont closes, et le formulaire étudiant n'est plus accessible ; les appels à l'action établissements ne changent pas s'ils restent ouverts.
9. **Given** le lieu de l'édition n'est pas renseigné, **When** le visiteur consulte la page, le badge ou les écrans de confirmation, **Then** le texte affiché est « Lieu à confirmer, Abidjan » (jamais un placeholder entre crochets).
10. **Given** la section photos, **When** le visiteur active « Voir tout le catalogue », **Then** toutes les photos de l'édition sont consultables sans quitter la page, avec navigation au clavier.
11. **Given** un écran de 390 px, **When** le visiteur parcourt `/salm`, **Then** toutes les sections de la version desktop sont présentes sur une colonne : l'affiche au-dessus du texte de « Pourquoi le SALM ? », les temps forts en carrousel horizontal, les photos en grille de 2 colonnes ; la navbar existante, avec le lien « SALM 2027 » en plus, reste entièrement utilisable sans défilement horizontal de la page.

---

### User Story 3 — Inscription d'un établissement exposant (Priority: P2)

Un·e représentant·e d'université ou de grande école clique sur « École : confirmer notre présence » et remplit un formulaire en 3 étapes (conforme à `inscription-ecole.dc.html`) :
1. **Établissement** : nom, téléphone, e-mail, programmes proposés (BACHELOR, BTS, LICENCE, MASTER, Autre — plusieurs choix possibles) ;
2. **Exposants & stand** : liste des exposants (nom et prénoms + contact, au moins 1), type de stand parmi ceux de l'édition (initialement STAND OR, STAND DIAMANT, STAND PREMIUM), question libre facultative ;
3. **Confirmation** : écran « Présence confirmée » qui récapitule l'inscription et indique explicitement qu'aucun badge n'est nécessaire.

**Why this priority**: Remplace le Google Form actuel et centralise les établissements avec les étudiant·e·s dans un même back-office. Moins critique que le parcours étudiant : les établissements peuvent encore être gérés par téléphone en attendant.

**Independent Test**: Remplir les 3 étapes avec 2 exposants et le stand « STAND OR », vérifier l'écran récapitulatif (stand, nombre d'exposants, programmes) et la mention « aucun badge », puis retrouver l'inscription dans le back-office.

**Acceptance Scenarios**:

1. **Given** les inscriptions établissements sont ouvertes, **When** l'utilisateur remplit l'étape 1 et clique sur « Continuer », **Then** l'étape 2 s'affiche et l'indicateur d'étapes marque l'étape 1 comme terminée.
2. **Given** l'étape 1 a un e-mail invalide ou aucun programme coché, **When** l'utilisateur clique sur « Continuer », **Then** il reste sur l'étape 1 et chaque erreur est affichée sous le champ concerné.
3. **Given** l'étape 2, **When** l'utilisateur clique sur « ← Retour », **Then** il revient à l'étape 1 avec ses saisies conservées.
4. **Given** l'étape 2 avec un seul exposant, **When** l'utilisateur tente de le retirer, **Then** c'est impossible : au moins un exposant est requis.
5. **Given** l'étape 2 complète, **When** l'utilisateur clique sur « Confirmer notre présence », **Then** l'écran « Présence confirmée » affiche le nom de l'établissement, le stand, le nombre d'exposants et les programmes, précise « Aucun badge à télécharger : l'équipe SALM vous recontacte pour finaliser votre stand. », indique que les exposants seront pointés à l'accueil exposants, et **ne mentionne pas** d'envoi de récapitulatif par e-mail.
6. **Given** l'étape 2, **When** l'utilisateur arrive en bas du formulaire, **Then** la mention d'usage au vouvoiement (FR-046) est affichée au-dessus du bouton « Confirmer notre présence ».
7. **Given** un type de stand masqué par l'administration, **When** l'utilisateur arrive à l'étape 2, **Then** ce type n'est pas proposé.
8. **Given** l'écran « Présence confirmée », **When** l'utilisateur clique sur « Ajouter à mon agenda », **Then** un fichier d'événement de calendrier couvrant les jours du salon est téléchargé.

---

### User Story 4 — Back-office des inscriptions (Priority: P2)

Un administrateur connecté ouvre la nouvelle entrée « SALM » du menu admin. Il y trouve, pour une édition (par défaut l'édition publiée) : la liste des étudiant·e·s inscrit·e·s, la liste des établissements inscrits, et les interrupteurs d'ouverture et de fermeture des inscriptions (étudiant·e·s et établissements séparément).

**Why this priority**: Indispensable pour exploiter les inscriptions (logistique, relances des établissements, contrôle des doublons), mais les inscriptions publiques peuvent être ouvertes quelques jours avant que le back-office soit complet.

**Independent Test**: Avec des inscriptions de test, se connecter à l'admin, rechercher un·e étudiant·e par nom puis par téléphone, filtrer par niveau, exporter en CSV, re-télécharger un badge, supprimer un doublon ; ouvrir la fiche d'un établissement, changer son statut, ajouter une note, exporter en CSV ; fermer les inscriptions étudiantes et vérifier que `/salm` affiche le message de fermeture.

**Acceptance Scenarios**:

1. **Given** l'administrateur est connecté, **When** il ouvre le menu admin, **Then** une entrée « SALM » est présente et mène au suivi des inscriptions de l'édition publiée.
2. **Given** 482 étudiant·e·s inscrit·e·s, **When** l'administrateur ouvre la liste, **Then** il voit le compteur total « 482 inscrit·e·s » et, par ligne : numéro de badge, nom, téléphone, niveau, date d'inscription.
3. **Given** la liste des étudiant·e·s, **When** l'administrateur tape « 0712 » ou « kouassi » dans la recherche, **Then** la liste ne montre que les inscrit·e·s dont le téléphone ou le nom contient ce texte (sans tenir compte des espaces, majuscules ni accents), et le compteur indique le nombre de résultats.
4. **Given** la liste des étudiant·e·s, **When** l'administrateur filtre sur « Master (Bac+5) », **Then** seul·e·s les inscrit·e·s de ce niveau apparaissent ; le filtre se combine avec la recherche.
5. **Given** la liste (filtrée ou non), **When** l'administrateur clique sur « Exporter CSV », **Then** il obtient un fichier contenant les lignes affichées (numéro de badge, nom, téléphone, niveau, date d'inscription), lisible avec les accents dans un tableur.
6. **Given** un·e inscrit·e, **When** l'administrateur clique sur « Badge », **Then** il télécharge exactement le même PDF que celui de l'étudiant·e.
7. **Given** deux inscriptions de la même personne (ex. numéros différents), **When** l'administrateur supprime l'une d'elles après confirmation, **Then** elle disparaît de la liste et du compteur, son badge et son URL de vérification deviennent invalides, et son numéro de badge n'est jamais réattribué.
8. **Given** la liste des établissements, **When** l'administrateur ouvre une fiche, **Then** il voit nom, téléphone, e-mail, programmes, exposants (nom + contact), type de stand, question libre, date d'inscription, statut de suivi et note interne.
9. **Given** une fiche établissement au statut « Nouvelle », **When** l'administrateur choisit « Contactée » puis enregistre une note interne, **Then** le statut et la note sont conservés et visibles dans la liste ; la note n'est jamais visible publiquement.
10. **Given** la liste des établissements, **When** l'administrateur exporte en CSV, **Then** le fichier contient une ligne par établissement avec programmes, stand, statut, note, question, nombre d'exposants et la liste des exposants.
11. **Given** les inscriptions étudiantes sont ouvertes, **When** l'administrateur les ferme, **Then** `/salm` et la page d'inscription étudiante affichent immédiatement un message de fermeture et masquent le formulaire, sans effet sur les inscriptions établissements.
12. **Given** une fiche établissement, **When** l'administrateur choisit « Supprimer l'inscription » et confirme, **Then** l'inscription et ses exposants sont définitivement supprimés et disparaissent des listes, des compteurs et des exports.
13. **Given** la liste des établissements, **When** l'administrateur clique sur « Exporter la liste des exposants », **Then** il obtient un fichier CSV avec une ligne par exposant : établissement, stand, nom et prénoms, contact (inscriptions « Annulée » exclues).
14. **Given** une édition archivée dont le salon est terminé, **When** l'administrateur lance « Supprimer les données personnelles » et confirme en saisissant l'année de l'édition, **Then** toutes les inscriptions étudiantes et établissements de l'édition (exposants compris) sont supprimées, les compteurs agrégés restent consultables, et les badges comme les URL de vérification de l'édition deviennent invalides.
15. **Given** une édition publiée ou en brouillon, **When** l'administrateur consulte le suivi, **Then** l'action « Supprimer les données personnelles » n'est pas disponible, et la date limite de conservation (fin du salon + 12 mois) est affichée.
16. **Given** un visiteur non connecté, **When** il tente d'accéder à une page ou une donnée du back-office SALM, **Then** l'accès est refusé.

---

### Edge Cases

- **Même téléphone, nom différent** : l'inscription existante est conservée telle quelle, aucun badge n'est rendu, et le message neutre de FR-025 s'affiche. Aucune donnée n'est écrasée par une nouvelle soumission.
- **Même téléphone, nom légèrement différent** (accents, majuscules, espaces, ordre des mots : « N'GUESSAN Ange » / « ange n'guessan ») : considéré comme le même nom, le badge est rendu.
- **Tentatives répétées sur un même numéro avec des noms différents** : soumises à la limitation anti-rafale (FR-080), pour empêcher de deviner un nom par essais successifs.
- **Numéro saisi avec espaces, points, tirets ou préfixe +225 / 00225** : le numéro est normalisé (10 chiffres) avant validation et contrôle d'unicité.
- **Deux soumissions simultanées avec le même numéro** (double clic, réseau lent) : une seule inscription est créée, les deux réponses rendent le même badge.
- **Deux inscriptions simultanées de personnes différentes** : les numéros de badge restent uniques et consécutifs, sans doublon.
- **Nom avec caractères accentués / apostrophes** (« N'Guessan Adjoua Ange-Élodie ») : le nom est conservé tel quel, mis en majuscules accentuées sur le badge, et passe à la ligne sans déborder du badge.
- **Nom composé uniquement d'espaces, ou contenant chiffres, émojis ou symboles** : refusé avec un message lié au champ (FR-020a).
- **Nom de 60 caractères** (« N'Guessan-Kouadio Adjoua Marie-Élodie Ange Christelle Aya ») : réduit jusqu'à 14 pt sur 2 lignes, sinon affiché sur 3 lignes à 14 pt, jamais tronqué (FR-030).
- **Caractère latin absent de la police du badge** (« Ǹ », « Ș ») : remplacé par sa forme sans accent dans le PDF uniquement ; le nom enregistré et affiché à l'écran reste intact.
- **Champs non prévus envoyés à une route publique** (`status`, `internalNote`, `badgeNumber`, `editionId`…) : ignorés, sans erreur ni effet (FR-081a).
- **Suppression des données d'une édition en cours** (non archivée ou salon non terminé) : action indisponible et refusée par le serveur.
- **Inscription établissement supprimée** : ses exposants disparaissent aussi ; le type de stand choisi n'est pas affecté.
- **Inscriptions étudiantes fermées** : le formulaire d'inscription est remplacé par le formulaire de récupération ; la récupération d'un badge existant reste possible avec le téléphone **et** le nom (FR-025, voir Assumptions).
- **Inscription soumise juste après la fermeture** (page restée ouverte) : refusée avec un message clair, pas d'inscription créée.
- **Après la fin de l'édition** : le compte à rebours est remplacé par un message (« Le SALM 2027 est en cours » pendant les jours du salon, puis « Merci pour cette édition »). À la fin du dernier jour (heure de fermeture du dernier jour, heure d'Abidjan), les deux types d'inscription se ferment automatiquement, quel que soit l'état des interrupteurs (FR-053). La récupération d'un badge existant reste possible.
- **Nombre d'inscriptions très élevé** : aucun plafond ; le numéro de badge sur 6 chiffres couvre jusqu'à 999 999 inscriptions par édition.
- **Édition sans vidéo, sans photo ou sans affiche** : la section correspondante est masquée (pas de bloc vide, pas d'image cassée) ; le bouton « Revivre le SALM » est masqué si l'édition précédente n'a pas de vidéo récapitulative.
- **Aucune édition précédente** (première édition gérée dans le système) : les sections « Le canapé du SALM » et catalogue photos, ainsi que le bouton « Revivre le SALM », sont masqués ; le fond du hero utilise l'affiche de l'édition.
- **Année sautée** (ex. pas d'édition 2028, page de l'édition 2029) : l'édition précédente est la plus récente antérieure (2027), et les titres de section en reprennent l'année.
- **Édition précédente qui devient publiée ou archivée** : n'a aucun effet sur le rattachement ; les médias restent attachés à leur édition d'origine.
- **Créneaux qui se chevauchent** (Panel 2 et Exposition à 14h00, Jour 1) : affichés tous les deux, dans l'ordre défini par les données, sans erreur.
- **Vidéo indisponible ou bloquée** : la fenêtre affiche un message et un lien vers la vidéo, et reste fermable.
- **JavaScript désactivé ou lent** : les contenus de la page restent lisibles ; les formulaires affichent leurs erreurs après envoi.
- **Robot remplissant le champ piège ou soumettant trop vite** : la soumission est ignorée sans révéler la raison.
- **Rafale de soumissions depuis une même source** : au-delà du seuil, les soumissions sont refusées temporairement avec un message invitant à réessayer plus tard.
- **Établissement inscrit deux fois** : les deux inscriptions sont conservées ; l'administrateur passe le doublon au statut « Annulée » ou le supprime (FR-067a).
- **Changement d'exposants après l'inscription** : l'établissement recontacte l'équipe SALM ; l'administration ne modifie pas les exposants dans cette feature.
- **Programme « Autre » coché** : un champ « Précisez » facultatif apparaît.
- **Type de stand plus proposé après l'inscription d'un établissement** : l'inscription garde son stand d'origine, affiché normalement dans le back-office.
- **Deux éditions en base (2027 publiée, 2028 en brouillon)** : la page publique, la navbar et les formulaires ne concernent que l'édition publiée ; le back-office permet de choisir l'édition consultée.

## Requirements *(mandatory)*

### Functional Requirements

#### Éditions et contenu piloté par les données

- **FR-001**: Le système MUST gérer plusieurs éditions du SALM, chacune avec un statut *brouillon*, *publiée* ou *archivée* ; au plus une édition est publiée à un instant donné.
- **FR-002**: Tous les contenus de la page `/salm`, des formulaires, des écrans de confirmation et du badge (année, dates, horaires par jour, ville, lieu, slogan, textes, affiche, vidéo récapitulative, temps forts, chronogramme, vidéos, photos, types de stands, contacts, organisateur) MUST provenir des données de l'édition, et aucun de ces contenus ne doit être écrit dans le code des pages.
- **FR-003**: Le système MUST fournir un jeu de données initial qui crée :
  - l'**édition 2026**, archivée, qui porte uniquement les médias produits en 2026 : photos du catalogue, image de secours de la vidéo récapitulative, ainsi que la vidéo récapitulative et les vidéos du canapé **dont l'URL est fournie**. Aucune ne l'est à ce jour : les 9 vidéos prévues seront ajoutées au jeu de données dès réception de leurs URL ;
  - l'**édition 2027**, publiée, avec les deux types d'inscription ouverts, et le contenu des brouillons et de la maquette : textes, affiche, 5 temps forts avec leurs photos, chronogramme des 2 jours, 3 types de stands, contacts.

  Les valeurs inconnues (lieu 2027, titres des vidéos, descriptions des stands, champs non connus de l'édition 2026) restent vides et sont traitées par FR-004.
- **FR-004**: Une valeur facultative non renseignée MUST être soit masquée, soit remplacée par un libellé neutre (« Lieu à confirmer »), et jamais affichée comme un placeholder technique.
- **FR-005**: Le modèle de données MUST contenir dès cette feature toutes les entités nécessaires à la feature B (édition, jours, créneaux, temps forts, vidéos, photos, types de stands, contacts, textes, affiche, fichier programme), afin que B n'ajoute que des écrans ; il MUST aussi permettre à la feature C de rattacher des passages à un badge via son identifiant de vérification.
- **FR-006**: Les vidéos du canapé, les photos du catalogue et la vidéo récapitulative MUST être rattachées à l'édition où elles ont été produites. La page d'une édition N affiche ceux de l'**édition précédente**, c'est-à-dire l'édition la plus récente dont l'année est inférieure à N, quel que soit son statut. Les intitulés « Revivre le SALM <année> », « Le canapé du SALM <année> », « Photos <année> » et « Catalogue photos · édition <année> » utilisent l'année de cette édition précédente, sans saisie.

#### Page publique `/salm`

- **FR-010**: Le système MUST afficher sur `/salm` l'édition publiée, conformément aux maquettes desktop et mobile, dans cet ordre : hero, « Deux façons de participer », « Pourquoi le SALM ? », programme d'activité, chronogramme, « Le canapé du SALM », catalogue photos, appel final avec contacts. La maquette fait foi pour les textes, la structure, les couleurs et les polices des écrans publics ; son en-tête mobile (bouton « Ouvrir le menu ») n'est pas contractuel (FR-018).
- **FR-010a**: Sur mobile (moins de 768 px), toutes les sections MUST rester présentes (aucune n'est masquée) et passer sur une colonne. « Pourquoi le SALM ? » place l'affiche au-dessus du texte ; le programme d'activité devient un carrousel horizontal (défilement tactile, utilisable au clavier) ; le catalogue photos devient une grille de 2 colonnes ; le chronogramme passe en onglets (FR-014). Les sections non représentées dans la maquette mobile suivent cette même logique.
- **FR-011**: Le hero MUST afficher : l'intitulé complet du salon, le titre « Salm <année> », le slogan, les dates, le lieu, la plage horaire, le compte à rebours jusqu'à l'ouverture (date et heure du premier jour, heure d'Abidjan), les deux appels à l'action « Étudiant·e : obtenir mon badge » et « École : confirmer notre présence », le bouton « Revivre le SALM <année de l'édition précédente> » (FR-006), les ancres vers les sections et la mention de l'organisateur.
- **FR-012**: Le fond du hero MUST montrer la vidéo récapitulative de l'édition précédente en lecture automatique, sans son et en boucle, uniquement sur les écrans d'au moins 768 px de large et lorsque le visiteur n'a demandé ni la réduction des animations ni l'économie de données. Dans tous les autres cas, pendant le chargement ou en cas d'échec, une image de secours (visuel de la vidéo, sinon affiche de l'édition) est affichée. Un bouton permet de mettre la vidéo de fond en pause et de la relancer. La vidéo avec le son se lit en plein écran dans la fenêtre vidéo (FR-016) quand on active « Revivre le SALM ».
- **FR-013**: Le programme d'activité MUST afficher les temps forts de l'édition (5 pour 2027) avec titre et photo, dans l'ordre défini.
- **FR-014**: Le chronogramme MUST afficher chaque jour (libellé, date) et ses créneaux (heure de début, heure de fin, titre, description facultative), dans l'ordre défini ; un créneau marqué « mis en avant » MUST être visuellement distingué. Sur mobile, les jours sont présentés en onglets accessibles.
- **FR-015**: Le bouton « Télécharger le programme (PDF) » MUST n'apparaître que si un fichier programme est rattaché à l'édition.
- **FR-016**: Les vidéos (hero et canapé) MUST se lire dans une fenêtre superposée sans quitter la page. Cette fenêtre a un titre accessible, place le focus à l'ouverture, garde le focus à l'intérieur, se ferme par Échap ou un bouton « Fermer », arrête la lecture à la fermeture et rend le focus à l'élément d'origine.
- **FR-017**: Le catalogue photos MUST afficher un aperçu (4 photos et le nombre de photos restantes) et permettre de consulter toutes les photos de l'édition précédente (FR-006) sans quitter la page, au clavier comme au toucher.
- **FR-018**: La barre de navigation publique MUST afficher un lien « SALM <année> » vers `/salm` uniquement lorsqu'une édition est publiée ; le pied de page suit la même règle. La navbar existante n'est pas modifiée autrement : pas de nouveau menu mobile. Avec ce lien en plus, elle MUST rester utilisable à 390 px : tous les liens visibles et activables, sans défilement horizontal de la page.
- **FR-019**: Quand aucune édition n'est publiée, `/salm` MUST afficher un message d'attente au lieu d'une erreur.

#### Inscription étudiant·e et badge

- **FR-020**: Le formulaire étudiant MUST comporter exactement trois champs obligatoires, identiques au formulaire de téléchargement du magazine : « Nom & prénoms », « Numéro de téléphone », « Niveau d'étude ». Du formulaire magazine sont repris les champs, les libellés, les exemples de saisie, la liste des niveaux et la validation du téléphone ; le visuel est celui de la maquette (fond clair, accent #D5570B, colonne orange à gauche, aperçu du badge), pas celui du formulaire magazine.
- **FR-020a**: « Nom & prénoms » MUST contenir de 2 à 60 caractères après réduction des espaces, dont au moins 2 lettres, et uniquement des lettres (accents compris), des espaces, des traits d'union, des apostrophes (' et ’) et des points. Chiffres, émojis et symboles sont refusés à la saisie, avec un message lié au champ.
- **FR-021**: Le numéro de téléphone MUST être accepté s'il commence par 01, 05, 07 ou 27 suivi de 8 chiffres, avec ou sans espaces et avec ou sans indicatif +225 / 00225 ; il est enregistré sous une forme normalisée à 10 chiffres.
- **FR-022**: Le niveau d'étude MUST être choisi parmi : Terminale / Futur bachelier, BTS / DUT (Bac+2), Licence (Bac+3), Master (Bac+5), Doctorat, Autre.
- **FR-023**: Un aperçu du badge (nom en majuscules, niveau) MUST se mettre à jour pendant la saisie, sans validation préalable.
- **FR-024**: Une mention d'usage MUST figurer sous le formulaire étudiant : « Tes informations servent uniquement à émettre ton badge, à organiser l'accueil du salon et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l'événement. » *(D5, à valider)*
- **FR-025**: Un même numéro de téléphone MUST correspondre à au plus une inscription par édition. Une nouvelle soumission avec un numéro déjà inscrit ne crée rien et ne modifie rien. Si le nom saisi correspond au nom enregistré, le badge existant est rendu avec le message « Tu es déjà inscrit·e ». La comparaison ignore les majuscules, les accents, les espaces multiples, la ponctuation et l'ordre des mots. Sinon, aucun badge n'est rendu et le message « Ce numéro est déjà inscrit sous un autre nom. Vérifie l'orthographe ou contacte l'organisateur. » s'affiche, sans jamais révéler le nom enregistré.
- **FR-026**: Chaque inscription MUST recevoir un numéro de badge unique, séquentiel par édition, au format `SALM<AA>-<6 chiffres>` (ex. `SALM27-000482`, où `AA` représente les deux derniers chiffres de l'année). Un numéro attribué n'est jamais réutilisé, même après suppression.
- **FR-027**: Chaque inscription MUST recevoir un identifiant de vérification aléatoire, non devinable et indépendant du numéro de badge. Le QR code du badge encode l'URL de vérification construite avec cet identifiant.
- **FR-028**: L'URL de vérification MUST répondre dès cette feature par une page neutre (édition, validité du badge) qui n'affiche aucune donnée personnelle ; une URL inconnue ou d'un badge supprimé indique « badge invalide ».
- **FR-029**: Après validation, l'écran « Félicitations, ton badge est prêt ! » MUST présenter le badge, le bouton « Télécharger mon badge (PDF) », la consigne « Imprime à 100 % (sans ajustement à la page) ou présente-le sur ton téléphone », les dates, horaires et lieu, et le lien « Inscrire une autre personne », qui réinitialise le formulaire.
- **FR-030**: Le badge MUST être un PDF à deux faces dont chaque page mesure exactement 100 × 150 mm, conforme à `badge-etudiant.dc.html` : **recto** avec l'intitulé du salon, « Salm <année> », le nom en majuscules, le niveau d'étude, le numéro de badge et le QR code ; **verso** avec « SALM <année> », « PARTICIPANT(E) », chaque jour avec ses horaires, le lieu et le contact de l'organisateur.
- **FR-030a**: Le QR code MUST mesurer au moins 25 mm de côté, marge blanche (zone de silence) en plus, sur fond blanc.
- **FR-030b**: Le nom MUST toujours être affiché en entier. Sa taille de police diminue depuis la taille de la maquette jusqu'à 14 pt au minimum pour tenir sur 2 lignes au plus ; s'il ne tient toujours pas, il passe sur 3 lignes à 14 pt. Aucune troncature.
- **FR-030c**: Les polices embarquées dans le PDF MUST couvrir le Latin étendu. Un caractère absent malgré tout de la police est remplacé par sa forme sans accent (« Ș » → « S »), dans le PDF uniquement ; le nom enregistré n'est pas modifié.
- **FR-031**: Le PDF MUST être identique quel que soit son mode d'obtention (première inscription, réinscription, back-office) et régénérable à tout moment à partir des données.

#### Inscription établissement

- **FR-040**: Le formulaire établissement MUST comporter 3 étapes avec un indicateur de progression : (1) Établissement, (2) Exposants & stand, (3) Confirmation. L'utilisateur peut revenir à l'étape précédente sans perdre ses saisies.
- **FR-041**: L'étape 1 MUST demander : nom de l'établissement, numéro de téléphone, adresse e-mail (tous obligatoires) et programmes proposés parmi BACHELOR, BTS, LICENCE, MASTER, Autre (au moins un, plusieurs possibles, contrairement au Google Form d'origine qui était à choix unique), avec un champ « Précisez » facultatif si « Autre » est coché.
- **FR-042**: L'étape 2 MUST demander : la liste des exposants (nom et prénoms + contact téléphonique, au moins 1, au plus 6), le type de stand parmi les types visibles de l'édition (choix unique obligatoire, avec sa description et son tarif lorsqu'ils sont renseignés), et une question libre facultative.
- **FR-043**: L'écran « Présence confirmée » MUST récapituler le nom de l'établissement, le stand, le nombre d'exposants et les programmes, indiquer explicitement qu'aucun badge n'est nécessaire, rappeler les dates et le lieu, proposer « Ajouter à mon agenda » et « Retour à la page SALM ». Il MUST NOT mentionner d'envoi par e-mail.
- **FR-044**: Le téléphone de l'établissement MUST accepter les formats ivoiriens (fixe ou mobile, avec ou sans +225) ; le contact d'un exposant suit la même règle.
- **FR-045**: Aucun e-mail, SMS ni message WhatsApp n'est envoyé par cette feature, ni aux étudiant·e·s ni aux établissements.
- **FR-046**: Une mention d'usage au vouvoiement MUST figurer en bas de la dernière étape de saisie (étape 2), au-dessus du bouton « Confirmer notre présence » : « Ces informations servent uniquement à confirmer votre participation, à organiser l'accueil des exposants et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l'événement. » *(D8, à valider avec D5)*
- **FR-047**: Aucun badge, numéro, QR code ni lien de téléchargement MUST être créé pour un établissement ou un exposant, que ce soit par l'interface publique, l'API ou le back-office. Les exposants se présentent à l'accueil exposants et sont pointés sur une liste nominative (FR-068a) ; aucun contrôle par QR code n'est prévu pour eux, y compris dans la feature C. *(D13, à valider)*

#### Ouverture et fermeture des inscriptions

- **FR-050**: L'administrateur MUST pouvoir ouvrir et fermer, séparément et à tout moment, les inscriptions étudiantes et les inscriptions établissements de chaque édition.
- **FR-051**: Quand un type d'inscription est fermé, la page publique et la page d'inscription concernée MUST afficher un message de fermeture et masquer le formulaire ; le bloc « Deux façons de participer » et l'appel final adaptent leurs appels à l'action ; le libellé « INSCRIPTIONS OUVERTES » n'est affiché que si au moins un type est ouvert.
- **FR-052**: Le système MUST refuser toute soumission d'un type d'inscription fermé, même si le formulaire était déjà affiché.
- **FR-053**: Les deux types d'inscription d'une édition MUST être considérés comme fermés automatiquement dès la fin du dernier jour du salon (heure de fermeture du dernier jour, heure d'Abidjan), même si l'interrupteur correspondant est sur « ouvert ». Aucun plafond du nombre d'inscriptions n'est appliqué.

#### Back-office des inscriptions

- **FR-060**: Le menu admin MUST comporter une entrée « SALM » ; toutes les pages et données SALM du back-office sont réservées aux administrateurs connectés.
- **FR-061**: Le back-office MUST permettre de choisir l'édition consultée (par défaut : l'édition publiée, sinon la plus récente).
- **FR-062**: La liste des étudiant·e·s MUST afficher numéro de badge, nom, téléphone, niveau et date d'inscription, avec un compteur total, une recherche par nom ou téléphone (insensible à la casse, aux accents et aux espaces), un filtre par niveau combinable avec la recherche, et une pagination.
- **FR-063**: L'administrateur MUST pouvoir exporter en CSV la liste des étudiant·e·s correspondant à la recherche et au filtre courants.
- **FR-064**: L'administrateur MUST pouvoir re-télécharger le badge PDF de n'importe quel·le inscrit·e.
- **FR-065**: L'administrateur MUST pouvoir supprimer une inscription étudiante après confirmation explicite ; la suppression invalide le badge et l'URL de vérification.
- **FR-065a**: Les données personnelles d'une édition (inscriptions étudiantes, établissements et exposants) MUST être conservées au plus 12 mois après la fin du salon. Le back-office affiche pour chaque édition la date limite de conservation (fin du dernier jour + 12 mois) et signale un dépassement. Aucune tâche planifiée : la suppression reste une action de l'administrateur (FR-065b). *(D5, à valider)*
- **FR-065b**: Sur une édition **archivée** dont le salon est terminé, l'administrateur MUST pouvoir lancer « Supprimer les données personnelles ». L'action est confirmée par la saisie de l'année de l'édition. Elle supprime toutes les inscriptions étudiantes et établissements de l'édition, exposants compris, après avoir enregistré des compteurs agrégés anonymes : total et répartition par niveau d'étude et par jour d'inscription des étudiant·e·s ; total, répartition par type de stand et par statut des établissements ; nombre d'exposants. Ces compteurs restent consultables dans le back-office. Les badges et URL de vérification de l'édition deviennent invalides, et le compteur de numéros de badge n'est pas remis à zéro. L'action est indisponible, et refusée par le serveur, pour une édition publiée ou en brouillon.
- **FR-066**: La liste des établissements MUST afficher nom, type de stand, nombre d'exposants, statut de suivi et date d'inscription, avec un compteur par statut et un filtre par statut.
- **FR-067**: La fiche d'un établissement MUST afficher toutes les données saisies (coordonnées, programmes, exposants, stand, question) et permettre de modifier le statut de suivi (*Nouvelle*, *Contactée*, *Confirmée*, *Annulée* ; *Nouvelle* à la création) et une note interne.
- **FR-067a**: L'administrateur MUST pouvoir supprimer une inscription établissement complète, exposants compris, après confirmation explicite. La modification des exposants par l'administrateur n'est pas prévue : en cas de changement, l'établissement recontacte l'équipe SALM.
- **FR-068**: L'administrateur MUST pouvoir exporter en CSV la liste des établissements (y compris programmes, exposants, stand, statut, note et question).
- **FR-068a**: L'administrateur MUST pouvoir exporter en CSV la « Liste des exposants » de l'édition, pour le pointage à l'accueil : une ligne par exposant avec établissement, stand, nom et prénoms, contact, triée par établissement ; les inscriptions au statut « Annulée » en sont exclues.
- **FR-069**: L'écran de suivi MUST afficher et permettre de basculer l'état ouvert / fermé des deux types d'inscription de l'édition consultée ; après la fin du salon, il indique « Fermées automatiquement (salon terminé) » et les interrupteurs n'ont plus d'effet (FR-053).

#### Protection, données personnelles, accessibilité, ton

- **FR-080**: Les formulaires publics MUST être protégés contre les robots (champ piège invisible pour les humains, délai minimal de remplissage) et contre les soumissions répétées (nombre limité de soumissions par source sur une période), sans CAPTCHA visuel.
- **FR-081**: Seules les données listées dans les formulaires MUST être collectées ; aucune donnée personnelle n'est exposée publiquement (page de vérification, sources de la page publique, messages d'erreur).
- **FR-081a**: Chaque route publique MUST n'accepter qu'une liste blanche de champs ; tout autre champ (`status`, `internalNote`, `badgeNumber`, `badgeSeq`, `editionId`, etc.) est ignoré. L'édition concernée est toujours déterminée côté serveur : l'édition publiée, dont le type d'inscription concerné est ouvert.
- **FR-082**: Tous les champs MUST avoir un libellé visible et associé ; chaque erreur MUST être affichée sous son champ, reliée à celui-ci et annoncée aux technologies d'assistance ; tous les parcours MUST être réalisables au clavier seul avec un focus visible ; les contrastes texte / fond MUST atteindre au moins 4,5:1 (texte courant) ; les animations respectent la préférence « réduire les animations ».
- **FR-082a**: Les bordures des champs de saisie MUST atteindre 3:1 avec le fond : #8A847F au repos (3,7:1 sur blanc, au lieu du #D6D3D1 de la maquette), accent #D5570B au focus.
- **FR-083**: Toute l'interface MUST être en français avec accents, en tutoyant les étudiant·e·s et en vouvoyant les établissements, avec les textes de la maquette. Les réponses d'erreur du serveur MUST porter des codes (par champ et par cas), jamais de phrases destinées à l'utilisateur : chaque formulaire traduit ces codes dans son propre registre.
- **FR-084**: La page publique et les formulaires MUST être utilisables sur mobile (à partir de 360 px de large) sans défilement horizontal.

### Key Entities *(include if feature involves data)*

- **Édition** : une occurrence annuelle du salon. Année, préfixe de badge (dérivé de l'année), statut (brouillon / publiée / archivée), dates de début et de fin (obligatoires pour publier, facultatives pour une édition archivée qui ne sert qu'à porter des médias), fuseau (Abidjan), ville, lieu (facultatif), nom de l'organisateur, slogan, textes de la page (titre et paragraphe « Pourquoi le SALM ? », publics cibles), affiche officielle, vidéo récapitulative de l'édition (lien + visuel de fond), montrée dans le hero de l'édition suivante, fichier programme (facultatif), inscriptions étudiantes ouvertes (oui/non), inscriptions établissements ouvertes (oui/non), dernier numéro de badge attribué, date de suppression des données personnelles et compteurs agrégés conservés après cette suppression (FR-065b).
- **Public cible** : carte de la section « Pourquoi le SALM ? » (ex. « Licencié·e·s » — « Trouver le Master qui prolonge votre parcours »). Rattaché à une édition, ordonné.
- **Contact organisateur** : téléphone, e-mail ou adresse affiché dans l'appel final, le formulaire établissement et le verso du badge. Rattaché à une édition, ordonné, typé.
- **Jour** : un jour du salon. Édition, date, libellé (« Jour 1 »), heures d'ouverture et de fermeture (utilisées sur le badge et pour le compte à rebours), ordre.
- **Créneau** : une ligne du chronogramme. Jour, heure de début, heure de fin, titre, description facultative, type (cérémonie, panel, présentation, stands, pause, exposition), mis en avant (oui/non), ordre.
- **Temps fort** : carte du programme d'activité. Édition, titre, photo, texte alternatif, ordre.
- **Vidéo** : entretien du « canapé ». Édition où elle a été tournée (affichée sur la page de l'édition suivante), titre, invité·e, établissement, lien de la vidéo, vignette facultative, ordre.
- **Photo** : image du catalogue. Édition où elle a été prise (affichée sur la page de l'édition suivante), image, légende / texte alternatif, ordre.
- **Type de stand** : option proposée aux établissements. Édition, nom (« STAND OR »), description, tarif facultatif, visible (oui/non), ordre.
- **Inscription étudiante** : édition, nom et prénoms, téléphone normalisé (unique par édition), niveau d'étude, numéro de badge (unique par édition), identifiant de vérification (unique, non devinable), date d'inscription.
- **Inscription établissement** : édition, nom, téléphone, e-mail, programmes (un ou plusieurs parmi BACHELOR, BTS, LICENCE, MASTER, Autre), précision « Autre », type de stand choisi, question libre, statut de suivi, note interne, dates de création et de dernière modification.
- **Exposant** : personne présente sur le stand. Inscription établissement, nom et prénoms, contact, ordre.

Les passages au contrôle d'entrée (feature C) seront rattachés à l'inscription étudiante via son identifiant de vérification et ne sont pas créés dans cette feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un·e étudiant·e complète son inscription et télécharge son badge en moins de 60 secondes depuis `/salm`, sur mobile.
- **SC-002**: Le PDF du badge est disponible en moins de 3 secondes après le clic sur « Télécharger mon badge (PDF) ».
- **SC-003**: 100 % des QR codes des badges générés sont lus par l'appareil photo d'un téléphone courant (Android et iPhone), imprimés en 10 × 15 cm comme affichés à l'écran.
- **SC-004**: 0 doublon d'inscription étudiante par numéro de téléphone et 0 numéro de badge en double dans une édition, y compris lors de soumissions simultanées.
- **SC-005**: Un établissement complète les 3 étapes en moins de 4 minutes.
- **SC-006**: La page `/salm` affiche son contenu principal (hero lisible, appels à l'action utilisables) en moins de 3 secondes sur une connexion mobile 4G moyenne.
- **SC-007**: Changer une donnée de l'édition (date, lieu, créneau, stand, texte) se reflète sur la page, les formulaires et le badge sans aucune modification de code.
- **SC-008**: Un administrateur retrouve un·e inscrit·e par nom ou téléphone et re-télécharge son badge en moins de 15 secondes.
- **SC-009**: Les exports CSV s'ouvrent directement dans un tableur courant avec les accents corrects et une colonne par champ.
- **SC-010**: Un audit d'accessibilité automatisé ne relève aucune erreur de niveau A ou AA sur `/salm` et les deux formulaires, et chaque parcours (inscription étudiant·e, inscription établissement, lecture d'une vidéo) se réalise entièrement au clavier.
- **SC-011**: Les soumissions automatisées (champ piège rempli, envoi instantané, rafale depuis une même source) ne créent aucune inscription.

## Assumptions

- **Badge perdu après fermeture** : fermer les inscriptions étudiantes bloque les nouvelles inscriptions, mais la récupération d'un badge existant reste possible (téléphone + nom, règle de FR-025) via un formulaire réduit affiché avec le message de fermeture.
- **Texte « Badge perdu ? »** : là où il apparaît, le texte de la maquette devient « Il se retélécharge en saisissant à nouveau ton nom et ton numéro de téléphone. »
- **Conservation des données** (décision de revue D5, à valider par l'organisateur) : 12 mois au plus après la fin du salon, avec une suppression déclenchée par l'administration (FR-065a, FR-065b). Une demande individuelle d'effacement est traitée par la suppression de l'inscription concernée (FR-065 pour un·e étudiant·e, FR-067a pour un établissement et ses exposants).
- **Archivage d'une édition** : la feature B fournira l'écran d'archivage. D'ici là, une édition est archivée par le jeu de données initial ou par une modification directe en base ; la suppression des données (FR-065b) est donc utilisable dès qu'une édition est archivée.
- **Mention d'usage établissement** : « la dernière étape du formulaire » s'entend de la dernière étape de saisie (étape 2), pour que la mention soit lue avant l'envoi ; l'étape 3 est une confirmation.
- **Hero** : la lecture automatique du fond (demandée au plan) est réservée aux écrans larges et aux connexions qui le permettent, pour préserver les forfaits mobiles ; sur mobile, le hero affiche une image fixe (FR-012).
- **Vidéos** : hébergées sur YouTube et lues via le lecteur intégré dans la fenêtre vidéo.
- **Nombre d'exposants** : au plus 6 par établissement, comme dans la maquette.
- **Téléphone établissement** : les formats ivoiriens à 10 chiffres (01, 05, 07, 21, 25, 27) sont acceptés ; l'e-mail est validé sur sa forme uniquement.
- **Doublons d'établissements** : pas d'unicité imposée, car un même établissement peut légitimement envoyer une correction ; l'administration utilise le statut « Annulée ».
- **Authentification admin** : le mécanisme de connexion existant de l'administration est réutilisé ; pas de rôles distincts.
- **Heure de référence** : Abidjan (UTC+0, sans changement d'heure) pour le compte à rebours et les horaires.
- **Exports CSV** : encodage compatible avec un tableur courant configuré en français (séparateur point-virgule, accents préservés).
- **Numéro affiché sur le badge** : le numéro de badge figure sur le recto, à côté du niveau, comme dans la maquette.
- **Aucun envoi** : pas d'e-mail, de SMS ni de WhatsApp ; la mention « récapitulatif envoyé par e-mail » de la maquette est retirée.
- **Duplication (feature B)** : comme les médias restent attachés à leur édition d'origine, la duplication d'une édition n'a aucun média à recopier.
- **Visuels** : les photos de la maquette (`images/`) servent au jeu de données initial en attendant les visuels HD, l'affiche 2027 et le logo officiel.

## Hors périmètre

- **Feature B** : écrans d'administration des éditions et des contenus (chronogramme, vidéos, photos, stands, affiche, textes, contacts), publication / archivage, prévisualisation, duplication d'une édition, statistiques SALM. D'ici là, le contenu se modifie par le jeu de données initial.
- **Feature C** : contrôle d'entrée par scan du QR code le jour J, enregistrement des présences par jour. Les exposants n'y sont pas concernés (FR-047).
- Modification des exposants ou des données d'un établissement par l'administration (FR-067a).
- Paiement des stands, envoi d'e-mails / SMS / WhatsApp, comptes utilisateurs pour les étudiant·e·s ou les établissements, modification d'une inscription par son auteur.

## Incohérences et manques relevés dans les sources

À faire trancher par l'organisateur ; le jeu de données initial reprend les sources telles quelles en attendant.

1. **Chevauchement Jour 1** : le Panel 2 (14h00–14h30) et l'Exposition (14h00–16h00) commencent à la même heure. L'Exposition démarre-t-elle à 14h30, ou se tient-elle en parallèle du panel ?
2. **Trou Jour 2** : rien n'est prévu entre 10h00 et 10h10 (fin de la présentation des universités, début de l'Exposition).
3. **Adresse e-mail** : les documents 2027 indiquent `salm2026@sucreycorporates.com`. Faut-il la conserver ou existe-t-il une adresse 2027 ?
4. **Lieu 2027 inconnu** : affiché « Lieu à confirmer, Abidjan » jusqu'à sa saisie.
5. **Horaires** : le hero annonce « 9h30 – 16h30 » pour les deux jours, alors que le Jour 1 se termine à 16h00 (dernier créneau) et le Jour 2 à 16h30. Le badge affiche des horaires par jour ; le hero affiche la plage globale.
6. **Adresse du siège** : « Rivera Palmeraie » dans le chronogramme, « Riviera Palmeraie » dans la maquette (orthographe retenue : Riviera).
7. **Placeholders encore ouverts** : titres et invités des 9 vidéos, description et tarif des stands, nombre de photos du catalogue, affiche officielle 2027, logo « Salm 2027 » officiel, heure d'installation des stands (« avant 9h30 » à confirmer), fichier PDF du programme.
