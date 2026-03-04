# Research: Dashboard Admin, Newsletter & Embellissement

**Branch**: `005-admin-dashboard-newsletter` | **Date**: 2026-03-04

## R1: Chart.js avec vue-chartjs dans Nuxt 4

**Decision**: Utiliser vue-chartjs (v5.3.3) avec Chart.js (v4.5.1), déjà installés. Enregistrer les composants Chart nécessaires (Line, Bar, Doughnut) dans les pages admin via import direct.

**Rationale**: vue-chartjs fournit des wrappers Vue 3 natifs pour Chart.js. Pas besoin de plugin Nuxt — l'import direct dans les composants est le pattern le plus simple et conforme à YAGNI. Chart.js 4.x supporte le tree-shaking via les imports de composants individuels (`CategoryScale`, `LinearScale`, etc.).

**Alternatives considered**:
- Plugin Nuxt global pour Chart.js : Sur-ingénierie, les graphiques ne sont utilisés que dans le dashboard admin
- ApexCharts / ECharts : Plus riches mais non installés, Chart.js suffit pour les besoins actuels

## R2: Agrégation des données pour les graphiques

**Decision**: Effectuer l'agrégation côté serveur via des requêtes Prisma avec `groupBy` et des filtres de date. Renvoyer des données pré-formatées (labels + datasets) pour chaque graphique.

**Rationale**: SQLite supporte bien les requêtes d'agrégation simples. L'agrégation côté serveur évite de transférer toutes les lignes au client et simplifie le code frontend. Prisma `groupBy` permet le regroupement par champs calculés.

**Alternatives considered**:
- Agrégation côté client : Transférerait potentiellement des milliers de lignes, mauvais pour la performance
- Vues SQL matérialisées : SQLite ne les supporte pas nativement, sur-ingénierie pour le volume actuel

## R3: Suivi des visites de pages

**Decision**: Créer un plugin client Nuxt (`track-visit.client.ts`) qui envoie un POST à `/api/visits` lors de chaque navigation. Enregistrer le chemin de la page et la date. Pas de tracking d'utilisateurs uniques (conforme à la spec).

**Rationale**: Un plugin client Nuxt s'exécute automatiquement à chaque navigation (SPA et SSR initial). Le POST est asynchrone et non-bloquant (fire-and-forget) — aucun impact sur l'expérience utilisateur. Le modèle `PageVisit` reste simple : juste `path` + `visitedAt`.

**Alternatives considered**:
- Middleware serveur Nitro : Compterait aussi les requêtes API et les fichiers statiques, pas ce qu'on veut
- Service analytique externe (Google Analytics, Plausible) : Dépendance externe non nécessaire pour des stats simples
- Cookie/localStorage pour unique visitors : La spec dit explicitement "chaque rechargement = nouvelle visite"

## R4: Newsletter sans SMTP

**Decision**: Créer un modèle `NewsletterSubscriber` avec `email` (unique) et `createdAt`. L'endpoint POST `/api/newsletter` est public. La page admin affiche la liste et permet l'export CSV. Pas de mécanisme de désinscription côté visiteur (l'admin supprime manuellement).

**Rationale**: La spec précise explicitement "capturer les emails et envoyer les emails manuellement". Le formulaire frontend fait une simple validation d'email + POST. Le backend vérifie l'unicité et retourne un message approprié si doublon.

**Alternatives considered**:
- Double opt-in (email de confirmation) : Nécessite un SMTP, explicitement exclu
- Lien de désinscription public : Prématuré sans SMTP, l'admin gère manuellement

## R5: Pagination côté serveur

**Decision**: Pagination basée sur offset/limit avec paramètres `page` et `limit` (défaut: 20 éléments par page). Le serveur renvoie `{ data, total, page, limit }`. Le tri et la recherche sont aussi traités côté serveur.

**Rationale**: Pattern simple et bien supporté par Prisma (`skip`/`take`). Suffisant pour le volume attendu (~500+ enregistrements). La recherche côté serveur utilise `contains` de Prisma pour le filtrage textuel.

**Alternatives considered**:
- Cursor-based pagination : Plus performant pour de gros volumes mais plus complexe, inutile ici
- Chargement complet + filtrage client : Pas adapté si la base grandit, et moins réactif pour les recherches

## R6: Export CSV

**Decision**: Endpoint serveur dédié (`/api/downloads/export.get.ts`, `/api/newsletter/export.get.ts`) qui génère le CSV côté serveur et le retourne avec `Content-Type: text/csv` et `Content-Disposition: attachment`. Pas de librairie CSV externe — construction manuelle suffisante pour des données tabulaires simples.

**Rationale**: Le CSV côté serveur permet d'exporter TOUS les enregistrements (pas seulement la page courante). La construction manuelle est suffisante car les données sont plates (pas de champs imbriqués ou de caractères spéciaux complexes). Les champs contenant des virgules sont entourés de guillemets.

**Alternatives considered**:
- Export côté client avec librairie (csv-stringify, papaparse) : Ajouterait une dépendance, limité à la page courante
- Export XLSX : Sur-ingénierie pour le besoin actuel

## R7: Thème admin layout sombre/ambré

**Decision**: Modifier `app/layouts/admin.vue` pour remplacer les classes Tailwind emerald/white par gray-900/gray-950/amber-400/amber-500. Scope limité au layout (sidebar, header mobile, fond de page). Les pages internes conservent leur thème actuel.

**Rationale**: La clarification spec confirme que seul le layout est concerné. Le changement est purement CSS (classes Tailwind) — pas de logique à modifier. Les couleurs s'alignent sur le footer/navbar existants : `gray-950` (fond), `amber-400`/`amber-500` (accents), `gray-400` (texte secondaire).

**Alternatives considered**:
- Système de thème dynamique (variables CSS) : Sur-ingénierie pour un seul layout
- Thème complet sur toutes les pages admin : Exclu par la clarification utilisateur

## R8: Protection des nouvelles routes API

**Decision**: Étendre le middleware `server/middleware/admin.ts` pour protéger les nouvelles routes admin : `/api/newsletter` (GET, DELETE), `/api/downloads` (GET), `/api/stats/*` (GET), `/api/newsletter/export` (GET), `/api/downloads/export` (GET). Les routes publiques restent : `/api/newsletter` (POST — inscription), `/api/visits` (POST — tracking).

**Rationale**: Pattern existant dans le middleware : vérification de `session.data.admin` sur les routes protégées. Les endpoints d'écriture publics (newsletter inscription, visit tracking) ne nécessitent pas d'auth.

**Alternatives considered**:
- Middleware séparé par route : Duplication, le middleware centralisé est déjà en place et extensible
