# Quickstart — vérification manuelle du module SALM (1/3)

Aucun test runner n'étant configuré (constitution), la feature est validée par ces scénarios manuels. Les références renvoient à [spec.md](./spec.md), [contracts/](./contracts/) et [data-model.md](./data-model.md).

## Pré-requis et mise en place

```bash
pnpm install                                   # ajoute pdf-lib, @pdf-lib/fontkit, qrcode, tsx
pnpm prisma migrate dev                        # applique la migration add_salm_module
pnpm prisma db seed                            # crée ou met à jour les éditions 2026 (archivée) et 2027 (publiée)
pnpm dev                                       # http://localhost:3000
```

- Relancer `pnpm prisma db seed` une seconde fois : **aucune erreur**, aucun doublon (jours, créneaux, stands), les inscriptions sont intactes (idempotence, research R8).
- Pour les scénarios vidéo : renseigner au moins une URL YouTube dans `prisma/seed/salm-data.ts` (vidéo récapitulative 2026 et une vidéo du canapé), puis relancer le seed.
- Admin : `/admin/login` avec `ADMIN_PASSWORD` (fichier `.env`).
- Téléphone de test Android ou iPhone sur le même réseau (`pnpm dev --host`) pour les QR codes et le mobile.

## Scénario 1 — Page publique `/salm` (US2)

1. Ouvrir n'importe quelle page du site : la navbar affiche **« SALM 2027 »** après « Résultats », et l'indicateur glissant la suit au survol. Le pied de page contient le lien.
2. Ouvrir `/salm` en 1440 px et comparer avec `page-desktop.dc.html` section par section. Ordre : hero, « Deux façons de participer », « Pourquoi le SALM ? », programme (5 temps forts), chronogramme (2 colonnes), canapé, photos, appel final.
3. Hero :
   - « OUVERTURE DANS N jours » est cohérent avec la date du jour ; le HTML rendu par le serveur (`curl -s localhost:3000/salm | grep -i ouverture`) ne contient **que** la date fixe ;
   - « Lieu à confirmer, Abidjan » s'affiche, jamais `[LIEU À CONFIRMER]` ;
   - la plage « 9h30 – 16h30 » est affichée.
4. Vidéo de fond (si une URL est renseignée) :
   - en ≥ 768 px, elle démarre sans son, en boucle ;
   - le bouton « Mettre la vidéo en pause » l'arrête et laisse l'image ;
   - avec `prefers-reduced-motion: reduce` (outils de dev, rendu), ou en 390 px : seule l'image est affichée.
5. « Revivre le SALM 2026 », au **clavier** (Tab, puis Entrée) :
   - la fenêtre s'ouvre et le focus est dans la fenêtre ;
   - Tab ne sort pas de la fenêtre ;
   - `Échap` ferme, le son s'arrête et le focus revient sur le bouton.
6. Chronogramme :
   - la ligne « Présentation du magazine Le Carré des Études » est en ambre ;
   - le chevauchement de 14h00 (Panel 2 et Exposition) s'affiche sans erreur.
7. Mobile (390 px), à comparer avec `page-mobile.dc.html` et la décision D3 :
   - **toutes** les sections sont présentes : affiche au-dessus du texte de « Pourquoi le SALM ? », temps forts en carrousel horizontal (glisser au doigt, flèches au clavier une fois le carrousel focalisé), photos en grille de 2 colonnes ;
   - la navbar existante affiche 6 liens dont « SALM 2027 », tous activables, sans défilement horizontal de la page ni nouveau menu (D2) ;
   - onglets « Jour 1 · ven. 12 » et « Jour 2 · sam. 13 », avec les flèches ←/→ entre onglets et un lecteur d'écran qui annonce « onglet, 1 sur 2 » ;
   - aucun défilement horizontal (FR-084).
8. Photos : « Voir tout le catalogue » ouvre la galerie, les flèches ← et → naviguent, `Échap` ferme.
9. Données pilotant la page (SC-007) :
   - modifier la `tagline` 2027 dans `salm-data.ts`, relancer le seed et recharger : le texte change sans aucune modification de code ;
   - passer l'édition 2027 en `draft` avec `pnpm prisma studio` : le lien navbar disparaît et `/salm` affiche le message d'attente (FR-019). Rétablir `published`.

## Scénario 2 — Inscription étudiante et badge (US1)

1. Depuis `/salm`, ouvrir « Étudiant·e : obtenir mon badge ». Taper « Kouassi Aya Marie » : l'aperçu affiche **KOUASSI AYA MARIE** à chaque frappe.
2. Valider le formulaire vide :
   - 3 erreurs, chacune sous son champ ;
   - le focus est sur « Nom & prénoms » ;
   - avec VoiceOver ou NVDA, l'erreur est annoncée (`aria-describedby`).
3. Téléphone `08 12 34 56 78` : « Commence par 01, 05, 07 ou 27, suivi de 8 chiffres. »
   - Nom « Kouassi 😀 », puis « K0uassi » : « Utilise seulement des lettres, espaces, traits d'union, apostrophes et points. » ; le champ n'accepte pas plus de 60 caractères.
   - Visuel (D1, D4) : fond clair, colonne orange à gauche, aperçu du badge à droite. Bordure des champs #8A847F au repos, #D5570B au focus (outil de contraste : ≥ 3:1).
   - La mention d'usage est affichée avec la durée de 12 mois.
4. Saisir `+225 07 12 34 56 78` et « Licence (Bac+3) », puis envoyer :
   - écran **« Félicitations, ton badge est prêt ! »** avec le badge, le QR code et la consigne « Imprime à 100 % (sans ajustement à la page) ou présente-le sur ton téléphone » ;
   - numéro `SALM27-000001` sur une base vide.
5. « Télécharger mon badge (PDF) » :
   - le fichier s'appelle `badge-salm27-000001.pdf` et fait 2 pages de **exactement 100 × 150 mm** (propriétés du document) ;
   - imprimé à 100 %, le QR code mesure au moins 25 mm de côté, hors marge blanche (à la règle) ;
   - recto : nom en majuscules, niveau, numéro, QR code ;
   - verso : « Jour 1 · ven. 12 mars — 9h30 – 16h00 », « Jour 2 · sam. 13 mars — 9h30 – 16h30 », « Lieu à confirmer, Abidjan », « Organisé par Sucrey Corporates Consulting · +225 07 68 011 409 » ;
   - temps de téléchargement inférieur à 3 s (SC-002).
6. Accents : s'inscrire avec « N'Guessan Éloïse Ange-Élodie » et un autre numéro. Le PDF affiche `N'GUESSAN ÉLOÏSE ANGE-ÉLODIE`, sans glyphe manquant ni débordement (research R2).
   - Nom de 60 caractères (« N'Guessan-Kouadio Adjoua Marie-Élodie Ange Christelle Aya ») : nom entier, sur 2 ou 3 lignes, taille ≥ 14 pt, sans troncature (FR-030b).
   - Nom avec « Ș » ou « Ǹ » : le PDF affiche « S » ou « N », alors que l'admin affiche le nom exact (FR-030c).
7. QR code : le scanner avec l'appareil photo d'un Android **et** d'un iPhone, sur l'écran puis sur une impression 10 × 15 cm (SC-003). Il ouvre `/salm/v/<jeton>` avec « Badge valide · SALM 2027 » et **aucun nom ni téléphone** (FR-028). Vérifier aussi que le jeton de l'URL du QR code est différent de celui de l'URL du PDF.
8. Badge perdu :
   - « Inscrire une autre personne », puis ressaisir `07 12 34 56 78` avec « aya marie KOUASSI » : écran « Tu es déjà inscrit·e », **même numéro** `SALM27-000001`, aucune nouvelle ligne en admin ;
   - même numéro avec « Koné Ibrahim » : message `NAME_MISMATCH`, sans nom révélé ;
   - 5 essais de plus : 429 « Trop de tentatives ».
9. Double clic ou concurrence : envoyer deux requêtes identiques en parallèle. Une seule inscription est créée, les deux réponses portent le même numéro.

   ```bash
   for i in 1 2; do curl -s -X POST localhost:3000/api/salm/students -H 'content-type: application/json' -H 'user-agent: Mozilla/5.0' \
     -d '{"fullName":"Test Course","phone":"0501020304","studyLevel":"Autre","website":"","startedAt":'$(( $(date +%s)*1000 - 5000 ))'}' & done; wait
   ```

10. Liste blanche (D9) : ajouter `"editionId":999,"badgeSeq":1,"status":"x"` au `curl` ci-dessus. Réponse normale, ces champs sont ignorés : numéro suivant, édition publiée.
11. Anti-robots, chacun doit répondre `400 REJECTED` sans inscription créée. Toutes les réponses d'erreur contiennent un **code** (`data.code`, `data.errors`), jamais une phrase (D6) :
    - le même `curl` avec `"website":"x"` ;
    - `startedAt` égal à maintenant ;
    - sans User-Agent (`-A ''`).
12. Enchaîner 31 envois depuis la même IP en moins de 10 min : le 31ᵉ répond `429` avec `Retry-After`.

## Scénario 3 — Inscription établissement (US3)

1. « École : confirmer notre présence ».
2. Étape 1 :
   - « Continuer » sans rien saisir : erreurs sous le nom, le téléphone, l'e-mail et les programmes ;
   - cocher LICENCE, MASTER et Autre : le champ « Précisez » apparaît.
3. Étape 2 :
   - 2 exposants ; le bouton de retrait est absent quand il ne reste qu'une ligne, et le bouton d'ajout disparaît à 6 lignes ;
   - « ← Retour » : l'étape 1 est intacte.
4. Choisir « STAND OR » et confirmer :
   - écran **« Présence confirmée »** avec STAND OR, 2 exposants, LICENCE · MASTER · Autre ;
   - le texte « Aucun badge à télécharger » est présent ;
   - le mot « e-mail » est **absent** (FR-043) ;
   - la phrase sur le pointage des exposants à l'accueil exposants est présente, et aucun lien ni bouton de badge (FR-047).
   - Avant l'envoi, la mention d'usage au vouvoiement (12 mois) est visible au-dessus de « Confirmer notre présence » (FR-046).
   - Provoquer une erreur (e-mail invalide) : les messages sont au vouvoiement (« Adresse e-mail invalide. »).
5. « Ajouter à mon agenda » : le fichier `salm-2027.ics` s'importe dans Google Agenda ou Calendrier, avec 2 événements (12 mars 9h30–16h00, 13 mars 9h30–16h30, en GMT).
6. Masquer « STAND PREMIUM » (`isVisible = false` via Prisma Studio) : il n'est plus proposé. Un envoi forcé de son `standTypeId` par `curl` répond `400 VALIDATION`.

## Scénario 4 — Back-office (US4)

1. Sans session, chaque requête doit répondre `401` :

   ```bash
   curl -i localhost:3000/api/admin/salm/editions
   curl -i -X DELETE localhost:3000/api/admin/salm/students/1
   curl -i -X PATCH localhost:3000/api/admin/salm/schools/1
   ```

2. Après connexion : entrée **« SALM »** dans le menu, puis `/admin/salm` avec l'édition 2027 sélectionnée par défaut, le compteur « N inscrit·e·s » et les interrupteurs.
3. Recherche :
   - « 0712 », « 07 12 », « kouassi » et « KOUASSÍ » retrouvent la bonne ligne ;
   - le filtre « Licence (Bac+3) » se combine avec la recherche (FR-062) ;
   - il faut moins de 15 s pour retrouver une personne et télécharger son badge (SC-008).
4. « Badge » d'une ligne : PDF **identique** à celui téléchargé par l'étudiant·e (FR-031).
5. Suppression en 2 clics :
   - la ligne disparaît et le compteur baisse ;
   - l'ancienne URL du PDF répond 404 et l'URL du QR code affiche « Badge invalide » ;
   - l'inscription suivante reçoit le numéro **suivant**, sans réutiliser le numéro supprimé.
6. « Exporter CSV » (étudiant·e·s, puis établissements), ouvert dans Excel ou LibreOffice en français :
   - une colonne par champ et accents corrects (SC-009) ;
   - un nom saisi `=1+1` apparaît comme texte `'=1+1`, pas comme formule.
7. Établissements :
   - la fiche affiche les exposants, les programmes et la question ;
   - passer de « Nouvelle » à « Contactée » et ajouter une note : ils sont conservés et visibles dans la liste (compteurs par statut) ;
   - `GET /api/salm/edition` ne contient aucune note.
8. Suppression et exposants (D7, D13) :
   - fiche d'un établissement : aucun bouton « Badge » ; « Supprimer l'inscription » (2 clics) la retire des listes, des compteurs et des exports ;
   - « Exporter la liste des exposants » : une ligne par exposant (Établissement ; Stand ; Nom & prénoms ; Contact), sans les inscriptions « Annulée ».
9. Fermer les inscriptions étudiantes :
   - `/salm` affiche « Inscriptions étudiantes closes » ;
   - `/salm/inscription-etudiant` montre le formulaire de récupération ;
   - un `POST /api/salm/students` avec un nouveau numéro répond `403 REGISTRATION_CLOSED` ;
   - la récupération d'un badge existant fonctionne encore ;
   - les établissements ne sont pas affectés.
10. Fermeture automatique (FR-053) : régler temporairement le dernier jour dans le passé (Prisma Studio, `SalmDay.date`).
   - Les deux types d'inscription sont fermés sur `/salm`.
   - L'admin affiche « Fermées automatiquement (salon terminé) ».
   - Rouvrir répond `409 EDITION_ENDED`.
   - Rétablir la date.

## Scénario 4 bis — Conservation et suppression des données (D5, FR-065a/b)

1. L'en-tête SALM de l'édition 2027 affiche « Données personnelles à supprimer au plus tard le 13/03/2028 ». Le bouton « Supprimer les données personnelles » est **absent** (édition publiée). `curl -X POST …/editions/<id>/purge` avec la session répond `409 EDITION_NOT_ARCHIVED`.
2. Sur une base de test : passer 2027 en `archived` et le dernier jour dans le passé (Prisma Studio), puis recharger.
   - Le bouton apparaît.
   - Saisir « 2026 » : le bouton final reste désactivé (et l'API répond `400 CONFIRMATION_MISMATCH`).
   - Saisir « 2027 » et confirmer.
3. Résultat :
   - listes et exports vides ;
   - compteurs agrégés affichés (total, par niveau, par jour, par stand, par statut, exposants) ;
   - anciens liens de badge en 404, anciennes URL de QR code en « Badge invalide » ;
   - une nouvelle tentative répond `409 ALREADY_PURGED`.
4. `lastBadgeSeq` est inchangé (Prisma Studio).
5. Rétablir la base de test.

## Scénario 5 — Accessibilité et performance (SC-006, SC-010)

- Lighthouse (mobile, 4G simulée) sur `/salm` : LCP inférieur à 3 s (l'image du hero est l'élément LCP), aucune requête vers `fonts.googleapis.com`. Les polices Montserrat, DM Sans et Yellowtail ne sont **pas** chargées sur `/` ni sur `/magazine` (onglet Réseau).
- axe DevTools sur `/salm`, `/salm/inscription-etudiant` et `/salm/inscription-ecole` : 0 violation A ou AA. Contrastes : blanc sur `#D5570B` (5,2:1), `#F4792B` sur `#0B0B0D`.
- Parcours complets **au clavier seul** : inscription étudiante, inscription établissement, lecture d'une vidéo, galerie.

## Scénario 6 — Régression du module magazine (refactor de `shared/`)

- Télécharger un magazine via `DownloadModal` : mêmes niveaux d'étude, même validation du téléphone, même message « Format invalide (ex: 07 12 34 56 78) ». `server/api/downloads/index.post.ts` accepte et refuse exactement les mêmes entrées qu'avant.

## Déploiement (à vérifier sur le serveur)

```bash
./deploy.sh deploy     # build + migrate deploy automatique au démarrage
./deploy.sh seed       # nouvelle commande : npx prisma db seed dans le conteneur
./deploy.sh logs app   # vérifier « All migrations have been successfully applied »
```

Puis `https://<domaine>/salm` : contenu 2027 présent ; badge PDF téléchargeable, les polices du PDF étant embarquées dans le build.
