# Research — Module SALM (3/3) : contrôle d'entrée

**Feature** : `008-salm-controle-entree` · **Spec** : [spec.md](./spec.md) · **Plan** : [plan.md](./plan.md)

Chaque section suit la forme **Décision / Justification / Alternatives écartées**. Les références `FR-2xx` renvoient à la spec de cette feature, `FR-0xx` à `specs/006-salm-inscriptions/spec.md`.

---

## R1. Inventaire de l'existant réutilisé

| Besoin | Existant | Emplacement |
|---|---|---|
| Jeton du QR code | `verifyToken`, 22 caractères base64url, unique | `SalmStudentRegistration.verifyToken`, `BADGE_TOKEN_REGEX` dans `server/utils/salm-registration.ts` |
| URL du QR code | `${siteUrl}/salm/v/${verifyToken}` | `badgeVerifyUrl()` dans `server/utils/salm-badge-pdf.ts` |
| Numéro de badge | `formatBadgeNumber(year, seq)` → `SALM27-000482` | `shared/utils/salm.ts` |
| Téléphone | `normalizeIvorianPhone()`, `formatIvorianPhone()` | `shared/utils/phone.ts` |
| Édition publiée et jours | `getPublishedEdition()`, `getEditionTimeline()` | `server/utils/salm-edition.ts` |
| Création d'inscription | `validateStudent()`, `createStudentRegistration()` (file d'attente en mémoire + transaction du compteur) | `server/utils/salm-registration.ts` |
| Liste et export admin | `studentWhere()`, `studentOrderBy()`, `toCsv()` | `server/utils/salm-admin.ts`, `server/utils/csv.ts` |
| Compteurs conservés | `computePurgedStats()`, `purgeEditionPersonalData()` | `server/utils/salm-purge.ts` |
| Protection admin | toute méthode sous `/api/admin/*` | `server/middleware/admin.ts` |
| Mode maintenance | `/admin` et `/api/admin/` toujours autorisés | `server/middleware/maintenance.ts` |
| QR code SVG | `qrcode` (dépendance serveur existante), `badgeQrSvg()` | `server/utils/salm-badge-pdf.ts` |
| Menu admin | section « SALM » avec sous-entrées | `app/layouts/admin.vue` |

**Constats utiles au plan** :

- **C1** : `app/layouts/admin.vue` redirige vers `/admin/login` si `/api/auth/me` échoue, y compris quand le réseau manque. Une page hors ligne ne peut donc pas utiliser ce layout (R8).
- **C2** : `app/pages/admin/login.vue` renvoie toujours vers `/admin`. Il n'y a pas de retour vers la page demandée, ce qu'exige FR-200 (R8).
- **C3** : la session admin est un cookie h3 sans `maxAge`, donc un cookie de session du navigateur, sans expiration côté serveur. Il tient la journée tant que le navigateur n'est pas fermé. Sur iOS, Safari peut purger les cookies de session quand il ferme un onglet en arrière-plan : la reconnexion doit donc ramener à la page de contrôle (C2).
- **C4** : la production est déjà en HTTPS (nginx avec certificats Let's Encrypt). En revanche, la commande `./deploy.sh ssl` ne colle plus à `docker-compose.yml` :
  - elle arrête le service `app`, alors que c'est `nginx` qui occupe le port 80 ;
  - certbot écrit dans le `/etc/letsencrypt` de l'hôte, alors que nginx lit le volume externe `le_carre_des_etudes_letsencrypt`.

  La tâche cron de renouvellement risque donc d'échouer sans bruit (R2).
- **C5** : `GET /api/salm/verify/:token` renvoie `{ valid, edition }`, ce qui révèle la validité d'un badge. FR-222 l'interdit désormais (R12).

---

## R1 bis. Lecture du QR code dans le navigateur

**Décision** : une interface interne unique, `detect(frame) → string | null`, avec deux moteurs :

1. **`BarcodeDetector` natif** quand `'BarcodeDetector' in window` et que `getSupportedFormats()` contient `qr_code`. C'est le cas de Chrome Android, la majorité des téléphones de l'équipe. Il est rapide (accélération système) et n'ajoute aucun code.
2. **Repli `jsQR` 1.4.0**, chargé par `import()` dynamique seulement si le natif manque. C'est notamment le cas d'iOS Safari, où l'on ne suppose pas que `BarcodeDetector` soit disponible.

**Boucle de lecture** :
- environ 8 images par seconde, via `requestVideoFrameCallback` quand il existe, sinon `requestAnimationFrame` ralenti ;
- un carré central est recadré à 640 px au plus, dessiné dans un `canvas` hors écran puis passé à `jsQR(data, w, h, { inversionAttempts: 'dontInvert' })` ;
- le moteur natif reçoit la `<video>` directement.

**Critère de repli documenté** : si la recette sur iPhone (quickstart § 6) montre que jsQR lit moins de 100 % des badges du premier coup (SC-002), remplacer le repli par `barcode-detector` 3.x. C'est une implémentation de l'API `BarcodeDetector` sur `zxing-wasm`, maintenue, dont le fichier `.wasm` d'environ 1 Mo doit être auto-hébergé (pas de CDN : hors ligne). L'interface interne ne change pas.

| Critère | BarcodeDetector natif | jsQR 1.4.0 | qr-scanner 1.4.2 | html5-qrcode 2.3.8 | barcode-detector 3.2 (zxing-wasm) |
|---|---|---|---|---|---|
| Dernière version | navigateur | 04/2021 | 11/2022 | 04/2023 (projet signalé non maintenu) | 08/2026 |
| Poids ajouté | 0 | ~130 ko minifié (~40 ko gzip), JS pur | ~16 ko gzip + worker | ~2,6 Mo non compressé (zxing-js + interface) | ~260 ko JS + wasm ~1 Mo |
| iOS Safari | non garanti | oui | oui (moteur interne) | oui | oui |
| Hors ligne | oui | oui (morceau JS mis en cache, R6) | oui | oui | oui si wasm auto-hébergé et mis en cache |
| Interface caméra imposée | non | non | oui (sa propre surcouche) | oui (sa propre interface HTML) | non |
| Robustesse (reflets, QR abîmé) | très bonne | bonne sur des QR nets et grands | bonne | moyenne | très bonne |
| Coût d'intégration | faible | faible | moyen | élevé (styles, DOM imposé) | moyen (hébergement du wasm) |

**Justification** :
- Nos QR codes sont générés par nous : au moins 25 mm, zone de silence, fond blanc (FR-030a de 006), à forte correction d'erreur par défaut dans `qrcode`. Le cas difficile (QR abîmé, minuscule) est marginal et couvert par la saisie manuelle.
- jsQR est un algorithme pur, sans dépendance aux API du navigateur, donc son absence de maintenance pèse peu. Il ne s'installe que comme repli et reste le plus simple à mettre en cache hors ligne.
- html5-qrcode et qr-scanner imposent leur propre gestion de la caméra et de l'affichage, en conflit avec l'écran de résultat plein écran (FR-208), et ne sont plus maintenus.

**Alternatives écartées** : html5-qrcode (poids, interface imposée, non maintenu) ; qr-scanner (non maintenu, surcouche imposée) ; barcode-detector en premier choix (wasm de 1 Mo à héberger et mettre en cache pour un gain non démontré sur nos QR codes : gardé comme plan B mesurable).

**Dépendance ajoutée** : `jsqr` (runtime, chargé à la demande). Principe IV de la constitution : besoin immédiat et démontré (iPhone), aucun module Nuxt.

---

## R2. Accès à la caméra : HTTPS, iOS, développement sur téléphone

**Décision** :

- **Flux vidéo** : `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })`. Il est affiché dans un `<video autoplay muted playsinline>`, attribut obligatoire sur iOS pour éviter le plein écran.
- **Démarrage** : au premier geste de l'utilisateur, par un bouton « Activer la caméra ». Sur iOS, la page se recharge rarement ; sur Android, l'autorisation est mémorisée par origine et la caméra peut démarrer seule.
- **Refus ou absence** (`NotAllowedError`, `NotFoundError`, `NotReadableError`, API absente) : message explicatif et ouverture de la saisie manuelle (FR-213).
- **Arrêt du flux** : `track.stop()` quand la page passe en arrière-plan (`visibilitychange`) ; redémarrage au retour (FR-214). iOS coupe de toute façon la caméra en arrière-plan.
- **Production** : HTTPS déjà en place (C4). Tâche de **vérification du certificat** avant le salon :
  - date d'expiration contrôlée à J-30 et à J-3 ;
  - correction de la fonction `ssl` / du cron de `deploy.sh` pour arrêter `nginx` et écrire dans le bon volume, ou renouvellement par la méthode `webroot`.

  Un certificat expiré le jour J bloque la caméra : les navigateurs refusent `getUserMedia` hors contexte sécurisé.
- **Développement sur un vrai téléphone** : `getUserMedia` exige un contexte sécurisé (`localhost` ou HTTPS). Voir [quickstart.md § Téléphone](./quickstart.md#6-test-sur-un-vrai-téléphone). Deux méthodes :
  - `pnpm dev --https --host`, avec certificat auto-signé de `nuxi`, à accepter une fois sur le téléphone ;
  - un tunnel HTTPS temporaire vers `localhost:3000`, par exemple `cloudflared tunnel --url http://localhost:3000`, sans installation dans le projet.

**Justification** : `facingMode: ideal` retombe sur la seule caméra disponible au lieu d'échouer (`exact` échoue sur certains Android). Une résolution de 720p suffit pour un QR code de 25 mm lu à 15-25 cm, et limite le coût du décodage logiciel (R1 bis).

**Alternatives écartées** :
- `input type="file" capture` : une photo par badge, trop lent (SC-001).
- Application native : hors périmètre.

---

## R3. Table des passages : une ligne par inscrit·e et par jour

**Décision** : nouveau modèle `SalmEntry`, détaillé dans [data-model.md](./data-model.md) :

- `registrationId` → `SalmStudentRegistration`, `onDelete: Cascade` ;
- `dayId` → `SalmDay`, `onDelete: Cascade` ;
- `enteredAt` (heure du premier passage), `mode` (`scan` | `manual`), `offline` (booléen), `createdAt` ;
- **`@@unique([registrationId, dayId])`** : c'est la garantie de FR-215 au niveau de la base, quel que soit le nombre de postes ;
- `@@index([dayId, enteredAt])` pour les compteurs et le rafraîchissement des postes.

**Justification** :
- Le jour est une ligne existante (`SalmDay`), pas une date libre : les colonnes de présence, les libellés « Jour 1 » et les compteurs en découlent sans conversion.
- Les cascades appliquent FR-228 sans code :
  - suppression d'une inscription (FR-065 de 006) ;
  - suppression des données personnelles (les `deleteMany` des inscriptions entraînent les entrées) ;
  - suppression d'un jour.
- Pas de colonne `editionId` : elle se déduit de l'inscription comme du jour, et la dupliquer ouvrirait une incohérence possible.
- L'annulation (FR-217) **supprime** la ligne : un nouveau passage retrouve « Entrée validée ». Aucun historique n'est demandé.

**Alternatives écartées** :
- Colonnes `presentDay1At` / `presentDay2At` sur l'inscription : nombre de jours variable selon l'édition.
- Journal de tous les passages (une ligne par scan) : la spec ne compte qu'une entrée par jour et n'identifie pas le contrôleur ; il faudrait dédoublonner à chaque lecture.
- `@@unique([registrationId, date])` avec la date en texte : doublon du jour existant.

---

## R4. Double scan simultané sur deux postes

**Décision** : insertion optimiste, avec traitement de la violation d'unicité comme « déjà entré·e ».

```text
POST /control/entries { token }
  1. inscription = findUnique(verifyToken) → sinon « invalide » ; édition ≠ publiée → « autre édition »
  2. jour = jour de salon de l'édition publiée à la date du serveur → sinon mode essai (aucune écriture)
  3. try   create SalmEntry { registrationId, dayId, enteredAt: now, mode }  → « entrée validée »
     catch P2002 (registrationId, dayId) → relire l'entrée existante        → « déjà entré·e à HH:MM »
```

**Justification** :
- SQLite n'a qu'un écrivain à la fois : deux `INSERT` concurrents sont sérialisés et la contrainte unique rejette le second. Aucun verrou applicatif n'est nécessaire, contrairement à la création d'inscription, qui doit incrémenter un compteur (R4 de 006).
- Les deux postes reçoivent une réponse cohérente : l'un « entrée validée », l'autre « déjà entré·e » avec **la même heure** (US1-10).
- La détection P2002 réutilise la logique robuste de `uniqueViolationField()` (forme de `meta` variable avec l'adaptateur better-sqlite3), extraite en utilitaire partagé.

**Alternatives écartées** :
- Lecture puis écriture (`findFirst` puis `create`) : fenêtre de course entre les deux.
- `upsert` : ne dit pas qui a créé la ligne, alors que le poste doit savoir s'il affiche vert ou ambre.
- File d'attente en mémoire comme pour les inscriptions : inutile, la contrainte suffit.

---

## R5. Mode hors ligne : principe retenu (clarification Q2)

**Décision** : une architecture « en ligne d'abord, repli local ».

1. **Précharge** (`GET /api/admin/salm/control/snapshot`). Au chargement de la page, puis toutes les 5 minutes en ligne (FR-232), le poste reçoit :
   - l'édition publiée et ses jours ;
   - la liste des badges `{ h, seq, name, level }` ;
   - les entrées existantes `{ h, dayId, at }` ;
   - les compteurs, le SVG du QR code d'inscription et `serverTime`.

   **`h` est une empreinte SHA-256 du `verifyToken`**, tronquée à 16 octets et encodée en base64url, jamais le jeton lui-même. Le téléphone ne contient ni téléphone (FR-230) ni jeton exploitable.
2. **Contrôle en ligne** : `POST /control/entries` avec un délai maximal de **3 s** (`AbortController`). La réponse du serveur fait foi.
3. **Repli local**. Il s'applique si `navigator.onLine === false`, sur erreur réseau ou délai dépassé, ou sur une réponse 5xx :
   - le poste calcule `h = SHA-256(token)` avec `crypto.subtle`, disponible en contexte sécurisé, et le cherche dans la liste ;
   - il détermine le résultat avec les mêmes règles que le serveur (fonction partagée `resolveControlResult`) ;
   - si l'entrée est validée, il l'ajoute à la **file d'attente** `{ clientId, seq, dayId, scannedAt, mode }`. La file ne contient **jamais le jeton** : le numéro de badge `seq` est lu dans la précharge (entrée trouvée par l'empreinte `h`).
4. **Synchronisation** (`POST /control/sync`). Elle part dès le retour du réseau (`online`, puis toutes les 15 s tant que la file n'est pas vide), par lots de 200 au plus. Chaque élément reçoit un statut, et les éléments traités sortent de la file.
5. **Fusion côté serveur** (FR-235) : pour chaque élément, trouver l'inscription par son numéro de badge dans l'édition publiée, contrôler que le jour appartient à l'édition publiée, puis :
   - `create`, ou, sur P2002, `updateMany({ where: { registrationId, dayId, enteredAt: { gt: reçu } }, data: { enteredAt: reçu, … } })`. La condition dans le `where` rend la fusion atomique : deux synchronisations concurrentes ne peuvent pas remplacer une heure plus ancienne par une plus récente ;
   - l'élément est ignoré, avec son statut, si l'inscription n'existe plus.
6. **Rafraîchissement entre postes** (`GET /control/state?afterId=`), toutes les 15 s en ligne : compteurs du jour et nouvelles entrées depuis le dernier identifiant vu, pour tenir le « déjà entré·e » local à jour (FR-224, FR-236). Les annulations des autres postes ne remontent qu'à la précharge suivante (5 min), un écart accepté.

**Justification** :
- Le serveur reste l'arbitre en ligne ; hors ligne, le poste reprend exactement la même logique.
- L'empreinte du jeton empêche de fabriquer un QR code valide à partir d'un téléphone perdu : on ne peut pas retrouver le jeton depuis son empreinte. Le nom et le niveau restent lisibles localement, un risque accepté par la clarification Q2.
- Volume : 5 000 badges × ~90 octets ≈ 450 Ko JSON, ~120 Ko compressés par nginx, une fois toutes les 5 minutes par poste.

**Alternatives écartées** :
- Contrôle toujours local, avec le serveur en simple sauvegarde : le « déjà entré·e » entre postes ne serait jamais fiable, même en ligne.
- Précharge des jetons en clair : un téléphone perdu permettrait de fabriquer des badges.
- Synchronisation par `Background Sync` : non disponible sur iOS Safari ; la page ouverte suffit (FR-234 : envoi à la prochaine ouverture avec réseau).

---

## R6. Chargement de la page sans réseau : service worker dédié

**Décision** : un **service worker écrit à la main**, `public/salm-controle-sw.js` (environ 80 lignes), enregistré **uniquement** par la page de contrôle, avec `scope: '/admin/salm/controle'`.

- **Navigation vers la page** : réseau d'abord, puis copie en cache si le réseau échoue (HTML rendu côté serveur de la dernière visite en ligne).
- **`/_nuxt/*`** (fichiers versionnés par empreinte) : cache d'abord.
- **À l'activation** : `clients.claim()`. La page envoie ensuite au service worker la liste de ses ressources déjà chargées (`performance.getEntriesByType('resource')` filtrée sur `/_nuxt/`), et précharge explicitement le morceau `jsqr`, pour que tout soit en cache dès la première visite.
- **Nettoyage** : les caches `salm-controle-*` d'une version précédente sont supprimés à l'activation, et le cache est vidé avec le stockage local : à la déconnexion, par le minuteur de fin de salon si la page est ouverte, sinon à la première ouverture de la page ou de l'admin après la fin du salon (FR-239).
- **`/api/*`** : jamais mis en cache par le service worker. Les données hors ligne passent par le stockage local (R7).
- **HTML sans données personnelles** : la page de contrôle ne charge aucune donnée pendant le rendu serveur (pas de `useFetch` ni de `useAsyncData` côté serveur). Le HTML mis en cache ne contient donc que la structure et les libellés, jamais de nom ni de numéro de badge.

La page affiche un indicateur **« Prêt hors ligne »** quand trois conditions sont réunies : le service worker contrôle la page, la précharge est à jour et le moteur de lecture est chargé. Le quickstart demande de le vérifier sur chaque téléphone le matin.

**Justification** :
- Sans service worker, un téléphone redémarré pendant une coupure ne peut plus afficher la page, alors que FR-234 exige de garder et renvoyer les entrées.
- Une portée limitée à `/admin/salm/controle` ne touche ni le site public ni le reste de l'admin : aucun risque de servir une page publique périmée.
- Écrit à la main : aucune dépendance ni aucun module ; le comportement se lit et se teste en entier.

**Alternatives écartées** : `@vite-pwa/nuxt` (module entier, manifeste d'application et précache de tout le site pour un seul écran ; configuration plus complexe à restreindre) ; aucun service worker (la page doit alors rester ouverte pendant toute coupure, ce qui contredit FR-234).

---

## R7. Stockage local sur le téléphone

**Décision** : `localStorage`, avec des clés versionnées préfixées `salm-controle:v1:` :

- `snapshot` : précharge (R5) et date ;
- `queue` : entrées en attente d'envoi ;
- `session` : marqueur de dernière session admin valide et date de fin du salon ;
- `prefs` : son activé ou non.

Toutes les lectures et écritures passent par un petit module (`app/utils/salm-control-storage.ts`), protégé par `try/catch`. L'écriture de la file est **synchrone** et faite **avant** d'afficher « Entrée validée » hors ligne (SC-005).

**Justification** :
- Volume inférieur à 1 Mo, bien sous la limite de 5 Mo par origine.
- L'écriture synchrone garantit que l'entrée est sur le disque avant l'affichage vert, même si le téléphone s'éteint aussitôt.
- Aucune dépendance.

**Alternatives écartées** : IndexedDB, directement ou avec `idb-keyval` (asynchrone : une fenêtre existe entre l'affichage et l'écriture ; plus de code pour un volume qui ne l'exige pas) ; Cache Storage pour les données (conçu pour des réponses HTTP, pas pour une file modifiable).

**Limites connues** : un navigateur en navigation privée peut refuser le stockage. La page le détecte et affiche « Mode hors ligne indisponible sur ce navigateur ». iOS efface les données d'un site non visité pendant 7 jours, ce qui est sans effet sur une journée de salon et contribue à l'effacement (FR-239).

---

## R8. Session, connexion et page hors ligne

**Décision** :

- **Layout** : la page de contrôle utilise un layout dédié plein écran, `app/layouts/salm-controle.vue`, sans barre latérale admin. Ce layout vérifie la session avec **tolérance au réseau** :
  - si `/api/auth/me` répond `admin: false`, retour à `/admin/login?redirect=/admin/salm/controle` ;
  - si l'appel **échoue faute de réseau** et que le marqueur `session` local existe (posé à la dernière vérification réussie), la page s'ouvre en mode hors ligne ;
  - sans marqueur, la page affiche « Connexion requise : ouvrez cette page avec du réseau ».
- **Retour après connexion** (C2) : `login.vue` accepte `?redirect=`, limité aux chemins qui commencent par `/admin/` (pas de redirection ouverte). `app/layouts/admin.vue` transmet ce paramètre lors de sa propre redirection.
- **Session expirée pendant le contrôle** : une API qui répond 401 donne le résultat « Non vérifié — Session expirée », avec un bouton « Se reconnecter » vers la connexion avec `redirect`. La file locale est **conservée** (elle part après reconnexion).
- **Déconnexion** (`useAdmin().logout`) : avertissement si la file n'est pas vide (FR-238), puis effacement des clés `salm-controle:*` et des caches du service worker (FR-239).

**Justification** : le serveur protège toutes les données (`/api/admin/*`). Le marqueur local ne donne accès qu'aux données déjà présentes sur ce téléphone, ce qui ne change rien au modèle de menace retenu en Q2.

**Alternatives écartées** : allonger la durée de session (sans effet sur la purge des cookies par iOS et hors sujet) ; réutiliser `layouts/admin.vue` (redirection sur toute erreur réseau, C1).

---

## R9. Jour contrôlé, horloge et mode essai

**Décision** :

- **Jour contrôlé** : le `SalmDay` de l'édition publiée dont `date === new Date().toISOString().slice(0, 10)`. Abidjan est à UTC+0 sans heure d'été (convention de 006). Il est calculé par le serveur en ligne, et par le téléphone hors ligne à partir de la liste des jours préchargée.
- **Changement de date** à minuit : réévaluation à chaque scan et toutes les minutes (US-edge « changement de jour »).
- **Mode essai** : aucun jour ne correspond. Le serveur répond avec `trial: true` et **n'écrit rien** ; le poste n'ajoute rien à la file.
- **Heure des entrées hors ligne** : `scannedAt` vient de l'horloge du téléphone. Le serveur la **borne** à l'intervalle `[dayId.date 00:00Z, min(maintenant, dayId.date 23:59:59Z)]` et refuse les éléments dont le `dayId` n'appartient pas à l'édition publiée (statut `OUT_OF_EDITION`). Le poste compare aussi `serverTime` (précharge) à son horloge et affiche un avertissement au-delà de 5 minutes d'écart.

**Justification** : aucun champ de fuseau à gérer ; le mode essai permet la répétition de la veille sans polluer les compteurs (Edge Cases de la spec).

---

## R10. Relecture du même badge et cadence

**Décision** :

- Le poste garde en mémoire `{ texte lu, instant du résultat }`. Une lecture identique dans les **5 s** qui suivent son résultat est ignorée (FR-210), sans appel réseau. Une lecture différente est traitée aussitôt.
- Pendant un appel en cours, les nouvelles lectures sont ignorées ; la réponse arrive en moins d'une seconde.
- **Extraction du jeton** (`extractVerifyToken`, `shared/utils/salm-control.ts`) : chercher `/salm/v/([A-Za-z0-9_-]{22})` dans le texte lu, **quel que soit le domaine**. Sinon, résultat « Ce QR code n'est pas un badge SALM » (FR-206), sans appel au serveur.

**Justification** : sans ce délai, un badge laissé devant l'objectif passerait du vert à l'ambre en 150 ms (US1-8).

---

## R11. Retours visuels, sonores et tactiles ; écran allumé

**Décision** :

- **Palette** : fond plein ; couleur, icône et mot distincts pour chaque état (FR-208). Contrastes calculés selon WCAG :

| État | Fond | Texte | Contraste |
|---|---|---|---|
| Entrée validée | `#14532D` | `#FFFFFF` | 9,11:1 |
| Déjà entré·e | `#FBBF24` | `#1C1917` | 10,48:1 |
| Badge refusé | `#991B1B` | `#FFFFFF` | 8,31:1 |
| Non vérifié | `#334155` | `#FFFFFF` | 10,35:1 |

- **Tailles** : mot d'état en capitales de 44 px (`text-[2.75rem]`), nom de 30 px (`text-3xl`) avec retour à la ligne, commandes de 56 px de haut dans le tiers bas de l'écran.
- **Vibration** : `navigator.vibrate` avec les motifs `[80]`, `[80, 80, 80]` et `[400]`. **Non disponible sur iOS Safari** : le retour non visuel y repose sur le son.
- **Son** : 3 bips courts de fréquences distinctes, générés par `AudioContext` (aucun fichier). Désactivable, et activé par le premier geste (règle de lecture automatique).
- **Écran allumé** : `navigator.wakeLock.request('screen')`, demandé de nouveau à chaque `visibilitychange`. Disponible sur Chrome Android et Safari iOS 16.4+. Absent : pas d'erreur, un conseil de réglage est affiché dans l'aide.

**Justification** : un contraste d'au moins 7:1 (niveau AAA) reste lisible en plein soleil ; la vibration seule ne couvre pas iOS.

---

## R12. URL du QR code : page publique indépendante du jeton (clarification Q5)

**Décision** :

- **`app/pages/salm/v/[token].vue`**, pour un visiteur non connecté : le rendu ne dépend **que** de l'édition publiée, via le `GET /api/salm/edition` existant. Il affiche :
  - « Ce QR code est un badge du SALM <année>. Présentez-le à l'entrée » ;
  - les jours et leurs horaires, le lieu, un lien vers `/salm`.

  Sans édition publiée : « La prochaine édition du SALM sera bientôt annoncée ». Aucune requête ne lit le jeton, ce qui donne un contenu, un code de statut et une durée identiques pour tout jeton (FR-222, SC-004).
- **Suppression de `GET /api/salm/verify/:token`** et du type `SalmVerifyResponse`. Plus aucune route publique ne répond sur la validité d'un jeton.
- **Administrateur connecté** : après hydratation, la page appelle `useAdmin().checkSession()`. Si la session est valide, elle interroge `GET /api/admin/salm/control/lookup?token=…` et affiche la validité, avec les mêmes états que la page de contrôle, ainsi que le bouton « Contrôler ce badge ». Ce bouton ouvre `/admin/salm/controle?token=…`, qui affiche la fiche **sans enregistrer d'entrée** (FR-223, FR-222a). Le rendu serveur est toujours celui du visiteur anonyme : aucun indice dans le HTML.

**Justification** : la seule façon de ne rien révéler est de ne jamais lire le jeton sur la route publique.

**Alternatives écartées** : garder l'API et masquer la validité à l'affichage (la réponse JSON la révélerait encore) ; rediriger vers `/salm` (écartée par la clarification Q5).

---

## R13. Inscription sur place par l'équipe (clarification Q3)

**Décision** : `POST /api/admin/salm/control/registrations` réutilise la chaîne existante sans la dupliquer :

- `pickStudentFields` et `validateStudent`, mêmes codes d'erreur que le formulaire public, traduits dans la page de contrôle au vouvoiement ;
- `createStudentRegistration(editionId, data, { origin: 'onsite' })`, avec un nouveau paramètre optionnel ;
- **pas** d'`assertHuman` ni de limitation anti-rafale : route admin ;
- champ `informed: true` obligatoire (FR-243) ; sinon `400 VALIDATION`, erreur `informed: 'REQUIRED'` ;
- refus hors d'un jour de salon de l'édition publiée (`409 NOT_A_SALON_DAY`) ; **ignore l'interrupteur** d'inscription publique (FR-246) ;
- téléphone déjà inscrit : `{ kind: 'existing' }`, et la réponse renvoie la **fiche** de contrôle existante (FR-245), sans comparer le nom (l'admin voit le nom) ;
- après création, l'entrée du jour est enregistrée par la même fonction que R4 (`recordEntry`, mode `manual`). Si cette seconde étape échoue, l'inscription reste créée et la réponse le signale, et l'administrateur peut valider l'entrée par la fiche.

**Origine** : nouvelle colonne `origin` sur `SalmStudentRegistration` (`'online'` par défaut, `'onsite'`), qui alimente le marqueur « Sur place » et la colonne CSV « Origine » (FR-247).

**Affiche d'inscription** (FR-241) : page admin imprimable `app/pages/admin/salm/controle/affiche.vue`, au format A4 avec `@page { size: A4 }`, et QR code SVG produit par le serveur (`qrcode`). Le même SVG est inclus dans la précharge, pour être affiché hors ligne (FR-240).

**Adresses courtes** (FR-201, FR-240), par `routeRules` redirect dans `nuxt.config.ts` :

| Adresse courte | Destination |
|---|---|
| `/controle` | `/admin/salm/controle` |
| `/inscription` | `/salm/inscription-etudiant` |

Aucune page existante n'occupe ces chemins. Le QR code de l'affiche encode `${siteUrl}/inscription`.

---

## R14. Compteurs sur la page de contrôle et dans le back-office

**Décision** :

- **Page de contrôle** : compteurs de la précharge, mis à jour localement après chaque entrée ou annulation, puis remplacés par ceux de `GET /control/state` toutes les **15 s** (inférieur aux 30 s de FR-224). Hors ligne : dernier total connu plus les entrées en file, avec la mention « hors ligne ».
- **Liste des étudiant·e·s** (`GET …/students`, existante et étendue) :
  - `dayCounts: [{ dayId, label, date, entries }]`, par `groupBy dayId` sur `SalmEntry` joint à l'édition ;
  - par ligne, `entries: { [dayId]: 'HH:MM' }` et `origin` ;
  - nouveau filtre `presence=present:<dayId>` ou `absent:<dayId>`, traduit en `entries: { some: { dayId } }` ou `none`, combiné à `studentWhere`.
- **Export** (`GET …/students/export`, étendu) : une colonne par jour, « Présent <label> (<JJ/MM/AAAA>) » à `Oui`/`Non`, plus la colonne « Origine ». Mêmes filtres que la liste, présence comprise.

**Justification** : `studentWhere` reste la source unique des filtres (liste et export), comme en 006.

---

## R15. Suppression des données personnelles : compteurs d'entrées conservés

**Décision** : `computePurgedStats()` ajoute `students.entriesByDay: Record<'AAAA-MM-JJ', number>`, champ **facultatif** dans `SalmPurgedStats` (les compteurs déjà conservés n'en ont pas). La suppression des entrées est obtenue par la cascade des `deleteMany` d'inscriptions, dans la même transaction. La vue statistiques de 007 n'affiche pas ce champ (hors périmètre de la spec) ; il reste consultable dans les données.

---

## R16. Charge et performances

- **Scan en ligne** : 1 lecture indexée (`verifyToken` unique), 1 lecture du jour (index `[editionId, date]` unique), 1 insertion. Largement sous 50 ms côté serveur ; le budget d'une seconde (FR-211) est consommé par le réseau mobile.
- **Rafraîchissement** : N postes × 1 requête toutes les 15 s (index `[dayId, enteredAt]`). Précharge : N × 1 toutes les 5 min (~120 Ko compressés). Pour 10 postes, environ 0,7 requête par seconde : négligeable pour Nitro et SQLite.
- **Cadence** : une lecture native est quasi instantanée ; avec jsQR à 8 images/s, un QR code est lu en 125 à 500 ms. Avec la réponse réseau, le cycle complet tient sous 3 s (SC-001).

---

## R17. Récapitulatif des décisions

| # | Sujet | Décision |
|---|---|---|
| R1 bis | Lecture du QR code | `BarcodeDetector` natif, repli `jsqr` chargé à la demande ; `barcode-detector` (zxing-wasm) en plan B mesuré |
| R2 | Caméra | `getUserMedia` caméra arrière, `playsinline`, HTTPS existant ; vérifier le renouvellement du certificat avant le salon |
| R3 | Table des passages | `SalmEntry`, `@@unique([registrationId, dayId])`, cascades |
| R4 | Double scan | Insertion optimiste, P2002 → « déjà entré·e » avec l'heure existante |
| R5 | Hors ligne | Précharge avec jeton haché, en ligne d'abord avec délai de 3 s, file locale, synchronisation qui garde l'heure la plus ancienne |
| R6 | Page hors ligne | Service worker écrit à la main, portée `/admin/salm/controle` |
| R7 | Stockage | `localStorage` synchrone, clés versionnées |
| R8 | Session | Layout dédié tolérant au réseau, `?redirect=` sur la connexion |
| R9 | Jour contrôlé | Date UTC (= Abidjan), mode essai sans écriture, heure hors ligne bornée |
| R10 | Relecture | Même contenu ignoré 5 s ; jeton extrait quel que soit le domaine |
| R11 | Retours | Palette AAA, vibration (pas sur iOS), son, écran maintenu allumé |
| R12 | URL du QR code | Page publique sans lecture du jeton ; API publique de vérification supprimée ; validité réservée à l'admin |
| R13 | Inscription sur place | Réutilise validation et création, `origin = 'onsite'`, entrée enregistrée dans la foulée ; adresses courtes `/controle`, `/inscription` |
| R14 | Compteurs | Rafraîchissement toutes les 15 s ; liste et export étendus (présence, origine) |
| R15 | Données supprimées | `entriesByDay` dans les compteurs conservés |
