# Feature Specification: Module SALM (2/3) — back-office des éditions et des contenus, statistiques

**Feature Branch**: `007-salm-admin-contenus`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Module « SALM », partie 2/3 : back-office des éditions et des contenus, plus statistiques. La feature précédente (specs/006-salm-inscriptions) a livré la page publique /salm, les inscriptions et le back-office des inscriptions, ainsi que le modèle de données complet. Aujourd'hui, ce contenu n'est modifiable que par le seed. Cette feature ajoute les écrans d'administration pour que l'équipe prépare et mette à jour chaque édition sans développeur. P1 : gérer les éditions (création, modification, archivage, publication unique, prévisualisation) ; P1 : gérer les contenus d'une édition (vidéo hero, « Pourquoi le SALM » et affiche, contacts, temps forts, chronogramme avec signalement des chevauchements, vidéos canapé, catalogue photos, types de stands) ; P2 : dupliquer une édition pour préparer la suivante, sans les inscriptions ; P3 : statistiques SALM avec comparaison à l'édition précédente. Hors périmètre : contrôle d'entrée (feature C) et toute modification de la page publique au-delà de la prévisualisation."

## Contexte

Le module SALM est découpé en trois features :

| Feature | Périmètre |
|---|---|
| A — `006-salm-inscriptions` (livrée) | Modèle multi-édition complet, page `/salm`, inscriptions étudiant·e·s et établissements, badge, back-office des inscriptions |
| **B — cette spec** | Écrans d'administration des éditions et de leurs contenus, prévisualisation, duplication, statistiques |
| C — plus tard | Contrôle d'entrée par scan du QR code le jour J |

Aujourd'hui, les éditions et leurs contenus ne se modifient que par le jeu de données initial ou directement en base. Cette feature donne à l'équipe SALM la main sur tout ce que la page `/salm`, les formulaires et le badge affichent, sans intervention d'un développeur. **Aucune nouvelle donnée n'est à modéliser** : la feature A a créé toutes les entités nécessaires (FR-005 de 006). Cette feature n'ajoute que des écrans et les règles de gestion associées.

**Références** :

- Spec, data-model et contrats de la feature A : `specs/006-salm-inscriptions/` (notamment FR-001 à FR-006, FR-015, FR-053, FR-065a/b, et la forme des compteurs conservés après suppression des données personnelles).
- Pas de maquette : les écrans reprennent les patterns des pages admin existantes (magazines, rubriques, partenaires, images de l'accueil) et se placent dans la section « SALM » du menu admin créée par la feature A.

**Rappel de la règle des médias** (clarification Q2 de la feature A) : la vidéo récapitulative, les vidéos du canapé et les photos sont rattachées à l'édition **où elles ont été produites**, et s'affichent sur la page de l'édition **suivante**. Les médias saisis pour le SALM 2026 apparaissent donc sur la page du SALM 2027. Les écrans de cette feature le rendent explicite.

## Clarifications

### Session 2026-09-28

- Q: La duplication d'une édition doit-elle aussi recopier les photos et les vidéos, ou seulement la structure ? → A: Seulement la structure (textes, contacts, temps forts avec leurs photos, chronogramme, stands). La vidéo récapitulative, les vidéos du canapé et les photos du catalogue ne sont jamais recopiées : elles restent sur leur édition d'origine, que la copie affiche déjà comme « édition précédente ».
- Q: Qui publie : faut-il une validation à deux personnes ou un journal des modifications, ou un seul rôle administrateur suffit-il ? → A: Un seul rôle administrateur, sans journal ni double validation. Tout administrateur connecté peut publier, archiver, dupliquer et supprimer, avec les confirmations prévues. La connexion admin reposant sur un mot de passe partagé, un journal ne pourrait pas identifier l'auteur.
- Q: Quel volume attendre pour le catalogue photos d'une édition, et quel poids maximal accepter par photo ? → A: De l'ordre de 50 photos par édition, 5 Mo au plus par photo ; l'équipe compresse les photos avant l'envoi. La limite de 5 Mo s'applique à toutes les images du back-office SALM (affiche, temps forts, image de secours) ; le PDF du programme reste à 10 Mo.
- Q: Où vont les statistiques SALM : tableau de bord admin existant, vue SALM dédiée, ou les deux ? → A: Les deux. La vue « SALM › Statistiques » porte le détail ; le tableau de bord existant reçoit un encart résumé (totaux de l'édition publiée, écart avec l'édition précédente, lien vers la vue dédiée), affiché seulement quand une édition est publiée.
- Q: Faut-il pouvoir republier une édition archivée ? → A: Oui, mais seulement tant que le salon de cette édition n'est pas terminé (pour réparer une publication faite par erreur) ; au-delà, l'archivage est définitif.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gérer les éditions (Priority: P1)

Un administrateur connecté ouvre « SALM › Éditions ». Il voit la liste des éditions (année, statut, dates, lieu, nombre d'inscriptions) et peut en créer une, la modifier, la publier, l'archiver ou la prévisualiser. Il renseigne pour chaque édition son année, son intitulé, son organisateur, sa ville, son lieu et son slogan ; les dates et les horaires sont ceux des jours du salon (User Story 2). Une seule édition est publiée à la fois : en publier une autre archive la précédente, après confirmation. Avant de publier un brouillon, il le prévisualise tel qu'il apparaîtra sur `/salm`.

**Why this priority**: Sans cet écran, préparer l'édition suivante ou basculer d'une édition à l'autre exige un développeur. C'est le socle de toutes les autres stories.

**Independent Test**: Créer l'édition 2028 en brouillon avec son lieu et son slogan, ajouter un jour, la prévisualiser, puis la publier : `/salm` affiche 2028, la navbar indique « SALM 2028 » et l'édition 2027 passe au statut « Archivée ».

**Acceptance Scenarios**:

1. **Given** les éditions 2026 (archivée) et 2027 (publiée), **When** l'administrateur ouvre « SALM › Éditions », **Then** il voit les deux éditions triées de la plus récente à la plus ancienne, avec pour chacune : année, statut, dates de début et de fin, lieu (« Lieu à confirmer » s'il est vide) et nombre d'inscriptions étudiantes et établissements.
2. **Given** la liste des éditions, **When** l'administrateur crée l'édition 2028 en saisissant l'année, **Then** l'édition est créée au statut « Brouillon », avec l'intitulé du salon, le nom de l'organisateur et la ville préremplis par ceux de l'édition la plus récente, et les inscriptions fermées ; elle n'apparaît nulle part sur le site public.
3. **Given** une édition 2027 existe déjà, **When** l'administrateur tente de créer une autre édition 2027, **Then** la création est refusée avec le message « Une édition 2027 existe déjà. ».
4. **Given** une édition en brouillon, **When** l'administrateur modifie son lieu, son slogan ou sa ville et enregistre, **Then** les modifications sont conservées et un message de succès s'affiche.
5. **Given** l'édition 2028 en brouillon sans aucun jour, **When** l'administrateur tente de la publier, **Then** la publication est refusée avec le message « Ajoutez au moins un jour au chronogramme avant de publier. ».
6. **Given** 2027 publiée et 2028 en brouillon avec au moins un jour, **When** l'administrateur clique sur « Publier » pour 2028, **Then** une confirmation indique « Publier le SALM 2028 archivera le SALM 2027, actuellement en ligne. » ; après confirmation, 2028 est publiée, 2027 est archivée, et `/salm` ainsi que la navbar affichent 2028 immédiatement.
7. **Given** la confirmation de publication est affichée, **When** l'administrateur annule, **Then** aucun statut n'est modifié.
8. **Given** l'édition 2027 publiée, **When** l'administrateur l'archive et confirme, **Then** plus aucune édition n'est publiée : le lien SALM disparaît de la navbar et `/salm` affiche le message d'attente (FR-019 de 006).
9. **Given** 2028 a été publiée par erreur et 2027, dont le salon n'a pas encore eu lieu, est donc archivée, **When** l'administrateur republie 2027 et confirme, **Then** 2027 est de nouveau publiée et 2028 est archivée.
10. **Given** l'édition 2026 archivée, dont le salon est terminé, **When** l'administrateur consulte ses actions, **Then** « Publier » n'est pas proposé, et une tentative de publication est refusée par le serveur.
11. **Given** l'édition 2028 en brouillon, **When** l'administrateur clique sur « Prévisualiser », **Then** une page présente l'édition 2028 exactement comme `/salm` la présentera une fois publiée (mêmes sections, mêmes médias de l'édition précédente), surmontée d'un bandeau « Aperçu — cette édition n'est pas publiée » ; les boutons d'inscription y sont visibles mais inactifs.
12. **Given** un visiteur non connecté, **When** il ouvre l'adresse d'une prévisualisation, **Then** l'accès lui est refusé et aucun contenu du brouillon n'est révélé.
13. **Given** une édition en brouillon sans aucune inscription, **When** l'administrateur la supprime et confirme, **Then** l'édition et tout son contenu disparaissent.
14. **Given** une édition qui a des inscriptions, ou qui est publiée ou archivée, **When** l'administrateur consulte ses actions, **Then** la suppression n'est pas proposée.
15. **Given** l'édition 2027 compte des inscriptions, **When** l'administrateur tente de changer son année, **Then** le champ année est verrouillé avec l'explication « L'année ne peut plus changer : des badges SALM27 ont déjà été émis. ».

---

### User Story 2 — Gérer les contenus d'une édition (Priority: P1)

Depuis la fiche d'une édition, l'administrateur accède à ses contenus, regroupés par section de la page `/salm` : textes et affiche, contacts, temps forts, chronogramme, types de stands, et médias produits pendant cette édition (vidéo récapitulative, vidéos du canapé, photos). Les listes (temps forts, créneaux, vidéos, photos, stands, contacts, publics cibles) sont ordonnables ; l'ordre choisi est celui de la page publique.

**Why this priority**: C'est la raison d'être de la feature : l'équipe met à jour le lieu, le programme, les stands et les médias au fil de la préparation, sans développeur.

**Independent Test**: Sur l'édition 2027, changer le lieu, remplacer l'affiche, ajouter un créneau qui chevauche un autre (le signalement apparaît), masquer un stand, réordonner les temps forts ; sur l'édition 2026, ajouter 2 vidéos du canapé et 10 photos. Ouvrir `/salm` : tous ces changements y figurent.

**Acceptance Scenarios**:

*Textes, affiche et programme*

1. **Given** la section « Textes et affiche » de l'édition 2027, **When** l'administrateur modifie le titre et le paragraphe « Pourquoi le SALM ? » et le texte d'une carte « public cible », puis enregistre, **Then** `/salm` affiche les nouveaux textes.
2. **Given** la même section, **When** l'administrateur envoie une affiche au format JPEG de 3 Mo et saisit son texte alternatif, **Then** l'aperçu de l'affiche est remplacé, et `/salm` l'utilise dans « Pourquoi le SALM ? » et comme image de partage.
3. **Given** la même section, **When** l'administrateur envoie un fichier `.gif`, un PDF ou une image de plus de 5 Mo comme affiche, **Then** l'envoi est refusé avec un message indiquant les formats (JPEG, PNG, WebP) et le poids maximal (5 Mo) acceptés, et l'affiche existante est conservée.
4. **Given** la même section, **When** l'administrateur joint le PDF du programme, **Then** le bouton « Télécharger le programme (PDF) » apparaît sur `/salm` ; quand il retire le PDF, le bouton disparaît.

*Vidéo récapitulative (hero de l'édition suivante)*

5. **Given** la section « Médias de l'édition 2026 », **When** l'administrateur la consulte, **Then** un texte explique « Ces médias ont été produits pendant le SALM 2026. Ils s'affichent sur la page du SALM 2027. ».
6. **Given** cette section, **When** l'administrateur saisit une URL YouTube valide (formes `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/embed/…`, `youtube.com/shorts/…`) comme vidéo récapitulative, **Then** la miniature de la vidéo s'affiche en aperçu et, une fois enregistrée, le bouton « Revivre le SALM 2026 » et le fond du hero de `/salm` (édition 2027) l'utilisent.
7. **Given** cette section, **When** l'administrateur saisit une URL qui n'est pas une vidéo YouTube (« https://vimeo.com/123 », « youtube.com/channel/… », texte libre), **Then** l'enregistrement est refusé avec le message « Saisissez l'adresse d'une vidéo YouTube (ex. https://youtu.be/…). ».
8. **Given** la fiche de l'édition 2027, **When** l'administrateur consulte la section médias, **Then** elle rappelle quels médias l'édition 2027 affichera (ceux de 2026, avec un lien vers leur gestion) et lesquels ont été produits pendant 2027 (affichés en 2028).

*Contacts*

9. **Given** la section « Contacts », **When** l'administrateur ajoute un contact de type « Téléphone » avec « 07 68 01 14 09 », le marque « Imprimé sur le badge » et le place en premier, **Then** l'appel final de `/salm` liste ce contact en premier, et le verso des badges ainsi que le formulaire établissement l'affichent.
10. **Given** un contact de type « E-mail » avec la valeur « salm2027@ », **When** l'administrateur enregistre, **Then** l'enregistrement est refusé avec le message « Adresse e-mail invalide. ».
11. **Given** un contact téléphonique déjà marqué « Imprimé sur le badge », **When** l'administrateur marque un autre téléphone, **Then** le premier perd la marque : un seul contact est imprimé sur le badge.

*Temps forts*

12. **Given** la section « Temps forts », **When** l'administrateur ajoute un temps fort « ATELIERS CV » avec une photo et son texte alternatif, puis le place en deuxième position, **Then** le programme d'activité de `/salm` affiche 6 temps forts dans le nouvel ordre.
13. **Given** un temps fort sans photo, **When** l'administrateur enregistre, **Then** l'enregistrement est refusé : le titre et la photo sont obligatoires.

*Chronogramme*

14. **Given** la section « Chronogramme » de l'édition 2028, **When** l'administrateur ajoute le jour du 10 mars 2028, ouvert de 09:30 à 16:00, **Then** le jour apparaît avec le libellé proposé « Jour 1 » (modifiable), et la liste des éditions affiche 10 mars 2028 comme date de début et de fin.
15. **Given** un jour dont l'heure de fermeture est antérieure ou égale à l'heure d'ouverture, **When** l'administrateur enregistre, **Then** l'enregistrement est refusé avec un message lié au champ.
16. **Given** un jour, **When** l'administrateur ajoute le créneau 11:00–11:10 « Présentation du magazine Le Carré des Études », de type « Présentation », coché « mis en avant », **Then** le créneau apparaît dans le jour à la position choisie, distingué visuellement sur `/salm`.
17. **Given** le Jour 1 contient « PANEL 2 » (14:00–14:30), **When** l'administrateur ajoute « Exposition » (14:00–16:00), **Then** le créneau est enregistré, et les deux créneaux portent l'avertissement « Chevauche : PANEL 2, 14h00 – 14h30 » (et inversement) ; rien n'est bloqué.
18. **Given** un créneau dont l'heure de fin est antérieure ou égale à l'heure de début, ou sans titre, ou sans type, **When** l'administrateur enregistre, **Then** l'enregistrement est refusé avec un message lié au champ.
19. **Given** un jour qui contient 7 créneaux, **When** l'administrateur supprime ce jour, **Then** la confirmation indique « Supprimer le Jour 1 et ses 7 créneaux ? » ; après confirmation, le jour et ses créneaux disparaissent.
20. **Given** les créneaux d'un jour, **When** l'administrateur clique sur « Trier par heure », **Then** les créneaux sont réordonnés par heure de début, puis par heure de fin.

*Vidéos du canapé*

21. **Given** la section médias de l'édition 2026, **When** l'administrateur ajoute une vidéo avec le titre « Choisir son Master », l'invitée « Dr Adjoua Koffi », l'établissement et une URL YouTube valide, **Then** la vidéo apparaît dans « Le canapé du SALM 2026 » sur `/salm`, à la position choisie.
22. **Given** une vidéo sans titre, **When** elle est enregistrée, **Then** elle est acceptée (le titre est facultatif) et `/salm` l'affiche sous un libellé numéroté (« Vidéo 03 »), comme dans la feature A.

*Catalogue photos*

23. **Given** la section médias de l'édition 2026, **When** l'administrateur sélectionne 20 photos d'un coup, dont une de 14 Mo et un fichier `.heic`, **Then** les 18 photos valides sont ajoutées à la fin du catalogue avec une progression visible, et les 2 fichiers refusés sont listés avec la raison du refus.
24. **Given** une photo du catalogue, **When** l'administrateur saisit une légende facultative et modifie son texte alternatif, **Then** ces textes sont conservés et utilisés sur `/salm`.
25. **Given** le catalogue, **When** l'administrateur déplace une photo en première position, **Then** elle fait partie des 4 photos de l'aperçu sur `/salm`.
26. **Given** une photo, **When** l'administrateur la supprime et confirme, **Then** elle disparaît du catalogue et de `/salm`.

*Types de stands*

27. **Given** la section « Types de stands », **When** l'administrateur ajoute « STAND ARGENT » avec une description et le tarif « 300 000 FCFA », **Then** ce type est proposé à l'étape 2 du formulaire établissement, avec sa description et son tarif.
28. **Given** un type de stand choisi par au moins un établissement, **When** l'administrateur consulte ses actions, **Then** la suppression est indisponible avec l'explication « Choisi par 12 établissements : vous pouvez seulement le masquer. », et l'action « Masquer » est proposée.
29. **Given** un type de stand masqué, **When** un établissement ouvre le formulaire, **Then** ce type n'est pas proposé ; les inscriptions qui l'ont choisi continuent de l'afficher dans le back-office.
30. **Given** un type de stand que personne n'a choisi, **When** l'administrateur le supprime et confirme, **Then** il disparaît.
31. **Given** un type de stand « STAND OR » existe, **When** l'administrateur crée ou renomme un autre type en « stand or », **Then** l'enregistrement est refusé : deux types d'une même édition ne peuvent pas porter le même nom.

*Commun*

32. **Given** n'importe quelle liste ordonnable, **When** l'administrateur change l'ordre à la souris ou au clavier (boutons « Monter » / « Descendre »), **Then** le nouvel ordre est enregistré et repris sur `/salm`.
33. **Given** n'importe quel élément supprimable, **When** l'administrateur demande la suppression, **Then** une confirmation nommant l'élément est demandée, et l'annulation ne supprime rien.

---

### User Story 3 — Dupliquer une édition pour préparer la suivante (Priority: P2)

Après le SALM 2027, l'administrateur duplique l'édition 2027. Il obtient une édition 2028 en brouillon qui reprend les textes, les contacts, les temps forts, la structure du chronogramme et les types de stands, sans aucune inscription. Il n'a plus qu'à ajuster les dates, le lieu, l'affiche et les créneaux qui changent.

**Why this priority**: Fait gagner des heures de ressaisie chaque année, mais l'équipe peut préparer une édition à la main avec les stories P1.

**Independent Test**: Dupliquer l'édition 2027 (482 étudiant·e·s et 37 établissements inscrits), puis vérifier que l'édition 2028 contient les mêmes textes, contacts, temps forts, jours et créneaux (dates décalées), et types de stands, et aucune inscription, aucun média, aucune affiche.

**Acceptance Scenarios**:

1. **Given** l'édition 2027 et aucune édition 2028, **When** l'administrateur choisit « Dupliquer » sur 2027 et confirme, **Then** une édition 2028 est créée au statut « Brouillon », et sa fiche s'ouvre avec le message « Édition 2028 créée à partir de 2027. Vérifiez les dates, le lieu et l'affiche. ».
2. **Given** la copie 2028, **When** l'administrateur la consulte, **Then** elle reprend de 2027 : l'intitulé du salon, l'organisateur, la ville, le slogan, le titre et le paragraphe « Pourquoi le SALM ? », les publics cibles, les contacts (avec la marque « Imprimé sur le badge »), les temps forts (titres, photos, textes alternatifs, ordre), les types de stands (noms, descriptions, tarifs, visibilité, ordre), les jours et leurs créneaux (horaires, titres, types, descriptions, mise en avant, ordre).
3. **Given** la copie 2028, **When** l'administrateur consulte ses jours, **Then** chaque date est décalée de 52 semaines pour tomber le même jour de la semaine (vendredi 12 mars 2027 → vendredi 10 mars 2028), et un avertissement invite à vérifier les dates.
4. **Given** la copie 2028, **When** l'administrateur consulte ses inscriptions et ses médias, **Then** elle n'a aucune inscription étudiante ni établissement, aucune vidéo récapitulative, aucune vidéo du canapé, aucune photo, ni affiche, ni PDF du programme ; son lieu est vide ; ses deux types d'inscription sont fermés et son premier badge portera le numéro `SALM28-000001`.
5. **Given** une édition 2028 existe déjà, **When** l'administrateur duplique 2027, **Then** la duplication est refusée avec le message « Une édition 2028 existe déjà. » et rien n'est créé.
6. **Given** la copie 2028 réutilise la photo d'un temps fort de 2027, **When** l'administrateur remplace ou supprime cette photo dans 2028, **Then** le temps fort de 2027 garde sa photo intacte.

---

### User Story 4 — Statistiques SALM (Priority: P3)

L'administrateur ouvre « SALM › Statistiques » et choisit une édition (un encart résumé de l'édition publiée figure aussi sur le tableau de bord admin, avec un lien vers cette vue). Il voit l'évolution des inscriptions étudiantes jour après jour, leur répartition par niveau d'étude, et la répartition des établissements par type de stand et par statut de suivi. Quand une édition précédente existe, chaque indicateur est comparé à celle-ci.

**Why this priority**: Utile pour piloter la communication et rendre compte aux partenaires, mais pas nécessaire pour préparer ni faire vivre une édition.

**Independent Test**: Avec des inscriptions de test sur 2027 et des compteurs conservés pour 2026, ouvrir les statistiques de 2027 : les totaux, les répartitions et les écarts avec 2026 correspondent aux données.

**Acceptance Scenarios**:

1. **Given** l'édition 2027 compte 482 inscriptions étudiantes, **When** l'administrateur ouvre ses statistiques, **Then** il voit le total (482), un graphique du nombre d'inscriptions par jour d'inscription avec le cumul, et la répartition par niveau d'étude (nombre et pourcentage pour chacun des 6 niveaux, y compris ceux à 0).
2. **Given** 37 établissements inscrits, **When** l'administrateur consulte la partie établissements, **Then** il voit le total, le nombre d'exposants des inscriptions non annulées, la répartition par type de stand (types masqués compris) et la répartition par statut (Nouvelle, Contactée, Confirmée, Annulée).
3. **Given** l'édition 2026 existe avec des inscriptions ou des compteurs conservés, **When** l'administrateur consulte les statistiques de 2027, **Then** chaque total et chaque répartition est accompagné de la valeur 2026 et de l'écart (ex. « 482 · +12 % par rapport à 2026 »).
4. **Given** les deux éditions ont des jours de salon, **When** l'administrateur consulte l'évolution des inscriptions, **Then** les cumuls des deux éditions sont superposés et alignés sur le nombre de jours restant avant l'ouverture (J-60, J-30, J-7…), pour comparer des périodes équivalentes.
5. **Given** une édition dont les données personnelles ont été supprimées (FR-065b de 006), **When** l'administrateur consulte ses statistiques ou la compare, **Then** les chiffres proviennent des compteurs conservés, avec la mention « Chiffres conservés après suppression des données personnelles le JJ/MM/AAAA ».
6. **Given** aucune édition antérieure n'a de données, **When** l'administrateur consulte les statistiques, **Then** aucune comparaison n'est affichée, sans message d'erreur.
7. **Given** une édition sans aucune inscription, **When** l'administrateur consulte ses statistiques, **Then** il voit « Aucune inscription pour le SALM <année> » au lieu de graphiques vides.
8. **Given** les statistiques, **When** l'administrateur les consulte, **Then** aucun nom, téléphone, e-mail ni numéro de badge n'y figure.
9. **Given** l'édition 2027 est publiée avec 482 étudiant·e·s et 37 établissements inscrits, **When** l'administrateur ouvre le tableau de bord admin, **Then** un encart « SALM 2027 » affiche ces deux totaux, leur écart avec 2026 et un lien vers « SALM › Statistiques » ; sans édition publiée, cet encart n'apparaît pas.

---

### Edge Cases

- **Deux éditions publiées** : impossible. La publication archive l'édition publiée précédente dans la même opération ; deux publications simultanées par deux administrateurs aboutissent à une seule édition publiée, la dernière.
- **Republier une archive dont le salon est terminé** : refusé ; l'action « Publier » n'est pas proposée (FR-115a).
- **Publier un brouillon dont les jours sont déjà passés** (ex. saisie tardive d'une édition ancienne) : autorisé après confirmation, avec l'avertissement « Le SALM <année> est terminé : les inscriptions resteront fermées. » (FR-053 de 006).
- **Archiver l'édition publiée** : confirmation spécifique indiquant que `/salm` affichera le message d'attente et que le lien SALM disparaîtra de la navigation.
- **Édition archivée par la publication d'une autre** : ses inscriptions et ses badges restent valides ; son suivi et la suppression de ses données personnelles restent possibles depuis le back-office des inscriptions.
- **Jours modifiés après l'émission de badges** : les badges sont régénérés à partir des données (FR-031 de 006), mais ceux déjà imprimés portent les anciennes dates. Quand l'édition a des inscriptions, la modification d'un jour affiche l'avertissement « <N> badges ont déjà été émis : ceux déjà téléchargés portent les anciennes dates. » et reste possible.
- **Suppression du dernier jour d'une édition publiée** : refusée, car une édition publiée doit garder au moins un jour (dates, compte à rebours, badge).
- **Deux jours à la même date** dans une édition : refusé.
- **Créneau hors des heures d'ouverture de son jour** : accepté ; seul le chevauchement entre créneaux est signalé.
- **Créneaux qui se touchent** (10:00–10:10 puis 10:10–10:30) : pas de chevauchement signalé.
- **Plusieurs créneaux « mis en avant »** : autorisé.
- **Stand unique masqué alors que les inscriptions établissements sont ouvertes** : l'écran des stands avertit « Aucun type de stand visible : les établissements ne peuvent pas s'inscrire. » (FR-173).
- **Type de stand renommé après des inscriptions** : les inscriptions affichent le nouveau nom (elles référencent le type, pas son nom).
- **Aucun contact « Imprimé sur le badge »** : le verso du badge omet la ligne de contact, comme dans la feature A ; l'écran des contacts le signale.
- **Upload interrompu ou fichier corrompu** (extension `.jpg` mais contenu illisible) : le fichier est refusé avec un message ; aucune image cassée n'est enregistrée.
- **Photo supprimée alors qu'elle fait partie de l'aperçu** : l'aperçu de `/salm` est complété par la photo suivante.
- **Image partagée entre deux éditions** après une duplication : supprimer ou remplacer l'image dans une édition n'affecte jamais l'autre.
- **URL YouTube avec paramètres** (`&t=42s`, `&list=…`, `?si=…`) : acceptée ; seule la vidéo est retenue.
- **Même vidéo YouTube ajoutée deux fois** dans le canapé d'une édition : acceptée avec un avertissement « Cette vidéo figure déjà dans la liste. ».
- **Modification d'une édition par deux administrateurs en même temps** : le dernier enregistrement l'emporte ; pas de verrouillage.
- **Duplication d'une édition archivée ancienne** (ex. 2026 alors que 2027 existe) : la copie vise l'année 2027, déjà prise ; elle est refusée (voir scénario US3-5). L'administrateur duplique la dernière édition.
- **Session admin expirée pendant une saisie** : l'enregistrement échoue avec un message invitant à se reconnecter ; aucune donnée partielle n'est enregistrée.
- **Mode maintenance du site actif** : les écrans d'administration SALM et la prévisualisation restent accessibles aux administrateurs.
- **Édition précédente sans jours** (ex. 2026 porteuse de médias seulement) : la comparaison statistique porte sur les totaux et les répartitions ; le cumul aligné sur J-n est affiché pour la seule édition courante.

## Requirements *(mandatory)*

### Functional Requirements

#### Accès et navigation

- **FR-100**: Tous les écrans, actions et données de cette feature, y compris la prévisualisation, MUST être réservés aux administrateurs connectés ; un visiteur non connecté est renvoyé vers la connexion et le serveur refuse toute requête sans session admin.
- **FR-101**: La section « SALM » du menu admin MUST proposer, en plus du suivi des inscriptions existant, les entrées « Éditions » et « Statistiques ».
- **FR-102**: Toute l'interface MUST être en français avec accents, avec le style des pages admin existantes.

#### Éditions

- **FR-110**: L'administrateur MUST pouvoir lister les éditions, triées par année décroissante, avec : année, statut (Brouillon, Publiée, Archivée), dates de début et de fin, lieu, nombre d'inscriptions étudiantes et établissements.
- **FR-111**: L'administrateur MUST pouvoir créer une édition en saisissant son année (4 chiffres, entre 2020 et 2100, unique). L'édition est créée en brouillon, inscriptions fermées ; l'intitulé du salon, le nom de l'organisateur et la ville sont préremplis par ceux de l'édition la plus récente. S'il n'existe aucune édition, l'intitulé et la ville prennent les valeurs par défaut de la feature A, et le nom de l'organisateur est demandé à la création.
- **FR-112**: L'administrateur MUST pouvoir modifier les informations générales d'une édition : année, intitulé du salon, nom de l'organisateur, ville, lieu (facultatif), slogan (facultatif).
- **FR-113**: Les dates de début et de fin et les horaires d'une édition MUST être ceux de ses jours (FR-150) : date de début = premier jour, date de fin = dernier jour, plage horaire = ouverture la plus tôt – fermeture la plus tardive. Ils ne sont pas saisis ailleurs.
- **FR-114**: L'année d'une édition MUST être verrouillée dès qu'elle a au moins une inscription (étudiante ou établissement) ou que ses données personnelles ont été supprimées, car elle fonde le préfixe des numéros de badge.
- **FR-115**: Au plus une édition MUST être publiée à un instant donné. Publier une édition (depuis Brouillon, ou depuis Archivée dans les conditions de FR-115a) archive dans la même opération l'édition publiée, s'il y en a une. La publication exige une confirmation qui nomme l'édition archivée par effet de bord.
- **FR-115a**: Une édition archivée MUST pouvoir être republiée, avec la même confirmation, tant que son salon n'est pas terminé (fin du dernier jour, heure d'Abidjan). Une fois le salon terminé, l'archivage est définitif : l'action « Publier » n'est plus proposée pour cette édition et le serveur la refuse.
- **FR-116**: La publication MUST être refusée tant que l'édition n'a aucun jour.
- **FR-117**: L'administrateur MUST pouvoir archiver une édition en brouillon ou publiée, après confirmation. Archiver l'édition publiée laisse le site sans édition publiée (message d'attente de la feature A).
- **FR-118**: Publier ou archiver une édition MUST NOT modifier ses interrupteurs d'inscription ni ses inscriptions ; seule l'édition publiée reçoit des inscriptions publiques (feature A).
- **FR-119**: L'administrateur MUST pouvoir supprimer, après confirmation, une édition en brouillon qui n'a jamais reçu d'inscription. Aucune autre édition n'est supprimable.
- **FR-120**: L'administrateur MUST pouvoir prévisualiser toute édition non publiée telle que `/salm` l'afficherait si elle était publiée : mêmes sections, mêmes règles d'affichage (valeurs manquantes, médias de l'édition précédente, compte à rebours), sur ordinateur comme sur mobile. La prévisualisation porte un bandeau « Aperçu — cette édition n'est pas publiée », ne permet aucune inscription, n'est pas indexable et ne modifie rien.
- **FR-121**: Une édition en brouillon ou archivée MUST rester invisible du public : ni la page `/salm`, ni la navigation, ni les formulaires, ni les données publiques ne l'exposent.

#### Contenus : règles communes

- **FR-130**: Chaque liste de contenus (publics cibles, contacts, temps forts, créneaux, vidéos du canapé, photos, types de stands) MUST être ordonnable, à la souris et au clavier ; l'ordre enregistré est celui de la page publique, des formulaires et du badge. Les jours ne sont pas ordonnables à la main : leur ordre est celui de leurs dates (FR-150).
- **FR-131**: Chaque suppression (contenu, fichier, jour, édition) MUST être précédée d'une confirmation qui nomme l'élément et, le cas échéant, ce qui disparaît avec lui.
- **FR-132**: Les images (affiche, temps forts, photos, image de secours de la vidéo récapitulative) MUST être acceptées uniquement aux formats JPEG, PNG et WebP, et à 5 Mo au plus par fichier ; le contenu réel du fichier est contrôlé, pas seulement son extension. Tout autre fichier est refusé avec un message indiquant les formats et le poids acceptés, et le contenu existant est conservé.
- **FR-133**: Chaque image porteuse d'information (affiche, temps forts, photos) MUST avoir un texte alternatif. Il est prérempli à l'envoi (titre du temps fort, « Affiche du SALM <année> », « Photo du SALM <année> n° N ») et reste modifiable. L'image de secours de la vidéo récapitulative est **décorative** (fond du hero, affiché avec un texte alternatif vide) : elle n'a pas de texte alternatif.
- **FR-134**: Les liens vidéo (vidéo récapitulative, canapé) MUST être des adresses de vidéos YouTube dont l'identifiant de vidéo est extractible (formes `watch?v=`, `youtu.be/`, `embed/`, `shorts/`, avec ou sans paramètres) ; toute autre adresse est refusée avec un message. Une miniature de la vidéo est montrée en aperçu dès que l'administrateur quitte le champ (ou colle une adresse).
- **FR-135**: Une modification enregistrée MUST se refléter immédiatement sur `/salm`, les formulaires et le badge de l'édition publiée, sans intervention technique.
- **FR-136**: Remplacer ou supprimer un fichier dans une édition MUST NOT affecter une autre édition qui utilise le même fichier (cas d'une copie par duplication).

#### Textes, affiche, programme et contacts

- **FR-141**: L'administrateur MUST pouvoir modifier les textes de la section « Pourquoi le SALM ? » : titre, paragraphe, et les cartes « public cible » (titre et texte ; ajout, suppression et ordre).
- **FR-142**: L'administrateur MUST pouvoir envoyer, remplacer ou retirer l'affiche officielle de l'édition et saisir son texte alternatif. L'affiche sert à la section « Pourquoi le SALM ? », à l'image de partage et au fond de secours du hero (feature A).
- **FR-143**: L'administrateur MUST pouvoir joindre, remplacer ou retirer le PDF du programme (format PDF, 10 Mo au plus) ; le bouton « Télécharger le programme (PDF) » de `/salm` suit sa présence (FR-015 de 006).
- **FR-144**: L'administrateur MUST pouvoir gérer les contacts de l'organisateur : type (Téléphone, E-mail, Adresse), valeur, ordre. Un téléphone suit le format ivoirien à 10 chiffres (avec ou sans +225) et est enregistré sous forme normalisée ; un e-mail est validé sur sa forme ; une adresse est un texte de 200 caractères au plus.
- **FR-145**: Au plus un contact, de type Téléphone, MUST pouvoir être marqué « Imprimé sur le badge » ; c'est celui du verso du badge et du formulaire établissement. Marquer un contact retire la marque du précédent.

#### Temps forts

- **FR-146**: L'administrateur MUST pouvoir ajouter, modifier, ordonner et supprimer les temps forts d'une édition. Titre (100 caractères au plus) et photo sont obligatoires.

#### Chronogramme

- **FR-150**: L'administrateur MUST pouvoir ajouter, modifier et supprimer les jours d'une édition : date (unique dans l'édition), libellé (proposé automatiquement « Jour N », modifiable), heure d'ouverture et heure de fermeture (fermeture postérieure à l'ouverture). Les jours sont présentés par date croissante.
- **FR-151**: Supprimer un jour MUST supprimer ses créneaux ; la confirmation indique leur nombre. Le dernier jour d'une édition publiée ne peut pas être supprimé.
- **FR-152**: Pour chaque jour, l'administrateur MUST pouvoir ajouter, modifier, ordonner et supprimer des créneaux : heure de début et heure de fin (fin postérieure au début), titre (obligatoire, 150 caractères au plus), type parmi Cérémonie, Panel, Présentation, Stands, Pause, Exposition, description facultative (1 000 caractères au plus), option « mis en avant ».
- **FR-153**: L'écran MUST signaler, sans bloquer l'enregistrement, chaque créneau qui chevauche un autre créneau du même jour (intervalles qui se recoupent strictement), en nommant le ou les créneaux concernés et leurs horaires. Le jour affiche le nombre de chevauchements.
- **FR-154**: L'administrateur MUST pouvoir réordonner les créneaux d'un jour par heure de début en une action (« Trier par heure »), en plus de l'ordre manuel.
- **FR-155**: Quand l'édition a déjà des inscriptions étudiantes, la modification ou la suppression d'un jour MUST afficher un avertissement indiquant que les badges déjà téléchargés portent les anciennes informations.

#### Médias produits pendant l'édition

- **FR-160**: Les médias d'une édition (vidéo récapitulative et son image de secours, vidéos du canapé, photos) MUST être gérés dans la fiche de l'édition où ils ont été produits, avec l'indication explicite de l'édition sur la page de laquelle ils s'affichent (l'édition suivante). La fiche de chaque édition rappelle aussi de quelle édition proviennent les médias qu'elle affiche, avec un lien vers leur gestion.
- **FR-161**: L'administrateur MUST pouvoir saisir, modifier ou retirer la vidéo récapitulative (lien YouTube) et envoyer, remplacer ou retirer son image de secours.
- **FR-162**: L'administrateur MUST pouvoir ajouter, modifier, ordonner et supprimer les vidéos du canapé : lien YouTube (obligatoire), titre, invité·e, établissement (facultatifs, 150 caractères au plus chacun).
- **FR-163**: L'administrateur MUST pouvoir envoyer plusieurs photos en une seule sélection (jusqu'à 50 fichiers). Le catalogue d'une édition compte de l'ordre de 50 photos ; ce volume n'est pas une limite bloquante, mais c'est celui pour lequel les écrans et la page publique sont conçus. Chaque fichier est contrôlé séparément : les fichiers valides sont ajoutés à la fin du catalogue, les fichiers refusés sont listés avec la raison. Une progression de l'envoi est affichée.
- **FR-164**: Pour chaque photo, l'administrateur MUST pouvoir saisir une légende facultative (200 caractères au plus), modifier le texte alternatif, changer l'ordre et supprimer la photo. Les 4 premières photos forment l'aperçu de `/salm`.

#### Types de stands

- **FR-170**: L'administrateur MUST pouvoir ajouter, modifier et ordonner les types de stands : nom (obligatoire, 60 caractères au plus, unique dans l'édition sans tenir compte des majuscules), description facultative (500 caractères au plus), tarif facultatif en texte libre (60 caractères au plus ; aucun calcul ni paiement).
- **FR-171**: L'administrateur MUST pouvoir masquer ou réafficher un type de stand. Un type masqué n'est plus proposé aux établissements et reste affiché sur les inscriptions qui l'ont choisi.
- **FR-172**: Un type de stand choisi par au moins un établissement MUST NOT pouvoir être supprimé ; l'écran indique le nombre d'établissements concernés et propose de le masquer. Un type jamais choisi peut être supprimé après confirmation.
- **FR-173**: L'écran des stands MUST avertir quand aucun type n'est visible alors que les inscriptions établissements de l'édition sont ouvertes.

#### Duplication

- **FR-180**: L'administrateur MUST pouvoir dupliquer une édition, après confirmation, en une nouvelle édition de l'année suivante (année source + 1). La duplication est refusée si cette année existe déjà.
- **FR-181**: La copie MUST être créée au statut Brouillon et reprendre : intitulé du salon, organisateur, ville, slogan, titre et paragraphe « Pourquoi le SALM ? », publics cibles, contacts (avec la marque « Imprimé sur le badge »), temps forts (titre, photo, texte alternatif, ordre), types de stands (nom, description, tarif, visibilité, ordre), jours et créneaux (tous leurs champs et leur ordre).
- **FR-182**: Les dates des jours copiés MUST être décalées de 52 semaines, pour conserver le jour de la semaine ; la fiche de la copie invite à vérifier les dates.
- **FR-183**: La copie MUST NOT reprendre : aucune inscription étudiante ni établissement, aucun exposant, ni le lieu, l'affiche, le PDF du programme, la vidéo récapitulative, les vidéos du canapé ou les photos du catalogue. Ces médias restent sur leur édition d'origine, que la copie affiche déjà comme « édition précédente » (FR-006 de 006) : les recopier les ferait apparaître à tort sur la page de l'édition d'après. Aucune option de la duplication ne permet de les recopier. Ses inscriptions sont fermées, son compteur de badges part de zéro et elle n'a ni date ni compteurs de suppression des données personnelles.
- **FR-184**: La duplication MUST être entière ou nulle : en cas d'échec, aucune édition partielle n'est créée.

#### Statistiques

- **FR-190**: L'administrateur MUST pouvoir consulter les statistiques d'une édition choisie (par défaut, l'édition publiée, sinon la plus récente).
- **FR-191**: Pour les étudiant·e·s, les statistiques MUST présenter : le total ; le nombre d'inscriptions par jour d'inscription (heure d'Abidjan) et leur cumul ; la répartition par niveau d'étude (les 6 niveaux, en nombre et en pourcentage).
- **FR-192**: Pour les établissements, les statistiques MUST présenter : le total ; le nombre d'exposants des inscriptions non annulées ; la répartition par type de stand (types masqués compris) ; la répartition par statut de suivi.
- **FR-193**: Quand une édition antérieure existe (la plus récente dont l'année est inférieure et qui a des inscriptions ou des compteurs conservés), chaque total et chaque répartition MUST être comparé à cette édition : valeur de l'édition précédente et écart en nombre et en pourcentage. Sinon, aucune comparaison n'est affichée.
- **FR-194**: Quand les deux éditions comparées ont des jours de salon, l'évolution cumulée des inscriptions étudiantes MUST être superposée en alignant chaque édition sur le nombre de jours restant avant son ouverture.
- **FR-195**: Pour une édition dont les données personnelles ont été supprimées, les statistiques MUST provenir des compteurs agrégés conservés (FR-065b de 006), avec la date de suppression.
- **FR-196**: Les statistiques MUST NOT afficher de donnée personnelle (nom, téléphone, e-mail, numéro de badge).
- **FR-197**: Les graphiques MUST être accompagnés des valeurs chiffrées lisibles sans le graphique (tableau ou libellés), pour l'accessibilité.
- **FR-197a**: Le tableau de bord admin existant MUST afficher, quand une édition est publiée, un encart « SALM <année> » : total des inscriptions étudiantes, total des établissements inscrits, écart de chacun avec l'édition précédente (règle de FR-193, omis s'il n'y en a pas) et lien « Voir les statistiques SALM » vers la vue dédiée. Sans édition publiée, l'encart n'apparaît pas. Le reste du tableau de bord n'est pas modifié.

#### Accessibilité et retours

- **FR-198**: Tous les écrans de cette feature MUST être utilisables au clavier seul, avec un focus visible, des libellés associés à chaque champ et des erreurs affichées sous le champ concerné.
- **FR-199**: Chaque enregistrement réussi MUST être confirmé par un message temporaire ; chaque échec MUST afficher un message en français qui dit quoi corriger, sans perdre la saisie.

### Key Entities *(include if feature involves data)*

Aucune nouvelle entité : la feature réutilise celles de la feature A (voir `specs/006-salm-inscriptions/spec.md`, Key Entities, et `data-model.md`).

- **Édition** : statut et transitions (Brouillon → Publiée ; Brouillon ou Publiée → Archivée ; Archivée → Publiée tant que le salon n'est pas terminé), informations générales, textes, affiche, PDF du programme, contacts, publics cibles, vidéo récapitulative ; dates et horaires dérivés de ses jours.
- **Jour** et **Créneau** : chronogramme ; chevauchements calculés à l'affichage, jamais stockés.
- **Temps fort**, **Vidéo du canapé**, **Photo** : contenus ordonnés d'une édition ; vidéos et photos rattachées à l'édition d'origine.
- **Type de stand** : ne peut être supprimé tant qu'une inscription établissement le référence.
- **Inscriptions** et **compteurs conservés** : lus seulement, pour les statistiques ; jamais copiés ni modifiés par cette feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des contenus affichés sur `/salm`, dans les formulaires et sur le badge d'une édition sont modifiables depuis le back-office ; plus aucune mise à jour de contenu SALM ne nécessite un développeur ni le jeu de données initial.
- **SC-002**: Un administrateur prépare l'édition suivante par duplication, ajuste dates, lieu et affiche, la prévisualise et la publie en moins de 30 minutes.
- **SC-003**: Le contenu d'une édition affiché en prévisualisation est identique, section par section, à celui affiché sur `/salm` après publication.
- **SC-004**: À aucun moment deux éditions ne sont publiées simultanément, y compris lors de publications concurrentes.
- **SC-005**: 100 % des liens non YouTube et des fichiers hors format ou hors poids sont refusés avec un message explicite ; aucune image cassée n'apparaît sur `/salm`.
- **SC-006**: L'envoi de 20 photos de 3 Mo en une seule sélection se termine en moins de 2 minutes sur une connexion de bureau courante.
- **SC-007**: Une duplication ne copie aucune inscription (0) et reprend 100 % des éléments listés en FR-181.
- **SC-008**: 100 % des créneaux qui se chevauchent sont signalés, et 0 créneau qui ne fait que toucher un autre n'est signalé.
- **SC-009**: Aucune inscription établissement ne perd son type de stand (0 référence orpheline).
- **SC-010**: Un administrateur répond à la question « combien d'étudiant·e·s de niveau Master sont inscrit·e·s, par rapport à l'an dernier ? » en moins de 30 secondes depuis le menu admin ; la page des statistiques s'affiche en moins de 3 secondes pour une édition de 5 000 inscriptions.
- **SC-011**: Chaque parcours de la feature (créer, modifier, ordonner, supprimer, publier, dupliquer, consulter les statistiques) se réalise entièrement au clavier.

## Assumptions

- **Dates et horaires** : le modèle de la feature A dérive les dates et horaires de l'édition de ses jours. « Dates de début et de fin, horaires » de la demande se saisissent donc via les jours du chronogramme (FR-113), ce qui évite deux sources de vérité.
- **« Dépublier »** : l'édition publiée précédente passe au statut Archivée (pas Brouillon), ce qui garde l'accès à ses inscriptions et à la suppression de ses données personnelles (FR-065b de 006). Une archive peut être republiée tant que son salon n'est pas terminé (FR-115a), ce qui permet de réparer une publication faite par erreur.
- **Retour au brouillon** : pas de transition Publiée → Brouillon ni Archivée → Brouillon. Pour retirer une édition du site, on l'archive.
- **Suppression d'une édition** : non demandée explicitement, mais limitée aux brouillons sans inscription, pour pouvoir annuler une création ou une duplication faite par erreur.
- **Vidéo hero** : c'est la vidéo récapitulative de l'édition précédente (règle des médias de la feature A). Elle se saisit sur l'édition où elle a été tournée, avec une image de secours facultative.
- **PDF du programme** : non listé dans la demande, mais inclus (FR-143) : sans lui, le bouton « Télécharger le programme » de la feature A ne pourrait jamais apparaître sans développeur.
- **Publics cibles** : considérés comme faisant partie du texte « Pourquoi le SALM ? » (ce sont les cartes de cette section).
- **Limites des fichiers** (clarification 2026-09-28) : catalogue de l'ordre de 50 photos par édition ; 5 Mo au plus par image, JPEG / PNG / WebP ; 50 photos par envoi ; 10 Mo pour le PDF du programme. L'équipe compresse les photos avant l'envoi (une photo d'appareil reflex de 8 à 15 Mo doit être réduite) ; le back-office ne retouche pas les images. Le format HEIC (photos d'iPhone) n'est pas accepté et doit être converti avant envoi.
- **Duplication des dates** : décalage de 52 semaines pour conserver le jour de la semaine (le salon se tient un vendredi et un samedi). L'administrateur ajuste ensuite.
- **Duplication du lieu** : le lieu change souvent d'une année à l'autre ; il n'est pas copié et s'affiche « Lieu à confirmer » jusqu'à sa saisie. La ville est copiée.
- **Statistiques « par jour »** : il s'agit du jour d'inscription (date de création de l'inscription, heure d'Abidjan), pas des jours du salon ; les présences par jour de salon relèvent de la feature C.
- **Édition de comparaison** : la plus récente antérieure qui a des données (inscriptions ou compteurs conservés), cohérente avec la règle « édition précédente » de la feature A.
- **Pas d'export des statistiques** : les exports CSV détaillés existent déjà dans le back-office des inscriptions.
- **Authentification et droits** (clarification 2026-09-28) : mécanisme de connexion admin existant (mot de passe partagé, sans compte nominatif), un seul rôle ; tout administrateur connecté peut publier, archiver, dupliquer et supprimer. Pas de journal des modifications ni de validation à deux personnes : les confirmations (FR-115, FR-117, FR-131) sont la seule protection contre les erreurs de manipulation.
- **Concurrence** : pas de verrouillage d'édition ; le dernier enregistrement l'emporte.
- **Miniatures des vidéos du canapé** : la miniature affichée est celle de YouTube. Une miniature personnalisée n'est pas gérée par le back-office ; le champ prévu par la feature A reste inutilisé.
- **Interrupteurs d'inscription** : restent dans l'en-tête du back-office des inscriptions (feature A) ; cette feature ne les déplace pas.

## Hors périmètre

- **Feature C** : contrôle d'entrée par scan du QR code, présences par jour de salon.
- Toute modification de la page publique `/salm`, des formulaires et du badge au-delà de la prévisualisation (FR-120).
- Modification des inscriptions ou des exposants par l'administration (inchangé depuis la feature A).
- Historique ou journal des modifications, gestion des versions de contenu et programmation d'une publication à une date future.
- Comptes administrateurs nominatifs, rôles et droits différenciés, validation d'une publication à deux personnes.
- Hébergement de vidéos hors YouTube ; recadrage ou retouche d'images dans le back-office.
- Export des statistiques.
