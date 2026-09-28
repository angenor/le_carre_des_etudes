# Quickstart — vérification manuelle du module SALM (2/3)

Aucun test runner n'est configuré (constitution) : la feature est validée par ces scénarios manuels. Les références renvoient à [spec.md](./spec.md), [contracts/](./contracts/) et [data-model.md](./data-model.md).

## Pré-requis et mise en place

```bash
pnpm install                 # aucune nouvelle dépendance
pnpm prisma migrate dev      # aucune nouvelle migration : doit indiquer « Already in sync »
pnpm prisma db seed          # base neuve : crée 2026 (archivée) et 2027 (publiée)
pnpm dev                     # http://localhost:3000
```

- Admin : `/admin/login` avec `ADMIN_PASSWORD` (`.env`).
- Fichiers de test à préparer :
  - 20 photos JPEG de 1 à 4 Mo ;
  - une image de plus de 5 Mo ;
  - un fichier `.heic` ;
  - un fichier texte renommé en `faux.jpg` ;
  - un PDF de moins de 10 Mo.
- Requête SQL utile :

```bash
sqlite3 dev.db "select year, status from SalmEdition order by year;"
```

## Scénario 0 — Seed en création seule (research R12)

1. Modifier la `tagline` 2027 dans le back-office (scénario 2), puis lancer `pnpm prisma db seed`.
2. Attendu :
   - la sortie indique « SALM 2026 déjà présent : ignoré » et « SALM 2027 déjà présent : ignoré » ;
   - la `tagline` modifiée est **conservée** ;
   - les identifiants des temps forts sont inchangés (`sqlite3 dev.db "select id from SalmHighlight"` avant et après).

## Scénario 1 — Éditions (US1)

1. **Menu** : l'entrée « SALM » affiche les sous-entrées « Inscriptions », « Éditions » et « Statistiques » ; la sous-entrée active porte `aria-current="page"`.
2. **Liste** (`/admin/salm/editions`) : 2027 « Publiée », puis 2026 « Archivée », avec dates, lieu (« Lieu à confirmer, Abidjan ») et compteurs (US1-1).
3. **Création** :
   - créer **2028** : la fiche s'ouvre ; statut Brouillon ; intitulé, organisateur et ville préremplis ; `/salm` affiche toujours 2027 (US1-2) ;
   - recréer 2028 : « Une édition 2028 existe déjà. » (US1-3).
4. **Modification** : saisir un lieu et un slogan, puis « Enregistrer » ; le bandeau de succès apparaît (US1-4).
5. **Publication sans jour** : « Publier » sur 2028 est refusé avec « Ajoutez au moins un jour au chronogramme avant de publier. » (US1-5).
6. **Aperçu** :
   - ajouter un jour (scénario 3) ;
   - « Prévisualiser » : bandeau « Aperçu — cette édition n'est pas publiée », sections identiques à `/salm`, médias du canapé et des photos de 2027 si elle en a ;
   - cliquer sur « Étudiant·e : obtenir mon badge » : aucune navigation, message « Les inscriptions ne sont pas disponibles dans l'aperçu. » (US1-11) ;
   - le code source de la page contient `noindex` ;
   - en navigation privée (non connecté), l'URL de l'aperçu redirige vers `/admin/login` ;
   - `curl -s localhost:3000/api/admin/salm/editions/<id>/preview` renvoie 401 (US1-12).
7. **Publication** :
   - « Publier » sur 2028 : la confirmation mentionne l'archivage de 2027 ; « Annuler » ne change rien (US1-7) ;
   - confirmer : 2028 est Publiée, 2027 Archivée ; `/salm` et la navbar affichent 2028 **sans redémarrage** (US1-6) ;
   - `sqlite3 dev.db "select count(*) from SalmEdition where status='published'"` renvoie `1` ;
   - publications simultanées (SC-004) : avec le cookie de session copié depuis le navigateur, lancer en même temps `curl -X POST -b "<cookie>" localhost:3000/api/admin/salm/editions/<id 2027>/publish & curl -X POST -b "<cookie>" localhost:3000/api/admin/salm/editions/<id 2028>/publish & wait`, puis la même requête `count(*)` : elle renvoie toujours `1`.
8. **Republication** :
   - republier 2027 (son salon, en mars 2027, n'est pas terminé à la date du test, sinon passer à l'étape suivante) : 2027 Publiée, 2028 Archivée (US1-9) ;
   - pour une archive dont le salon est terminé (modifier le dernier jour de 2026 à une date passée si nécessaire) : « Publier » n'est pas proposé, et `curl -X POST …/publish` avec la session renvoie `409 EDITION_ENDED` (US1-10). 2026, qui n'a aucun jour, est considérée comme terminée : même résultat.
9. **Archivage de l'édition publiée** : après confirmation, `/salm` affiche « La prochaine édition du SALM sera bientôt annoncée. » et le lien disparaît de la navbar (US1-8). Republier 2027 ensuite.
10. **Suppression** : un brouillon sans inscription propose « Supprimer » ; 2027 ne le propose pas (US1-13, US1-14).
11. **Année verrouillée** : dans la fiche de 2027 (avec au moins une inscription de test), le champ Année est verrouillé avec l'explication « des badges SALM27 ont déjà été émis » (US1-15).

## Scénario 2 — Contenus (US2)

Sur l'édition publiée, vérifier chaque changement sur `/salm` (et sur le badge PDF quand il est concerné).

1. **Textes** : modifier le titre et le paragraphe « Pourquoi le SALM ? » et un public cible, puis réordonner les publics (US2-1).
2. **Affiche** :
   - JPEG de 3 Mo et texte alternatif : l'aperçu est remplacé, `/salm` l'affiche et `og:image` pointe vers `/uploads/salm/…` (US2-2) ;
   - image de plus de 5 Mo, `.heic`, `faux.jpg` et PDF envoyés comme image : chacun refusé avec le message des formats et du poids ; l'affiche précédente est conservée (US2-3) ;
   - `ls public/uploads/salm/` : aucun fichier refusé ne reste.
3. **PDF du programme** : le joindre fait apparaître « Télécharger le programme (PDF) » sur `/salm` ; le retirer le fait disparaître, et le fichier est supprimé de `public/uploads/salm/` (US2-4).
4. **Médias** (fiche 2027, section Médias) :
   - l'encadré indique que les médias produits en 2027 s'affichent en 2028, et que la page 2027 affiche ceux de 2026, avec un lien (US2-5, US2-8) ;
   - dans la fiche 2026, saisir comme vidéo récapitulative `https://youtu.be/<id>?si=abc` : miniature affichée, puis URL enregistrée `https://www.youtube.com/watch?v=<id>` ; « Revivre le SALM 2026 » la lit sur `/salm` (US2-6) ;
   - `https://vimeo.com/123`, `https://www.youtube.com/channel/UCxyz` et `https://exemple.com/?u=youtu.be/AAAAAAAAAAA` : refusés (US2-7).
5. **Contacts** :
   - ajouter `07 68 01 14 09`, le cocher « Imprimé sur le badge » et le placer en premier : il est stocké `+225 07 68 01 14 09`, affiché en premier dans l'appel final, et présent au verso d'un badge re-téléchargé (US2-9) ;
   - un e-mail `salm2027@` est refusé (US2-10) ;
   - cocher un second téléphone retire la marque du premier (US2-11).
6. **Temps forts** : ajouter « ATELIERS CV » avec photo et le placer en 2ᵉ position (US2-12) ; un temps fort sans photo est refusé (US2-13).
7. **Chronogramme** :
   - ajouter un jour avec fermeture ≤ ouverture : erreur liée au champ (US2-15) ;
   - ajouter « Exposition » 14:00–16:00 au jour contenant « PANEL 2 » 14:00–14:30 : enregistré, les deux créneaux portent « Chevauche : … » (US2-17) ;
   - 10:00–10:10 puis 10:10–10:30 : **aucun** chevauchement signalé (SC-008) ;
   - « Trier par heure » réordonne les créneaux (US2-20) ;
   - supprimer un jour : la confirmation annonce le nombre de créneaux (US2-19) ;
   - sur l'édition publiée, le dernier jour ne peut pas être supprimé (`409 LAST_DAY_OF_PUBLISHED`).
8. **Vidéos du canapé** (fiche 2026) :
   - ajouter 2 vidéos, dont une sans titre : `/salm` les affiche, avec « Vidéo 02 » pour celle sans titre (US2-21, US2-22) ;
   - rajouter la même vidéo : avertissement « Cette vidéo figure déjà dans la liste. ».
9. **Photos** (fiche 2026) :
   - sélectionner les 20 photos, plus l'image de plus de 5 Mo et le `.heic` : progression « Envoi N / 22 », 20 photos ajoutées, 2 refus listés avec leur raison (US2-23). Durée inférieure à 2 minutes (SC-006) ;
   - modifier une légende et un texte alternatif (US2-24) ;
   - monter une photo en 1ʳᵉ position : elle apparaît dans l'aperçu à 4 photos de `/salm` (US2-25) ;
   - la supprimer : elle disparaît, et son fichier disparaît de `public/uploads/salm/` (US2-26).
10. **Types de stands** :
    - ajouter « STAND ARGENT » avec tarif : proposé à l'étape 2 de `/salm/inscription-ecole` (US2-27) ;
    - inscrire un établissement de test sur « STAND OR » : sa suppression est indisponible (« Choisi par 1 établissement ») ; le masquer : il n'est plus proposé, et la fiche de l'établissement l'affiche toujours (US2-28, US2-29) ;
    - supprimer « STAND ARGENT » (jamais choisi) (US2-30) ;
    - renommer un type en « stand or » : refusé (US2-31) ;
    - masquer tous les types, inscriptions établissements ouvertes : avertissement FR-173.
11. **Clavier seul** (SC-011) : sur la section Temps forts, déplacer un élément avec Tab et Entrée sur « Descendre » ; le focus reste sur le bouton, et la nouvelle position est annoncée (lecteur d'écran ou panneau d'accessibilité).

## Scénario 3 — Duplication (US3)

1. Sur 2027 (avec des inscriptions de test, des médias en 2026 et une affiche), cliquer sur « Dupliquer vers 2028 » (après suppression du 2028 de test) et confirmer.
2. La fiche 2028 s'ouvre avec le message de US3-1. Vérifier (US3-2 à US3-4) :
   - mêmes textes, publics, contacts (marque du badge comprise), temps forts, stands (visibilité comprise), jours et créneaux ;
   - dates décalées : vendredi 12 mars 2027 → **vendredi 10 mars 2028** ;
   - lieu, affiche, PDF, vidéo récapitulative, vidéos et photos vides ;
   - `sqlite3 dev.db "select count(*) from SalmStudentRegistration where editionId=<id 2028>"` renvoie `0`, et `lastBadgeSeq = 0`.
3. Dupliquer à nouveau 2027 : « Une édition 2028 existe déjà. » (US3-5).
4. Dans 2028, remplacer la photo d'un temps fort : le temps fort de 2027 garde sa photo, et le fichier d'origine existe toujours (US3-6, FR-136).

## Scénario 4 — Statistiques (US4)

1. Créer quelques inscriptions de test sur 2027 (étudiant·e·s sur plusieurs niveaux ; établissements sur 2 stands et 3 statuts, dont une « Annulée » avec 2 exposants).
2. `/admin/salm/statistiques?edition=2027` :
   - totaux, graphique par jour avec cumul, 6 niveaux (dont ceux à 0) (US4-1) ;
   - stands (dont les types masqués) et statuts ; le compte des exposants **exclut** ceux de l'inscription annulée (US4-2).
3. **Comparaison** :
   - créer des inscriptions de test sur 2026, ou utiliser des `purgedStats` ;
   - chaque indicateur de 2027 affiche la valeur 2026 et l'écart (US4-3) ;
   - si les deux éditions ont des jours, les cumuls alignés sur J-n sont superposés (US4-4).
4. **Édition purgée** : archiver une édition de test terminée, la purger depuis l'en-tête des inscriptions, puis consulter ses statistiques : mêmes chiffres, avec la mention de conservation (US4-5).
5. **États vides** : une édition sans inscription affiche « Aucune inscription pour le SALM <année> » ; sans édition antérieure qui ait des données, aucune comparaison (US4-6, US4-7).
6. Aucune donnée personnelle dans `GET …/stats` (inspecter la réponse JSON) (US4-8).
7. **Tableau de bord** (`/admin`) : l'encart « SALM 2027 » affiche les deux totaux, l'écart et le lien ; après archivage de toutes les éditions, l'encart disparaît (US4-9).
8. **Performance** : `/admin/salm/statistiques` s'affiche en moins de 3 s avec 5 000 inscriptions (script d'insertion de test dans une copie de `dev.db`) (SC-010).

## Scénario 5 — Accès et non-régression

1. **Sans session** : `curl -s -o /dev/null -w "%{http_code}" -X PATCH localhost:3000/api/admin/salm/editions/2 -H 'content-type: application/json' -d '{"venue":"x"}'` renvoie `401`. Même chose pour `POST /api/upload`.
2. **Liste blanche** : `PATCH` d'une édition avec `{ "status": "published", "lastBadgeSeq": 0 }` et la session : aucun effet sur ces champs.
3. **Chemin arbitraire** : `POST …/photos` avec `{ "imagePath": "https://exemple.com/x.jpg" }` ou `"/uploads/salm/../../.env"` renvoie `400 VALIDATION`.
4. **Page `/salm` inchangée** : comparer le HTML rendu avant et après le refactor (`curl -s localhost:3000/salm > apres.html`, puis `diff` avec une capture prise sur `main`). Seuls des attributs techniques de Vue peuvent différer.
5. **Back-office des inscriptions** : listes, exports, interrupteurs et purge de la feature A fonctionnent toujours ; l'en-tête `SalmAdminHeader` affiche aussi 2028.
6. **Mode maintenance** actif : l'aperçu et les écrans d'administration SALM restent accessibles à l'administrateur.
7. **Autres uploads** : envoyer une couverture de magazine, catégorie `magazines`, fonctionne comme avant (image OG générée).

## Nettoyage manuel des fichiers orphelins (research R3)

Les fichiers envoyés puis jamais rattachés (formulaire abandonné) ne sont pas supprimés automatiquement. Pour les repérer :

```bash
# en production : ./deploy.sh connect, puis dans le conteneur
ls public/uploads/salm/ > fichiers.txt
sqlite3 /app/data/production.db "select posterPath from SalmEdition union select recapPosterPath from SalmEdition union select programPdfPath from SalmEdition union select imagePath from SalmHighlight union select imagePath from SalmPhoto union select thumbnailPath from SalmVideo;" > references.txt
```

Tout fichier de `fichiers.txt` absent de `references.txt` peut être supprimé.
