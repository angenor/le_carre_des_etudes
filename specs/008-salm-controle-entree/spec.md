# Feature Specification: Module SALM (3/3) — contrôle d'entrée le jour J

**Feature Branch**: `008-salm-controle-entree`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Module « SALM », partie 3/3 : contrôle d'entrée le jour J. Les badges étudiants générés par la feature salm-inscriptions contiennent un QR code qui encode une URL de vérification non devinable, ainsi qu'un numéro (ex. SALM27-000482). Les établissements n'ont pas de badge. P1 : scanner un badge depuis une page de contrôle réservée aux administrateurs, sur téléphone (résultat valide avec nom, niveau et numéro, présence du jour enregistrée ; « déjà scanné aujourd'hui » avec l'heure du premier passage ; « badge invalide ou d'une autre édition » ; retours très contrastés, lisibles en extérieur). P1 : saisie manuelle par numéro de badge ou par téléphone quand le QR code est illisible. P2 : compteur d'entrées par jour sur la page de contrôle et dans la liste des inscrits du back-office, colonne « présent » par jour dans l'export CSV. Règles : page réservée aux administrateurs connectés, conçue d'abord pour le mobile (390 px, une seule main) ; une entrée par badge et par jour ; scanner l'URL du QR code sans être connecté ne révèle aucune donnée personnelle. Hors périmètre : inscription sur place, contrôle des exposants."

## Contexte

Le module SALM est découpé en trois features :

| Feature | Périmètre |
|---|---|
| A — `006-salm-inscriptions` (livrée) | Modèle multi-édition, page `/salm`, inscriptions, badge PDF à QR code, back-office des inscriptions, page de vérification neutre |
| B — `007-salm-admin-contenus` (livrée) | Écrans d'administration des éditions et des contenus, prévisualisation, duplication, statistiques |
| **C — cette spec** | Contrôle d'entrée des étudiant·e·s par scan du QR code, saisie manuelle de secours, suivi des entrées par jour de salon |

Ce que les features précédentes ont déjà établi et que cette feature réutilise :

- Chaque inscription étudiante porte un **numéro de badge** (`SALM27-000482`, séquentiel par édition) et un **identifiant de vérification** aléatoire et non devinable ; le QR code du badge encode l'**URL de vérification** construite avec cet identifiant (FR-026, FR-027 de 006).
- L'URL de vérification ouverte par n'importe qui affiche une page neutre (édition, validité) sans aucune donnée personnelle (FR-028 de 006). **Cette feature la modifie** : pour un visiteur non connecté, la page n'indique plus la validité du badge (FR-222).
- Un badge supprimé, ou dont les données personnelles de l'édition ont été supprimées, est invalide (FR-065, FR-065b de 006).
- Les **établissements et exposants n'ont aucun badge** et ne sont pas contrôlés par QR code : ils sont pointés à l'accueil exposants sur la liste nominative exportée (FR-047, FR-068a de 006, décision D13).
- Une édition a des **jours de salon** (date, libellé « Jour 1 », horaires) ; l'heure de référence est celle d'Abidjan (UTC+0).
- La connexion admin repose sur un mot de passe partagé, sans compte nominatif, avec un seul rôle (clarification de 007).

**Références** : `specs/006-salm-inscriptions/` (spec, data-model, contrats `public-api.md` et `admin-api.md`), `specs/007-salm-admin-contenus/spec.md`. Pas de maquette : l'écran de contrôle suit les exigences de lisibilité de cette spec ; les ajouts au back-office suivent les patterns de la liste des inscrit·e·s existante.

## Clarifications

### Session 2026-09-28

- Q: Combien de postes de contrôle fonctionneront en même temps le jour J, et sur quels téléphones ? → A: Au moins 1 poste, sans nombre maximal fixé, sur les téléphones personnels de l'équipe, Android et iPhone mélangés.
- Q: Le contrôle doit-il continuer à fonctionner quand la connexion internet du lieu tombe ou sature ? → A: Oui, mode dégradé complet : chaque téléphone précharge la liste des badges valides de l'édition avec nom, niveau et numéro de badge (sans téléphone). Hors ligne, les résultats sont identiques au mode en ligne, avec un indicateur « hors ligne ». Les entrées sont envoyées au retour du réseau.
- Q: Que se passe-t-il quand un·e étudiant·e non inscrit·e se présente à l'entrée ? → A: Il ou elle s'inscrit sur son propre téléphone via le formulaire public (affiche à QR code à l'entrée), puis présente son nouveau badge ; la page de contrôle rappelle l'adresse d'inscription. L'équipe peut aussi inscrire elle-même, depuis la page de contrôle, une personne qui n'a pas de connexion. Cela revient sur la décision initiale qui excluait l'inscription sur place.
- Q: Le contrôle porte-t-il seulement sur l'entrée du salon, ou aussi sur l'accès à certains créneaux du programme, comme les panels ? → A: Entrée du salon uniquement : une entrée par badge et par jour de salon ; les créneaux du chronogramme sont en accès libre une fois dans le salon.
- Q: Que doit afficher l'URL du QR code quand elle est ouverte par quelqu'un qui n'est pas un administrateur connecté ? → A: Une page sans aucune indication de validité : « Ce QR code est un badge du SALM <année>. Présentez-le à l'entrée », avec les dates et le lieu. Seule l'équipe connectée connaît la validité d'un badge. Cela remplace la page « Badge valide / Badge invalide » de la feature A (FR-028 de 006).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Scanner un badge à l'entrée (Priority: P1)

Le matin du salon, un membre de l'équipe se connecte à l'admin sur son téléphone et ouvre « SALM › Contrôle d'entrée ». L'écran affiche le jour en cours (« Jour 1 · ven. 12 mars »), le nombre d'entrées du jour et la vue de l'appareil photo, prête à lire. Un·e étudiant·e présente son badge, imprimé ou affiché sur son téléphone. Dès que le QR code est lu, le résultat occupe l'écran : une couleur franche, un mot en très gros caractères, puis le nom, le niveau d'étude et le numéro de badge. L'entrée est enregistrée pour le jour en cours. Le membre de l'équipe passe au badge suivant sans toucher l'écran.

**Why this priority**: C'est la raison d'être de la feature : faire entrer rapidement les inscrit·e·s et compter les présences réelles. Sans scan, le contrôle se fait à l'œil sur un badge imprimé, sans aucune garantie.

**Independent Test**: Avec l'édition publiée dont un jour correspond à la date du jour (ou en mode essai hors jour de salon), 3 inscriptions de test et leurs badges : scanner un badge valide (écran vert, entrée enregistrée, compteur +1), le rescanner après 10 secondes (écran ambre avec l'heure du premier passage, compteur inchangé), scanner le badge d'une édition précédente (écran rouge) puis le QR code d'un site quelconque (écran rouge). Tester sur un téléphone de 390 px en plein soleil.

**Acceptance Scenarios**:

1. **Given** l'administrateur est connecté sur son téléphone et l'édition 2027 est publiée, **When** il ouvre la page de contrôle, **Then** l'appareil photo arrière s'active après son autorisation, et l'écran affiche le jour en cours, le nombre d'entrées du jour et une invite « Présentez le QR code du badge ».
2. **Given** nous sommes le vendredi 12 mars 2027 (Jour 1) et « Kouassi Aya Marie », Licence (Bac+3), badge SALM27-000482, n'est pas encore entrée, **When** son QR code est lu, **Then** en moins d'une seconde l'écran devient vert avec « ENTRÉE VALIDÉE », « KOUASSI AYA MARIE », « Licence (Bac+3) » et « SALM27-000482 » ; son entrée du Jour 1 est enregistrée à l'heure du scan et le compteur du jour augmente de 1.
3. **Given** la même étudiante est entrée le Jour 1 à 09h42, **When** son badge est scanné de nouveau le Jour 1 à 13h05, **Then** l'écran devient ambre avec « DÉJÀ ENTRÉE AUJOURD'HUI », « à 09h42 », son nom, son niveau et son numéro ; aucune nouvelle entrée n'est enregistrée et le compteur ne change pas.
4. **Given** la même étudiante est entrée le Jour 1, **When** son badge est scanné le samedi 13 mars (Jour 2), **Then** le résultat est « ENTRÉE VALIDÉE » et une entrée du Jour 2 est enregistrée.
5. **Given** le badge d'une inscription de l'édition 2026, **When** il est scanné pendant le SALM 2027, **Then** l'écran devient rouge avec « BADGE REFUSÉ » et « Badge d'une autre édition (SALM 2026) » ; aucune donnée personnelle n'est affichée et rien n'est enregistré.
6. **Given** le badge d'une inscription supprimée par l'administration, ou un QR code dont l'identifiant est inconnu, **When** il est scanné, **Then** l'écran devient rouge avec « BADGE REFUSÉ » et « Badge invalide » ; rien n'est enregistré.
7. **Given** un QR code qui n'est pas un badge SALM (adresse d'un autre site, texte libre, badge d'un autre événement), **When** il est lu, **Then** l'écran devient rouge avec « BADGE REFUSÉ » et « Ce QR code n'est pas un badge SALM ».
8. **Given** un résultat est affiché et le badge reste devant l'appareil photo, **When** le même QR code est relu dans les secondes qui suivent, **Then** le résultat affiché ne change pas (il ne bascule pas en « déjà entré·e ») et rien n'est enregistré de plus.
9. **Given** un résultat est affiché, **When** un autre QR code est présenté, **Then** il est lu et son résultat remplace le précédent, sans action sur l'écran.
10. **Given** deux membres de l'équipe scannent le même badge au même instant sur deux téléphones, **When** les deux résultats s'affichent, **Then** une seule entrée est enregistrée : un téléphone affiche « ENTRÉE VALIDÉE », l'autre « DÉJÀ ENTRÉE AUJOURD'HUI » avec la même heure.
11. **Given** un résultat « ENTRÉE VALIDÉE » vient de s'afficher pour la mauvaise personne (badge d'un·e autre présenté par erreur), **When** l'administrateur touche « Annuler cette entrée » et confirme, **Then** l'entrée du jour est retirée, le compteur diminue de 1 et un nouveau scan de ce badge sera « ENTRÉE VALIDÉE ».
12. **Given** l'administrateur a refusé l'accès à l'appareil photo, ou le navigateur ne le permet pas, **When** il ouvre la page de contrôle, **Then** un message explique comment autoriser l'appareil photo et la saisie manuelle (User Story 2) est proposée directement.
13. **Given** le téléphone a préchargé la liste des badges de l'édition puis perd le réseau, **When** le badge de « Kouassi Aya Marie », pas encore entrée ce jour, est scanné, **Then** l'écran vert « ENTRÉE VALIDÉE » s'affiche avec son nom, son niveau et son numéro, comme en ligne ; un indicateur « HORS LIGNE · 1 entrée en attente d'envoi » reste visible en haut de l'écran.
14. **Given** le téléphone est hors ligne et a enregistré 37 entrées en attente, **When** le réseau revient, **Then** les 37 entrées sont envoyées sans action de l'administrateur, l'indicateur disparaît, et elles apparaissent dans le back-office avec l'heure de leur scan.
15. **Given** deux téléphones hors ligne ont chacun validé le badge SALM27-000482 le Jour 1, l'un à 09h42 et l'autre à 09h55, **When** les deux se resynchronisent, **Then** une seule entrée existe pour ce badge et ce jour, à 09h42.
16. **Given** le téléphone est hors ligne, **When** un badge absent de la liste préchargée est scanné (inscription faite après le dernier préchargement, ou identifiant inconnu), **Then** l'écran affiche l'état neutre « NON VÉRIFIÉ — badge absent de la liste hors ligne », sans l'accepter ni le refuser ; rien n'est enregistré.
17. **Given** la page de contrôle est ouverte pour la première fois sans réseau (liste jamais préchargée sur ce téléphone), **When** un QR code est lu, **Then** l'écran affiche « NON VÉRIFIÉ — réseau indisponible » avec un bouton « Réessayer », et jamais « ENTRÉE VALIDÉE ».
18. **Given** un résultat vert, ambre ou rouge, **When** il s'affiche, **Then** le téléphone vibre selon un motif propre à chaque résultat (une vibration courte pour « validée », deux pour « déjà entré·e », une longue pour « refusé ») lorsque l'appareil le permet.

---

### User Story 2 — Retrouver un inscrit sans QR code lisible (Priority: P1)

Le badge est froissé, l'écran du téléphone de l'étudiant·e est cassé ou trop sombre, ou le badge a été oublié. Depuis la page de contrôle, l'administrateur touche « Saisie manuelle », tape le numéro de badge ou le numéro de téléphone de la personne et obtient sa fiche : nom, niveau, numéro de badge et état du jour. Il vérifie le nom avec la personne et touche « Valider l'entrée ».

**Why this priority**: Sans solution de secours, chaque QR code illisible bloque la file et pousse l'équipe à laisser entrer sans contrôle ni comptage. Elle est indispensable dès le premier jour.

**Independent Test**: Sans appareil photo, retrouver une inscription de test par « 482 », par « SALM27-000482 » et par « 07 12 34 56 78 », valider son entrée, puis vérifier qu'un scan de son badge indique « déjà entrée aujourd'hui ». Rechercher un numéro inexistant : message « Aucun inscrit ».

**Acceptance Scenarios**:

1. **Given** la page de contrôle, **When** l'administrateur touche « Saisie manuelle », **Then** un champ unique « Numéro de badge ou téléphone » apparaît avec le clavier numérique, accessible au pouce en bas de l'écran.
2. **Given** « Kouassi Aya Marie » a le badge SALM27-000482 et le numéro 0712345678, **When** l'administrateur saisit « 482 », « 000482 », « SALM27-000482 », « salm27 482 », « 07 12 34 56 78 » ou « +225 0712345678 », **Then** la même fiche s'affiche : nom, niveau, numéro de badge et « Pas encore entrée aujourd'hui ».
3. **Given** la fiche d'une inscrite pas encore entrée ce jour, **When** l'administrateur touche « Valider l'entrée », **Then** l'écran vert « ENTRÉE VALIDÉE » s'affiche comme pour un scan et l'entrée du jour est enregistrée comme saisie manuelle.
4. **Given** la fiche d'une inscrite déjà entrée ce jour à 09h42, **When** elle s'affiche, **Then** elle indique « Déjà entrée aujourd'hui à 09h42 », le bouton « Valider l'entrée » est absent et « Annuler cette entrée » est proposé.
5. **Given** un numéro de badge ou de téléphone qui ne correspond à aucune inscription de l'édition contrôlée (y compris une inscription d'une autre édition), **When** l'administrateur valide la recherche, **Then** le message « Aucun inscrit avec ce numéro pour le SALM 2027 » s'affiche, sans autre détail.
6. **Given** une saisie qui n'est ni un numéro de badge ni un téléphone ivoirien (« abc », « 12 »), **When** l'administrateur valide, **Then** un message indique les formats attendus (« numéro de badge, ex. 482 ou SALM27-000482, ou téléphone, ex. 07 12 34 56 78 »).
6a. **Given** le téléphone est hors ligne avec la liste préchargée, **When** l'administrateur saisit « 482 », **Then** la fiche s'affiche et « Valider l'entrée » enregistre l'entrée en attente d'envoi ; **When** il saisit un numéro de téléphone, **Then** le message « Recherche par téléphone indisponible hors ligne : utilisez le numéro de badge » s'affiche.
7. **Given** la fiche d'un·e inscrit·e, **When** l'administrateur touche « Retour au scan », **Then** l'appareil photo reprend la lecture.
8. **Given** l'administrateur est connecté et ouvre l'URL d'un QR code avec l'appareil photo natif de son téléphone (la lecture intégrée ne fonctionne pas), **When** la page de vérification s'affiche, **Then** elle indique en plus la validité du badge et propose un bouton « Contrôler ce badge » qui ouvre la fiche de ce badge sur la page de contrôle, sans enregistrer d'entrée tant que « Valider l'entrée » n'est pas touché.
9. **Given** un visiteur non connecté, **When** il ouvre l'URL du QR code d'un badge valide, puis celle d'un badge supprimé, puis une URL au jeton inventé, **Then** les trois pages sont identiques : « Ce QR code est un badge du SALM 2027. Présentez-le à l'entrée », les dates et horaires des deux jours, le lieu et un lien vers `/salm` ; aucune ne dit si le badge est valide ni n'affiche de donnée personnelle.

---

### User Story 3 — Suivre les entrées par jour (Priority: P2)

Pendant et après le salon, l'équipe veut savoir combien d'étudiant·e·s sont entré·e·s chaque jour, et qui. La page de contrôle affiche en permanence le compteur du jour et celui de l'autre jour. Dans le back-office, la liste des inscrit·e·s affiche les compteurs d'entrées de chaque jour, la présence de chaque inscrit·e par jour et un filtre par présence ; l'export CSV contient une colonne « présent » par jour.

**Why this priority**: Utile pour piloter l'accueil en direct (affluence) et rendre compte aux partenaires (taux de présence), mais le contrôle d'entrée fonctionne sans.

**Independent Test**: Avec 10 inscriptions de test, enregistrer 4 entrées le Jour 1 et 3 le Jour 2 (dont 2 personnes présentes les deux jours) : la page de contrôle et la liste du back-office affichent « Jour 1 : 4 » et « Jour 2 : 3 » ; le filtre « Présent·e Jour 1 » montre 4 lignes ; l'export CSV contient les colonnes de présence avec « Oui » sur les bonnes lignes.

**Acceptance Scenarios**:

1. **Given** le Jour 1 compte 1 204 entrées, **When** l'administrateur regarde la page de contrôle, **Then** il lit « Jour 1 · 1 204 entrées » en tête d'écran, et le compteur de l'autre jour en plus petit.
2. **Given** plusieurs téléphones contrôlent en même temps (aucun nombre maximal), **When** un autre téléphone enregistre des entrées, **Then** le compteur de chaque téléphone se met à jour au plus tard 30 secondes après, sans recharger la page.
3. **Given** la liste des étudiant·e·s de l'édition 2027 dans le back-office, **When** l'administrateur l'ouvre, **Then** il voit, à côté du total des inscrit·e·s, le nombre d'entrées de chaque jour (« Jour 1 · ven. 12 : 1 204 entrées », « Jour 2 · sam. 13 : 987 entrées ») et, pour chaque ligne, l'heure d'entrée de chaque jour ou « — ».
4. **Given** la liste, **When** l'administrateur filtre sur « Présent·e le Jour 1 » ou « Absent·e le Jour 1 », **Then** seules les lignes correspondantes apparaissent ; le filtre se combine avec la recherche et le filtre par niveau, et le compteur indique le nombre de résultats.
5. **Given** la liste filtrée ou non, **When** l'administrateur exporte en CSV, **Then** le fichier contient, en plus des colonnes existantes, une colonne par jour de salon, intitulée avec le libellé et la date du jour (« Présent Jour 1 (12/03/2027) »), valant « Oui » ou « Non ».
6. **Given** une édition sans aucune entrée enregistrée (salon à venir), **When** l'administrateur ouvre la liste, **Then** les compteurs d'entrées affichent 0 et les colonnes de présence restent présentes dans l'export, à « Non ».
7. **Given** une inscription dont l'entrée a été enregistrée, **When** l'administrateur supprime cette inscription, **Then** ses entrées disparaissent aussi et les compteurs diminuent d'autant.
8. **Given** une édition archivée dont l'administrateur supprime les données personnelles (FR-065b de 006), **When** la suppression est faite, **Then** les entrées sont supprimées avec les inscriptions, et le nombre d'entrées de chaque jour est conservé dans les compteurs agrégés anonymes de l'édition.

---

### User Story 4 — Accueillir un·e étudiant·e non inscrit·e (Priority: P2)

Un·e étudiant·e se présente sans s'être inscrit·e. Une affiche à l'entrée porte un QR code vers le formulaire d'inscription public ; l'étudiant·e s'inscrit sur son téléphone, obtient son badge et le présente au contrôle. La page de contrôle rappelle cette adresse et peut afficher le QR code d'inscription à l'écran. Si la personne n'a pas de connexion ou pas de smartphone, un membre de l'équipe l'inscrit lui-même depuis la page de contrôle, avec les trois mêmes champs, et valide son entrée dans la foulée.

**Why this priority**: Évite de refuser des visiteurs venus au salon, sans créer de file d'attente au contrôle : la plupart s'inscrivent seuls, l'équipe ne prend en charge que les cas sans connexion. Le contrôle des inscrit·e·s (P1) fonctionne sans cette story.

**Independent Test**: Un jour de salon, depuis la page de contrôle, afficher le QR code d'inscription et le scanner avec un autre téléphone : le formulaire public s'ouvre. Puis inscrire « Traoré Awa », « 05 01 02 03 04 », « BTS / DUT (Bac+2) » depuis la page de contrôle : l'écran vert s'affiche avec son nouveau numéro de badge, l'entrée du jour est comptée, et l'inscription apparaît dans le back-office marquée « sur place ».

**Acceptance Scenarios**:

1. **Given** la page de contrôle, **When** l'administrateur touche « Pas de badge ? », **Then** l'écran affiche l'adresse courte du formulaire d'inscription étudiant et son QR code en grand, à faire scanner par l'étudiant·e, ainsi que le bouton « Inscrire la personne ».
2. **Given** l'administrateur, depuis la page de contrôle, **When** il ouvre « Affiche d'inscription », **Then** il obtient une page imprimable au format A4 avec le titre « Pas encore inscrit·e ? », le QR code et l'adresse courte du formulaire.
3. **Given** un jour de salon avec du réseau, **When** l'administrateur touche « Inscrire la personne », saisit « Traoré Awa », « 05 01 02 03 04 », « BTS / DUT (Bac+2) », coche « La personne a été informée de l'usage de ses données » et touche « Inscrire et valider l'entrée », **Then** l'inscription est créée avec le numéro de badge suivant de l'édition (ex. SALM27-004822), l'écran vert « ENTRÉE VALIDÉE » affiche son nom, son niveau et ce numéro, et l'entrée du jour est enregistrée.
4. **Given** le résultat d'une inscription sur place, **When** il s'affiche, **Then** il rappelle à l'équipe de communiquer le numéro de badge à la personne et indique que le badge se récupère plus tard sur `/salm` avec son nom et son téléphone ; le lendemain, la saisie manuelle par badge ou téléphone suffit à la retrouver.
5. **Given** le numéro « 05 01 02 03 04 » est déjà inscrit à l'édition, **When** l'administrateur tente de l'inscrire sur place, **Then** aucune inscription n'est créée et la fiche existante s'affiche (nom, niveau, numéro de badge, état du jour), avec « Valider l'entrée » si la personne n'est pas encore entrée.
6. **Given** un nom invalide, un téléphone non ivoirien ou un niveau manquant, **When** l'administrateur valide, **Then** chaque erreur s'affiche sous son champ avec les messages du formulaire public, et rien n'est créé.
7. **Given** le téléphone est hors ligne, **When** l'administrateur touche « Inscrire la personne », **Then** le message « Inscription sur place indisponible hors ligne : réessayez au retour du réseau » s'affiche ; l'adresse et le QR code d'inscription restent affichés.
8. **Given** la page de contrôle en mode essai (pas de jour de salon aujourd'hui), **When** l'administrateur l'ouvre, **Then** l'inscription par l'équipe n'est pas proposée ; l'adresse et le QR code d'inscription le sont.
9. **Given** la liste des étudiant·e·s du back-office, **When** l'administrateur la consulte ou l'exporte, **Then** les inscriptions faites par l'équipe sont marquées « Sur place », et l'export contient une colonne « Origine » (« En ligne » ou « Sur place »).

---

### Edge Cases

- **Scan hors jour de salon** (répétition la veille, test au bureau) : la page fonctionne en **mode essai**, signalé par un bandeau permanent « Aucun jour de salon aujourd'hui : mode essai, aucune entrée n'est enregistrée ». Les résultats (valide, invalide, autre édition) s'affichent normalement, avec « VALIDE (ESSAI) » au lieu de « ENTRÉE VALIDÉE » ; rien n'est enregistré et les compteurs ne bougent pas.
- **Scan avant l'ouverture ou après la fermeture** le jour même : l'entrée est enregistrée pour ce jour ; les horaires d'ouverture ne limitent pas le contrôle (arrivées avant 9h30, installation).
- **Aucune édition publiée** : la page de contrôle indique « Aucune édition SALM publiée : rien à contrôler » et n'active pas l'appareil photo.
- **Badge d'une édition archivée ou en brouillon** : traité comme « Badge d'une autre édition » ; seule l'édition publiée est contrôlée.
- **Badge émis puis dates de l'édition modifiées** (badge imprimé portant d'anciennes dates) : le badge reste valide ; seul son identifiant de vérification compte.
- **Badge photocopié ou capture d'écran partagée** : le premier passage est validé, les suivants affichent « DÉJÀ ENTRÉ·E AUJOURD'HUI » avec le nom enregistré, ce qui permet à l'équipe de vérifier l'identité de la personne.
- **Sortie puis retour dans la journée** : le badge affiche « DÉJÀ ENTRÉ·E AUJOURD'HUI » avec l'heure du premier passage ; c'est un avertissement, pas un refus : l'équipe décide de laisser repasser la personne. Aucune entrée supplémentaire n'est comptée.
- **Même QR code lu en boucle** (badge laissé devant l'objectif) : ignoré pendant 5 secondes après son dernier résultat (scénario US1-8).
- **QR code abîmé mais partiellement lisible** : soit la lecture échoue (l'appareil continue de chercher), soit elle aboutit à un identifiant inconnu (« Badge invalide ») ; jamais d'entrée enregistrée pour un autre badge.
- **URL de vérification d'un autre domaine ou d'un environnement de test** : seul l'identifiant de vérification est pris en compte ; s'il est inconnu, « Badge invalide ».
- **Inscription supprimée entre deux scans** : le scan suivant indique « Badge invalide » en ligne ; hors ligne, le badge reste accepté jusqu'au prochain préchargement, et l'entrée est ignorée à la synchronisation (FR-235).
- **Badge validé deux fois pendant une coupure** sur deux téléphones différents : les deux écrans affichent « ENTRÉE VALIDÉE » ; une seule entrée est comptée, à l'heure la plus ancienne (FR-235, FR-236).
- **Réseau lent mais pas coupé** : au-delà de 3 secondes sans réponse, le résultat est établi hors ligne et l'entrée est mise en attente d'envoi (FR-233).
- **Compteurs hors ligne** : ils affichent le dernier total connu plus les entrées en attente du téléphone, marqués « hors ligne » ; ils redeviennent exacts à la synchronisation.
- **Téléphone éteint ou page fermée avec des entrées en attente** : les entrées restent sur le téléphone et partent à la prochaine ouverture de la page avec du réseau (FR-234).
- **Déconnexion demandée avec des entrées en attente** : un avertissement indique leur nombre et propose d'attendre le réseau ; la déconnexion confirmée les perd (FR-238).
- **Annulation d'une entrée par erreur** : l'annulation n'est proposée qu'après confirmation et seulement pour l'entrée du jour en cours ; les entrées des jours passés ne se modifient pas depuis la page de contrôle.
- **Session admin expirée pendant le contrôle** : le prochain scan affiche « Session expirée : reconnectez-vous » au lieu d'un résultat ; après connexion, l'administrateur revient sur la page de contrôle. Aucun résultat n'est affiché à tort.
- **Téléphone qui passe en veille** : l'écran reste allumé tant que la page de contrôle est ouverte et visible, lorsque l'appareil le permet ; au retour de veille, l'appareil photo reprend sans recharger la page.
- **Faible luminosité ou reflets** (écran de téléphone présenté en plein soleil) : l'invite rappelle de monter la luminosité de l'écran présenté ou de passer en saisie manuelle.
- **Mode maintenance du site actif** : la page de contrôle reste accessible aux administrateurs connectés, comme le reste de l'admin.
- **Deux inscriptions de la même personne** (numéros de téléphone différents) : chacune a son badge ; chaque badge compte pour lui-même. Le dédoublonnage reste une action du back-office (FR-065 de 006).
- **Recherche manuelle d'un téléphone inscrit à une autre édition seulement** : « Aucun inscrit avec ce numéro pour le SALM 2027 ».
- **Établissement ou exposant** qui présente un QR code quelconque : « Ce QR code n'est pas un badge SALM » ; les exposants sont pointés à l'accueil exposants (hors périmètre).
- **Badge d'une édition passée ouvert par son titulaire** (non connecté) : la page présente l'édition publiée, comme pour tout autre QR code ; elle ne dit pas que ce badge est d'une autre édition (FR-222).
- **Étudiant·e qui veut vérifier son badge avant de venir** : la page publique ne le permet plus ; en cas de doute, il ou elle récupère son badge sur `/salm` avec son nom et son téléphone (FR-025 de 006), ce qui confirme l'inscription.
- **Changement de jour à minuit** (page restée ouverte) : le jour contrôlé et les compteurs suivent la date d'Abidjan sans recharger la page.

## Requirements *(mandatory)*

### Functional Requirements

#### Accès et page de contrôle

- **FR-200**: La page de contrôle d'entrée et toutes les données qu'elle utilise MUST être réservées aux administrateurs connectés ; un visiteur non connecté est renvoyé vers la connexion puis ramené à la page de contrôle, et le serveur refuse toute requête de contrôle sans session admin.
- **FR-201**: La section « SALM » du menu admin MUST proposer une entrée « Contrôle d'entrée ». La page MUST aussi pouvoir être ouverte directement par une adresse courte et stable, à mettre en favori sur les téléphones de l'équipe.
- **FR-202**: La page de contrôle MUST porter sur l'**édition publiée**. Le **jour contrôlé** est le jour de salon de cette édition dont la date est la date du jour à Abidjan ; il est affiché en tête (« Jour 1 · ven. 12 mars »). S'il n'y en a pas, la page passe en mode essai (FR-212).
- **FR-203**: La page MUST être conçue d'abord pour un écran de 390 px tenu d'une main : aucun défilement horizontal, commandes principales (saisie manuelle, retour au scan, annuler) dans la moitié basse de l'écran, zones tactiles d'au moins 48 × 48 px, aucun geste de précision requis.
- **FR-204**: La page MUST rester accessible aux administrateurs quand le mode maintenance du site est actif.

#### Scan et résultats

- **FR-204a**: Le contrôle MUST fonctionner sur un nombre quelconque de téléphones en parallèle (au moins 1, sans maximum), connectés chacun avec la session admin, sur les navigateurs à jour d'Android et d'iPhone ; aucun poste n'a de rôle particulier et aucun enregistrement préalable des téléphones n'est demandé.
- **FR-205**: La page MUST lire les QR codes avec l'appareil photo arrière du téléphone, en continu, sans action entre deux badges, que le badge soit imprimé ou affiché sur un écran.
- **FR-206**: Seul l'identifiant de vérification contenu dans l'URL lue MUST être utilisé pour identifier le badge ; tout contenu dont on ne peut pas extraire un identifiant au format attendu est « Ce QR code n'est pas un badge SALM ».
- **FR-207**: Chaque lecture MUST aboutir à exactement un des résultats suivants :
  - **Entrée validée** (vert) : badge d'une inscription de l'édition contrôlée, pas encore entré·e le jour contrôlé. Affiche nom et prénoms (en majuscules), niveau d'étude, numéro de badge. L'entrée est enregistrée.
  - **Déjà entré·e aujourd'hui** (ambre) : même badge déjà entré le jour contrôlé. Affiche l'heure du premier passage (« à 09h42 »), le nom, le niveau et le numéro. Rien n'est enregistré.
  - **Badge refusé** (rouge), avec l'un des motifs : « Badge d'une autre édition (SALM <année>) », « Badge invalide » (identifiant inconnu, inscription supprimée, données de l'édition supprimées), « Ce QR code n'est pas un badge SALM ». Aucune donnée personnelle n'est affichée. Rien n'est enregistré.
  - **Non vérifié** (neutre) : le badge n'a pu être contrôlé ni en ligne ni hors ligne (liste jamais préchargée sur ce téléphone, badge absent de la liste préchargée alors que le réseau manque, session expirée). Le motif et une action (« Réessayer », « Se reconnecter ») sont affichés. Ce résultat MUST NOT ressembler à un des trois précédents.

  Hors ligne, les trois premiers résultats sont établis à partir de la liste préchargée (FR-232) et s'affichent de la même façon qu'en ligne.
- **FR-208**: Le résultat MUST être lisible à bout de bras en plein soleil : fond de couleur pleine sur la majeure partie de l'écran ; mot d'état en capitales d'au moins 40 px ; nom d'au moins 28 px, affiché en entier (retour à la ligne, jamais tronqué) ; contraste texte / fond d'au moins 7:1 ; chaque état porte aussi une icône et un mot distincts, pour ne jamais dépendre de la seule couleur.
- **FR-209**: Chaque résultat MUST être accompagné d'un retour non visuel propre à son état (motif de vibration, et son facultatif désactivable) lorsque l'appareil le permet.
- **FR-210**: Le même QR code relu dans les 5 secondes qui suivent l'affichage de son résultat MUST être ignoré ; un QR code différent est traité immédiatement et remplace le résultat affiché.
- **FR-211**: Le résultat MUST s'afficher en moins d'une seconde après la lecture du QR code, sur une connexion mobile 4G courante.
- **FR-212**: **Mode essai** : quand aucun jour de salon de l'édition publiée ne tombe à la date du jour, la page MUST fonctionner normalement mais n'enregistrer aucune entrée ; un bandeau permanent l'indique, et le résultat positif s'intitule « VALIDE (ESSAI) ».
- **FR-213**: Si l'appareil photo est refusé ou indisponible, la page MUST l'expliquer (comment l'autoriser) et ouvrir la saisie manuelle.
- **FR-214**: L'écran MUST rester allumé tant que la page de contrôle est ouverte et visible, lorsque l'appareil le permet, et la lecture MUST reprendre d'elle-même au retour de veille ou d'une autre application.

#### Règle d'unicité et annulation

- **FR-215**: Le contrôle MUST porter uniquement sur l'entrée du salon : il n'existe qu'un seul point de contrôle, sans choix de salle ni de créneau. Un badge MUST compter au plus une entrée par jour de salon, y compris lorsque plusieurs téléphones le contrôlent simultanément. L'heure enregistrée est celle du premier passage validé.
- **FR-216**: Chaque entrée MUST conserver : l'inscription concernée, le jour de salon, l'heure du passage, le mode (scan ou saisie manuelle) et le fait qu'elle a été enregistrée hors ligne. Aucun identifiant de l'appareil ni de la personne qui contrôle n'est enregistré.
- **FR-217**: L'administrateur MUST pouvoir annuler, après confirmation, l'entrée du jour contrôlé d'un badge, depuis le résultat qui vient de s'afficher ou depuis la fiche de la saisie manuelle. L'annulation supprime l'entrée : un nouveau passage sera de nouveau « Entrée validée ». Les entrées d'un autre jour ne sont pas modifiables depuis la page de contrôle.

#### Saisie manuelle

- **FR-218**: La page de contrôle MUST proposer, à tout moment et en un geste, une saisie manuelle à champ unique « Numéro de badge ou téléphone », avec le clavier numérique.
- **FR-219**: La recherche MUST reconnaître : un numéro de badge complet (« SALM27-000482 », sans tenir compte des majuscules, espaces et tirets), ou sa seule partie numérique avec ou sans zéros (« 482 », « 000482 ») ; un numéro de téléphone ivoirien dans tous les formats acceptés à l'inscription (FR-021 de 006). Elle ne porte que sur l'édition contrôlée et renvoie au plus une inscription (correspondance exacte, pas de recherche partielle).
- **FR-220**: Une recherche aboutie MUST afficher la fiche de l'inscrit·e (nom, niveau, numéro de badge, état du jour avec l'heure d'entrée éventuelle) et proposer « Valider l'entrée » si la personne n'est pas encore entrée ce jour. L'entrée n'est enregistrée qu'après ce geste, avec les mêmes règles et le même écran de résultat qu'un scan.
- **FR-221**: Une recherche sans résultat MUST afficher « Aucun inscrit avec ce numéro pour le SALM <année> », sans indiquer si le numéro existe dans une autre édition ; une saisie mal formée MUST afficher les formats attendus.

#### Fonctionnement hors ligne

- **FR-232**: Tant qu'elle a du réseau, la page de contrôle MUST précharger sur le téléphone, puis tenir à jour au moins toutes les 5 minutes, la liste des badges valides de l'édition publiée (identifiant de vérification, numéro de badge, nom et prénoms, niveau d'étude) et les entrées déjà enregistrées pour chaque jour de salon. Le numéro de téléphone des inscrit·e·s n'est jamais préchargé. L'écran indique l'heure du dernier préchargement.
- **FR-233**: Sans réseau, ou quand le serveur ne répond pas dans un délai de 3 secondes, la page MUST contrôler les badges à partir de la liste préchargée, avec les mêmes résultats et les mêmes écrans qu'en ligne, et afficher en permanence l'indicateur « HORS LIGNE » avec le nombre d'entrées en attente d'envoi. Un badge absent de la liste préchargée donne le résultat « Non vérifié » (FR-207).
- **FR-234**: Hors ligne, les entrées validées (scan ou saisie manuelle) MUST être conservées sur le téléphone avec l'heure du scan, y compris si la page est fermée ou le téléphone redémarré, puis envoyées automatiquement dès le retour du réseau, sans action de l'administrateur.
- **FR-235**: À la réception d'entrées différées, le serveur MUST appliquer la règle d'une entrée par badge et par jour en retenant l'heure de passage la plus ancienne. Une entrée différée dont l'inscription a été supprimée entre-temps est ignorée.
- **FR-236**: Hors ligne, « Déjà entré·e aujourd'hui » MUST être établi à partir des entrées connues du téléphone (celles du dernier préchargement et celles qu'il a lui-même enregistrées) ; un badge validé sur un autre téléphone depuis la coupure peut donc être validé une seconde fois, et n'est compté qu'une fois à la synchronisation (FR-235).
- **FR-237**: Hors ligne, la saisie manuelle MUST fonctionner par numéro de badge ; la recherche par téléphone n'est disponible qu'en ligne, et la page l'indique. L'annulation d'une entrée encore en attente d'envoi la retire de la file ; l'annulation d'une entrée déjà envoyée exige le réseau.
- **FR-238**: La page MUST avertir avant la déconnexion, ou avant la fermeture de la page si l'appareil le permet, quand des entrées sont encore en attente d'envoi.
- **FR-239**: La liste préchargée et les entrées déjà envoyées MUST être effacées du téléphone : à la déconnexion de l'administrateur ; à la fin du dernier jour de salon de l'édition si la page de contrôle est ouverte à ce moment ; sinon, à la première ouverture de la page ou de l'admin qui suit la fin du salon, avant tout affichage. Les entrées encore en attente d'envoi sont d'abord synchronisées si le réseau le permet. Ces données ne sont utilisables que depuis la page de contrôle.

#### Accueil des non-inscrit·e·s

- **FR-240**: La page de contrôle MUST proposer en un geste « Pas de badge ? », qui affiche l'adresse courte du formulaire d'inscription étudiant public et son QR code, assez grand pour être scanné depuis l'écran du téléphone de l'équipe.
- **FR-241**: La page de contrôle MUST donner accès à une affiche d'inscription imprimable au format A4 (titre « Pas encore inscrit·e ? », QR code et adresse courte du formulaire), à placer à l'entrée.
- **FR-242**: Les jours de salon, avec du réseau, l'administrateur MUST pouvoir inscrire une personne depuis la page de contrôle, avec les trois champs et les règles de validation du formulaire public (FR-020 à FR-022 de 006). L'inscription suit les règles d'unicité et de numérotation de la feature A (FR-025, FR-026 de 006) et reçoit un badge et un identifiant de vérification comme une inscription en ligne. Les protections anti-robot du formulaire public ne s'appliquent pas à cette action réservée aux administrateurs.
- **FR-243**: L'inscription par l'équipe MUST exiger que l'administrateur coche « La personne a été informée de l'usage de ses données », sous le texte de la mention d'usage étudiante (FR-024 de 006) affiché dans le formulaire.
- **FR-244**: Une inscription par l'équipe MUST valider l'entrée du jour dans le même geste (« Inscrire et valider l'entrée ») et afficher l'écran « Entrée validée » avec le nouveau numéro de badge, en rappelant de le communiquer à la personne et que le badge se récupère sur `/salm` avec le nom et le téléphone.
- **FR-245**: Si le téléphone saisi est déjà inscrit à l'édition, l'inscription par l'équipe MUST ne rien créer ni modifier, et afficher la fiche existante comme la saisie manuelle (FR-220).
- **FR-246**: L'inscription par l'équipe MUST être disponible uniquement un jour de salon de l'édition publiée, en ligne, et quel que soit l'état de l'interrupteur des inscriptions étudiantes publiques ; elle n'est pas proposée en mode essai ni hors ligne.
- **FR-247**: Chaque inscription étudiante MUST indiquer son origine : « En ligne » (formulaire public) ou « Sur place » (équipe). La liste des étudiant·e·s du back-office l'affiche, et l'export CSV contient une colonne « Origine ».

#### URL de vérification

- **FR-222**: Pour tout visiteur non connecté, l'URL de vérification encodée dans le QR code MUST afficher une page d'information identique quel que soit l'identifiant qu'elle contient (badge valide, supprimé, d'une autre édition ou inconnu) : « Ce QR code est un badge du SALM <année>. Présentez-le à l'entrée », les dates et horaires de chaque jour et le lieu de l'**édition publiée**, et un lien vers `/salm`. Sans édition publiée, elle affiche « La prochaine édition du SALM sera bientôt annoncée » et le lien vers `/salm`. Ni la page, ni ses données, ni la réponse du serveur (contenu, code de statut) ne révèlent la validité du badge ni aucune donnée personnelle. Cette exigence remplace FR-028 de 006.
- **FR-222a**: L'URL de vérification MUST NOT enregistrer d'entrée, quel que soit le visiteur.
- **FR-223**: Quand un administrateur connecté ouvre l'URL de vérification, la page MUST afficher en plus la validité du badge, avec les mêmes états que la page de contrôle (valide, badge d'une autre édition, badge invalide), et, pour un badge de l'édition publiée, un bouton « Contrôler ce badge » qui ouvre sa fiche sur la page de contrôle (FR-220), sans enregistrer d'entrée. Pour un visiteur non connecté, ni ces informations ni ce bouton ni aucun indice de leur existence ne sont présents.

#### Suivi des entrées

- **FR-224**: La page de contrôle MUST afficher en permanence le nombre d'entrées du jour contrôlé (en grand) et celui de chaque autre jour de salon de l'édition (en plus petit). Ces compteurs se mettent à jour après chaque entrée ou annulation faite sur le téléphone, et au plus tard 30 secondes après une entrée faite sur un autre téléphone (hors ligne : dernier total connu plus les entrées en attente, marqué « hors ligne »).
- **FR-225**: La liste des étudiant·e·s du back-office (feature A) MUST afficher, pour l'édition consultée, le nombre d'entrées de chaque jour de salon, et pour chaque inscrit·e l'heure d'entrée de chaque jour ou « — ».
- **FR-226**: La liste des étudiant·e·s MUST proposer un filtre par présence pour chaque jour de salon (« Présent·e le Jour N », « Absent·e le Jour N »), combinable avec la recherche et le filtre par niveau ; le compteur de résultats en tient compte.
- **FR-227**: L'export CSV des étudiant·e·s MUST contenir, en plus des colonnes existantes et pour chaque jour de salon de l'édition, une colonne « Présent <libellé du jour> (<JJ/MM/AAAA>) » valant « Oui » ou « Non ». Il respecte la recherche et les filtres courants, présence comprise.
- **FR-228**: La suppression d'une inscription (FR-065 de 006) MUST supprimer ses entrées. La suppression des données personnelles d'une édition (FR-065b de 006) MUST supprimer toutes ses entrées et conserver, dans les compteurs agrégés anonymes de l'édition, le nombre d'entrées de chaque jour de salon.

#### Protection et données personnelles

- **FR-229**: Aucune donnée personnelle (nom, téléphone, niveau, numéro de badge, heure d'entrée) MUST être accessible sans session admin, que ce soit par l'URL de vérification, la page de contrôle ou ses données.
- **FR-230**: Les réponses de contrôle et la liste préchargée MUST NOT contenir le téléphone de l'inscrit·e ; la page de contrôle n'affiche que le nom, le niveau, le numéro de badge et l'état du jour. La recherche par téléphone (en ligne) renvoie la fiche sans renvoyer le numéro.
- **FR-231**: Toute l'interface MUST être en français avec accents, au vouvoiement pour l'équipe ; les libellés d'état et les messages sont ceux de cette spec.

### Key Entities *(include if feature involves data)*

- **Entrée** (nouvelle) : passage validé d'un badge un jour de salon. Inscription étudiante, jour de salon, heure du passage (heure du scan, y compris pour une entrée envoyée plus tard), mode (scan ou saisie manuelle), enregistrée hors ligne ou non. Au plus une par inscription et par jour. Supprimée avec l'inscription, avec le jour de salon, et lors de la suppression des données personnelles de l'édition. C'est la table de présences que la feature A a prévue (FR-005 de 006).
- **Inscription étudiante** (existante, feature A) : identifiée au contrôle par son identifiant de vérification (scan), son numéro de badge ou son téléphone (saisie manuelle). Nouvel attribut : origine (« En ligne » ou « Sur place »), « En ligne » pour les inscriptions existantes.
- **Jour de salon** (existant) : détermine le jour contrôlé et les colonnes de présence.
- **Édition** (existante) : seule l'édition publiée est contrôlée ; ses compteurs agrégés conservés après suppression des données personnelles s'enrichissent du nombre d'entrées par jour.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un membre de l'équipe contrôle un badge (présentation du QR code, lecture, résultat affiché) en moins de 3 secondes, et au moins 15 badges par minute sur un même téléphone en continu.
- **SC-002**: 100 % des badges générés par la feature A, imprimés à 100 % ou affichés sur un téléphone à luminosité moyenne, sont lus du premier coup par la page de contrôle sur un téléphone Android et un iPhone courants.
- **SC-003**: 0 entrée comptée en double pour un même badge et un même jour, quel que soit le nombre de téléphones qui contrôlent en même temps (recette faite avec au moins 6 téléphones, Android et iPhone mélangés, dont 2 qui scannent le même badge au même instant).
- **SC-004**: 0 donnée personnelle, et 0 indication de validité d'un badge, obtenue en ouvrant une URL de vérification, ou en interrogeant les données du contrôle, sans être connecté : les réponses pour un badge valide et pour un jeton inventé sont identiques.
- **SC-005**: Un résultat « Entrée validée » n'est jamais affiché sans que l'entrée soit effectivement enregistrée, sur le serveur ou dans la file d'attente du téléphone (hors mode essai) ; 0 entrée enregistrée hors ligne n'est perdue.
- **SC-005a**: Une coupure de réseau de 30 minutes n'interrompt pas le contrôle d'un téléphone préchargé, et 100 % des entrées faites pendant la coupure apparaissent dans le back-office au plus tard 1 minute après le retour du réseau.
- **SC-006**: Les trois états de résultat sont distingués sans erreur par 5 personnes sur 5, à bout de bras, en extérieur en plein jour, en moins d'une seconde.
- **SC-007**: Un·e inscrit·e dont le QR code est illisible est retrouvé·e et son entrée validée en moins de 15 secondes par la saisie manuelle.
- **SC-008**: Le nombre d'entrées de chaque jour affiché sur la page de contrôle, dans le back-office et obtenu en comptant les « Oui » de l'export CSV est identique.
- **SC-009**: Tout le parcours de contrôle (scan, saisie manuelle, annulation) se réalise d'une seule main sur un écran de 390 px, sans défilement horizontal.

## Assumptions

- **Postes et appareils de l'équipe** (clarification 2026-09-28) : au moins 1 poste de contrôle, sans nombre maximal fixé ; chaque poste est le smartphone personnel d'un membre de l'équipe, Android ou iPhone, avec un navigateur à jour. Pas d'application à installer, pas de lecteur de code-barres dédié, pas de téléphone fourni par l'organisateur. Les tests de recette couvrent au moins un Android et un iPhone.
- **HTTPS** : le site est servi en HTTPS le jour du salon (l'accès à l'appareil photo depuis le navigateur l'exige) ; la commande de mise en place du certificat existe déjà dans le script de déploiement.
- **Réseau** (clarification 2026-09-28) : la connexion du lieu n'est pas jugée fiable. Le contrôle fonctionne hors ligne à partir d'une liste préchargée (FR-232 à FR-239). Chaque téléphone doit avoir ouvert la page de contrôle avec du réseau au moins une fois avant l'ouverture des portes, idéalement le matin même.
- **Données sur les téléphones personnels** : la liste préchargée contient le nom, le niveau et le numéro de badge des inscrit·e·s de l'édition (jamais leur téléphone). Ce risque est accepté pour garantir la continuité du contrôle ; il est limité par l'effacement à la déconnexion et à la fin du salon (FR-239). Un téléphone perdu pendant le salon n'est pas effacé à distance.
- **Heure des entrées hors ligne** : c'est l'heure du téléphone au moment du scan ; les téléphones de l'équipe sont supposés à l'heure (réglage automatique).
- **Session admin** : la connexion existante (mot de passe partagé) est réutilisée ; la session dure au moins une journée de salon sur un téléphone qui reste ouvert. Chaque membre de l'équipe se connecte sur son propre téléphone.
- **Pas d'identification du contrôleur** : faute de comptes nominatifs, les entrées n'indiquent pas qui les a enregistrées (FR-216).
- **Jour contrôlé** : la date du jour à Abidjan (UTC+0). Les horaires d'ouverture ne bornent pas le contrôle ; seul le jour compte.
- **« Déjà entré·e » = avertissement** : l'équipe décide de laisser repasser une personne sortie puis revenue ; le système ne bloque rien, il informe.
- **Nom affiché en cas de doublon** : le nom est affiché aussi sur le résultat « déjà entré·e » pour permettre à l'équipe de repérer un badge copié ou partagé ; ce résultat n'est visible que d'un administrateur connecté.
- **Vérification d'identité** : aucune pièce d'identité n'est exigée par le système ; l'équipe compare le nom affiché si elle le juge utile.
- **Annulation** : destinée aux erreurs de manipulation immédiates (mauvais badge, mauvaise fiche) ; aucune modification des entrées passées dans cette feature.
- **Colonne « présent » de l'export** : « Oui » / « Non » pour rester filtrable dans un tableur ; l'heure d'entrée est visible dans la liste du back-office, pas dans l'export.
- **Statistiques** : les entrées ne sont pas ajoutées à la vue « SALM › Statistiques » de la feature B dans cette feature ; les compteurs par jour de la liste des inscrit·e·s suffisent au pilotage.
- **Conservation** : les entrées sont des données personnelles rattachées aux inscriptions et suivent la même règle de 12 mois au plus (D5 de 006).

## Hors périmètre

- Inscription sur place hors ligne (l'inscription par l'équipe exige le réseau, FR-246), et inscription sur place des établissements ou des exposants.
- Contrôle des établissements et des exposants (pointage sur la liste nominative exportée, FR-047 et FR-068a de 006).
- Comptage des sorties, jauge de présence instantanée dans le salon, contrôle d'accès ou comptage de fréquentation des salles et des créneaux du chronogramme (panels, présentations), en accès libre une fois dans le salon (clarification 2026-09-28).
- Comptes nominatifs de contrôleurs, journal de qui a contrôlé quoi.
- Application mobile native, lecteurs de code-barres dédiés, impression sur place de badges (la personne inscrite sur place repart avec son numéro de badge, pas avec un badge imprimé).
- Ajout des entrées à la vue « SALM › Statistiques » et à l'encart du tableau de bord (feature B).
- Envoi de messages aux inscrit·e·s (rappel, confirmation de présence).
