# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Le Carré des Études" is an Ivorian magazine for students, aimed at guiding, informing, and inspiring Côte d'Ivoire's student community. This is its web platform.

## Commands

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm postinstall  # Run nuxt prepare (auto-runs after pnpm install)
```

### Prisma (database)

```bash
pnpm prisma migrate dev     # Apply migrations in development
pnpm prisma migrate deploy  # Apply migrations in production
pnpm prisma generate        # Regenerate Prisma client
pnpm prisma db seed         # Crée les éditions SALM absentes (2026/2027) ; n'écrase jamais une édition existante — prisma/seed/salm-data.ts
```

No test runner is configured yet.

## Tech Stack

- **Nuxt 4** (v4.3.1) with Vue 3
- **pnpm** as package manager
- **Tailwind CSS v4** (v4.2.1) via `@tailwindcss/vite` Vite plugin — NOT `@nuxtjs/tailwindcss`
- **Prisma 7** with SQLite (`dev.db` at project root)
- TypeScript (ESM)

## Architecture

### Tailwind CSS v4 Setup

Tailwind is configured as a Vite plugin in `nuxt.config.ts`, not as a Nuxt module. The global stylesheet at `app/assets/css/main.css` uses `@import "tailwindcss"` (v4 syntax). Do not install or use `@nuxtjs/tailwindcss` (that's for Tailwind v3).

### Prisma Setup

- Schema: `prisma/schema.prisma`
- Config: `prisma.config.ts` (sets datasource URL and migration path)
- Generated client output: `app/generated/prisma/` (gitignored)
- Server singleton: `server/utils/prisma.ts` — import `prisma` from here in server routes
- Database URL defined in `.env` as `DATABASE_URL`

### Nuxt App Structure

Standard Nuxt 4 layout with the `app/` directory convention:
- `app/app.vue` — root component
- `app/pages/` — file-based routing
- `app/assets/css/` — stylesheets
- `server/` — server routes and utilities (Nitro)
- `shared/` — code commun app + serveur (dossier Nuxt 4, auto-importé côté app, `#shared/...` côté serveur) : constantes et normalisations (`STUDY_LEVELS`, téléphone ivoirien, validateurs SALM), types
- Mode clair / sombre du site public : `@nuxtjs/color-mode` (réglage du visiteur, puis son choix, clé `lcde-theme`) pose `light` ou `dark` sur `<html>` ; bouton rond à côté de la barre de navigation. Les composants publics n'écrivent pas de couleur en dur : jetons de `app/assets/css/main.css` (`bg-page`, `bg-surface`, `text-ink`, `text-ink-muted`, `text-accent`, `border-line`, `from-title-from`… ; SALM : `bg-salm-bg`, `text-salm-ink`, `text-salm-accent-text`…), dont la valeur sombre est la couleur d'origine. Zone toujours sombre (pied de page, texte sur photo ou vidéo, fenêtres sur voile) : classe `dark` sur le conteneur. Aplats ambre des boutons et orange SALM identiques dans les deux modes. Dans un `<style scoped>`, cibler le clair par `.light .ma-classe` (jamais `:global(.light) .ma-classe`, que Vue réduit à `.light`). L'administration n'utilise pas ces jetons. SALM en clair : « Soleil d'Abidjan » (abricot, orange, vert, jaune soleil) ; les aplats propres au clair (bandeaux `salm-band-*`, carte `salm-card-green`, légendes `salm-cap-*`, `salm-day-*`, `salm-slot-sun`, `salm-frame-*`, `salm-final`…) sont dans `app/assets/css/salm.css`, sous `.light`, et redéfinissent localement les jetons SALM : aucun effet en sombre. Magazine en clair : « Édition jaune » (papier, jaune de la couverture #F9C81A, encre, indigo ; style kiosque à bordures et ombres franches) : classes `mag-*` (`mag-band-yellow`, `mag-band-indigo`, `mag-badge`, `mag-marker`, `mag-card`, `mag-cover`, `mag-btn`, `mag-electric`, `mag-nav`…) en fin de `main.css`, sous `.light`
- Mode maintenance du site entier : interrupteur dans la barre latérale admin (`SiteSettings.maintenanceMode`). `server/middleware/maintenance.ts` renvoie les visiteurs vers `/maintenance` (503) et les API publiques en 503 ; `app/middleware/maintenance.global.ts` couvre la navigation côté client. Les admins connectés voient le site avec un bandeau d'aperçu.
- Envoi d'images du back-office : toute image choisie passe d'abord par `app/components/ImageEditor.vue` (recadrage, proportions, largeur, format, qualité, poids mesuré sur le fichier produit). Images agrandissables au clic (photos du catalogue SALM, rubriques) : champ `variants=web` de `POST /api/upload` ; le fichier recadré est gardé en `originalPath` (affiché dans la galerie / la visionneuse) et le serveur en tire `<nom>-web.webp` (1600 px au plus) renvoyé en `path` → `imagePath` (grilles, cartes). `originalPath` vide (seed, envois antérieurs) : `imagePath` sert aux deux
- Module SALM : `app/components/salm/` (kebab-case → `<Salm…>`), `app/pages/salm/`, `server/api/salm/` (public), `server/api/admin/salm/` (protégé toutes méthodes par `server/middleware/admin.ts`). Polices Montserrat/DM Sans/Yellowtail auto-hébergées, déclarées dans `app/assets/css/salm.css` et importées **uniquement** par les composants SALM (ne pas l'ajouter à `css` de `nuxt.config.ts`). Polices du badge PDF dans `server/assets/fonts/salm/`
- Back-office SALM des contenus (007) : menu « SALM » › Inscriptions, Éditions (`/admin/salm/editions`, fiche en sections `?section=`), Statistiques (`/admin/salm/statistiques`), Chiffres clés (`/admin/salm/chiffres-cles` : table `SalmKeyFigure`, toutes éditions confondues, liste remplacée en entier par `PUT /api/admin/salm/key-figures`, servie avec `GET /api/salm/edition` en `keyFigures` et affichée en fin de `/salm` par `SalmKeyFigures`, nombre qui défile via `data-motion="count"`), Partenaires (`/admin/salm/partenaires` : table `SalmPartner`, globale aussi, distincte des partenaires du magazine ; `PUT /api/admin/salm/partners` remplace la liste et libère les logos qui ne servent plus ; `partners` de `GET /api/salm/edition`, affichés après les chiffres clés par `SalmPartners` en un bandeau qui défile, CSS seul) ; aperçu d'une édition non publiée sur `/admin/salm/editions/:id/apercu` (même composant `SalmEditionView` que `/salm`). Logique serveur dans `server/utils/salm-content.ts` (validateurs, ordre, fiche), `salm-lifecycle.ts` (publier, archiver, supprimer, dupliquer), `salm-files.ts`, `salm-stats.ts`. Catégorie d'upload `salm` de `POST /api/upload` : JPEG, PNG, WebP de 5 Mo au plus, PDF de 10 Mo au plus, contenu réel contrôlé ; fichiers dans `public/uploads/salm/`, supprimés quand plus aucune ligne SALM ne les référence (jamais les images du seed `public/images/salm/`)
- Contrôle d'entrée SALM (008) : page mobile `/admin/salm/controle` (layout plein écran `salm-controle`, adresse courte `/controle`, `?token=` ouvre la fiche d'un badge sans enregistrer) et affiche A4 `/admin/salm/controle/affiche` (adresse courte `/inscription` → formulaire étudiant). Routes `server/api/admin/salm/control/*` (snapshot, state, entries, lookup, sync, registrations, poster), toujours sur l'édition publiée, sans téléphone ni jeton en clair dans les réponses ; logique dans `server/utils/salm-control.ts`, règles communes client / serveur dans `shared/utils/salm-control.ts` (`extractVerifyToken`, `parseControlQuery`, `badgeTokenHash`, `resolveControlResult`). Table `SalmEntry` : une entrée par inscription et par jour (`@@unique([registrationId, dayId])`, double scan départagé par la base) ; colonne `SalmStudentRegistration.origin` (`online` · `onsite`). Hors ligne : précharge (empreinte SHA-256 du jeton, nom, niveau) et file (numéro de badge) dans `localStorage` `salm-controle:v1:*` (`app/utils/salm-control-storage.ts`), service worker `public/salm-controle-sw.js` de portée `/admin/salm/controle`, enregistré en production seulement ; tout est effacé à la déconnexion et à la fin du salon. `GET /api/salm/verify/:token` supprimée : `/salm/v/:token` ne révèle rien sans session admin. Test sur téléphone (la caméra exige HTTPS) : `pnpm dev --https --host` ou `cloudflared tunnel --url http://localhost:3000` ; le hors ligne se teste sur `pnpm build` + `node .output/server/index.mjs`

## Conventions

- **Install Nuxt modules** with `npx nuxi@latest module add <module>` (not manual pnpm add + config edit)
- **Package manager**: always use `pnpm`, never npm/yarn/bun


## Conventions

- **Français avec accents** (é, è, ê, à, ç, ù) obligatoires dans le code et les contenus
- **Nommage de fichiers/dossiers : PAS d'accents ni de caractères spéciaux** (problèmes d'encodage SSH/Docker en production). Utiliser uniquement `[a-z0-9_-]`.
- Champs trilingues : `*_fr`, `*_en`, `*_ar`
- Alias : `@bank` → `./bank`

## Parallel Sub-agents Strategy

Use multiple sub-agents in parallel for efficiency:
- Search frontend + backend simultaneously
- Explore multiple files/folders at the same time
- Run tests + verifications in parallel after modifications
- **Avant de créer un nouveau composant** : Toujours lancer un sous-agent pour vérifier si un composant similaire existe déjà(rechercher par nom et par fonctionnalité). Évite les redondances et favorise la réutilisation.

## Active Technologies
- TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3 + Nuxt 4, Vue 3, Tailwind CSS v4 (`@tailwindcss/vite`), Prisma 7 (001-magazine-landing-site)
- SQLite via Prisma 7 (`dev.db` at project root); generated client in `app/generated/prisma/` (001-magazine-landing-site)
- TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3 + Nuxt 4, Vue 3, Tailwind CSS v4 (`@tailwindcss/vite`), Prisma 7, h3 (002-magazine-backend-sync)
- TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3.5.28 + Nuxt 4, Vue 3, Tailwind CSS v4.2.1 (`@tailwindcss/vite`), @toast-ui/editor 3.2.2, Sharp 0.34.5 (003-rubriques-redesign)
- Prisma 7.4.2 with SQLite (`dev.db`), generated client in `app/generated/prisma/` (003-rubriques-redesign)
- TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3.5.28 + Nuxt 4, Vue 3, Tailwind CSS v4.2.1 (`@tailwindcss/vite`), Prisma 7.4.2, @toast-ui/editor 3.2.2 (004-rubriques-simplify)
- Prisma 7 avec SQLite (`dev.db` à la racine) ; client généré dans `app/generated/prisma/` (004-rubriques-simplify)
- TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3.5.28 + Nuxt 4, Vue 3, Tailwind CSS v4.2.1 (`@tailwindcss/vite`), Chart.js 4.5.1, vue-chartjs 5.3.3, Prisma 7.4.2 (005-admin-dashboard-newsletter)
- SQLite via Prisma 7 (`dev.db` à la racine) ; client généré dans `app/generated/prisma/` (005-admin-dashboard-newsletter)
- TypeScript (ESM), Node 22 / Nuxt 4, Vue 3, Tailwind CSS v4.2.1, Prisma 7.4.2, pdf-lib + @pdf-lib/fontkit + qrcode (badge PDF), tsx (seed) ; dossier `shared/` Nuxt 4 (006-salm-inscriptions)
- SQLite via Prisma 7 (`dev.db`, `/app/data/production.db` en production). Images du seed statiques dans `public/images/salm/` (pas `public/salm/`, qui masquerait la route `/salm`). Polices du PDF dans `server/assets/fonts/salm/`. Aucun fichier d'upload dans cette feature. (006-salm-inscriptions)
- TypeScript (ESM), Node 22 / Nuxt 4, Vue 3, Tailwind CSS v4.2.1, Prisma 7.4.2 ; ajout de `jsqr` (repli de lecture QR quand `BarcodeDetector` manque, iOS) ; API navigateur getUserMedia, Web Crypto, Service Worker, Wake Lock (008-salm-controle-entree)
- SQLite via Prisma 7 : table `SalmEntry` (`@@unique([registrationId, dayId])`), colonne `SalmStudentRegistration.origin` ; sur les téléphones de contrôle, `localStorage` `salm-controle:v1:*` et caches `salm-controle-*` (008-salm-controle-entree)

## Deployment

Production server: `root@31.220.73.105` at `/opt/le_carre_des_etudes`
Deploy script: `deploy.sh` (Docker-based, branch `main`)

```bash
./deploy.sh setup          # Premier setup serveur (Docker, clone, .env)
./deploy.sh deploy         # Déploiement complet (pull, build --no-cache, restart)
./deploy.sh update         # Mise à jour rapide (pull, rebuild)
./deploy.sh logs [service] # Voir les logs
./deploy.sh restart        # Redémarrer les conteneurs
./deploy.sh stop           # Arrêter les conteneurs
./deploy.sh status         # État du serveur
./deploy.sh ssl <domaine>  # Configurer SSL avec Let's Encrypt
./deploy.sh backup         # Sauvegarder la base SQLite en local (dans backups/)
./deploy.sh seed           # Crée les éditions SALM absentes ; n'écrase jamais une édition existante (npx prisma db seed dans le conteneur)
./deploy.sh connect        # Se connecter en SSH au serveur
```

- Production DB: `/app/data/production.db` (dans le conteneur)
- `.env` production : `ADMIN_PASSWORD` (12 caractères min.) et `NUXT_SESSION_SECRET` (32 min.) générés par `setup` / `deploy` / `update` s'ils manquent (`ensure_secrets`), jamais remplacés s'ils sont valides. Aucune valeur par défaut : sans secret de session l'app refuse de démarrer, sans mot de passe admin valide la connexion admin est refusée
- Site accessible sur `http://<IP>:3000` (ou HTTPS après `ssl`)

## Recent Changes
- 008-salm-controle-entree: Contrôle d'entrée SALM le jour J (scan du QR code, saisie manuelle, hors ligne, inscription sur place, présences par jour) ; migration `add_salm_entries` ; ajout de jsqr ; `GET /api/salm/verify/:token` supprimée
- 007-salm-admin-contenus: Back-office SALM des éditions et des contenus (publication unique, aperçu, duplication), statistiques et encart du tableau de bord ; seed en création seule ; aucune dépendance ni migration
- 006-salm-inscriptions: Module SALM (page /salm, inscriptions, badge PDF, back-office) ; ajout de pdf-lib, @pdf-lib/fontkit, qrcode, tsx
- 001-magazine-landing-site: Added TypeScript (ESM) via Nuxt 4 (v4.3.1) / Vue 3 + Nuxt 4, Vue 3, Tailwind CSS v4 (`@tailwindcss/vite`), Prisma 7
