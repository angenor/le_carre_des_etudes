# Contrat — pages, composants et adresses

**Feature** : `008-salm-controle-entree` · Research : R2, R6, R8, R10, R11, R12, R13

## Pages

| Route | Fichier | Layout | Données | Rôle |
|---|---|---|---|---|
| `/admin/salm/controle` | `app/pages/admin/salm/controle/index.vue` | `salm-controle` (nouveau, plein écran) | `control/snapshot`, `state`, `entries`, `lookup`, `sync`, `registrations` | Contrôle d'entrée (US1 à US4). `?token=<jeton>` ouvre directement la fiche de ce badge, sans enregistrer (FR-223). Toutes les données sont chargées **côté navigateur** : le HTML rendu par le serveur, mis en cache par le service worker, ne contient aucune donnée personnelle |
| `/admin/salm/controle/affiche` | `app/pages/admin/salm/controle/affiche.vue` | aucun (`layout: false`), page d'impression | `control/poster` | Affiche A4 « Pas encore inscrit·e ? » (FR-241). `noindex` |
| `/salm/v/:token` | `app/pages/salm/v/[token].vue` (**modifiée**) | `default` | `GET /api/salm/edition` ; si admin : `control/lookup?token=` | Page d'information identique pour tout jeton (FR-222) ; validité et « Contrôler ce badge » pour l'admin (FR-223). `noindex, nofollow` (inchangé) |
| `/admin/salm` | `app/pages/admin/salm/index.vue` (**modifiée**) | `admin` | `students` (étendue) | Compteurs par jour, colonnes de présence, filtre de présence, marqueur « Sur place » (FR-225 à FR-227, FR-247) |
| `/admin/login` | `app/pages/admin/login.vue` (**modifiée**) | aucun | — | Accepte `?redirect=` : chemin qui commence par `/admin/`, sinon `/admin` (R8) |

### Adresses courtes (`routeRules` de `nuxt.config.ts`, redirections 302)

| Adresse | Destination | Usage |
|---|---|---|
| `/controle` | `/admin/salm/controle` | Favori sur les téléphones de l'équipe (FR-201) |
| `/inscription` | `/salm/inscription-etudiant` | QR code de l'affiche et de « Pas de badge ? » (FR-240) |

### Menu admin

`app/layouts/admin.vue` : la section « SALM » reçoit l'entrée **« Contrôle d'entrée »** (`/admin/salm/controle`), après « Inscriptions ». Le layout transmet `?redirect=<route courante>` quand il renvoie vers la connexion.

## Layout `salm-controle` (nouveau)

`app/layouts/salm-controle.vue` : plein écran, fond sombre neutre, sans barre latérale. Il assure :

- la vérification de session **tolérante au réseau** (R8) ;
- l'enregistrement du service worker `public/salm-controle-sw.js`, avec `scope: '/admin/salm/controle'` (R6) ;
- `useHead` : `robots: noindex`, `viewport` avec `viewport-fit=cover`, `theme-color`.

## Écran de contrôle : structure (390 × 844, tenue d'une main)

```text
┌──────────────────────────────┐
│ Jour 1 · ven. 12 mars   ☰    │  bandeau : jour contrôlé (ou « MODE ESSAI »), menu
│ 1 204 entrées · J2 : 0       │  compteurs (FR-224) ; « HORS LIGNE · 3 en attente » si besoin
├──────────────────────────────┤
│                              │
│   vue caméra (60 % haut)     │  cadre de visée ; invite « Présentez le QR code du badge »
│        ┌────────┐            │
│        └────────┘            │
│                              │
├──────────────────────────────┤
│ [ Saisie manuelle ] [Pas de  │  tiers bas : zones de 56 px, accessibles au pouce (FR-203)
│                      badge ?]│
└──────────────────────────────┘
```

**Résultat** : couche plein écran au-dessus de la caméra, sur fond de couleur pleine (palette R11). La caméra continue de lire derrière.

| Élément | Taille | Contenu |
|---|---|---|
| Icône | 72 px | ✓ · ! · ✕ · ? |
| Mot d'état | 44 px, capitales, gras | `ENTRÉE VALIDÉE` · `DÉJÀ ENTRÉ·E AUJOURD'HUI` · `BADGE REFUSÉ` · `NON VÉRIFIÉ` · `VALIDE (ESSAI)` |
| Détail | 24 px | « à 09h42 » · « Badge d'une autre édition (SALM 2026) » · « Badge invalide » · « Ce QR code n'est pas un badge SALM » · « Réseau indisponible » · « Session expirée » · « Badge absent de la liste hors ligne » |
| Nom | 30 px, capitales, retour à la ligne | Seulement pour `entered`, `already` et `valid_trial` |
| Niveau · numéro | 22 px | « Licence (Bac+3) · SALM27-000482 » |
| Actions (bas) | 56 px | « Annuler cette entrée » (après `entered`, avec confirmation) · « Réessayer » / « Se reconnecter » (non vérifié) · « Retour au scan » |

- Le résultat reste affiché jusqu'au scan suivant, ou jusqu'au toucher de « Retour au scan ».
- Une lecture identique dans les 5 s qui suivent est ignorée (R10).
- Accessibilité : la couche de résultat est une région `role="status"` avec `aria-live="assertive"` (mot d'état et nom annoncés), et chaque état porte un mot et une icône en plus de la couleur (FR-208).

## Composants (nouveaux, `app/components/salm/`, préfixe `Salm…`)

Vérification préalable de l'existant (consigne de CLAUDE.md) : aucun composant de caméra, de lecture de QR code ni d'écran de résultat n'existe. `modal-dialog.vue` (fenêtre vidéo) et `student-form.vue` (formulaire public au style de la maquette, avec champs anti-robot) ne conviennent pas : le premier ne gère pas un plein écran coloré, le second porte le visuel public. La validation, la liste des niveaux et la normalisation du téléphone sont **réutilisées** depuis `shared/`.

| Fichier | Composant | Rôle |
|---|---|---|
| `control-scanner.vue` | `<SalmControlScanner>` | `<video playsinline muted>`, démarrage et arrêt de la caméra, boucle de lecture ; émet `read(text)`. Erreurs de caméra → `unavailable(reason)` |
| `control-result.vue` | `<SalmControlResult>` | Couche plein écran d'un résultat (palette, tailles, actions) |
| `control-counters.vue` | `<SalmControlCounters>` | Bandeau jour, compteurs, état hors ligne, « Prêt hors ligne » |
| `control-manual.vue` | `<SalmControlManual>` | Champ unique `inputmode="tel"` : les chiffres suffisent (« 482 », téléphone) ; « SALM27-000482 », collé ou saisi au clavier complet, est aussi accepté, fiche, « Valider l'entrée » / « Annuler cette entrée » |
| `control-onsite.vue` | `<SalmControlOnsite>` | « Pas de badge ? » : adresse courte, QR code, lien vers l'affiche ; formulaire « Inscrire la personne » (3 champs, mention d'usage, case « La personne a été informée… ») |

## Composables et utilitaires (nouveaux)

| Fichier | Rôle |
|---|---|
| `app/composables/use-qr-reader.ts` | Choix du moteur (`BarcodeDetector` ou `jsqr` en `import()`), boucle à ~8 images/s, recadrage central (R1 bis) |
| `app/composables/use-salm-control.ts` | État du poste : précharge, rafraîchissement (15 s), en ligne d'abord avec délai de 3 s puis repli local, file et synchronisation, relecture ignorée 5 s, vibration, son, écran allumé |
| `app/utils/salm-control-storage.ts` | Accès `localStorage` sous `salm-controle:v1:*` (R7), effacement |
| `shared/utils/salm-control.ts` | `extractVerifyToken`, `parseControlQuery`, `badgeTokenHash` (SHA-256 tronqué, Web Crypto côté client et `node:crypto` webcrypto côté serveur), `resolveControlResult` (règles communes serveur / hors ligne), `controlDayFor(days, now)` |
| `public/salm-controle-sw.js` | Service worker (R6) |

`useAdmin().logout()` (existant) est complété : avertissement si la file n'est pas vide, puis effacement du stockage `salm-controle:*` et des caches `salm-controle-*`.

## Textes (vouvoiement de l'équipe, FR-231)

| Clé | Texte |
|---|---|
| Invite | Présentez le QR code du badge |
| Caméra refusée | L'accès à l'appareil photo est refusé. Autorisez-le dans les réglages du navigateur pour ce site, ou utilisez la saisie manuelle. |
| Caméra absente | Aucun appareil photo utilisable. Utilisez la saisie manuelle. |
| Mode essai | Aucun jour de salon aujourd'hui : mode essai, aucune entrée n'est enregistrée |
| Aucune édition | Aucune édition SALM publiée : rien à contrôler |
| Hors ligne | HORS LIGNE · {n} entrée(s) en attente d'envoi |
| Prêt hors ligne | Prêt hors ligne · liste du {HH:MM} |
| Horloge | L'heure de ce téléphone diffère de {n} min de celle du serveur. Réglez l'heure automatique. |
| Recherche : aucun résultat | Aucun inscrit avec ce numéro pour le SALM {année} |
| Recherche : format | Saisissez un numéro de badge (ex. 482 ou SALM27-000482) ou un téléphone (ex. 07 12 34 56 78) |
| Téléphone hors ligne | Recherche par téléphone indisponible hors ligne : utilisez le numéro de badge |
| Inscription hors ligne | Inscription sur place indisponible hors ligne : réessayez au retour du réseau |
| Après inscription | Communiquez le numéro {SALM27-004822} à la personne. Son badge se récupère sur /salm avec son nom et son téléphone. |
| Déconnexion avec file | {n} entrée(s) ne sont pas encore envoyées. Si vous vous déconnectez maintenant, elles seront perdues. |
| Stockage indisponible | Mode hors ligne indisponible sur ce navigateur (navigation privée ?) |

## Page `/salm/v/:token` (visiteur non connecté)

- Titre : « Ce QR code est un badge du SALM {année} ». Texte : « Présentez-le à l'entrée. »
- Liste des jours (« Vendredi 12 mars 2027 · 9h30 – 16h00 »), lieu (`venueLabel`), lien « Découvrir le SALM {année} » vers `/salm`.
- Sans édition publiée : « La prochaine édition du SALM sera bientôt annoncée » et le lien vers `/salm`.
- Styles SALM existants (`salm.css`). **Aucune icône** de validité ni couleur d'état.

Pour un administrateur connecté, après hydratation, un encart s'ajoute : validité (« Badge valide », « Badge d'une autre édition (SALM 2026) », « Badge invalide »), le nom si le badge est valide, et le bouton « Contrôler ce badge » vers `/admin/salm/controle?token=…` (édition publiée seulement).
