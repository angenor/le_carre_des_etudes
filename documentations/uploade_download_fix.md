# Upload & Download — Améliorations

## Résumé des changements

### 1. Barre de progression côté client

**Fichier** : `app/pages/admin/magazines.vue`

**Avant** : L'upload utilisait `$fetch` (Nuxt) qui ne supporte pas le suivi de progression. L'utilisateur n'avait aucun retour visuel pendant l'envoi du fichier.

**Après** : Remplacement par `XMLHttpRequest` qui expose l'événement `upload.onprogress`. Une barre de progression verte s'affiche sous chaque champ fichier (PDF et image de couverture) avec le pourcentage en temps réel.

Le bouton de soumission est désactivé tant qu'un téléversement est en cours.

---

### 2. Limite de taille des fichiers (50 Mo)

**Fichiers** : `magazines.vue`, `server/api/upload/index.post.ts`, `nuxt.config.ts`, `nginx.conf`

La validation s'effectue à **4 niveaux** :

| Niveau | Fichier | Mécanisme |
|--------|---------|-----------|
| Client | `magazines.vue` | Vérifie `file.size` avant même d'envoyer |
| XHR | `magazines.vue` | Gère la réponse HTTP 413 du serveur |
| Serveur (Nitro) | `nuxt.config.ts` | `routeRules` avec `maxBodySize: 50 Mo` sur `/api/upload` |
| Serveur (Busboy) | `index.post.ts` | `limits.fileSize` coupe le stream si dépassement |
| Reverse proxy | `nginx.conf` | `client_max_body_size 50M` |

---

### 3. Streaming sur disque avec Busboy (zéro RAM)

**Fichier** : `server/api/upload/index.post.ts`

**Avant** : `readMultipartFormData` (h3) chargeait le fichier **entier en mémoire RAM** avant de l'écrire sur le disque. Un fichier de 50 Mo = 50 Mo de RAM consommée. Avec 20 uploads simultanés = 1 Go de RAM.

**Après** : Utilisation de `busboy` (parser multipart en streaming). Le fichier est écrit **chunk par chunk** directement sur le disque via un `WriteStream`. Chaque upload ne consomme que **quelques Ko de RAM**, quelle que soit la taille du fichier.

**Flux de traitement** :

```
Requête HTTP
  │
  ▼
event.node.req.pipe(busboy)     ← le flux HTTP est connecté à busboy
  │
  ▼
busboy parse les chunks          ← champs texte (category) et fichier
  │
  ▼
stream.pipe(writeStream)         ← écriture directe sur disque dans uploads/_tmp/
  │
  ▼
rename(_tmp → uploads/category/) ← déplacement vers le dossier final
  │
  ▼
sharp(filePath)                  ← génération OG depuis le disque (pas de buffer RAM)
```

**Pourquoi un dossier `_tmp` ?**
Dans un formulaire multipart, les champs arrivent dans l'ordre d'`append()`. Le client envoie `file` puis `category`. Le fichier arrive donc **avant** qu'on connaisse la catégorie. On écrit d'abord dans `_tmp`, puis on déplace (`rename`, quasi instantané sur le même filesystem).

**Gestion des dépassements** :
Si le fichier dépasse 50 Mo, busboy émet l'événement `limit` sur le stream. Le `WriteStream` est détruit, le fichier partiel est supprimé, et une erreur 413 est renvoyée au client.

---

### 4. Génération OG sans RAM

**Avant** : `sharp(buffer)` — l'image entière était passée en mémoire.

**Après** : `sharp(inputPath)` — Sharp lit le fichier directement depuis le disque.

---

## Dépendances ajoutées

- `busboy` (runtime) — parser multipart en streaming
- `@types/busboy` (dev) — types TypeScript

## Configuration serveur requise

Après déploiement, redémarrer Nginx pour appliquer `client_max_body_size 50M` :

```bash
./deploy.sh restart
```
