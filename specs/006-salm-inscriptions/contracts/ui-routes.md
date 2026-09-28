# Contrat — Routes d'interface

## Pages publiques (layout `default` : navbar + pied de page)

| Route | Fichier | Maquette | Rendu | Données |
|---|---|---|---|---|
| `/salm` | `app/pages/salm/index.vue` | `page-desktop.dc.html` et `page-mobile.dc.html` | SSR. Compte à rebours, iframe du hero, fenêtres vidéo et galerie côté client | `GET /api/salm/edition` |
| `/salm/inscription-etudiant` | `app/pages/salm/inscription-etudiant.vue` | `inscription-etudiant.dc.html` | SSR du formulaire. Aperçu du badge réactif | `GET /api/salm/edition`, `POST /api/salm/students`, `POST /api/salm/students/recover` |
| `/salm/inscription-ecole` | `app/pages/salm/inscription-ecole.vue` | `inscription-ecole.dc.html` | SSR de l'étape 1, étapes gérées côté client | `GET /api/salm/edition`, `POST /api/salm/schools` |
| `/salm/v/:token` | `app/pages/salm/v/[token].vue` | aucune (page neutre) | SSR, `noindex` | `GET /api/salm/verify/:token` |

**États de `/salm`** :

| État | Rendu |
|---|---|
| Édition publiée | Sections dans l'ordre FR-010. Ancres `#participer`, `#pourquoi`, `#programme`, `#chronogramme`, `#canape`, `#photos` |
| Aucune édition | Message d'attente (FR-019), sans erreur 404 |
| Inscriptions étudiantes fermées | Appels à l'action « Étudiant·e » remplacés par « Inscriptions étudiantes closes » et un lien « Récupérer mon badge » (FR-051) |
| Inscriptions établissements fermées | Appels à l'action « École » remplacés par « Inscriptions des établissements closes » |
| Les deux fermées | Libellé « INSCRIPTIONS OUVERTES » masqué |
| Pas d'édition précédente, ou pas de médias | Sections canapé et photos, et bouton « Revivre », masqués |

**`/salm` sur mobile (< 768 px, référence 390 px)** (FR-010a, décision D3) : aucune section n'est masquée, toutes passent sur une colonne.

| Section | Rendu mobile |
|---|---|
| Hero | Comme `page-mobile.dc.html` (compte à rebours en ligne, CTA empilés, bouton « Revivre le SALM 2026 en vidéo ») |
| « Deux façons de participer » | Cartes empilées (maquette mobile) |
| « Pourquoi le SALM ? » | Affiche **au-dessus** du texte, puis les 3 publics empilés |
| Programme d'activité | **Carrousel horizontal** : défilement tactile avec accrochage (`scroll-snap`), conteneur focalisable au clavier (`tabindex="0"`, `role="region"`, `aria-label="Programme d'activité"`), défilement aux flèches ← et → |
| Chronogramme | Onglets Jour 1 / Jour 2 (maquette mobile) |
| Canapé | Grille d'une colonne (maquette mobile). Le lien « 9 vidéos → » mène à l'ancre `#canape` ; toutes les vidéos sont listées, sans pagination. |
| Catalogue photos | **Grille de 2 colonnes** avec l'aperçu, puis « Voir tout le catalogue » |
| Appel final | Maquette mobile |

**`/salm/inscription-etudiant`** — le visuel est celui de `inscription-etudiant.dc.html` : carte sur fond clair #FAF8F5, colonne orange #D5570B à gauche avec la photo et les 3 atouts, aperçu du badge à droite (décision D1). Du formulaire `DownloadModal`, on reprend seulement les libellés, les exemples de saisie (« Kouassi Aya Marie », « 07 12 34 56 78 »), la liste des niveaux et la validation du téléphone, **pas son style**. Champs : bordure #8A847F au repos (3,7:1), #D5570B au focus avec halo (FR-082a). Sur mobile, la colonne orange passe au-dessus du formulaire et l'aperçu du badge sous le bouton.
- **Formulaire** (inscriptions ouvertes) :
  - 3 champs avec libellés `<label for>` ;
  - erreurs sous chaque champ avec `id`, `aria-describedby` et `aria-invalid` ;
  - message d'erreur global en `role="alert"` ;
  - focus sur le premier champ en erreur ;
  - `maxlength="60"` sur « Nom & prénoms », avec un compteur « N/60 » visible à partir de 50 caractères ;
  - mention d'usage sous le bouton : « Tes informations servent uniquement à émettre ton badge, à organiser l'accueil du salon et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l'événement. » ;
  - champ piège `website` et horodatage `startedAt`.
- **Récupération** (inscriptions fermées) : message de fermeture, puis formulaire réduit Nom & prénoms + téléphone, bouton « Récupérer mon badge ».
- **Écran « Félicitations »** (`status: created`) ou **« Tu es déjà inscrit·e »** (`status: existing`) :
  - le badge avec le QR code (`qrSvg`) ;
  - le bouton `<a href="downloadUrl" download>Télécharger mon badge (PDF)</a>` ;
  - la consigne « Imprime à 100 % (sans ajustement à la page) ou présente-le sur ton téléphone » (FR-029) ;
  - dates, horaires et lieu ;
  - le bouton « Inscrire une autre personne », qui réinitialise le formulaire et place le focus sur le premier champ.
  - Le titre de l'écran reçoit le focus à l'affichage, pour que les lecteurs d'écran l'annoncent.
- L'aperçu du badge (`<figure>`, `aria-hidden` sur le visuel et légende « Aperçu de ton badge ») se met à jour à chaque frappe (FR-023).

**`/salm/inscription-ecole`** :
- **Indicateur d'étapes** : `<ol aria-label="Étapes">`, avec `aria-current="step"` sur l'étape active.
- **Étape 1** : les programmes sont des boutons bascules `aria-pressed` dans un `<fieldset>` avec `<legend>` ; le champ « Précisez » apparaît si « Autre » est coché. Bouton « Continuer ».
- **Étape 2** :
  - la liste des exposants : 1 à 6 lignes, bouton « + Ajouter un exposant » masqué à 6, bouton de retrait masqué quand il ne reste qu'une ligne ;
  - les stands en groupe radio natif, avec la description et le tarif s'ils existent ;
  - la question libre ;
  - la mention d'usage au vouvoiement, au-dessus du bouton de confirmation : « Ces informations servent uniquement à confirmer votre participation, à organiser l'accueil des exposants et à établir des statistiques anonymes. Elles sont supprimées au plus tard 12 mois après l'événement. » (FR-046) ;
  - les boutons « ← Retour » (saisies conservées) et « Confirmer notre présence ».
- **Étape 3, « Présence confirmée »** : récapitulatif (stand, nombre d'exposants, programmes), mention « Aucun badge à télécharger : l'équipe SALM vous recontacte pour finaliser votre stand. », phrase « Vos exposants n'ont pas besoin de badge : ils seront pointés à l'accueil exposants sur une liste nominative. » (FR-047), dates et lieu, lien « Ajouter à mon agenda » (`/api/salm/agenda.ics`), « Retour à la page SALM ». **Pas de mention d'e-mail** (FR-043).
- Au changement d'étape, le focus est placé sur le titre de l'étape.

**SEO** :
- `/salm` : `useSeoMeta` (title « SALM 2027 — Salon International des Licences et Masters · Le Carré des Études », description, `og:image` = affiche) et JSON-LD `Event` (nom, dates, lieu, organisateur).
- Pages d'inscription : `useSeoMeta` simple.
- `/salm/v/*` : `robots: noindex, nofollow`.

## Textes des erreurs par formulaire

L'API ne renvoie que des codes (FR-083, décision D6). Chaque formulaire a sa table de textes (`app/components/salm/student-form.vue` et `school-form.vue`).

| Code | Formulaire étudiant (tutoiement) | Formulaire établissement (vouvoiement) |
|---|---|---|
| `fullName` / `name` : `REQUIRED` | Ton nom et tes prénoms sont requis. | Le nom de l'établissement est requis. |
| `fullName` : `INVALID_CHARS` | Utilise seulement des lettres, espaces, traits d'union, apostrophes et points. | — |
| `fullName` / `name` : `TOO_SHORT` / `TOO_LONG` | Ton nom doit compter entre 2 et 60 caractères. | Le nom doit compter entre 2 et 150 caractères. |
| `phone` : `REQUIRED` | Ton numéro de téléphone est requis. | Le numéro de téléphone est requis. |
| `phone` : `INVALID_FORMAT` | Commence par 01, 05, 07 ou 27, suivi de 8 chiffres. | Saisissez 10 chiffres commençant par 01, 05, 07, 21, 25 ou 27. |
| `studyLevel` : `REQUIRED` / `INVALID_CHOICE` | Choisis ton niveau d'étude. | — |
| `email` : `INVALID_FORMAT` | — | Adresse e-mail invalide. |
| `programmes` : `REQUIRED` | — | Sélectionnez au moins un programme. |
| `exhibitors` : `REQUIRED` | — | Ajoutez au moins un exposant. |
| `exhibitors.N.contact` : `INVALID_FORMAT` | — | Numéro de l'exposant invalide. |
| `standTypeId` : `REQUIRED` / `INVALID_CHOICE` | — | Choisissez un type de stand. |
| `REGISTRATION_CLOSED` | Les inscriptions étudiantes sont closes. Tu peux encore récupérer ton badge. | Les inscriptions des établissements sont closes. Contactez l'équipe SALM. |
| `NAME_MISMATCH` | Ce numéro est déjà inscrit sous un autre nom. Vérifie l'orthographe ou contacte l'organisateur. | — |
| `NOT_FOUND` (récupération) | Aucune inscription ne correspond à ce numéro pour le SALM <année>. | — |
| `REJECTED` | Impossible d'enregistrer ta demande. Recharge la page et réessaie. | Impossible d'enregistrer votre demande. Rechargez la page et réessayez. |
| `RATE_LIMITED` | Trop de tentatives. Réessaie dans quelques minutes. | Trop de tentatives. Réessayez dans quelques minutes. |
| `NO_EDITION` | Aucune édition du SALM n'est ouverte pour le moment. | Aucune édition du SALM n'est ouverte pour le moment. |
| Erreur réseau ou 5xx | Une erreur est survenue. Réessaie dans un instant. | Une erreur est survenue. Veuillez réessayer dans un instant. |

Un code inconnu est affiché avec le texte générique « erreur réseau ou 5xx » du formulaire.

## Navigation publique

- `app/components/AppNavbar.vue` : `navLinks` devient un `computed`, et `{ label: 'SALM 2027', to: '/salm' }` est inséré après « Résultats » si `useSalmStatus().published`. L'indicateur glissant existant fonctionne sans changement. **Aucune autre modification**, en particulier pas de menu mobile : l'en-tête de la maquette mobile n'est pas contractuel (décision D2). À 390 px, la pilule compte 6 liens ; elle doit tenir sans défilement horizontal de la page. Si elle déborde, seuls l'espacement et le corps du texte des liens sous 640 px sont ajustés (texte ≥ 12 px, cible tactile ≥ 24 px de haut).
- `app/components/AppFooter.vue` : même lien conditionnel dans « Liens rapides ».
- `app/composables/use-salm-status.ts` → `useSalmStatus()` : `useFetch('/api/salm/status', { key: 'salm-status' })`, partagé par la navbar et le pied de page, soit une seule requête par rendu.

## Back-office (layout `admin`, entrée « SALM » dans `navItems`)

| Route | Fichier | Contenu |
|---|---|---|
| `/admin/salm` | `app/pages/admin/salm/index.vue` | En-tête SALM (sélecteur d'édition `?edition=<année>`, interrupteurs d'ouverture, onglets Étudiant·e·s / Établissements). Liste des étudiant·e·s : compteur, recherche différée de 400 ms, filtre par niveau, tri, pagination, « Exporter CSV », bouton « Badge » par ligne, suppression en 2 clics. |
| `/admin/salm/etablissements` | `app/pages/admin/salm/etablissements/index.vue` | Même en-tête. Liste des établissements : compteurs par statut, filtre par statut, recherche, pagination, « Exporter CSV », « Exporter la liste des exposants » (FR-068a), lien vers la fiche. |
| `/admin/salm/etablissements/:id` | `app/pages/admin/salm/etablissements/[id].vue` | Fiche complète (exposants en lecture seule), sélecteur de statut, note interne (textarea), bouton « Enregistrer », bandeau de succès temporaire (pattern `images-accueil.vue`). Bouton « Supprimer l'inscription » avec confirmation en 2 clics (pattern `newsletter.vue`), puis retour à la liste (FR-067a). **Aucun bouton « Badge »** (FR-047). |

**Conservation des données, dans l'en-tête SALM** (FR-065a, FR-065b) :
- Pour chaque édition, affichage de « Données personnelles à supprimer au plus tard le JJ/MM/AAAA ». Une alerte ambre s'affiche si la date est dépassée.
- Si `canPurge` : bouton « Supprimer les données personnelles ». Il ouvre une confirmation qui explique l'effet (inscriptions et exposants supprimés, compteurs conservés, badges invalides) et exige la saisie de l'année de l'édition avant d'activer le bouton final.
- Après suppression : « Données personnelles supprimées le JJ/MM/AAAA ». Les compteurs de `purgedStats` remplacent les listes, et les exports et listes sont vides.

L'en-tête commun est `app/components/salm/admin-header.vue`, utilisé par les 2 listes et la fiche (cf. plan).

Style : celui des pages admin existantes (fond clair, tableaux `bg-white`, boutons `emerald`, entrée de menu active `text-amber-400`).
