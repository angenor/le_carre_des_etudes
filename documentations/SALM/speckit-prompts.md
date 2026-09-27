# Module SALM — prompts speckit

Le module est découpé en **3 features** à développer l'une après l'autre. Pour chacune, lancer les commandes dans l'ordre (`specify` → `clarify` → `plan` → `tasks` → `analyze` → `implement`) et coller le bloc indiqué après la commande.

| Feature | Périmètre | Échéance |
|---|---|---|
| **A — salm-inscriptions** | Modèle multi-édition, édition 2027 initialisée par un seed, page `/salm`, inscription étudiant + badge PDF, inscription établissement, back-office des inscriptions | En premier : permet d'ouvrir les inscriptions |
| **B — salm-contenus-admin** | Back-office des éditions et des contenus, duplication d'une édition, statistiques | Ensuite. D'ici là, le contenu se modifie par le seed |
| **C — salm-controle-entree** | Scan des badges le jour J, présence par jour | Facultatif, à livrer avant le 12 mars 2027 |

## Ressources à disposition de l'agent

| Ressource | Emplacement |
|---|---|
| Maquette de la partie publique (5 écrans) | `documentations/SALM/maquette/` (lire d'abord `README.md`) |
| Canevas interactif de la maquette | https://claude.ai/artifact/LxBDV2LoBxzUQEdgWETbtf |
| Brief d'origine (onglet SALM, 6 pages) | `documentations/brouillons/onglet SALM.pdf` |
| Chronogramme 2027 | `documentations/brouillons/CHRONOGRAMME SALM 2027 .pdf` |
| Badge 2026 (recto/verso) | `documentations/brouillons/badge participant.pdf` |
| Formulaire exposants d'origine | https://docs.google.com/forms/d/e/1FAIpQLScW4EKHLpisaZxLzs4O-8m84vZzIkIvixcuQ6mht5VLEtp71g/viewform |
| Formulaire de référence pour les étudiants | `app/components/DownloadModal.vue` (téléchargement du magazine) |

Le **back-office n'a pas de maquette** : chaque feature demande de reprendre les patterns de l'admin existant.

---

# Feature A — salm-inscriptions

## A1. `/speckit.specify`

```text
Module « SALM », partie 1/3 : page publique, inscriptions et back-office des inscriptions.

Le SALM (Salon International des Licences et Masters de Côte d'Ivoire) est organisé par Sucrey Corporates Consulting. Le magazine Le Carré des Études y est présenté (Jour 1, 11h00). La prochaine édition est le SALM 2027 : vendredi 12 et samedi 13 mars 2027, Abidjan, lieu à confirmer. Le module doit servir pour les éditions suivantes sans redéveloppement.

Maquette validée de la partie publique : documentations/SALM/maquette/ (lire README.md, puis les fichiers .dc.html, qui donnent les textes, la structure et les styles exacts). Contenus sources : documentations/brouillons/ (onglet SALM, chronogramme 2027, badge 2026).

Il y a trois publics :
- étudiant·e·s : ils s'inscrivent et reçoivent un badge d'entrée nominatif ;
- établissements (universités, grandes écoles) : ils s'inscrivent comme exposants uniquement pour CONFIRMER LEUR PRÉSENCE. Ils ne reçoivent AUCUN badge ;
- administrateurs du site : ils consultent et suivent les inscriptions.

### User stories

P1 — Inscription étudiant et badge.
Un·e étudiant·e remplit un formulaire de 3 champs, identiques au formulaire de téléchargement du magazine :
- Nom & prénoms ;
- Numéro de téléphone (format ivoirien : 01, 05, 07 ou 27 suivi de 8 chiffres) ;
- Niveau d'étude : Terminale / Futur bachelier, BTS / DUT (Bac+2), Licence (Bac+3), Master (Bac+5), Doctorat, Autre.
Un aperçu du badge se met à jour pendant la saisie. À la validation, un écran « Félicitations » permet de télécharger immédiatement le badge en PDF (10 × 15 cm).
- Recto du badge : nom en majuscules, niveau d'étude, numéro unique séquentiel par édition (ex. SALM27-000482) et QR code.
- Le QR code encode une URL de vérification non devinable, qui servira au contrôle d'entrée d'une feature ultérieure.
- Verso du badge : jours, horaires, lieu, contact organisateur.
- Un même numéro de téléphone ne crée qu'une inscription par édition : s'il se réinscrit, il récupère son badge existant (c'est le parcours « badge perdu »).

P1 — Page publique de l'édition active (/salm), conforme à page-desktop.dc.html et page-mobile.dc.html :
- hero avec la vidéo de l'édition précédente en plein écran, le compte à rebours jusqu'à l'ouverture, les dates, le lieu et les horaires, et deux appels à l'action (« Étudiant·e : obtenir mon badge », « École : confirmer notre présence ») ;
- bloc « Deux façons de participer » qui explique la différence étudiant / établissement ;
- section « Pourquoi le SALM ? » avec l'affiche officielle ;
- programme d'activité (5 temps forts avec photo) ;
- chronogramme jour par jour, avec la présentation du magazine Le Carré des Études mise en avant ;
- « Le canapé du SALM » : les vidéos, lues dans une fenêtre sans quitter la page ;
- catalogue photos ;
- appel final avec les contacts de l'organisateur.
Tout le contenu de la page vient de la base de données (édition 2027 initialisée par un seed avec le contenu des brouillons), et non du code de la page.
Il faut aussi un lien dans la navbar publique (libellé « SALM <année> »), visible uniquement quand une édition est publiée.

P2 — Inscription établissement (exposant).
Le formulaire comporte 3 étapes (voir inscription-ecole.dc.html), avec les champs du Google Form existant :
- nom de l'établissement ;
- téléphone ;
- e-mail ;
- programmes proposés : BACHELOR, BTS, LICENCE, MASTER, Autre ;
- liste des exposants : nom et prénoms + contact, au moins 1 ;
- type de stand, parmi les types de stands de l'édition (initialisés à STAND OR, STAND DIAMANT, STAND PREMIUM) ;
- question libre (facultative).
L'écran final « Présence confirmée » récapitule l'inscription et indique explicitement qu'aucun badge n'est nécessaire. Retirer de la maquette la mention « récapitulatif envoyé par e-mail » : aucun e-mail n'est envoyé dans cette feature.

P2 — Back-office des inscriptions (pas de maquette, reprendre les patterns de l'admin existant).
- Nouvelle entrée « SALM » dans le menu admin.
- Liste des étudiants inscrits par édition :
  - recherche par nom ou téléphone, filtre par niveau, compteur total ;
  - export CSV ;
  - re-téléchargement du badge d'un inscrit ;
  - suppression d'un doublon.
- Liste des établissements inscrits :
  - fiche détail (exposants, programmes, stand, question) ;
  - statut de suivi : nouvelle / contactée / confirmée / annulée ;
  - note interne ;
  - export CSV.
- Ouverture et fermeture des inscriptions, séparément pour les étudiants et pour les établissements. Quand elles sont fermées, la page publique affiche un message et masque le formulaire concerné.

### Règles et contraintes

- Toute l'interface est en français avec accents, sur le ton de la maquette (tutoiement pour les étudiants, vouvoiement pour les établissements).
- Les données personnelles sont limitées au strict nécessaire. Une mention d'usage est affichée sous le formulaire étudiant.
- Protection anti-spam des formulaires publics (robots, soumissions répétées).
- Accessibilité : vrais libellés de champs, erreurs liées aux champs, clavier, contrastes 4,5:1, fenêtre vidéo accessible.

### Hors périmètre de cette feature (prévu ensuite, à anticiper dans le modèle de données)

- Feature B : écrans d'administration des éditions et des contenus (chronogramme, vidéos, photos, stands, affiche, textes), duplication d'une édition, statistiques. Le modèle de données de la feature A doit déjà contenir toutes ces entités, pour que B n'ajoute que des écrans.
- Feature C : contrôle d'entrée par scan du QR code le jour J.
- Paiement des stands, envoi d'e-mails et de WhatsApp, comptes utilisateurs.

### Incohérences connues dans les sources, à signaler

- Le chronogramme du Jour 1 fait commencer le Panel 2 (14h00–14h30) et l'Exposition (14h00–16h00) à la même heure.
- Le Jour 2 laisse un trou entre 10h00 et 10h10.
- L'adresse de contact des documents est salm2026@sucreycorporates.com, alors que l'édition est celle de 2027.
- Le lieu 2027 n'est pas connu.
```

## A2. `/speckit.clarify`

```text
Concentre les questions sur ces 5 points :

1. Récupération du badge : suffit-il de ressaisir le même numéro de téléphone pour re-télécharger un badge existant ? N'importe qui connaissant un numéro pourrait alors obtenir le badge d'un autre. Faut-il aussi vérifier le nom ?
2. Médias de la page : les vidéos « canapé » et les photos affichées sur la page de l'édition N sont-elles rattachées à l'édition N-1 (« retour sur l'édition précédente ») ou saisies directement sur l'édition N ?
3. Programmes proposés par les établissements : choix multiple (maquette) ou choix unique (Google Form actuel) ?
4. Faut-il limiter le nombre d'inscriptions étudiantes (capacité de la salle) ou fermer les inscriptions automatiquement à une date ?
5. Durée de conservation des données des inscrits après l'événement.
```

## A3. `/speckit.plan`

```text
Stack imposée (voir CLAUDE.md et .specify/memory/constitution.md) :
- Nuxt 4 (répertoire app/), Vue 3, Tailwind CSS v4 via @tailwindcss/vite ;
- Prisma 7 + SQLite, client importé depuis server/utils/prisma.ts ;
- pnpm, TypeScript ESM ;
- modules Nuxt installés avec `npx nuxi@latest module add`.
Noms de fichiers et de dossiers en [a-z0-9_-] uniquement, sans accents. Textes de l'interface en français avec accents.

Existant à réutiliser (vérifier avant de créer quoi que ce soit, via un sous-agent de recherche, comme le demande CLAUDE.md) :
- Formulaire étudiant : reprendre les champs, la validation et le style de app/components/DownloadModal.vue. STUDY_LEVELS et IVORIAN_PHONE_REGEX sont aujourd'hui dupliqués dans DownloadModal.vue et server/api/downloads/index.post.ts : les extraire dans le dossier shared/ de Nuxt 4 et les réutiliser aux deux endroits et dans le module SALM.
- Anti-robots : server/utils/is-bot.ts.
- Export CSV : suivre le modèle de server/api/downloads/export.get.ts.
- Admin :
  - layout app/layouts/admin.vue : ajouter une entrée « SALM » au menu ;
  - listes sur le modèle de app/pages/admin/telechargements.vue et newsletter.vue ;
  - authentification par session (server/utils/session.ts, server/api/auth).
- Sécurité API : server/middleware/admin.ts protège les routes par préfixe (PROTECTED_PREFIXES, ADMIN_READ_PREFIXES). Toute nouvelle route non listée y est publique. Mettre toutes les routes d'administration SALM sous /api/admin/salm/*, protégé pour toutes les méthodes, et les routes publiques sous /api/salm/*.
- Navbar publique : app/components/AppNavbar.vue (tableau de liens + indicateur glissant en CSS anchor positioning).
- Page et SEO : s'inspirer de app/pages/resultats.vue et de app/components/ResultatsFloatingCard.vue.

Maquette : documentations/SALM/maquette/.
- Reproduire fidèlement les écrans publics.
- Accent SALM #D5570B, orange texte #F4792B, fonds #0B0B0D / #141417 / #16161A, ambre du site #FBBF24.
- Polices Montserrat, DM Sans et Yellowtail : décider comment les charger (Google Fonts limité au module ou polices auto-hébergées) sans alourdir le reste du site.

Points à trancher dans research.md :
- Génération du badge PDF côté serveur, sans navigateur headless (image Docker légère) :
  - comparer pdf-lib + @pdf-lib/fontkit + qrcode avec les autres options ;
  - polices embarquées dans le PDF ;
  - PDF généré à la volée ou stocké.
- Numérotation des badges (SALM27-000001, séquentielle par édition, sans collision en cas d'inscriptions simultanées) et jeton du QR code (URL de vérification non devinable).
- Modélisation Prisma COMPLÈTE dès cette feature, y compris les entités que seule la feature B administrera :
  - SalmEdition : année, dates, horaires, lieu, slogan, textes, URL de la vidéo hero, affiche, contacts, statut brouillon / publiée / archivée, inscriptions ouvertes ou fermées pour chaque public ;
  - créneaux du chronogramme : jour, heure de début et de fin, titre, type, description, mis en avant, ordre ;
  - temps forts, vidéos, photos et types de stands, tous ordonnables ;
  - SalmStudentRegistration, avec une contrainte d'unicité sur (editionId, téléphone normalisé) ;
  - SalmSchoolRegistration et ses exposants.
  Justifier chaque table au regard du principe YAGNI de la constitution.
- Seed idempotent de l'édition 2027 à partir des brouillons.
- Normalisation du téléphone avant stockage et comparaison (espaces, préfixe +225).
- Vidéos YouTube :
  - hero en lecture automatique, sans son, en boucle, avec une image de secours ;
  - vidéos « canapé » en chargement différé : miniature, puis iframe au clic dans une fenêtre accessible (focus piégé, Échap pour fermer).
- Compte à rebours calculé côté client pour éviter les écarts d'hydratation.
- Anti-spam : champ piège (honeypot) + limitation de débit simple par IP sur les POST publics.
- Migration compatible avec le déploiement Docker (deploy.sh, `prisma migrate deploy`) et persistance de public/uploads.

Livrables : plan.md, research.md, data-model.md, contracts/ (routes publiques et admin, avec leurs payloads et leurs erreurs) et quickstart.md (scénarios de vérification manuelle, aucun test runner n'étant configuré).
```

## A4. `/speckit.checklist` (facultatif)

```text
Checklist de revue :
- Conformité à la maquette : desktop 1440 px et mobile 390 px.
- Accessibilité : libellés, erreurs, clavier, contrastes, fenêtre vidéo.
- Sécurité :
  - toutes les routes /api/admin/salm/* sont protégées par server/middleware/admin.ts ;
  - validation serveur de chaque champ ;
  - honeypot et limitation de débit ;
  - QR code non devinable ;
  - aucune fuite de données d'un autre inscrit.
- Données personnelles : minimisation, mention d'usage, suppression possible.
- Badge PDF : format 10 × 15 cm, nom long, caractères accentués, QR code lisible une fois imprimé.
- Aucun badge ne peut être généré pour un établissement.
- Multi-édition : aucun contenu de l'édition 2027 n'est écrit en dur dans les pages.
- Conventions : noms de fichiers sans accents, textes avec accents, composants existants réutilisés.
```

## A5. `/speckit.tasks`

```text
Organise les tâches pour livrer au plus vite l'ouverture des inscriptions étudiantes :

- Phase 1 : fondations.
  - Modèle Prisma complet et migration ;
  - extraction de STUDY_LEVELS et IVORIAN_PHONE_REGEX dans shared/ ;
  - protection de /api/admin/salm/* dans server/middleware/admin.ts ;
  - seed de l'édition 2027.
- Phase 2 (MVP) : inscription étudiant + badge PDF + page /salm alimentée par la base + lien navbar.
- Phase 3 : inscription établissement + écran de confirmation.
- Phase 4 : back-office des inscriptions (menu, listes, recherche, filtres, export CSV, statuts, notes, ouverture et fermeture).
- Phase finale : version mobile, SEO et accessibilité, vérification des scénarios de quickstart.md.

Marque [P] les tâches parallélisables (fichiers distincts). Chaque tâche indique le chemin exact du fichier concerné.
```

## A6. `/speckit.analyze`

```text
Vérifie la cohérence entre spec.md, plan.md et tasks.md. Contrôle en particulier :
- que chaque user story a ses tâches ;
- que chaque route admin est protégée ;
- que l'unicité téléphone + édition est appliquée côté base ET côté API ;
- que les établissements ne peuvent recevoir aucun badge ;
- que le formulaire étudiant a strictement les 3 champs demandés ;
- que le modèle de données couvre déjà les besoins des features B et C ;
- que chaque écran de la maquette a sa tâche d'implémentation.
```

## A7. `/speckit.implement`

```text
Implémente tasks.md phase par phase, dans l'ordre, et coche chaque tâche terminée.

Règles :
- Avant de créer un composant, lance un sous-agent pour vérifier qu'un composant similaire n'existe pas déjà (par nom et par fonction), comme le demande CLAUDE.md.
- Pour chaque écran public, ouvre le fichier .dc.html correspondant dans documentations/SALM/maquette/ et reprends les textes, les couleurs et les espacements.
- Pour le back-office, reprends le style et les composants des pages admin existantes.
- Après chaque phase : `pnpm build` doit passer, et les scénarios concernés de quickstart.md doivent être vérifiés sur `pnpm dev`.
- Ne jamais committer ni déployer sans que je le demande.
```

---

# Feature B — salm-contenus-admin

À lancer une fois la feature A fusionnée.

## B1. `/speckit.specify`

```text
Module « SALM », partie 2/3 : back-office des éditions et des contenus, plus statistiques.

La feature précédente (specs/<numéro>-salm-inscriptions) a livré la page publique /salm, les inscriptions et le back-office des inscriptions. Elle a aussi créé le modèle de données complet : éditions, créneaux du chronogramme, temps forts, vidéos, photos et types de stands. Aujourd'hui, ce contenu n'est modifiable que par le seed. Cette feature ajoute les écrans d'administration pour que l'équipe prépare et mette à jour chaque édition sans développeur. Lire la spec, le data-model et les contrats de cette feature avant de commencer.

Pas de maquette : reprendre les patterns des pages admin existantes (app/pages/admin/magazines.vue, rubriques.vue, partenaires.vue, images-accueil.vue), dans la section « SALM » du menu admin créée par la feature précédente.

### User stories

P1 — Gérer les éditions.
- Lister les éditions ; créer, modifier et archiver une édition.
- Champs d'une édition : année, dates de début et de fin, horaires, lieu, slogan, statut brouillon / publiée / archivée.
- Une seule édition peut être publiée à la fois ; publier une édition dépublie la précédente, après confirmation.
- Prévisualiser une édition en brouillon telle qu'elle apparaîtra sur /salm, avant de la publier.

P1 — Gérer les contenus d'une édition :
- vidéo hero (URL YouTube) ;
- texte « Pourquoi le SALM » et affiche officielle (upload d'image) ;
- contacts de l'organisateur ;
- temps forts du programme (titre + photo), ordonnables ;
- chronogramme : jours, puis créneaux avec heure de début et de fin, titre, type (cérémonie, panel, présentation, stands, pause, exposition), description et option « mis en avant », ordonnables. Signaler, sans les bloquer, les créneaux qui se chevauchent ;
- vidéos « canapé » (titre, invité, URL YouTube), ordonnables ;
- catalogue photos : upload multiple, légende facultative, ordre, suppression ;
- types de stands (nom, description, tarif facultatif), ordonnables. Un type déjà choisi par un établissement ne peut pas être supprimé, seulement masqué.

P2 — Dupliquer une édition pour préparer la suivante.
- La copie crée une édition en brouillon avec l'année suivante.
- Elle recopie les textes, les temps forts, la structure du chronogramme, les types de stands et les contacts.
- Elle ne recopie jamais les inscriptions.

P3 — Statistiques SALM.
- Inscriptions étudiantes par jour et par niveau d'étude ;
- établissements par type de stand et par statut ;
- comparaison avec l'édition précédente quand elle existe.

### Règles

- Toutes les actions sont réservées aux administrateurs connectés.
- Messages de confirmation avant chaque suppression et chaque publication.
- Validation des URL YouTube et des images (formats et poids acceptés).
- Interface en français avec accents.

### Hors périmètre

Le contrôle d'entrée le jour J (feature C) et toute modification de la page publique au-delà de la prévisualisation.
```

## B2. `/speckit.clarify`

```text
Concentre les questions sur :
1. La duplication d'une édition doit-elle aussi recopier les photos et les vidéos, ou seulement la structure ?
2. Qui publie : faut-il une validation à deux personnes ou un journal des modifications, ou un seul rôle administrateur suffit-il ?
3. Volume attendu du catalogue photos (ordre de grandeur) et poids maximal par photo.
4. Les statistiques vont-elles dans le tableau de bord admin existant, dans une vue SALM dédiée, ou les deux ?
5. Faut-il pouvoir republier une édition archivée ?
```

## B3. `/speckit.plan`

```text
Même stack et mêmes conventions que la feature salm-inscriptions (CLAUDE.md, constitution). Partir de son data-model.md et de ses contrats : le modèle ne devrait changer qu'à la marge ; justifier toute nouvelle migration.

À réutiliser (vérifier par un sous-agent avant de créer un composant) :
- upload d'images : server/api/upload (busboy + sharp, public/uploads/<catégorie>), catégorie salm ;
- éditeur de texte riche : ToastEditor.client.vue et ToastViewer.client.vue, si le texte « Pourquoi le SALM » doit être mis en forme ;
- listes, formulaires et fenêtres de confirmation des pages admin existantes ;
- mécanisme d'ordre existant, s'il y en a un (rubriques, partenaires, images d'accueil) ; sinon, choisir la solution la plus simple (boutons monter / descendre ou glisser-déposer) et la justifier ;
- graphiques : chart.js et vue-chartjs, comme le tableau de bord actuel (server/api/stats/*).

Points à trancher dans research.md :
- duplication d'une édition dans une transaction Prisma ;
- unicité de l'édition publiée ;
- prévisualisation d'un brouillon (route protégée ou paramètre réservé aux admins) ;
- nettoyage des fichiers uploadés quand une photo ou une affiche est supprimée ;
- extraction de l'identifiant YouTube à partir des différents formats d'URL.

Toutes les routes sous /api/admin/salm/*, déjà protégé par server/middleware/admin.ts.

Livrables : plan.md, research.md, data-model.md (seulement les écarts), contracts/ et quickstart.md.
```

## B4. `/speckit.tasks` puis `/speckit.analyze` puis `/speckit.implement`

```text
tasks : phases dans l'ordre éditions → contenus (un sous-ensemble par type de contenu, en [P] quand les fichiers sont distincts) → duplication → statistiques → vérification quickstart.md.

analyze : vérifier que chaque type de contenu affiché sur /salm a son écran d'administration, que la duplication n'emporte aucune inscription, et que toutes les routes sont sous /api/admin/salm/*.

implement : mêmes règles que la feature salm-inscriptions (sous-agent avant chaque nouveau composant, `pnpm build` et quickstart après chaque phase, ni commit ni déploiement sans ma demande).
```

---

# Feature C — salm-controle-entree (facultative)

À lancer seulement si le contrôle d'entrée est retenu, et à terminer avant le 12 mars 2027.

## C1. `/speckit.specify`

```text
Module « SALM », partie 3/3 : contrôle d'entrée le jour J.

Les badges étudiants générés par la feature salm-inscriptions contiennent un QR code qui encode une URL de vérification non devinable, ainsi qu'un numéro (ex. SALM27-000482). Les établissements n'ont pas de badge. Lire la spec, le data-model et les contrats des features précédentes.

### User stories

P1 — Scanner un badge.
- Un membre de l'équipe, connecté à l'admin sur son téléphone, ouvre une page de contrôle, scanne le QR code d'un badge (imprimé ou affiché sur un téléphone) et voit immédiatement le résultat.
- Résultat valide : nom, niveau d'étude, numéro de badge ; la présence du jour est enregistrée.
- Résultat « déjà scanné aujourd'hui », avec l'heure du premier passage.
- Résultat « badge invalide ou d'une autre édition ».
- Retours visuels très contrastés et gros caractères, lisibles en extérieur.

P1 — Saisie manuelle : retrouver un inscrit par numéro de badge ou par téléphone quand le QR code est illisible.

P2 — Suivi des entrées : compteur d'entrées par jour (Jour 1 / Jour 2) visible sur la page de contrôle et dans la liste des inscrits du back-office, avec une colonne « présent » par jour dans l'export CSV.

### Règles

- Page réservée aux administrateurs connectés, conçue d'abord pour le mobile (écran de 390 px, usage d'une seule main).
- Un badge ne compte qu'une entrée par jour.
- Scanner l'URL du QR code avec l'appareil photo du téléphone, sans être connecté, ne doit révéler aucune donnée personnelle.

### Hors périmètre

Inscription sur place des visiteurs non inscrits, contrôle des exposants.
```

## C2. `/speckit.clarify`

```text
Concentre les questions sur :
1. Combien de postes de contrôle en parallèle, et sur quels appareils (téléphones Android ou iPhone du staff) ?
2. La connexion internet sur le lieu est-elle fiable, ou faut-il un mode dégradé hors ligne (liste des badges préchargée, synchronisation ensuite) ?
3. Que faire pour un étudiant non inscrit qui se présente : refus, ou inscription sur place via le formulaire public ?
4. Faut-il distinguer les créneaux (par exemple un contrôle à l'entrée des panels) ou seulement l'entrée du salon ?
5. Que doit afficher l'URL du QR code quand quelqu'un d'autre que le staff la scanne ?
```

## C3. `/speckit.plan`

```text
Même stack et mêmes conventions que les features précédentes. Réutiliser le jeton du QR code et les routes /api/admin/salm/* existantes.

Points à trancher dans research.md :
- lecture du QR code dans le navigateur : BarcodeDetector natif avec repli sur une bibliothèque légère (comparer jsQR, html5-qrcode, qr-scanner) ; accès caméra en HTTPS obligatoire (voir `./deploy.sh ssl`) ;
- table des passages : un enregistrement par inscrit et par jour, avec une contrainte d'unicité ;
- comportement en cas de double scan simultané sur deux postes ;
- mode hors ligne, si la clarification le retient.

Livrables : plan.md, research.md, data-model.md (écarts), contracts/ et quickstart.md, avec un scénario de test sur un vrai téléphone.
```

## C4. `/speckit.tasks` puis `/speckit.analyze` puis `/speckit.implement`

```text
tasks : table des passages + API → page de contrôle mobile (scan) → saisie manuelle → compteurs, colonne « présent » dans la liste et l'export → test sur téléphone.

analyze : vérifier qu'aucune donnée personnelle n'est exposée sans session admin, et que l'unicité inscrit + jour est garantie par la base.

implement : mêmes règles que les features précédentes.
```
