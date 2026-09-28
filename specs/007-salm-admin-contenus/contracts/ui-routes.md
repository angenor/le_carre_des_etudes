# Contrat — Écrans d'administration

Toutes les pages sont en français avec accents, dans le style des pages admin existantes : cartes `bg-white`, boutons `emerald`, bandeau de succès vert `role="status"` effacé après 3 s, bandeau d'erreur rouge `role="alert"`, erreurs de champ sous le champ avec `aria-describedby` et `aria-invalid`. Les confirmations passent par `confirm()` natif ([research R10](../research.md#r10-confirmations-messages-et-textes-derreur)). Les textes d'erreur viennent de `app/utils/salm-admin-errors.ts`.

## Navigation (`app/layouts/admin.vue`)

`navItems` accepte un champ facultatif `children`. L'entrée « SALM » garde son lien `/admin/salm` et affiche, indentées sous elle :

| Sous-entrée | Lien | Active quand le chemin… |
|---|---|---|
| Inscriptions | `/admin/salm` | vaut `/admin/salm` ou commence par `/admin/salm/etablissements` |
| Éditions | `/admin/salm/editions` | commence par `/admin/salm/editions` |
| Statistiques | `/admin/salm/statistiques` | vaut `/admin/salm/statistiques` |

La sous-entrée active porte `aria-current="page"` et le style actif existant (`text-amber-400`). Les sous-entrées sont toujours visibles, pour être atteignables en un clic.

## Pages

| Route | Fichier | Layout | Données |
|---|---|---|---|
| `/admin/salm/editions` | `app/pages/admin/salm/editions/index.vue` | `admin` | `GET /editions` (clé `salm-admin-editions`, partagée avec l'en-tête des inscriptions) |
| `/admin/salm/editions/:id` | `app/pages/admin/salm/editions/[id]/index.vue` | `admin` | `GET /editions/:id` (clé `salm-admin-edition-<id>`) |
| `/admin/salm/editions/:id/apercu` | `app/pages/admin/salm/editions/[id]/apercu.vue` | `default` | `GET /editions/:id/preview` |
| `/admin/salm/statistiques` | `app/pages/admin/salm/statistiques.vue` | `admin` | `GET /editions` puis `GET /editions/:id/stats` ; `?edition=<année>` comme les pages d'inscriptions |
| `/admin` (modifiée) | `app/pages/admin/index.vue` | `admin` | + `GET /api/admin/salm/summary` |

### Liste des éditions (US1)

- **Tableau** : Année · Statut (pastille Brouillon gris / Publiée vert / Archivée ambre) · Dates (« 12 – 13 mars 2027 », « — » sans jour) · Lieu (`venueLabel`) · Inscriptions (« 482 étudiant·e·s · 37 établissements ») · Actions.
- **Actions par ligne**, selon les dérivés de la réponse :
  - « Gérer » : lien vers la fiche.
  - « Prévisualiser » : si l'édition n'est pas publiée.
  - « Voir la page » : si elle est publiée, lien `/salm`.
  - « Publier » : si `canPublish`. Confirmation : « Publier le SALM <A> ? » ; si une autre édition est publiée : « Publier le SALM <A> archivera le SALM <B>, actuellement en ligne. Continuer ? ». Pour un brouillon dont le salon est passé, l'avertissement « Le SALM <A> est terminé : les inscriptions resteront fermées. » est ajouté.
  - « Archiver » : si l'édition n'est pas archivée. Pour l'édition publiée, la confirmation précise que `/salm` affichera le message d'attente et que le lien SALM disparaîtra de la navigation.
  - « Dupliquer vers <A+1> » : désactivé avec la raison « Une édition <A+1> existe déjà. » si l'année est prise. Après succès : navigation vers la fiche de la copie, avec le message de US3-1.
  - « Supprimer » : seulement si `canDelete`.
  
  Une édition archivée dont le salon est terminé n'affiche pas « Publier ».
- **Création** : bouton « Nouvelle édition » qui ouvre un formulaire en ligne (pattern magazines et rubriques). Champ « Année » (`inputmode="numeric"`), et « Organisateur » seulement si aucune édition n'existe. Après création : navigation vers la fiche.
- **État vide** : « Aucune édition. Créez la première. »

### Fiche d'une édition (US2)

- **En-tête** :
  - « SALM <année> », pastille de statut, et lien « ← Toutes les éditions » ;
  - boutons « Prévisualiser » (ou « Voir la page »), « Publier » et « Archiver », avec les mêmes règles que la liste ;
  - si l'édition n'a aucun jour, rappel « Ajoutez au moins un jour au chronogramme avant de publier. ».
- **Sous-navigation** : liens `?section=` (`<nav aria-label="Sections de l'édition">`, `aria-current` sur la section active). La section par défaut est `general`.

| `section` | Composant | Contenu |
|---|---|---|
| `general` | `SalmAdminEditionGeneral` | Année (verrouillée avec l'explication de US1-13 si `yearLocked`), intitulé, organisateur, ville, lieu, slogan. Bouton « Enregistrer ». |
| `textes` | `SalmAdminEditionTexts` | Titre et paragraphe « Pourquoi le SALM ? » (`<textarea>`, compteur au-delà de 1 800 caractères) ; publics cibles (liste, ajout, retrait, ordre) ; affiche (`SalmAdminImageField`) ; PDF du programme (envoi, lien « Ouvrir », retrait). |
| `contacts` | `SalmAdminEditionContacts` | Lignes Type (select) · Valeur · « Imprimé sur le badge » (case, téléphones uniquement), ordre, retrait. Avertissement « Aucun contact n'est imprimé sur le badge. » si aucun n'est coché. |
| `temps-forts` | `SalmAdminEditionHighlights` | Cartes avec photo, titre et texte alternatif ; formulaire en ligne d'ajout et de modification ; ordre ; suppression. |
| `chronogramme` | `SalmAdminEditionChronogram` | Un bloc par jour (date longue, libellé, horaires, « N chevauchement(s) ») avec ses créneaux (heures, titre, type, « Mis en avant », description) ; ordre ; « Trier par heure » ; ajout, modification et suppression de jours et de créneaux. Avertissement FR-155 si l'édition a des inscriptions étudiantes. |
| `stands` | `SalmAdminEditionStands` | Liste nom · description · tarif · visibilité · « Choisi par N établissements » ; « Masquer » / « Réafficher » ; suppression désactivée avec l'explication si `schoolCount > 0` ; ordre. Avertissement FR-173. |
| `medias` | `SalmAdminEditionMedia` | Encadré FR-160. Vidéo récapitulative (`SalmAdminYoutubeField`) et son image de secours (`SalmAdminImageField decorative`, sans texte alternatif). Vidéos du canapé : liste, ajout, ordre, suppression. Photos : envoi multiple, grille, légende, texte alternatif, ordre, suppression. |

**Encadré des médias (FR-160)**, deux paragraphes :
- « Ces médias ont été produits pendant le SALM <année>. Ils s'affichent sur la page du SALM <nextEditionYear>. »
- « La page du SALM <année> affiche les médias du SALM <previousEdition.year> (lien : Gérer les médias <année précédente>). » S'il n'y a pas d'édition précédente : « La page du SALM <année> n'affiche aucun média d'une édition précédente. »

**Chevauchements (FR-153)** : sous chaque créneau concerné, texte ambre « Chevauche : PANEL 2, 14h00 – 14h30 » (horaires par `formatHour`), et icône avec texte alternatif. Aucun blocage.

**Envoi multiple de photos (FR-163)** :
- Un `<input type="file" multiple accept="image/jpeg,image/png,image/webp">` stylé en bouton « Ajouter des photos » ; au plus 50 fichiers par sélection, l'excédent étant listé comme refusé.
- Pré-contrôle client (format, 5 Mo), puis envoi **séquentiel** : `POST /api/upload` suivi de `POST …/photos` pour chaque fichier.
- Progression `<progress>` et texte « Envoi 12 / 18 » dans une zone `aria-live="polite"`.
- Pour finir, un récapitulatif « 18 photos ajoutées. 2 fichiers refusés : IMG_0042.heic (format non accepté : JPEG, PNG ou WebP), DSC_0107.jpg (plus de 5 Mo). ».

**Composants transverses** :

| Composant | Props / événements | Comportement |
|---|---|---|
| `SalmAdminOrderButtons` | `index`, `count`, `label` ; émet `move(-1 \| 1)` | Boutons « Monter » et « Descendre » (`aria-label` avec le nom de l'élément), désactivés aux extrémités. Le parent conserve le focus et annonce la nouvelle position dans une zone `aria-live`. |
| `SalmAdminImageField` | `modelValue` (chemin), `alt`, `label`, `defaultAlt`, `decorative` ; émet `update:modelValue`, `update:alt` | Aperçu `<img>`, bouton « Choisir une image » / « Remplacer », « Retirer », champ « Texte alternatif » requis (absent si `decorative`, avec la mention « Image décorative : aucun texte alternatif nécessaire. »), progression, erreurs traduites. Utilise `useSalmUpload`. |
| `SalmAdminYoutubeField` | `modelValue` (URL), `label` ; émet `update:modelValue` | Champ `type="url"`, validation à la sortie du champ et au collage (`paste`) par `parseYoutubeId`, miniature `hqdefault` si l'identifiant est valide, message FR-134 sinon. |

**Composable `useSalmUpload()`** → `upload(file, kind, onProgress)` renvoie `Promise<{ path }>`. `XMLHttpRequest` pour la progression, codes `FILE_TOO_LARGE`, `UNSUPPORTED_FORMAT` et `CORRUPTED_FILE` traduits. Utilisé par `SalmAdminImageField`, l'envoi multiple de photos et le PDF du programme.

### Aperçu (FR-120)

- Page `app/pages/admin/salm/editions/[id]/apercu.vue`, layout `default` :
  - `definePageMeta({ layout: 'default' })` ;
  - au montage, `useAdmin().checkSession()`, puis redirection vers `/admin/login` si l'utilisateur n'est pas connecté ;
  - `useSeoMeta({ robots: 'noindex, nofollow', title: 'Aperçu — SALM <année>' })`, sans JSON-LD.
- Bandeau fixe en haut, contrasté (fond `gray-950`, texte blanc) : « Aperçu — cette édition n'est pas publiée. » avec le lien « ← Retour à l'édition ». Il est présent aussi pour une édition archivée : « Aperçu — cette édition est archivée. ».
- Contenu : `<SalmEditionView :edition :previous />`, le même composant que `/salm` (extrait de `app/pages/salm/index.vue`).
- Liens d'inscription inertes : un écouteur `click` en capture sur le conteneur annule la navigation vers `/salm/inscription-*` et affiche « Les inscriptions ne sont pas disponibles dans l'aperçu. » (`role="status"`).

### Statistiques (US4)

- **En-tête** : sélecteur d'édition (`<select>`, `?edition=<année>`, par défaut `defaultEditionId`). Il n'utilise pas `SalmAdminHeader`, qui porte les interrupteurs d'inscription.
- **Mention** si `source = purged` : « Chiffres conservés après suppression des données personnelles le JJ/MM/AAAA ». Même mention pour l'édition de comparaison.
- **Cartes de totaux** : « Étudiant·e·s inscrit·e·s », « Établissements », « Exposants (hors annulations) », chacune avec « <valeur> · +12 % par rapport à 2026 » lorsqu'il y a une comparaison. L'écart en nombre est dans un texte complémentaire, et une valeur de référence nulle affiche « — » au lieu d'un pourcentage.
- **Graphiques** (`vue-chartjs`) :
  - `Line` des inscriptions par jour d'inscription et de leur cumul, sur deux axes ;
  - `Line` des cumuls alignés sur « J-n avant l'ouverture », une série par édition, seulement si les deux `opensAtIso` existent ;
  - `Bar` horizontal par niveau d'étude, avec les 6 niveaux, y compris ceux à 0.
  
  Chaque graphique est suivi d'un `<details><summary>Voir les données</summary><table>…</table></details>`.
- **Tableaux** : répartition par type de stand (types masqués avec la mention « (masqué) ») et par statut (Nouvelle, Contactée, Confirmée, Annulée), avec colonnes « <année> », « <année de comparaison> » et « Écart ».
- **États vides** :
  - « Aucune inscription pour le SALM <année>. » à la place des graphiques ;
  - aucune comparaison et aucun message s'il n'y a pas d'édition de comparaison.

### Tableau de bord (FR-197a)

Dans `app/pages/admin/index.vue`, sous la grille des cartes de résumé, une carte « SALM <année> » est affichée seulement si `summary` n'est pas `null`. Elle contient :
- deux valeurs : étudiant·e·s et établissements ;
- pour chacune, l'écart avec l'édition de comparaison, si elle existe ;
- le lien « Voir les statistiques SALM → » vers `/admin/salm/statistiques`.

Le reste de la page n'est pas modifié.

## Page publique `/salm` (refactor sans changement visible)

`app/pages/salm/index.vue` conserve son `useFetch` (clé `salm-edition`), son SEO et son JSON-LD. L'assemblage des sections et le message d'attente passent dans `app/components/salm/edition-view.vue` (props `edition: SalmPublicEdition | null`, `previous: SalmPreviousEdition | null`). Le rendu HTML de `/salm` reste identique (vérifié dans le quickstart).
