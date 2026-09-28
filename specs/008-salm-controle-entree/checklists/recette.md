# Recette — contrôle d'entrée SALM (008)

**Date** : 2026-09-28 · **Environnement** : `pnpm dev` (copie isolée du projet, même `dev.db`) et `pnpm build` + `node .output/server/index.mjs` (service worker, hors ligne), Chromium 153 sans interface à 390 × 844, caméra factice (`--use-file-for-fake-video-capture`) ou détecteur piloté.

**Données de test** : jour de salon temporaire « Jour test » (28/09/2026) ajouté à l'édition 2027 ; inscription de test sur l'édition 2026 archivée ; entrées de test sur Jour 1 (4) et Jour 2 (3). À retirer avant la mise en production (voir fin du document).

## Bureau (T060) : quickstart § 1 à 5

| § | Scénario | Résultat |
|---|---|---|
| 2.1 | Ouverture, caméra, bandeau jour et compteurs | ✅ Caméra démarrée seule quand l'autorisation est déjà donnée, sinon bouton « Activer la caméra » |
| 2.2 | Badge valide | ✅ Vert, nom en capitales, niveau et numéro, compteur +1 (lecture réelle d'un QR code par `BarcodeDetector` sur la caméra factice) |
| 2.3 | Badge laissé devant l'objectif 4 s | ✅ Aucune nouvelle lecture |
| 2.4 | Badge représenté après 5 s | ✅ Ambre « DÉJÀ ENTRÉ·E AUJOURD'HUI », heure du premier passage, compteur inchangé |
| 2.6 | Badge d'une autre édition | ✅ Rouge « Badge d'une autre édition (SALM 2026) », sans nom |
| 2.7 | QR code quelconque | ✅ Rouge « Ce QR code n'est pas un badge SALM », aucun appel réseau (compteur de ressources inchangé) |
| 2.8 | Jeton inconnu | ✅ Rouge « Badge invalide » |
| 2.9 | Mode essai | ✅ Bandeau permanent, « VALIDE (ESSAI) », aucune ligne `SalmEntry` créée |
| 2.10 | Annulation puis rescan | ✅ Compteur −1, ligne supprimée, rescan immédiat → vert |
| 2.11 | Caméra refusée | ✅ Message d'autorisation ; saisie manuelle ouverte, champ focalisé |
| 2 | Double scan concurrent (`curl`) | ✅ Une réponse `entered`, une `already`, même `enteredAt`, une seule ligne |
| 2 | Réseau coupé en ligne / session expirée | ✅ « NON VÉRIFIÉ · Réseau indisponible » + « Réessayer » (→ vert) ; « Session expirée » + « Se reconnecter » (→ `/admin/login?redirect=/admin/salm/controle`) |
| 2 | Mode maintenance actif | ✅ Page et API de contrôle accessibles à l'admin ; visiteur renvoyé vers la connexion |
| 2 | HTML rendu par le serveur | ✅ Aucun nom, numéro ni jeton |
| 3.1 | `1`, `SALM27-000001`, `salm27 1`, `000001` | ✅ Même fiche |
| 3.2 | Téléphone `+225 07 12 34 56 78`, « Valider l'entrée » | ✅ Fiche, puis vert ; la fiche suivante indique « Déjà entré·e aujourd'hui à HH:MM » avec « Annuler cette entrée » |
| 3.3 | Téléphone non inscrit | ✅ « Aucun inscrit avec ce numéro pour le SALM 2027 » |
| 3.4 | `abc`, `SALM26-000001` | ✅ Message des formats attendus |
| 3.5 | `/salm/v/<jeton>` connecté | ✅ Encart « Badge valide » + « Contrôler ce badge » → fiche, `?token` retiré de l'URL, aucune entrée ; autre édition et jeton inconnu affichés |
| 4 | `diff` des pages `/salm/v/<valide>` et `/salm/v/AAAA…` | ✅ Identiques sur le build de production (en développement, seul l'horodatage `timeSsrStart` de Nuxt DevTools diffère) ; statut 200 pour les deux |
| 4 | `GET /api/salm/verify/:token` | ✅ 404 |
| 4 | `GET /api/admin/salm/control/lookup` sans session | ✅ 401 |
| 5.1 | Compteurs par jour, colonnes d'heure, filtre de présence combiné à la recherche | ✅ 4 présent·e·s le Jour 1, 26 absent·e·s, filtre d'un jour étranger ignoré |
| 5.2 | Export CSV filtré | ✅ BOM UTF-8, colonnes `Origine` et `Présent <jour> (JJ/MM/AAAA)`, toutes les lignes à `Oui` |
| 5.3 | Deux postes | ✅ Compteur de l'autre poste à jour en 12 s |
| 5.4 | `/inscription` | ✅ 302 vers `/salm/inscription-etudiant` |
| 5.5 | Affiche | ✅ Une page A4, QR code de 95 mm, adresse courte sur une ligne |
| 5.6 | Inscription sur place | ✅ 201, vert avec « Communiquez le numéro SALM27-… », origine « Sur place » dans la liste et l'export, entrée `manual` ; champs hors liste blanche ignorés |
| 5.7 | Même téléphone | ✅ Fiche existante, rien de créé |
| 5.8 | Case « informée » non cochée | ✅ Erreur sous la case ; rien de créé |
| 5.9 | Suppression des données d'une édition archivée terminée | ✅ Sur une copie de la base : `entriesByDay` conservé, plus aucune `SalmEntry` pour l'édition |

## Hors ligne sur navigateur de bureau (quickstart § 6.8 à 6.14, sans téléphone)

| § | Scénario | Résultat |
|---|---|---|
| 6.8 | Réseau coupé : badge non entré, badge déjà entré, badge hors liste | ✅ Vert + « HORS LIGNE · 1 entrée en attente d'envoi » ; ambre avec l'heure (y compris pour une entrée d'un autre poste) ; neutre « Badge absent de la liste hors ligne ». La file ne contient que `{ clientId, seq, dayId, scannedAt, mode }`, jamais le jeton |
| 6.9 | Rechargement de la page sans réseau | ✅ Page servie par le service worker (build de production), file conservée |
| 6.10 | Saisie manuelle hors ligne | ✅ Fiche par numéro, validation mise en file ; téléphone → « Recherche par téléphone indisponible hors ligne » |
| 6.11 | Retour du réseau | ✅ File envoyée aussitôt ; entrées en base avec l'heure du scan hors ligne et `offline = 1` |
| 6.12 | Même badge synchronisé par plusieurs postes | ✅ `curl` concurrents (20h30, 20h10, 20h20) : une seule ligne, à 20h10 |
| 6.13 | Déconnexion avec une entrée en attente | ✅ Avertissement « 1 entrée(s) ne sont pas encore envoyées… » ; refus → rien ne change ; confirmation → plus aucune clé `salm-controle:*` |
| 6.14 | Fin du salon, page ouverte (build de production, copie de la base, jour se terminant 4 min plus tard) | ✅ Page d'abord rouverte hors ligne, puis à l'heure de fin : « Le SALM 2027 est terminé : les données de contrôle ont été effacées de ce téléphone », plus aucune clé `salm-controle:*` ni cache `salm-controle-*`. Un premier essai avait échoué (minuteur non programmé après une réouverture hors ligne) : corrigé |
| — | Fin du salon mémorisée dépassée, ouverture de `/admin` | ✅ Clés `salm-controle:*` effacées |
| — | Annulation d'une entrée encore en file, sans réseau | ✅ Retirée de la file |
| — | « Prêt hors ligne » | ✅ Affiché une fois le service worker actif, la page et 13 fichiers en cache |

## Moteur de repli `jsqr` (sans téléphone)

Chromium sans `BarcodeDetector` (supprimé avant le chargement de la page), caméra factice sur un badge réel : le morceau `jsqr` est chargé à la demande et le badge est lu (vert, puis ambre à la relecture après 5 s). Cela valide la chaîne de décodage du repli, pas sa robustesse sur un vrai capteur d'iPhone (reflets, mise au point), qui reste le critère du plan B.

## Accessibilité à 390 px (T064)

- Clavier : Tab parcourt « Son », « Menu », « Saisie manuelle », « Pas de badge ? » avec un contour de focus de 4 px ; Entrée ouvre la saisie manuelle avec le champ focalisé ; Échap ferme le résultat ou le panneau ouvert ; le fond est `inert` sous un résultat ou un panneau.
- Zones tactiles : toutes ≥ 48 px dans les cinq états (écran principal, saisie manuelle, « Pas de badge ? », formulaire sur place, résultat) ; la case « informée » de 24 px est dans un libellé cliquable de 48 px.
- Aucun défilement horizontal à 360, 390 et 430 px.
- Contrastes : 9,11:1 (vert), 10,48:1 (ambre), 8,31:1 (rouge), 10,35:1 (neutre), 11,83:1 (bandeaux ambre).
- Résultat annoncé par une région `role="status"`, `aria-live="assertive"`, `aria-atomic="true"`. L'écoute réelle avec VoiceOver et TalkBack reste à faire sur téléphone.

## Téléphones réels (T061 à T063) : à faire

Non réalisables dans cet environnement : Android (Chrome), iPhone (Safari), 6 postes mélangés. Parcours complet § 6.1 à 6.14 à consigner ici, notamment la lecture par `jsqr` sur iPhone (critère du plan B, R1 bis), le son, la vibration, le Wake Lock et la lisibilité en plein soleil.

## À nettoyer dans `dev.db` après la recette

- jour « Jour test » du 28/09/2026 de l'édition 2027 (sa suppression retire ses entrées par cascade) ;
- entrées de test des jours 1 et 2 (inscriptions n° 10 à 14) ;
- inscriptions créées pendant la recette : « Traoré Awa » (05 01 02 99 01), « Koné Mariam » (05 01 02 99 02) ; inscription de test de l'édition 2026 (supprimée pendant la recette).
