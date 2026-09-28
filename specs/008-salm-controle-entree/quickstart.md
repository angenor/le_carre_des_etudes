# Quickstart — valider le contrôle d'entrée

**Feature** : `008-salm-controle-entree` · Contrats : [control-api.md](./contracts/control-api.md), [admin-api.md](./contracts/admin-api.md), [ui-routes.md](./contracts/ui-routes.md) · Modèle : [data-model.md](./data-model.md)

Aucun test runner n'est configuré (constitution). Ce guide est la recette de la feature : scénarios exécutables et résultats attendus.

## 1. Préparation

```bash
pnpm install                    # ajoute jsqr
pnpm prisma migrate dev         # migration add_salm_entries (SalmEntry + origin)
pnpm prisma db seed             # éditions 2026 (archivée) et 2027 (publiée) si absentes
pnpm dev                        # http://localhost:3000
```

**Données de test** :
1. Inscrire 3 étudiant·e·s sur `/salm/inscription-etudiant` (A, B, C) et télécharger leurs badges PDF. Imprimer celui de A à 100 % et garder ceux de B et C à l'écran d'un autre téléphone ou d'un ordinateur.
2. Obtenir un badge d'une **autre édition**. Créer une inscription sur l'édition 2026 archivée n'est pas possible depuis le site public, donc la créer en base, par exemple avec `pnpm prisma studio` sur `SalmStudentRegistration` de 2026, puis imprimer son PDF depuis le back-office (« Badge »).

**Jour de salon simulé** : le contrôle enregistre seulement si la date du jour est un jour de l'édition publiée (R9). Dans « SALM › Éditions › 2027 › Chronogramme », ajouter **temporairement** un jour à la date du jour, puis le supprimer à la fin de la recette. Sans ce jour, la page est en **mode essai** (scénario 2.9).

## 2. Scan (US1), sur ordinateur avec webcam ou sur téléphone (§ 6)

Se connecter à `/admin`, ouvrir « SALM › Contrôle d'entrée » (ou `/controle`).

| # | Action | Attendu |
|---|---|---|
| 2.1 | Ouvrir la page, autoriser la caméra | Bandeau « Jour N · … », compteurs, invite « Présentez le QR code du badge » ; « Prêt hors ligne · liste du HH:MM » après quelques secondes |
| 2.2 | Présenter le badge imprimé de A | Écran **vert** « ENTRÉE VALIDÉE », nom en capitales, niveau, `SALM27-…` ; compteur +1 ; vibration courte sur Android |
| 2.3 | Laisser le badge devant l'objectif 4 s | Rien ne change (lecture ignorée 5 s) |
| 2.4 | Retirer le badge, attendre 10 s, le représenter | Écran **ambre** « DÉJÀ ENTRÉ·E AUJOURD'HUI · à HH:MM » (heure de 2.2) ; compteur inchangé |
| 2.5 | Présenter le badge de B, affiché sur un écran | Vert ; compteur +1 |
| 2.6 | Présenter le badge 2026 | **Rouge** « BADGE REFUSÉ · Badge d'une autre édition (SALM 2026) », sans nom |
| 2.7 | Présenter un QR code quelconque (ex. l'URL d'un site) | Rouge « Ce QR code n'est pas un badge SALM », sans appel réseau (onglet réseau des outils de développement) |
| 2.8 | Supprimer C dans le back-office, puis scanner son badge | Rouge « Badge invalide » |
| 2.9 | Supprimer le jour temporaire, recharger, scanner A | Bandeau « MODE ESSAI » ; résultat « VALIDE (ESSAI) » ; aucune écriture (`SalmEntry` inchangée dans Prisma Studio) |
| 2.10 | (jour recréé) Après un vert, toucher « Annuler cette entrée », confirmer, rescanner | Compteur −1, puis de nouveau vert |
| 2.11 | Refuser la caméra (réglages du site) et recharger | Message d'autorisation ; saisie manuelle ouverte |

**Double scan simultané (R4, US1-10)**, deux postes ouverts sur la page (deux navigateurs ou deux téléphones), badge d'un·e inscrit·e pas encore entré·e :

```bash
# Même effet sans caméra : deux requêtes concurrentes (cookie de session admin copié du navigateur)
TOKEN=<verifyToken de l'inscrit·e>   # Prisma Studio
for i in 1 2; do curl -s -X POST localhost:3000/api/admin/salm/control/entries \
  -H 'Content-Type: application/json' -H "Cookie: h3=<cookie>" \
  -d "{\"token\":\"$TOKEN\"}" & done; wait
```

Attendu : une réponse `entered`, l'autre `already` avec **le même** `enteredAt`, et une seule ligne `SalmEntry`.

## 3. Saisie manuelle (US2)

| # | Saisie | Attendu |
|---|---|---|
| 3.1 | `482` (numéro de B), puis `SALM27-000482`, `salm27 482`, `000482` | Même fiche ; « Déjà entrée aujourd'hui à HH:MM » ; pas de bouton « Valider » |
| 3.2 | Téléphone d'un·e inscrit·e pas encore entré·e, au format `+225 07 …` | Fiche « Pas encore entré·e aujourd'hui » ; « Valider l'entrée » → vert |
| 3.3 | `0799999999` (non inscrit) | « Aucun inscrit avec ce numéro pour le SALM 2027 » |
| 3.4 | `abc` | Message des formats attendus |
| 3.5 | Ouvrir `/salm/v/<jeton>` **connecté** | Page publique, plus un encart admin avec la validité et « Contrôler ce badge » → fiche sur la page de contrôle, **sans** entrée enregistrée |

## 4. URL du QR code sans être connecté (FR-222, SC-004)

Dans une fenêtre de navigation privée :

```bash
curl -s localhost:3000/salm/v/<jeton valide>   > a.html
curl -s localhost:3000/salm/v/AAAAAAAAAAAAAAAAAAAAAA > b.html
diff <(sed 's/<jeton valide>/X/g' a.html) <(sed 's/AAAAAAAAAAAAAAAAAAAAAA/X/g' b.html)   # attendu : aucune différence
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/salm/verify/<jeton>          # attendu : 404 (route supprimée)
curl -s -o /dev/null -w '%{http_code}\n' "localhost:3000/api/admin/salm/control/lookup?token=<jeton>"  # attendu : 401
```

Visuellement : « Ce QR code est un badge du SALM 2027. Présentez-le à l'entrée », jours, horaires et lieu, sans nom ni validité.

## 5. Suivi (US3) et accueil des non-inscrit·e·s (US4)

| # | Action | Attendu |
|---|---|---|
| 5.1 | Ouvrir `/admin/salm` | Compteurs « Jour N · … : n entrées » ; colonne d'heure d'entrée par jour ; filtre « Présent·e / Absent·e le Jour N » combiné à la recherche |
| 5.2 | Exporter en CSV filtré « Présent·e le Jour N » | Colonnes `Origine` et `Présent Jour N (JJ/MM/AAAA)` ; toutes les lignes à `Oui` ; accents corrects dans le tableur |
| 5.3 | Deux postes ouverts : entrée sur l'un | Compteur de l'autre mis à jour en moins de 30 s |
| 5.4 | Page de contrôle › « Pas de badge ? » ; scanner le QR code affiché avec un autre téléphone | `/inscription` redirige vers le formulaire étudiant public |
| 5.5 | « Affiche d'inscription » → impression en PDF | Une page A4 avec le titre, le QR code et l'adresse courte |
| 5.6 | « Inscrire la personne » : nom, `05 01 02 03 04`, niveau, case cochée | Vert avec un nouveau numéro ; ligne marquée « Sur place » dans le back-office ; `Origine = Sur place` dans l'export |
| 5.7 | Recommencer 5.6 avec le même téléphone | Fiche existante, rien de créé |
| 5.8 | Case « informée » non cochée | Erreur sous la case ; rien de créé |
| 5.9 | Supprimer les données personnelles d'une édition archivée terminée qui a des entrées (base de test) | `purgedStats.students.entriesByDay` renseigné ; plus aucune `SalmEntry` pour l'édition |

## 6. Test sur un vrai téléphone

La caméra exige HTTPS (R2). Deux méthodes pour tester avant la production :

**A. Serveur de développement en HTTPS sur le réseau local**

```bash
pnpm dev --https --host        # nuxi génère un certificat auto-signé
# noter l'adresse « Network » affichée, ex. https://192.168.1.20:3000
```

Sur le téléphone, connecté au même Wi-Fi, ouvrir cette adresse et accepter l'avertissement de certificat une fois :
- Android Chrome : « Paramètres avancés › Continuer » ;
- iOS Safari : « Afficher les détails › consulter ce site web ». En développement, le cookie de session n'est pas marqué `secure` (`server/utils/session.ts`) : la connexion fonctionne en HTTP comme en HTTPS.

**B. Tunnel HTTPS temporaire** (aucune installation dans le projet) : `cloudflared tunnel --url http://localhost:3000`, puis ouvrir l'URL `https://…trycloudflare.com` affichée. Certificat valide, pratique pour l'iPhone.

**Parcours de recette sur téléphone**. À faire au moins sur **un Android (Chrome) et un iPhone (Safari)** (SC-002), à 390 px, d'une seule main :

| # | Étape | Attendu |
|---|---|---|
| 6.1 | Se connecter, ouvrir `/controle`, ajouter la page à l'écran d'accueil ou aux favoris | Redirection vers le contrôle après connexion (`?redirect=`) |
| 6.2 | Autoriser la caméra | Caméra **arrière** ; vidéo intégrée à la page (pas de plein écran natif sur iOS) |
| 6.3 | Enchaîner 15 badges (imprimés et à l'écran) sans toucher l'écran, chronomètre en main | Chaque badge lu du premier coup ; au moins 15 badges par minute (SC-001) ; sur iPhone, moteur de repli (jsQR) actif : si un badge n'est pas lu du premier coup, noter le cas (critère de passage au plan B, R1 bis) |
| 6.4 | Lire l'écran de résultat à bout de bras, **en extérieur en plein jour** | État, nom et numéro lisibles en moins d'une seconde (SC-006) |
| 6.5 | Laisser le téléphone posé 3 min sur la page | L'écran ne s'éteint pas (Wake Lock) ; sinon, conseil affiché |
| 6.6 | Vibration et son | Android : trois motifs distincts ; iPhone : pas de vibration, son (si activé) |
| 6.7 | Verrouiller puis déverrouiller le téléphone | La caméra reprend seule |
| 6.8 | **Hors ligne** : vérifier « Prêt hors ligne », passer en mode avion, scanner A (déjà entré·e), un badge pas encore entré, un badge absent de la liste (inscrit après la dernière précharge) | Ambre ; vert avec « HORS LIGNE · 1 en attente » ; neutre « NON VÉRIFIÉ — badge absent de la liste hors ligne » |
| 6.9 | Toujours en mode avion : fermer l'onglet, rouvrir `/admin/salm/controle` depuis le favori | La page se charge (service worker), la file affiche toujours 1 en attente |
| 6.10 | Saisie manuelle hors ligne : numéro de badge, puis téléphone | Fiche par numéro ; message « Recherche par téléphone indisponible hors ligne » |
| 6.11 | Désactiver le mode avion | File envoyée en moins d'une minute ; entrée visible dans le back-office avec l'heure du scan hors ligne (SC-005a) |
| 6.12 | Deux téléphones en mode avion scannent le même badge, puis reviennent en ligne | Une seule entrée, à l'heure la plus ancienne |
| 6.13 | Se déconnecter avec une entrée en attente | Avertissement ; après confirmation, `localStorage` sans clé `salm-controle:*` (inspection à distance : Chrome `chrome://inspect`, Safari « Développement ») |
| 6.14 | Avec un jour de test qui se termine dans 2 minutes, page de contrôle ouverte : attendre l'heure de fermeture | Message « Le SALM {année} est terminé : les données de contrôle ont été effacées de ce téléphone » ; `localStorage` sans clé `salm-controle:*` ; recommencer page fermée puis ouvrir `/admin` : même effacement (FR-239) |

## 7. Avant le jour J (production)

- [ ] **Certificat HTTPS** valide au moins jusqu'au lendemain du salon : `echo | openssl s_client -connect lecarredesetudes.com:443 2>/dev/null | openssl x509 -noout -enddate`. Si le renouvellement automatique n'a pas fonctionné, la caméra est bloquée ; voir research R2 / constat C4.
- [ ] `./deploy.sh deploy`, puis ouvrir `/controle` sur chaque téléphone la veille (répétition en mode essai) et **le matin** avec du réseau, pour vérifier « Prêt hors ligne ».
- [ ] Heure automatique activée sur chaque téléphone.
- [ ] Affiches d'inscription imprimées (5.5) et placées à l'entrée.
- [ ] Après le salon : supprimer le jour de test s'il en reste un, et contrôler les compteurs du back-office (SC-008 : page de contrôle = back-office = nombre de `Oui` de l'export).
