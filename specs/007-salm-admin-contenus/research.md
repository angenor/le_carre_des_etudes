# Research — Module SALM (2/3) : back-office des éditions et des contenus, statistiques

**Feature** : `007-salm-admin-contenus` · **Spec** : [spec.md](./spec.md) · **Plan** : [plan.md](./plan.md)

Chaque décision suit le format : **Décision**, **Justification**, **Alternatives écartées**. Les numéros de ligne renvoient à l'état du dépôt au commit `940d129`.

---

## R1. Inventaire de l'existant (sous-agents de recherche)

Trois sous-agents ont inventorié le dépôt avant toute création de composant (règle de `CLAUDE.md`). Constats qui orientent la conception :

| Sujet | Constat | Conséquence |
|---|---|---|
| Modèle Prisma | Tous les champs nécessaires existent (`caption`, `isVisible`, `programPdfPath`, `recapPosterPath`, `audiences`, `contacts.onBadge`…). Aucun index d'unicité sur le statut publié. | Aucune migration (R16). |
| Upload | `server/api/upload/index.post.ts` : catégories `magazines`, `rubriques`, `partenaires`, `homepage`. **Aucune liste blanche de formats, aucun contrôle du contenu réel**, limite unique de 50 Mo, image OG générée pour toute image. | Catégorie `salm` avec ses propres règles (R2). |
| Suppression de fichiers | `unlink` dans les routes DELETE de magazines, rubriques et partenaires ; **jamais lors d'un remplacement**, jamais pour les `-og.jpg`. | Nettoyage par comptage de références (R3). |
| Ordre | **Aucun mécanisme** : champ numérique `order` saisi à la main (rubriques, partenaires). Aucune bibliothèque de glisser-déposer. | Boutons « Monter » / « Descendre » (R8). |
| Confirmations | `confirm()` natif (magazines, rubriques, partenaires, maintenance) ou double clic (newsletter, back-office SALM). Aucun composant de modale admin. `SalmModalDialog` est stylé pour la page publique. | `confirm()` natif (R10). |
| Messages | Succès temporaire de 3 s (`images-accueil.vue`, `admin-header.vue`, fiche établissement), erreur en bandeau `bg-red-50`. | Même pattern. |
| Éditeur riche | `ToastEditor.client.vue` stocke du **Markdown** ; utilisé seulement par `rubriques.vue`. `ToastViewer.client.vue` est client-only. `whyText` est rendu en texte brut dans un `<p>` SSR (`why.vue:32`). | Pas d'éditeur riche (R9). |
| Graphiques | `vue-chartjs` (`Line`, `Bar`, `Doughnut`) ; éléments Chart.js enregistrés par `app/plugins/chartjs.client.ts` (et en double dans `admin/index.vue`). | Réutilisés (R11). |
| Payload public | `getPublicEditionPayload()` (`server/utils/salm-edition.ts:128`) filtre `status: 'published'` en dur, mais `serializePublicEdition`, `serializePreviousEdition` et `getPreviousEdition(year)` sont déjà séparés. Les composants de section de `/salm` sont purement pilotés par leurs props. | Prévisualisation par extraction (R6). |
| YouTube | `parseYoutubeId` existe (`shared/utils/salm.ts:97`), regex non ancrée, sans contrôle de l'hôte. | Durci (R7). |
| Statistiques | `computePurgedStats(tx, editionId)` (`server/utils/salm-purge.ts:15`) produit exactement les compteurs voulus, mais compte les exposants des inscriptions **annulées** aussi. | Réutilisé et corrigé (R11). |
| Seed | `prisma/seed/salm.ts` **réécrit** le contenu des éditions 2026 et 2027 et **supprime puis recrée** créneaux, temps forts, vidéos et photos à chaque exécution. | Seed en création seule (R12). |
| Navigation admin | `navItems` plat ; une seule entrée « SALM » ; sous-navigation par les onglets de `SalmAdminHeader`. | Sous-entrées dans le menu (R14). |
| Autres | Pas de `SLOT_KIND_LABELS` ; `EMAIL_REGEX` privé dans `salm-registration.ts:330` ; `normalizeIvorianPhone(raw, { landline })` et `formatIvorianPhone` dans `shared/utils/phone.ts`. | Libellés et validateur e-mail ajoutés à `shared/` (R13). |

---

## R2. Upload des images et du PDF : catégorie `salm`

**Décision** : réutiliser `POST /api/upload` en ajoutant la catégorie `salm`, avec des règles propres à cette catégorie. Les autres catégories gardent leur comportement actuel.

- Un champ multipart `kind` (`image` par défaut, ou `pdf`), envoyé avant `file` comme `category` aujourd'hui.
- Limite Busboy de **10 Mo** pour `salm`, puis, une fois le fichier écrit :
  - `kind = image` : `sharp(path).metadata()` doit réussir et renvoyer `format ∈ { jpeg, png, webp }`, poids ≤ **5 Mo** (clarification Q3) ;
  - `kind = pdf` : les 5 premiers octets valent `%PDF-`, poids ≤ 10 Mo.
- En cas de refus : suppression du fichier écrit, réponse `createError({ statusCode, message: code, data: { code } })` avec `FILE_TOO_LARGE` (413), `UNSUPPORTED_FORMAT` (415) ou `CORRUPTED_FILE` (422). Les autres catégories gardent leurs messages actuels.
- **Pas d'image OG** pour `salm` (`ogPath: null`) : l'affiche est déjà utilisée telle quelle comme `og:image` (feature A), et un recadrage 1200 × 630 d'une affiche portrait serait inutilisable. Cela évite aussi un fichier supplémentaire par photo.
- Nom de fichier : pattern existant `<timestamp>-<nom-nettoyé>`, dans `public/uploads/salm/` (volume Docker `uploads` déjà monté).
- Côté client, un pré-contrôle (extension, type MIME, poids) donne un retour immédiat ; le serveur reste l'autorité.
- **Envoi multiple séquentiel** (FR-163) : le client envoie les photos une par une (progression « 12 / 18 »). Chaque fichier accepté est aussitôt rattaché par `POST …/photos`. Un échec n'interrompt pas la suite ; il est ajouté à la liste des fichiers refusés.

**Justification** : la demande impose de réutiliser la route existante. Busboy en streaming, la protection par le middleware admin, le service par `server/routes/uploads/[...path].get.ts` et le volume Docker sont déjà en place. `sharp` est déjà installé : lire les métadonnées suffit à contrôler le contenu réel (une extension `.jpg` sur un fichier HEIC ou corrompu échoue).

**Alternatives écartées** :
- Route d'upload dédiée `/api/admin/salm/uploads` : duplique le parsing Busboy.
- Contrôle par extension seule : ne satisfait pas FR-132 (« le contenu réel est contrôlé »).
- Redimensionnement ou conversion WebP automatique : écarté par la clarification Q3 (l'équipe compresse avant l'envoi) ; pourra venir plus tard sans changer les contrats.
- Envoi parallèle : charge du serveur mono-processus et risque de collision de noms dans la même milliseconde.

---

## R3. Nettoyage des fichiers uploadés

**Décision** : un fichier `/uploads/salm/…` est supprimé du disque **quand plus aucune ligne SALM ne le référence**, juste après la validation de l'écriture en base.

- Utilitaire `releaseSalmFiles(paths: (string | null)[])` dans `server/utils/salm-files.ts` :
  1. ne garde que les chemins commençant par `/uploads/salm/` : **les images statiques du seed (`/images/salm/…`) ne sont jamais supprimées** ;
  2. pour chaque chemin, compte les références restantes dans toutes les colonnes de fichiers : `SalmEdition.posterPath`, `recapPosterPath`, `programPdfPath`, `SalmHighlight.imagePath`, `SalmPhoto.imagePath`, `SalmVideo.thumbnailPath` ;
  3. si le compte est nul, `unlink` dans un `try/catch` (pattern des routes existantes : un fichier déjà absent n'est pas une erreur).
- Appelé après : remplacement ou retrait d'un fichier (PATCH), suppression d'un temps fort ou d'une photo, suppression d'une édition en brouillon (tous ses chemins).
- **Duplication** (FR-136) : la copie référence les mêmes fichiers que la source (pas de copie physique). Le comptage de références garantit que remplacer ou supprimer la photo d'un temps fort dans la copie n'efface jamais le fichier encore utilisé par la source.
- **Fichiers orphelins** (fichier envoyé puis formulaire abandonné, ou échec du rattachement) : non nettoyés automatiquement. Le volume attendu est faible (quelques Mo par édition) ; un nettoyage manuel est documenté dans [quickstart.md](./quickstart.md).

**Justification** : le comptage de références est la seule façon simple de concilier fichiers partagés (duplication) et nettoyage. Six requêtes `count` sur des colonnes peu volumineuses, à chaque suppression, restent négligeables.

**Alternatives écartées** :
- Copier physiquement les fichiers à la duplication : double l'espace disque et complique la copie (écriture de fichiers dans une transaction de base).
- Ne jamais supprimer (comportement actuel des remplacements) : accumulation indéfinie sur le volume.
- Tâche de ramasse-miettes planifiée : aucune infrastructure de tâches ; hors YAGNI.
- Supprimer avant la validation en base : un échec de la transaction laisserait une ligne pointant vers un fichier supprimé.

---

## R4. Unicité de l'édition publiée et transitions de statut

**Décision** : règle applicative dans une **transaction Prisma interactive**, sans contrainte en base.

```text
publier(id) :
  $transaction(tx =>
    e = tx.salmEdition.findUnique(id, avec days)
    refus 409 NO_DAYS si e.days est vide (FR-116)
    refus 409 EDITION_ENDED si e.status = 'archived' et isEditionEnded(e.days) (FR-115a)
    tx.salmEdition.updateMany({ status: 'published', id ≠ e.id } → 'archived')
    tx.salmEdition.update(e.id → 'published')
  )
```

- Transitions autorisées : `draft → published`, `draft → archived`, `published → archived`, `archived → published` si le salon n'est pas terminé. Toute autre transition renvoie `409 INVALID_TRANSITION`.
- Publier une édition déjà publiée est sans effet (200, idempotent).
- La réponse indique les éditions archivées par effet de bord, pour le message de succès.
- Les lectures existantes (`findFirst({ where: { status: 'published' }, orderBy: { year: 'desc' } })`) restent un filet de sécurité : si deux éditions étaient un jour publiées, la plus récente serait affichée.
- Une modification publiée se reflète immédiatement : aucun cache Nitro ni `routeRules` sur `/api/salm/*` ou `/salm`.

**Justification** : SQLite n'accepte qu'un écrivain à la fois, et l'archivage et la publication se font dans la même transaction. Deux publications concurrentes sont donc sérialisées : chacune archive l'autre, et la dernière validée reste seule publiée (SC-004). C'est la même approche que `featured.put.ts` (magazine à la une), déjà présente dans le dépôt.

**Alternatives écartées** :
- **Index unique partiel** `CREATE UNIQUE INDEX … ON "SalmEdition"("status") WHERE "status" = 'published'` : SQLite le permet, mais `schema.prisma` ne peut pas le décrire. Ajouté à la main dans une migration, il serait vu comme une dérive par `prisma migrate dev`, qui proposerait de le supprimer à la migration suivante. Maintenance fragile pour un risque déjà couvert par la transaction.
- Colonne booléenne `isPublished` unique nullable : nouvelle migration et double source de vérité avec `status`.
- Table `SalmSettings.publishedEditionId` : même objection, plus une jointure à chaque lecture publique.

---

## R5. Duplication d'une édition

**Décision** : une seule écriture Prisma **imbriquée** (`salmEdition.create` avec `days: { create: [{ …, slots: { create } }] }`, `highlights: { create }` et `standTypes: { create }`), précédée de la lecture de la source. Prisma exécute une écriture imbriquée dans une transaction implicite : tout est créé, ou rien (FR-184).

| Élément | Copié | Règle |
|---|---|---|
| `salonName`, `organizerName`, `city`, `tagline`, `whyTitle`, `whyText`, `audiences`, `contacts` | Oui | Tels quels, `onBadge` compris |
| Jours | Oui | `date` + 364 jours (52 semaines, même jour de la semaine, FR-182) ; `label`, `opensAt`, `closesAt`, `sortOrder` |
| Créneaux | Oui | Tous les champs et l'ordre |
| Temps forts | Oui | Titre, `imagePath` (fichier partagé, R3), `imageAlt`, ordre |
| Types de stands | Oui | Nom, description, tarif, visibilité, ordre |
| `venue`, `posterPath`, `posterAlt`, `programPdfPath` | Non | `null` |
| `recapVideoUrl`, `recapPosterPath`, vidéos, photos | Non | Médias de l'édition d'origine (clarification Q1) |
| Inscriptions, `lastBadgeSeq`, interrupteurs, purge | Non | `0`, `false`, `null` |
| `status` | — | `'draft'` |

- Année cible : `source.year + 1`. Une vérification préalable renvoie `409 YEAR_TAKEN` ; un conflit concurrent est rattrapé par l'erreur Prisma `P2002` sur `year`, traduite en `409 YEAR_TAKEN`.
- Le décalage de date se fait en UTC (`Date.UTC`, + 364 × 86 400 000 ms), conformément à la convention « Abidjan = UTC+0 » de la feature A.

**Justification** : l'écriture imbriquée est atomique sans transaction interactive, et plus courte. La lecture préalable n'a pas besoin d'être dans la même transaction : une modification concurrente de la source n'aurait pour effet qu'une copie légèrement antérieure, sans incohérence.

**Alternatives écartées** :
- `$transaction` interactive avec `createMany` successifs : plus de code, et `createMany` ne renvoie pas les identifiants des jours nécessaires pour créer les créneaux.
- Copie « à plat » puis rattachement : état intermédiaire visible en cas d'échec.

---

## R6. Prévisualisation d'une édition non publiée

**Décision** : **page admin dédiée** `/admin/salm/editions/[id]/apercu`, alimentée par une route protégée `GET /api/admin/salm/editions/:editionId/preview`. Pas de paramètre sur `/salm`.

- **Serveur** : `getPublicEditionPayload()` est découpée en `loadEditionPayload(where)` (même `select`, même sérialisation, même édition précédente) et en deux appelants :
  - public : `where: { status: 'published' }` ;
  - aperçu : `where: { id }`.
  
  La réponse de l'aperçu a exactement la forme `SalmEditionResponse`.
- **Client** : le contenu de `app/pages/salm/index.vue` (assemblage des sections et message d'attente) est extrait dans `app/components/salm/edition-view.vue` (props `edition`, `previous`). Les **deux** pages l'utilisent ; la page publique conserve son `useFetch`, son SEO et son JSON-LD.
- La page d'aperçu :
  - utilise le layout `default` (navbar et pied de page, comme `/salm`) ;
  - vérifie la session avec `useAdmin().checkSession()` et redirige vers `/admin/login` sinon ;
  - affiche un bandeau fixe « Aperçu — cette édition n'est pas publiée » avec « Retour à l'édition » ;
  - pose `robots: noindex, nofollow` et n'émet pas de JSON-LD.
- **Boutons d'inscription inactifs** : un écouteur `click` en phase de capture sur le conteneur de l'aperçu annule la navigation des liens vers `/salm/inscription-*` et affiche « Les inscriptions ne sont pas disponibles dans l'aperçu. » (`role="status"`). La touche Entrée sur un lien déclenche le même événement `click`. Les composants publics ne sont pas modifiés.
- L'état des inscriptions affiché est l'état réel des interrupteurs de l'édition, donc ce que les visiteurs verront à la publication.
- Le middleware de maintenance laisse passer `/admin*` et `/api/admin/*` ; l'aperçu fonctionne donc site fermé.

**Justification** : la route `/api/admin/*` est déjà protégée pour toutes les méthodes (`server/middleware/admin.ts:11`). Aucun contenu de brouillon ne peut fuiter par l'API publique, qui garde son filtre `published`. L'extraction de `edition-view.vue` garantit que l'aperçu est la page publique elle-même (SC-003), sans duplication de gabarit.

**Alternatives écartées** :
- `/salm?preview=<id>` réservé aux admins : l'API publique devrait lire la session et servir des brouillons, ce qui élargit la surface d'attaque ; la clé `useFetch` `salm-edition` serait polluée entre aperçu et page publique ; le risque d'indexation est accru.
- Jeton de prévisualisation partageable (URL signée) : non demandé (un seul rôle admin, clarification Q2).
- Modifier les composants publics pour une prop `preview` : quatre composants touchés, contre un seul écouteur. La spec limite les changements de la page publique à la prévisualisation.

---

## R7. Extraction et validation des URL YouTube

**Décision** : durcir `parseYoutubeId(url)` dans `shared/utils/salm.ts` en analysant l'URL au lieu d'une regex non ancrée, et ajouter `canonicalYoutubeUrl(id)`.

```text
parseYoutubeId(raw) :
  u = new URL(raw.trim(), avec « https:// » ajouté si le schéma manque) ; sinon null
  hôte (sans « www. » ni « m. ») ∈ { youtube.com, music.youtube.com, youtube-nocookie.com, youtu.be } ; sinon null
  youtu.be/<id>                         → id = premier segment du chemin
  /watch                                → id = u.searchParams.get('v')
  /embed/<id>, /shorts/<id>, /live/<id> → id = deuxième segment
  id valide si /^[A-Za-z0-9_-]{11}$/ ; sinon null
```

- **Stockage** : l'URL canonique `https://www.youtube.com/watch?v=<id>`. Les paramètres parasites (`&t=42s`, `&list=…`, `?si=…`) disparaissent, et la détection des doublons (« Cette vidéo figure déjà dans la liste ») se fait par identifiant.
- **Aperçu** dans le back-office : miniature `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, comme la page publique. L'existence de la vidéo n'est pas vérifiée (il faudrait une clé d'API YouTube) : un identifiant bien formé mais inexistant affiche la miniature grise par défaut, que l'administrateur voit avant d'enregistrer.
- Refus : `400 VALIDATION` avec `errors.youtubeUrl = 'INVALID_FORMAT'`.
- La fonction reste partagée : la page publique continue de l'appeler sur les URL stockées (celles du seed comme les canoniques).

**Justification** : la regex actuelle accepte `https://exemple.com/?u=youtu.be/AAAAAAAAAAA` et ne rejette pas explicitement `youtube.com/channel/…`. `URL` est disponible côté serveur et navigateur ; aucune dépendance n'est nécessaire.

**Alternatives écartées** :
- API oEmbed de YouTube pour vérifier l'existence : appel réseau sortant à chaque saisie, dépendance à la disponibilité de YouTube, sans exigence de la spec.
- Stocker l'URL telle que saisie : doublons non détectables, paramètres de lecture (`t=`) transmis à la page publique.

---

## R8. Ordre des listes

**Décision** : **boutons « Monter » / « Descendre »** sur chaque élément, et une route de réordonnancement par liste.

- Composant `app/components/salm/admin-order-buttons.vue` : deux `<button>` natifs avec `aria-label="Monter « <titre> »"` et « Descendre », désactivés en tête ou en fin de liste. Après un déplacement, le focus reste sur le même bouton de l'élément déplacé, et une zone `aria-live="polite"` annonce « « <titre> » déplacé en position 2 sur 6 ».
- API : `PUT …/order` avec `{ ids: number[] }`, la **liste complète** dans le nouvel ordre. Le serveur vérifie que `ids` contient exactement les éléments du périmètre (sinon `400 ORDER_MISMATCH`, par exemple après une suppression concurrente), puis écrit `sortOrder = index` dans une transaction. Une fonction commune `applyOrder(tx, model, scopeWhere, ids)` sert aux 5 listes en table (temps forts, créneaux, vidéos, photos, stands).
- Listes en JSON (contacts, publics cibles) : l'ordre est celui du tableau, enregistré avec le reste des champs par `PATCH` de l'édition.
- Jours : triés par date (FR-150) ; `sortOrder` est recalculé à chaque écriture de jour, sans réordonnancement manuel.
- « Trier par heure » (FR-154) : le client calcule l'ordre (heure de début, puis de fin, puis ordre actuel) et appelle la même route `PUT …/order`.
- Mise à jour optimiste côté client ; en cas d'erreur, rechargement et message.

**Justification** : aucun mécanisme n'existe dans le dépôt. FR-130 exige l'usage à la souris **et au clavier** : les boutons natifs le sont sans code supplémentaire, sans dépendance et sur mobile. Les listes sont courtes (5 temps forts, 12 créneaux, environ 50 photos au plus) : deux ou trois clics suffisent pour un déplacement.

**Alternatives écartées** :
- Glisser-déposer (`sortablejs`, `vuedraggable`) : nouvelle dépendance (principe IV), et il faut de toute façon une alternative clavier, donc les boutons en plus.
- Glisser-déposer HTML5 natif : pas de prise en charge tactile, alternative clavier toujours nécessaire.
- Champ numérique « Ordre » (pattern rubriques et partenaires) : collisions de valeurs, mauvaise ergonomie pour 50 photos, et incompatible avec la lecture « position N sur M ».

---

## R9. Texte « Pourquoi le SALM ? » : pas d'éditeur riche

**Décision** : `<textarea>` simple pour `whyText` (2 000 caractères au plus), et champs texte pour `whyTitle` et les publics cibles. ToastEditor n'est pas utilisé.

**Justification** :
- La maquette présente un paragraphe unique, sans mise en forme.
- `why.vue:32` rend `whyText` en texte brut dans un `<p>` rendu côté serveur.
- Passer au Markdown imposerait `ToastViewer.client.vue`, rendu uniquement côté client. Le texte disparaîtrait du HTML initial (SEO, principe V), la page publique chargerait la bibliothèque toast-ui, et il faudrait modifier la page publique, ce que la spec exclut hors prévisualisation.

**Alternatives écartées** : ToastEditor + ToastViewer (raisons ci-dessus) ; Markdown rendu côté serveur (nouvelle dépendance et modification de la page publique).

---

## R10. Confirmations, messages et textes d'erreur

**Décision** :
- **Confirmations** : `confirm()` natif, avec des messages qui nomment l'élément et ses conséquences (FR-131). Exemples :
  - « Supprimer le Jour 1 et ses 7 créneaux ? » ;
  - « Publier le SALM 2028 archivera le SALM 2027, actuellement en ligne. Continuer ? » ;
  - « Archiver le SALM 2027 ? Le site n'affichera plus aucune édition et le lien SALM disparaîtra de la navigation. ».
- **Succès** : bandeau vert `role="status"` effacé après 3 s (pattern `images-accueil.vue`, `admin-header.vue`).
- **Erreurs** : bandeau rouge `role="alert"`, plus des messages sous les champs (`aria-describedby`, `aria-invalid`) pour les erreurs de validation. La saisie est conservée (FR-199).
- Comme dans la feature A, le serveur renvoie des **codes** (`data.code`, `data.errors[champ]`). Les textes français sont dans une table unique côté client, `app/utils/salm-admin-errors.ts` (auto-importée), utilisée par toutes les sections.

**Justification** : `confirm()` est le pattern majoritaire du back-office, il est accessible (focus, clavier, lecteurs d'écran) et ne demande aucun code. Toutes les confirmations de la spec sont des questions oui / non avec un texte.

**Alternatives écartées** :
- Composant de fenêtre de confirmation admin sur `<dialog>` : plus joli, mais nouveau composant sans besoin fonctionnel.
- Double clic (newsletter) : ne peut pas afficher « et ses 7 créneaux » ni le nom de l'édition archivée.
- Saisie de l'année (purge de la feature A) : réservée à l'action irréversible sur des données personnelles.

---

## R11. Statistiques

**Décision** :
- **Calcul** : réutiliser `computePurgedStats(client, editionId)` pour les éditions non purgées. Il produit exactement la forme `SalmPurgedStats` (totaux, par niveau, par jour d'inscription en UTC = Abidjan, par stand, par statut, exposants). Une édition purgée lit son `purgedStats`. Les deux cas ont donc **la même forme**, et la comparaison est triviale.
- **Correction** : `computePurgedStats` compte aujourd'hui les exposants de toutes les inscriptions. Il exclura les inscriptions « Annulée », comme la liste des exposants (FR-068a) et FR-192. **Aucune purge n'a encore eu lieu** : 2026 n'a pas d'inscription et 2027 n'est pas terminée. Aucune donnée enregistrée n'est donc incohérente.
- **Réponse** `GET /api/admin/salm/editions/:editionId/stats` :
  - les compteurs, la source (`live` ou `purged`, avec `purgedAt`) et `opensAtIso` ;
  - la liste des types de stands de l'édition, pour afficher aussi ceux à 0 ;
  - `comparison` : même bloc pour l'édition de comparaison, c'est-à-dire la plus récente d'année inférieure ayant au moins une inscription ou des `purgedStats` (FR-193), sinon `null`.
- **Alignement J-n** (FR-194), côté client : pour chaque jour d'inscription, `n = (date d'ouverture − date d'inscription)` en jours, puis cumul. Une édition sans jours n'a pas de courbe alignée.
- **Graphiques** (`vue-chartjs`, éléments déjà enregistrés par `app/plugins/chartjs.client.ts`) :
  - `Line` des inscriptions par jour et de leur cumul ;
  - `Line` des cumuls alignés sur J-n (deux séries) ;
  - `Bar` horizontal par niveau (deux séries en cas de comparaison).
  
  Stands et statuts, 3 à 4 valeurs chacun, sont présentés en **tableaux** avec écart, sans graphique. Chaque graphique est suivi d'un tableau des valeurs dans un `<details>` « Voir les données » (FR-197).
- **Encart du tableau de bord** (clarification Q4) : `GET /api/admin/salm/summary`, qui renvoie `null` sans édition publiée, sinon les deux totaux et l'édition de comparaison. Deux `count` et la même règle de comparaison. L'encart s'ajoute sous les cartes de résumé de `app/pages/admin/index.vue`.
- **Volume** : 5 000 inscriptions, soit 5 000 `createdAt` lus et agrégés en JavaScript, quelques millisecondes (SC-010 : moins de 3 s). C'est le même principe que `server/api/stats/*`.

**Justification** : une seule fonction de calcul pour les chiffres en direct et les chiffres conservés garantit que la comparaison d'une édition purgée avec une édition en cours porte sur des définitions identiques.

**Alternatives écartées** :
- `groupBy` par date en SQL brut (`strftime`) : interdit sauf nécessité (principe III), inutile à ce volume.
- Statistiques pré-calculées et stockées : pas de besoin de performance.
- Graphiques pour les stands et statuts : peu de valeurs, un tableau avec écart est plus lisible et accessible.

---

## R12. Seed après la feature B : création seule

**Décision** : `prisma/seed/salm.ts` ne crée une édition du jeu initial **que si son année n'existe pas encore**. Une édition existante est ignorée, avec le message « SALM <année> déjà présent : ignoré (contenu géré dans le back-office) ». L'en-tête de `salm-data.ts`, `CLAUDE.md` et l'aide de `./deploy.sh seed` sont mis à jour.

**Justification** : aujourd'hui, le seed réécrit le contenu de 2026 et 2027 et supprime puis recrée créneaux, temps forts, vidéos et photos. Relancé après la mise en service du back-office (`./deploy.sh seed`), il **effacerait les saisies de l'équipe** et changerait les identifiants. Pour une base neuve (développement, nouveau serveur), il reste utile.

**Alternatives écartées** :
- Supprimer le seed : les environnements de développement n'auraient plus de données.
- Drapeau `--force` pour réécrire : risque d'erreur en production pour un besoin non avéré.

---

## R13. Contacts, validateurs partagés et libellés

**Décision** :
- **Téléphone** : validé par `normalizeIvorianPhone(raw, { landline: true })` et enregistré sous la forme d'affichage canonique `+225 ` + `formatIvorianPhone(n)` (ex. `+225 07 68 01 14 09`). La page publique et le badge affichent `value` tel quel ; la forme canonique garantit un affichage homogène. Le seed garde ses valeurs, qui seront normalisées à la première modification.
- **E-mail** : `EMAIL_REGEX` passe de `server/utils/salm-registration.ts:330` à `shared/utils/salm.ts`, sous la forme `isValidEmail(value)`, avec deux usages (formulaire établissement et contacts). Valeur en minuscules, 254 caractères au plus.
- **Adresse** : texte de 200 caractères au plus.
- **`onBadge`** : au plus un contact, de type téléphone (FR-145). Le serveur retire la marque des autres contacts si plusieurs sont marqués (dernier marqué gagnant), et refuse la marque sur un autre type (`INVALID_CHOICE`).
- **`SLOT_KIND_LABELS`** ajouté à `shared/utils/salm.ts` : `ceremonie` → « Cérémonie », `panel` → « Panel », `presentation` → « Présentation », `stands` → « Stands », `pause` → « Pause », `exposition` → « Exposition ».
- **Chevauchements** : `findSlotOverlaps(slots)` dans `shared/utils/salm.ts` (strict : `a.start < b.end && b.start < a.end`, donc des créneaux qui se touchent ne sont pas signalés), calculé à l'affichage et jamais stocké.

**Justification** : réutiliser les normalisations de la feature A plutôt que d'en créer de nouvelles ; `shared/` sert au client (retour immédiat) comme au serveur (autorité).

---

## R14. Structure des écrans et navigation

**Décision** :
- **Menu** : l'entrée « SALM » de `app/layouts/admin.vue` reçoit des sous-entrées, affichées sous elle : « Inscriptions » (`/admin/salm`, active aussi sur `/admin/salm/etablissements/**`), « Éditions » (`/admin/salm/editions/**`) et « Statistiques » (`/admin/salm/statistiques`). `navItems` accepte un champ facultatif `children`.
- **Pages** :
  - `editions/index.vue` : liste, création, actions de statut, duplication, suppression ;
  - `editions/[id]/index.vue` : fiche en sections, choisies par `?section=` ;
  - `editions/[id]/apercu.vue` : prévisualisation (R6) ;
  - `statistiques.vue`.
  
  Le choix de `[id]/index.vue` plutôt que `[id].vue` évite une route parente qui imposerait un `<NuxtPage>`.
- **Fiche d'édition** : un seul `useFetch` de `GET /api/admin/salm/editions/:editionId` (clé `salm-admin-edition-<id>`). Chaque section est un composant qui reçoit l'édition, fait ses propres mutations et émet `saved` ; la page rafraîchit alors la fiche et la liste partagée (`salm-admin-editions`).
- **Sections** (`app/components/salm/`, kebab-case → `<SalmAdmin…>`) : `admin-edition-general.vue`, `admin-edition-texts.vue`, `admin-edition-contacts.vue`, `admin-edition-highlights.vue`, `admin-edition-chronogram.vue`, `admin-edition-stands.vue` et `admin-edition-media.vue`.
- **Composants transverses**, chacun avec au moins deux usages (principe II) :
  - `admin-order-buttons.vue` : 5 listes ;
  - `admin-image-field.vue` (envoi, aperçu, texte alternatif sauf en mode `decorative`) : affiche, temps forts, image de secours de la vidéo récapitulative (décorative, sans texte alternatif : aucune colonne ne le stocke et le hero l'affiche avec `alt=""`) ;
  - `admin-youtube-field.vue` (saisie, validation, miniature) : vidéo récapitulative et vidéos du canapé.
- **Composable** `app/composables/use-salm-upload.ts` : envoi par `XMLHttpRequest` avec progression (pattern de `magazines.vue`, `uploadFile`), traduction des codes d'erreur. Utilisé par le champ image, l'envoi multiple de photos et le PDF du programme.
- **Style** : celui des pages admin existantes (cartes `bg-white`, boutons `emerald`, bandeaux de message), sans les polices ni les couleurs SALM publiques.

**Alternatives écartées** :
- Une page par section : 7 fichiers de page qui recopient chacun le chargement de la fiche.
- Ajouter des onglets à `SalmAdminHeader` : cet en-tête porte les interrupteurs d'inscription et la purge, propres au suivi des inscriptions.
- `SalmModalDialog` pour les formulaires : stylé pour la page publique. Les formulaires s'ouvrent en ligne, comme dans les pages admin existantes.

---

## R15. Sécurité des chemins de fichiers et des champs

**Décision** :
- Les routes de contenu n'acceptent comme chemin d'image que `^/(uploads|images)/salm/[a-z0-9][a-z0-9._/-]*\.(jpe?g|png|webp)$`, sans `..`, et comme PDF que `^/uploads/salm/[a-z0-9][a-z0-9._-]*\.pdf$`. Pour `/uploads/salm/…`, le fichier doit exister sur le disque (`FILE_NOT_FOUND`). Cela empêche de référencer un fichier arbitraire, une URL externe ou un schéma `javascript:` (les chemins sont injectés dans des `src` et `href` publics).
- **Listes blanches de champs** pour chaque corps de requête (convention D9 de la feature A) ; tout autre champ est ignoré. `status`, `lastBadgeSeq`, `personalDataPurgedAt`, `purgedStats` et les interrupteurs ne sont **jamais** modifiables par les routes de contenu, seulement par leurs routes dédiées.
- Longueurs maximales validées côté serveur (voir [data-model.md](./data-model.md)).
- Protection d'accès : `/api/admin/*` (toutes méthodes) et `/api/upload` sont déjà protégés par `server/middleware/admin.ts`. La page d'aperçu vérifie la session, et son API est sous `/api/admin/`.

---

## R16. Pas de migration

**Décision** : **aucune modification de `schema.prisma`, aucune migration.**

| Besoin | Couvert par |
|---|---|
| Légende des photos | `SalmPhoto.caption` (prévu pour la feature B) |
| Masquer un stand | `SalmStandType.isVisible` |
| PDF du programme | `SalmEdition.programPdfPath` |
| Image de secours de la vidéo récapitulative | `SalmEdition.recapPosterPath` |
| Ordre | `sortOrder` sur chaque table ; ordre du tableau pour les colonnes JSON |
| Contact imprimé sur le badge | `contacts[].onBadge` |
| Une seule édition publiée | Transaction applicative (R4) |
| Suppression d'un stand utilisé | Contrainte existante `onDelete: Restrict`, doublée d'un contrôle applicatif lisible (`STAND_TYPE_IN_USE` avec le nombre d'inscriptions) |
| Année verrouillée, suppression d'édition | Dérivées de `_count` des inscriptions, de `lastBadgeSeq` et de `personalDataPurgedAt` |
| Statistiques | Lecture des inscriptions ou de `purgedStats` |

`SalmVideo.thumbnailPath` reste inutilisé par les écrans (la miniature YouTube suffit) ; le champ est conservé tel quel.

**Justification** : la feature A a modélisé ce périmètre à l'avance (FR-005 de 006). La seule migration envisagée, l'index partiel, est écartée en R4.
