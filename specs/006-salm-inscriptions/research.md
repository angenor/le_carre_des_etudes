# Research — Module SALM (1/3)

**Feature**: `006-salm-inscriptions` · **Date**: 2026-09-27 · **Spec**: [spec.md](./spec.md)

Chaque section suit le format **Décision / Justification / Alternatives écartées**. L'inventaire de l'existant (sous-agents de recherche, serveur et front) est résumé en fin de document (§ R15).

---

## R1. Génération du badge PDF côté serveur

**Décision** : **`pdf-lib` + `@pdf-lib/fontkit` + `qrcode`**, PDF **généré à la volée** à chaque téléchargement, jamais stocké.

- Format : 2 pages de 283,46 × 425,20 pt (10 × 15 cm), page 1 = recto, page 2 = verso, conformes à `badge-etudiant.dc.html`.
- QR code : `QRCode.create(url, { errorCorrectionLevel: 'M' })` donne la matrice de modules, dessinée en rectangles vectoriels avec `page.drawRectangle` (net à toute taille d'impression, pas d'image PNG intermédiaire). Zone de silence de 2 modules sur fond blanc, 120 pt de côté au recto (soit environ 4,2 cm, bien lisible).
- Le même module `qrcode` produit l'aperçu SVG affiché à l'écran « Félicitations » (`QRCode.toString(url, { type: 'svg', margin: 1 })`), renvoyé par l'API. `qrcode` n'est donc jamais chargé côté client.
- Format : `page.setSize(283.46, 425.20)`, soit 100 × 150 mm exactement (FR-030) ; pas de marge d'impression intégrée.
- QR code : module calculé pour que le carré de données mesure au moins 25 mm (≈ 71 pt), plus 2 modules de zone de silence blanche (FR-030a). Le gabarit de la maquette prévoit environ 120 pt, soit plus de 40 mm.
- Nom (FR-030b) :
  1. conversion `toLocaleUpperCase('fr-FR')` ;
  2. découpage en mots, puis recherche de la plus grande taille, de 25 pt à 14 pt par pas de 0,5 pt, à laquelle le nom tient sur **2 lignes au plus** dans la largeur utile (`font.widthOfTextAtSize`, césure aux espaces, ou après un trait d'union si un mot seul dépasse la largeur) ;
  3. à défaut, **3 lignes à 14 pt**.

  Avec la limite de 60 caractères (FR-020a) et la largeur utile d'environ 250 pt, 3 lignes à 14 pt suffisent toujours : Montserrat 800 fait environ 10 pt par capitale à 14 pt, soit environ 25 caractères par ligne. **Jamais de troncature.**
- Glyphes manquants (FR-030c) : avant le dessin, chaque caractère est vérifié dans le jeu de caractères de la police (`fontkit` : `font.hasGlyphForCodePoint`). Un caractère absent est remplacé par sa décomposition NFD sans diacritiques (`Ș` → `S`), et en dernier recours supprimé. Seul le texte dessiné dans le PDF est modifié, jamais la donnée enregistrée.
- Temps de génération attendu : moins de 100 ms (polices en cache mémoire, cf. R2), compatible avec SC-002 (< 3 s).

**Justification** :
- Pur JavaScript, aucune dépendance native ni navigateur : l'image Docker `node:22-slim` ne change pas.
- Fonctionne dans le bundle Nitro, sans lecture de fichiers de données à l'exécution, contrairement à pdfkit.
- API bas niveau suffisante pour un gabarit fixe de 2 pages.
- `pdf-lib` 1.17.1 n'évolue plus depuis 2021 mais reste stable et très utilisé. Le fork maintenu `@cantoo/pdf-lib` a la même API et sert de repli si un bug bloquant apparaît.

**Alternatives écartées** :

| Option | Pourquoi non |
|---|---|
| Puppeteer / Playwright (HTML → PDF) | Chromium headless, soit environ 300 Mo dans l'image, et une consommation mémoire incompatible avec le VPS. Exclu par la demande. |
| `pdfkit` | Charge ses polices AFM et ses données par `fs` à l'exécution, ce qui pose des problèmes connus de bundling avec Nitro/rollup. API en flux plus lourde pour un gabarit fixe. |
| `@react-pdf/renderer` | Tire React et un moteur de mise en page, disproportionné pour 2 pages. |
| `jsPDF` | Pensé pour le navigateur. Les polices personnalisées passent par une conversion base64 (VFS) et le support serveur est moins solide. |
| Génération côté client | L'admin doit produire exactement le même PDF (FR-031). Le rendu dépendrait du téléphone de l'étudiant·e, et le QR code comme les polices pèseraient sur le bundle public. |
| PDF stocké sur disque | Duplique des données personnelles, doit être invalidé à la suppression (FR-065) et prend du volume disque. La régénération est déterministe et rapide. |

## R2. Polices embarquées dans le PDF

**Décision** : fichiers **TTF statiques complets**, couvrant le **Latin étendu** (Latin-1, Latin Extended-A et B : exigence FR-030c), sous licence SIL OFL, téléchargés une fois depuis Google Fonts et versionnés avec leur `OFL.txt`) placés dans `server/assets/fonts/salm/` :

- `montserrat-400.ttf`, `montserrat-500.ttf`, `montserrat-600.ttf`, `montserrat-800.ttf`, `montserrat-900.ttf` ;
- `dm-sans-400.ttf`, `dm-sans-600.ttf`, `dm-sans-700.ttf` ;
- `yellowtail-400.ttf`.

Ils sont lus via le stockage d'assets serveur de Nitro (`useStorage('assets:server').getItemRaw('fonts/salm/…')`), donc embarqués dans `.output` et sans chemin disque à gérer en production. Les octets sont chargés une seule fois puis mis en cache dans une variable de module.

Intégration avec `pdfDoc.registerFontkit(fontkit)` et `embedFont(bytes, { subset: true })`. Avec le sous-ensemble, le PDF fait quelques dizaines de Ko ; sans, environ 1 Mo. Le quickstart vérifie les majuscules accentuées (É È Ê À Ç Ï Ô Ù) et l'apostrophe typographique ’. En cas de glyphe manquant (bug connu du subsetting de fontkit sur certaines polices), passer `subset: false` pour la police concernée.

**Alternatives écartées** : les polices standard PDF (Helvetica) n'ont ni Yellowtail ni Montserrat, et leur encodage WinAnsi limite certains caractères ; les polices variables ne sont pas gérées de façon fiable par fontkit dans pdf-lib.

## R3. Polices web (Montserrat, DM Sans, Yellowtail)

**Décision** : polices **auto-hébergées en WOFF2**, déclarées **uniquement sur les pages SALM**.

- Fichiers dans `public/fonts/salm/` : `montserrat-latin-wght.woff2` et `dm-sans-latin-wght.woff2` (variables, sous-ensemble latin + latin-ext), `yellowtail-latin-400.woff2`.
- Les `@font-face` (avec `font-display: swap`) sont dans `app/assets/css/salm.css`, importé seulement par les composants `app/components/salm/*` et les pages `app/pages/salm/*`. Nuxt/Vite extrait ce CSS dans le chunk de ces routes : les autres pages ne le chargent pas.
- Sur `/salm`, `useHead` précharge Montserrat (`<link rel="preload" as="font" type="font/woff2" crossorigin>`).
- Les jetons Tailwind v4 sont ajoutés dans `app/assets/css/main.css` via `@theme` : `--color-salm-accent: #D5570B`, `--color-salm-accent-text: #F4792B`, `--color-salm-bg: #0B0B0D`, `--color-salm-surface: #141417`, `--color-salm-surface-2: #16161A`, `--color-salm-surface-3: #1C1C21`, `--color-salm-border: #2A2A31`, `--font-salm-title`, `--font-salm-body`, `--font-salm-script`. Tailwind v4 ne génère que les utilitaires utilisés, donc le coût est négligeable pour le reste du site. L'ambre du site reste `amber-400` (#FBBF24).

**Justification** :
- Aucun appel à un domaine tiers (pas de fuite d'IP vers Google, pas de résolution DNS supplémentaire sur réseau mobile).
- Aucun module ajouté (constitution IV).
- Le reste du site n'est pas alourdi.

**Alternatives écartées** :
- `<link>` Google Fonts via `useHead` sur `/salm` : dépendance tierce, requête bloquante et vie privée.
- `@nuxt/fonts` : module supplémentaire alors que 3 fichiers suffisent ; sa configuration globale dépasse le besoin.

## R4. Numérotation des badges

**Décision** : compteur monotone **`SalmEdition.lastBadgeSeq`**, incrémenté dans une **transaction interactive Prisma** qui crée aussi l'inscription :

```text
prisma.$transaction(async (tx) => {
  const ed = await tx.salmEdition.update({ where: { id }, data: { lastBadgeSeq: { increment: 1 } }, select: { lastBadgeSeq: true } })
  return tx.salmStudentRegistration.create({ data: { …, badgeSeq: ed.lastBadgeSeq } })
})
```

- SQLite n'admet qu'un seul écrivain. L'`UPDATE` pose le verrou d'écriture, donc deux transactions concurrentes sont sérialisées et ne peuvent pas lire la même valeur.
- Filet de sécurité : `@@unique([editionId, badgeSeq])`.
- Si la création échoue (par exemple doublon de téléphone), la transaction est annulée et le compteur n'avance pas. Il n'y a donc pas de trou pour une inscription refusée.
- **Sérialisation des créations dans le processus** (constat F14 de l'analyse) : le comportement de plusieurs transactions interactives Prisma 7 simultanées sur l'adaptateur `better-sqlite3` (connexion unique) n'est pas garanti. Il pourrait produire des erreurs de verrou (`SQLITE_BUSY`) ou de transaction imbriquée plutôt que des doublons. Les créations d'inscriptions étudiantes passent donc par une **file d'attente en mémoire** (`withStudentCreationLock`, une chaîne de promesses d'une dizaine de lignes). Le conteneur étant unique et mono-processus, cela suffit ; le coût est négligeable (une création prend quelques millisecondes). Les contraintes d'unicité restent le filet de sécurité.
- **Doublon (`P2002`)** (constat F4) : le champ en cause est lu dans `error.meta` (`target`, ou l'erreur d'adaptateur selon la version de Prisma) :
  - `phone` → l'inscription existe : traitement « déjà inscrit·e » ;
  - `verifyToken` ou `downloadToken` → nouveaux jetons et nouvelle tentative, 3 au plus ;
  - `badgeSeq` ou champ non identifié → erreur 500 journalisée, sans donnée personnelle dans le journal.
- **Jamais de `MAX(badgeSeq) + 1`** : une suppression ferait réattribuer un numéro, ce que FR-026 interdit. Le compteur de l'édition ne recule jamais.
- Affichage : `formatBadgeNumber(year, seq)` donne `SALM27-000482` (`SALM` + 2 derniers chiffres de l'année + `-` + numéro sur 6 chiffres). Seul l'entier est stocké, la chaîne est calculée.

**Alternatives écartées** :
- `autoincrement` global : pas séquentiel par édition.
- `COUNT(*) + 1` : collisions en concurrence et réattribution après suppression.
- UUID ou code aléatoire : ne répond pas au besoin « séquentiel » ni au format de la maquette.

## R5. Jetons : QR code (vérification) et téléchargement

**Décision** : **deux jetons aléatoires distincts** par inscription, de 128 bits chacun (`crypto.randomBytes(16).toString('base64url')`, 22 caractères) :

| Jeton | Usage | Exposé à |
|---|---|---|
| `verifyToken` | URL encodée dans le QR code : `<siteUrl>/salm/v/<verifyToken>`. La page publique ne révèle que l'édition et la validité (FR-028) ; la feature C l'utilisera pour le scan. | Quiconque voit le badge |
| `downloadToken` | URL de téléchargement du PDF : `/api/salm/badges/<downloadToken>` | Seulement l'inscrit·e, dans la réponse de l'API après inscription ou récupération (téléphone + nom), et l'admin |

**Justification** : le PDF contient le nom. Si le jeton du QR code permettait de télécharger le PDF, scanner un badge révélerait des données personnelles, contrairement à FR-028 et à la règle de la feature C. Deux colonnes suffisent : pas de secret serveur à gérer, pas d'expiration à calculer. Chaque jeton a une contrainte `@unique` ; la probabilité de collision est négligeable et une violation déclenche une nouvelle tentative.

- `siteUrl` : nouvelle clé `runtimeConfig.public.siteUrl`, par défaut `https://lecarredesetudes.com` et surchargeable par `NUXT_PUBLIC_SITE_URL`. C'est la valeur aujourd'hui codée en dur dans `app/app.vue`. Chemin court `/salm/v/…`, pour un QR code peu dense (version 3 ou 4).

**Alternatives écartées** :
- URL signée HMAC avec expiration : il faudrait un secret de configuration, alors que `NUXT_SESSION_SECRET` n'est même pas défini en production aujourd'hui (§ R15). Un lien expiré casserait aussi le parcours « badge perdu ».
- Numéro de badge dans le QR code : devinable.
- Jeton unique pour les deux usages : fuite de données personnelles au scan.

## R6. Normalisation du téléphone et du nom

**Décision** : fonctions pures dans `shared/utils/`, auto-importées côté app et serveur (Nuxt 4), et importées explicitement par `#shared/utils/…` dans les fichiers serveur, pour suivre le style d'import explicite du dépôt.

- `normalizeIvorianPhone(raw, { landline = false })` :
  1. retirer espaces, points, tirets et parenthèses ;
  2. retirer un préfixe `+225` ou `00225` si le reste fait 10 chiffres ;
  3. valider `^(01|05|07|27)\d{8}$` pour les étudiant·e·s, ou `^(01|05|07|21|25|27)\d{8}$` avec `landline: true` pour les établissements et exposants ;
  4. renvoyer la forme à 10 chiffres, ou `null`.
- Stockage et unicité sur la forme normalisée : `@@unique([editionId, phone])`.
- `formatIvorianPhone('0712345678')` renvoie `07 12 34 56 78` (affichage et CSV).
- `IVORIAN_PHONE_REGEX` (celle de `DownloadModal.vue`) est déplacée telle quelle dans `shared/utils/phone.ts` et réutilisée par le module magazine sans changement de comportement.
- `validateStudentName(name)` (FR-020a) : réduction des espaces, puis 2 à 60 caractères, au moins 2 lettres, et motif `^[\p{L}\p{M} .'’-]+$` (drapeau `u`). Tout chiffre, émoji ou symbole donne `INVALID_CHARS`. Le champ porte aussi `maxlength="60"` côté client.
- `nameMatchKey(name)` : NFD, suppression des diacritiques, minuscules, tout caractère non alphanumérique (apostrophes, tirets) remplacé par un espace, découpage, tri des mots, jointure par un espace. Ainsi `« KOUASSI Aya-Marie »` et `« aya marie kouassi »` donnent tous deux `aya kouassi marie` (FR-025). La clé est calculée à la volée : on compare une seule ligne, celle trouvée par téléphone.
- `nameSearchKey(name)` : même normalisation **sans tri**, stockée dans la colonne `nameSearch` pour la recherche admin insensible aux accents (FR-062). Le `LIKE` de SQLite ne gère pas les accents, d'où la colonne.

**Alternatives écartées** :
- Comparaison exacte du nom : trop fragile (ordre nom/prénoms, accents).
- Distance de Levenshtein : tolérance floue qui affaiblit la protection voulue en clarification.
- Extension ICU de SQLite : dépendance native.

## R7. Modélisation Prisma complète — justification YAGNI

Le principe II interdit d'anticiper des besoins hypothétiques. Ici, la spec (FR-005) et la feature B déjà spécifiée font de ces entités un **besoin concret** : la page `/salm` les **affiche dès cette feature**, et B n'ajoutera que des écrans. Chaque table est justifiée par un usage de la feature A, et tout ce qui peut être une colonne l'est.

Deux colonnes supplémentaires sur `SalmEdition`, et non une table : `personalDataPurgedAt` et `purgedStats` (JSON), écrites une seule fois par la suppression des données (R16).

| Table | Usage dans la feature A | Pourquoi une table, et pas une colonne ou du code |
|---|---|---|
| `SalmEdition` | Page, badge, formulaires, toggles, compteur | Entité racine multi-édition, exigée par « sans redéveloppement » |
| `SalmDay` | Chronogramme (onglets mobiles), verso du badge (horaires par jour), compte à rebours, fermeture automatique (FR-053) | Horaires propres à chaque jour, ordonnés ; porte les créneaux |
| `SalmSlot` | Chronogramme, avec le créneau « mis en avant » du magazine | Liste ordonnée par jour, avec type et mise en avant |
| `SalmHighlight` | 5 temps forts du programme | Liste ordonnée titre + photo |
| `SalmVideo` | « Le canapé du SALM » | Liste ordonnée, rattachée à l'édition d'origine (clarification Q2) |
| `SalmPhoto` | Catalogue photos | Liste ordonnée, rattachée à l'édition d'origine (clarification Q2) |
| `SalmStandType` | Étape 2 du formulaire établissement, clé étrangère des inscriptions | Référencé par une clé étrangère `Restrict` : un type choisi ne peut pas être supprimé (règle de la feature B) |
| `SalmStudentRegistration` | Inscription, badge, back-office | Données saisies, unicité (édition, téléphone) |
| `SalmSchoolRegistration` | Inscription établissement, suivi | Données saisies, statut, note |

**Colonnes JSON plutôt que tables** (Prisma prend en charge `Json` sur SQLite depuis la version 6.2) :

| Donnée | Pourquoi du JSON |
|---|---|
| `SalmEdition.contacts` (téléphones, e-mail, adresse) | Jamais interrogés, toujours lus avec l'édition, moins de 5 éléments |
| `SalmEdition.audiences` (3 cartes « Pourquoi le SALM ? ») | Jamais interrogées, toujours lues avec l'édition, moins de 5 éléments |
| `SalmSchoolRegistration.programmes` (`string[]`) | Liste fermée de 5 valeurs, affichée ou exportée d'un bloc |
| `SalmSchoolRegistration.exhibitors` (`{ fullName, contact }[]`, 1 à 6) | Écrits et lus uniquement avec l'établissement, jamais recherchés, et hors du périmètre de la feature C (pas de contrôle des exposants). La demande parle de « SalmSchoolRegistration et ses exposants » : une table `SalmExhibitor` n'apporterait qu'une jointure. Si un besoin réel apparaît (recherche par exposant), la migration vers une table sera simple. |

**Écarté** : table `SalmContact` ou `SalmAudience` (cf. JSON), table `SalmExhibitor` (cf. JSON), table des présences (la feature C la créera en la rattachant à `SalmStudentRegistration`), enum de fuseau horaire (Abidjan est à UTC+0 sans heure d'été : constante).

Détails complets : [data-model.md](./data-model.md).

## R8. Seed idempotent (éditions 2026 et 2027)

**Constat** : le dépôt n'a aucun mécanisme de seed (ni `prisma.seed`, ni script, ni entrée dans `prisma.config.ts`).

**Décision** : **seed Prisma standard**, lancé par `pnpm prisma db seed`.

- `prisma.config.ts` : `migrations.seed = 'tsx prisma/seed.ts'`.
- `prisma/seed.ts` : point d'entrée qui appelle `seedSalm()`.
- `prisma/seed/salm-data.ts` : données (textes des brouillons et de la maquette).
- `prisma/seed/salm.ts` : logique d'upsert.
- Le seed importe **le singleton `server/utils/prisma.ts`** (module pur, sans auto-import Nuxt), conformément à la constitution III.
- Nouvelle dépendance de dev : `tsx`.

**Règles d'idempotence** (le seed peut être relancé autant de fois que nécessaire ; jusqu'à la feature B, c'est lui qui met à jour le contenu) :

| Données | Traitement |
|---|---|
| Éditions | `upsert` par `year` (unique). À la création : statut (`archived` pour 2026, `published` pour 2027), toggles ouverts pour 2027, `lastBadgeSeq = 0`. À la mise à jour : **seulement les champs de contenu**. Statut, toggles et `lastBadgeSeq` ne sont jamais écrasés. |
| `SalmDay` | `upsert` par `(editionId, date)` |
| `SalmSlot` | Supprimés puis recréés pour les jours de l'édition (aucune clé étrangère entrante) |
| Temps forts, vidéos, photos | Supprimés puis recréés par édition (aucune clé étrangère entrante) |
| `SalmStandType` | `upsert` par `(editionId, name)`, **jamais supprimés**, car référencés par les inscriptions (`Restrict`) |
| Inscriptions | Jamais touchées |

**Médias du seed** :
- Les images de la maquette sont copiées dans `public/salm/2026/` (photos du catalogue, affiche de la vidéo récapitulative) et `public/salm/2027/` (affiche, temps forts), sous des noms en `[a-z0-9-]`. Ce sont des fichiers statiques versionnés, servis depuis `.output/public` et indépendants du volume `uploads`.
- Les visuels HD viendront plus tard par les uploads de la feature B, dans `public/uploads/salm/`.
- **Données manquantes** : les URL YouTube de la vidéo récapitulative 2026 et des 9 vidéos du canapé ne figurent dans aucune source. Le seed les prévoit dans `salm-data.ts` mais les laisse vides. Tant qu'elles manquent, le bouton « Revivre le SALM » et la section « Le canapé » sont masqués (FR-004), et le fond du hero reste l'image de secours.

**Production** :
- Le conteneur n'embarque aujourd'hui que `.output`, `prisma/` et `node_modules`, et `node_modules` contient déjà les dépendances de dev, `pnpm install` étant lancé sans `--prod`.
- Le `Dockerfile` copie en plus `app/generated/` et `server/utils/prisma.ts` dans l'étape `production`.
- `deploy.sh` reçoit une commande `seed` : `docker compose exec app npx prisma db seed`.

**Alternatives écartées** :

| Option | Pourquoi non |
|---|---|
| Plugin Nitro qui seed au démarrage | Écritures implicites à chaque redémarrage ; risque d'écraser les modifications faites via la feature B |
| Tâche Nitro (`experimental.tasks`) | L'endpoint des tâches n'existe qu'en dev ; en production, il faudrait une route admin authentifiée impossible à appeler simplement depuis `deploy.sh` |
| Données insérées par migration SQL | Contenu figé dans l'historique des migrations, mise à jour impossible sans nouvelle migration |

## R9. Vidéos YouTube

**Décision** :

**Hero (fond, sans son, en boucle)** :
- **Image de secours rendue en SSR** : `recapPosterPath` de l'édition précédente, sinon l'affiche de l'édition. Elle porte `fetchpriority="high"`, `width` et `height`, et sert d'élément LCP.
- Après montage, côté client uniquement, un `<iframe>` `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&mute=1&loop=1&playlist=<id>&controls=0&playsinline=1&rel=0&disablekb=1&iv_load_policy=3` est injecté par-dessus l'image. Il est `aria-hidden="true"`, `tabindex="-1"`, avec `pointer-events: none` et un dimensionnement « cover » (`width: max(100%, 177.78vh)` centré).
- **L'injection a lieu partout** (mobile compris, quelle que soit la connexion), sauf en `prefers-reduced-motion: reduce`. Décision révisée le 2026-10-04 à la demande du client : la réserve initiale (≥ 768 px, sans `saveData` ni réseau 2G/3G, au nom du principe V) a été levée. Le dimensionnement « cover » se calcule sur le hero (`cqw`/`cqh`), plus haut que l'écran sur mobile.
- **Bouton « Mettre la vidéo en pause » / « Relancer la vidéo »** : obligatoire selon le critère WCAG 2.2.2 (contenu animé automatique de plus de 5 s). Il retire ou réinjecte l'iframe ; le choix est mémorisé en `sessionStorage` (commodité, lecture et écriture dans un `try/catch`).
- Le bouton « Revivre le SALM <année> » ouvre la même vidéo **avec le son** dans la fenêtre vidéo (ci-dessous).

**Vidéos du canapé (chargement différé)** :
- Grille de boutons avec miniature `https://i.ytimg.com/vi/<id>/hqdefault.jpg` (`loading="lazy"`, `alt=""`, le libellé est porté par le bouton : « Lire la vidéo 01 — <titre> »).
- Au clic, ouverture de la fenêtre vidéo, qui monte `<iframe src="…youtube-nocookie.com/embed/<id>?autoplay=1&rel=0" title="<titre>" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen>`.
- À la fermeture, l'iframe est démontée (`v-if`), ce qui arrête la lecture.
- Un lien de secours « Ouvrir sur YouTube » est toujours présent dans la fenêtre (vidéo bloquée ou indisponible).
- L'identifiant YouTube est extrait par `parseYoutubeId(url)` (`shared/utils/salm.ts`), qui accepte les formats `youtu.be/ID`, `watch?v=ID`, `embed/ID` et `shorts/ID`.

**Fenêtre accessible** : composant unique `app/components/salm/modal-dialog.vue` bâti sur l'élément natif **`<dialog>` avec `showModal()`**.
- Le reste de la page devient inerte, ce qui piège le focus.
- `Échap` déclenche l'événement `cancel`, donc la fermeture.
- Le focus revient à l'élément déclencheur à la fermeture (comportement HTML, doublé par une restauration explicite pour les navigateurs anciens).
- Autres attributs : `aria-labelledby` vers le titre, bouton « Fermer » en premier élément focalisable, défilement bloqué par `body:has(dialog[open]) { overflow: hidden }`.
- Ce composant sert à **deux** usages, la vidéo et la galerie photo (FR-017), ce qui satisfait la règle des deux usages de la constitution II.

**Alternatives écartées** :
- Réutiliser `RubriqueLightbox.vue` ou `DownloadModal.vue` : ni l'un ni l'autre n'a `role="dialog"`, de piège de focus ou de restauration du focus (§ R15), et la lightbox est câblée sur une seule image.
- Bibliothèque de focus trap (`focus-trap`, `@vueuse/integrations`) : `<dialog>` natif suffit.
- Lecture automatique du fond sur mobile : consommation de données.
- Lecteur YouTube par l'IFrame API JS : script tiers supplémentaire, inutile pour lecture et arrêt.

## R10. Compte à rebours

**Décision** : composant `app/components/salm/countdown.vue`.
- **Rendu serveur** : texte stable, sans valeur relative (« Ouverture le 12 mars 2027 à 9h30 »). Aucun écart d'hydratation possible.
- **Client** : dans `onMounted`, calcul des jours restants jusqu'à `premierJour.date + opensAt` (UTC+0, soit l'heure d'Abidjan), affichage « OUVERTURE DANS 167 jours » ; recalcul chaque minute par `setInterval`, nettoyé dans `onUnmounted`.
- **États** :

| Moment | Affichage |
|---|---|
| Plus d'un jour avant l'ouverture | « N jours » |
| Jour J avant l'ouverture | « Aujourd'hui, 9h30 » |
| Pendant le salon | « Le SALM 2027 est en cours » |
| Après la fin du dernier jour | « Merci pour cette édition » |

- Pas d'`aria-live`, pour éviter des annonces répétées.
- Les trois comptes à rebours existants (`magazine/[id].vue`, `AlaUneSection.vue`, `MagazineCard.vue`) comptent à la seconde, avec heures, minutes et secondes. Leur factorisation n'est pas dans le périmètre.

**Alternative écartée** : calcul en SSR, qui donne un écart d'hydratation et une valeur figée par le cache.

## R11. Anti-spam

**Décision** : trois barrières sur les `POST` publics (`/api/salm/students`, `/api/salm/students/recover`, `/api/salm/schools`) :

1. **User-Agent** : réutilisation de `isBot()` (`server/utils/is-bot.ts`), qui refuse aussi un User-Agent absent.
2. **Champ piège et délai** :
   - champ `website`, caché visuellement (hors écran, `aria-hidden="true"`, `tabindex="-1"`, `autocomplete="off"`), qui doit rester vide ;
   - champ `startedAt` (horodatage client au montage du formulaire), qui doit dater de plus de 3 s et de moins de 24 h.
   - En cas d'échec : `400 REJECTED`, avec un message générique qui ne donne pas la raison.
3. **Limitation de débit** : nouvel utilitaire `server/utils/rate-limit.ts`, en mémoire, par fenêtre fixe (une `Map` avec purge paresseuse). Le conteneur est unique et mono-processus, donc aucun stockage partagé n'est nécessaire.
   - Clé IP : en-tête **`x-real-ip`** posé par nginx (`$remote_addr`, non falsifiable par le client), sinon adresse du socket. `x-forwarded-for` est ignoré, car son premier élément est fourni par le client.
   - Seuils (constantes en tête de fichier) :

| Clé | Limite |
|---|---|
| Inscriptions et récupérations étudiantes | 30 par 10 min et par IP |
| Échecs « nom différent » | 5 par heure et par téléphone (empêche de deviner un nom, clarification Q1) |
| Établissements | 5 par 10 min et par IP |

   - Au-delà : `429 RATE_LIMITED` avec l'en-tête `Retry-After`.
   - Les seuils IP sont volontairement larges, car les opérateurs mobiles ivoiriens partagent massivement les IP (CGNAT) et le Wi-Fi d'un établissement ou du salon regroupe de nombreux étudiants.

**Alternatives écartées** :
- CAPTCHA (reCAPTCHA, hCaptcha, Turnstile) : tiers, friction, exclu par FR-080.
- `limit_req` nginx : configuration serveur hors dépôt applicatif, sans distinction du motif d'échec.
- Stockage des compteurs en base : écritures inutiles.

## R12. Exports CSV

**Trois exports**, sur le même utilitaire : étudiant·e·s, établissements, « Liste des exposants » (FR-068a, une ligne par exposant, inscriptions annulées exclues).


**Décision** : nouvel utilitaire `server/utils/csv.ts`, `toCsv(header: string[], rows: (string | number | null)[][]): string`. Il :
- préfixe le BOM UTF-8, comme le modèle existant ;
- utilise le **point-virgule** comme séparateur et `\r\n` comme fin de ligne ;
- met chaque champ entre guillemets en doublant les guillemets internes ;
- neutralise les formules : un champ commençant par `=`, `+`, `-`, `@` ou une tabulation est préfixé d'une apostrophe, pour empêcher l'injection de formule quand le tableur ouvre des données saisies par le public.

Il sert aux deux exports SALM (étudiants et établissements).

- **Même modèle que `server/api/downloads/export.get.ts`** : route `GET` authentifiée, en-têtes `Content-Type: text/csv; charset=utf-8` et `Content-Disposition: attachment; filename="salm-2027-etudiants-2026-09-27.csv"`, ouverture côté client par `window.open`.
- **Écart assumé** : point-virgule au lieu de virgule. Excel en français attend `;` (SC-009 : une colonne par champ).
- Les deux exports existants (téléchargements, newsletter) gardent la virgule et leur `escapeCsv` local. Les migrer vers l'utilitaire est une amélioration possible, hors périmètre.

## R13. Protection des routes (middleware admin)

**Décision** : dans `server/middleware/admin.ts`, ajout d'une troisième règle : **tout chemin commençant par `/api/admin/` exige la session admin, quelle que soit la méthode** (constante `ADMIN_ALL_METHODS_PREFIXES = ['/api/admin/']`).
- Toutes les routes d'administration SALM sont sous `/api/admin/salm/*`.
- Les routes publiques sont sous `/api/salm/*`, qui ne correspond à aucun préfixe protégé. Elles restent donc publiques, et chaque route publique ne renvoie que des données non personnelles, sauf pour l'inscrit·e porteur·se du bon jeton.
- Côté client, les pages `app/pages/admin/salm/**` utilisent `definePageMeta({ layout: 'admin' })`, dont la vérification de session existe déjà.

## R14. Migration et déploiement Docker

**Décision** :
- **Migration** : une seule migration `pnpm prisma migrate dev --name add_salm_module`. Uniquement des `CREATE TABLE` et des index : aucune table existante n'est modifiée, aucun risque pour les données de production.
- **Déploiement** : le `CMD` du Dockerfile lance déjà `npx prisma migrate deploy` au démarrage. Il n'y a rien à ajouter pour le schéma.
- **Seed en production** : commande `./deploy.sh seed` (cf. R8), à lancer une fois après le premier déploiement, puis à chaque mise à jour du contenu jusqu'à la feature B.
- **Uploads** : le volume `uploads:/app/public/uploads` est déjà persistant et servi par `server/routes/uploads/[...path].get.ts`. La feature A n'écrit rien dans `uploads`. Ses images de seed sont statiques dans `public/salm/`, et `ALLOWED_CATEGORIES` recevra `salm` seulement avec la feature B.
- **Polices du PDF** : dans `server/assets`, donc embarquées dans `.output` et sans volume.
- **Variables d'environnement** : ajouter `NUXT_PUBLIC_SITE_URL` (facultative, avec valeur par défaut). Point signalé dans le § R15 : `NUXT_SESSION_SECRET` n'est pas défini dans `docker-compose.yml` ; le back-office donnant accès à des données personnelles, il est **recommandé** de le générer au `setup` comme `ADMIN_PASSWORD`.

## R16. Conservation et suppression des données (décision de revue D5, à valider)

**Décision** : pas de tâche planifiée, pas d'anonymisation ligne à ligne. L'action admin `POST /api/admin/salm/editions/:id/purge` exécute une seule transaction Prisma :
1. contrôle d'éligibilité : édition archivée, salon terminé, pas encore purgée ;
2. calcul des compteurs avec `groupBy` et `count`, enregistrés dans `SalmEdition.purgedStats` ;
3. `deleteMany` des inscriptions étudiantes et établissements ;
4. renseignement de `personalDataPurgedAt`.

La confirmation exige de saisir l'année, comme pour une suppression de dépôt. Le back-office affiche la date limite (fin + 12 mois) et une alerte en cas de dépassement.

**Justification** :
- La décision exclut une tâche planifiée : le seul conteneur Nitro n'a pas d'ordonnanceur, et une suppression automatique irréversible sans contrôle humain serait risquée.
- Les compteurs couvrent les statistiques prévues par la feature B (par jour, par niveau, par stand, par statut).
- Les exposants étant stockés en JSON dans l'inscription établissement, ils disparaissent avec elle.

**Alternatives écartées** :
- Anonymisation (effacement des noms et téléphones, lignes conservées) : garde des lignes inutiles et complique l'unicité (édition, téléphone).
- Tâche Nitro planifiée (`scheduledTasks`) : exclue par la décision.
- Suppression de l'édition entière : perdrait le contenu, les médias et l'historique des numéros.

## R15. Inventaire de l'existant (sous-agents de recherche)

| Existant | Constat | Utilisation dans le module |
|---|---|---|
| `app/components/DownloadModal.vue` | 3 champs, `STUDY_LEVELS` et `IVORIAN_PHONE_REGEX` locaux, erreurs sous les champs, **sans** `aria-invalid`, `aria-describedby`, ni gestion du focus ; thème sombre ambre | Mêmes champs, libellés et messages. `STUDY_LEVELS` et `IVORIAN_PHONE_REGEX` sont extraits dans `shared/utils/` et réimportés ici. Le formulaire SALM ajoute l'accessibilité manquante (FR-082) et le style clair de la maquette. |
| `server/api/downloads/index.post.ts` | Mêmes constantes dupliquées. Erreurs au format `createError({ statusCode: 400, message, data: { errors } })`. Téléphone non normalisé. | Constantes réimportées depuis `shared/`. **Même format d'erreur** pour les routes SALM, complété d'un `data.code`. |
| `server/utils/is-bot.ts` | Filtre sur le User-Agent, utilisé seulement par les visites | Réutilisé tel quel (R11) |
| `server/api/downloads/export.get.ts` | Virgule, BOM, `escapeCsv` local | Modèle suivi, avec un utilitaire `csv.ts` (R12) |
| `server/middleware/admin.ts` | Protection par préfixes ; `/api/admin/*` libre | Nouvelle règle toutes méthodes (R13) |
| `server/utils/session.ts`, `useAdmin()` | `useSession(event, sessionConfig)`, `session.data.admin` ; layout admin avec contrôle de session | Réutilisés sans changement |
| `app/layouts/admin.vue` | Tableau `navItems { label, to, icon }` | Ajout de « SALM » → `/admin/salm` |
| `admin/telechargements.vue`, `newsletter.vue` | `useFetch` avec `query` et `watch`, recherche différée de 400 ms, pagination « Page X sur Y — N résultats », suppression en 2 clics, export par `window.open`. API au format `{ data, total, page, limit }`. | Mêmes patterns et même forme de réponse pour les listes SALM |
| `app/components/AppNavbar.vue` | Tableau `navLinks` statique, indicateur glissant en CSS, pas de fetch | `navLinks` devient un `computed` : le lien « SALM <année> » est inséré après « Résultats » quand `useSalmStatus()` renvoie une édition publiée. L'indicateur fonctionne sans changement (`.nav-link` et `.is-active`). |
| `app/components/AppFooter.vue` | Liens rapides codés en dur | Ajout conditionnel du même lien (FR-018) |
| `app/pages/resultats.vue`, `magazine/[id].vue` | `useHead` et `useSeoMeta` (OG) ; OG global dans `app.vue` | `useSeoMeta` sur `/salm` (titre, description, `og:image` = affiche), plus JSON-LD `Event` ; `noindex` sur `/salm/v/*` |
| `ResultatsFloatingCard.vue` | `onMounted` et `sessionStorage` pour un affichage côté client | Même approche pour le compte à rebours et la préférence de pause vidéo |
| Modales et lightbox | Aucune n'est accessible (pas de `role="dialog"`, de piège ni de restauration du focus) ; pas de `@vueuse` | Nouveau `salm/modal-dialog.vue` sur `<dialog>` natif (R9) |
| Polices et thème | Aucune police personnalisée, aucun `@theme` | Polices limitées au module et jetons `@theme` (R3) |
| `shared/` | Absent | Créé : `shared/utils/study-levels.ts`, `phone.ts`, `salm.ts` |
| Seed | Absent | Créé (R8) |
| Rate limit, CSV, dates | Absents | `rate-limit.ts` et `csv.ts` créés (R11, R12) |

**Points de sécurité constatés hors périmètre, à signaler** (non corrigés par cette feature, sauf décision contraire) :
1. `server/api/auth/login.post.ts`, ligne 23 : un `console.log('[LOGIN DEBUG] …')` écrit le mot de passe reçu **et** le mot de passe attendu dans les logs.
2. `PUT /api/homepage-images/[slug]` n'est couvert par aucun préfixe du middleware : il est **public**.
3. `NUXT_SESSION_SECRET` n'est pas défini en production, donc le secret de secours du code est utilisé.
