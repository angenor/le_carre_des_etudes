# Data Model: Dashboard Admin, Newsletter & Embellissement

**Branch**: `005-admin-dashboard-newsletter` | **Date**: 2026-03-04

## Nouveaux modèles

### NewsletterSubscriber

Représente un visiteur inscrit à la newsletter pour être alerté des prochaines éditions.

| Champ     | Type     | Contraintes                  | Description                    |
|-----------|----------|------------------------------|--------------------------------|
| id        | Int      | PK, auto-increment           | Identifiant unique             |
| email     | String   | Unique, max 254 chars        | Adresse email de l'abonné      |
| createdAt | DateTime | Default: now()               | Date d'inscription             |

**Règles de validation** :
- Email : format RFC 5322 basique, maximum 254 caractères, unique en base
- Doublon : retourne un message explicite (pas d'erreur technique)

**Relations** : Aucune

---

### PageVisit

Représente une visite de page sur la plateforme publique.

| Champ     | Type     | Contraintes        | Description                           |
|-----------|----------|--------------------|---------------------------------------|
| id        | Int      | PK, auto-increment | Identifiant unique                    |
| path      | String   |                    | Chemin de la page visitée (ex: `/`, `/magazines/v1`) |
| visitedAt | DateTime | Default: now()     | Date et heure de la visite            |

**Règles de validation** :
- Path : chaîne non vide, commence par `/`
- Chaque chargement de page = 1 nouvel enregistrement (pas de déduplication par visiteur)

**Relations** : Aucune

**Note sur le volume** : Cette table croîtra rapidement. Pour une plateforme à trafic modéré, ~1000 visites/jour = ~365k lignes/an. SQLite gère bien ce volume. Si nécessaire à l'avenir, une tâche de purge ou d'agrégation pourra être ajoutée.

---

## Modèles existants (inchangés)

### Download (existant)

Utilisé pour la liste des téléchargements admin et les graphiques du dashboard.

| Champ        | Type     | Contraintes              | Description                |
|--------------|----------|--------------------------|----------------------------|
| id           | Int      | PK, auto-increment       | Identifiant unique         |
| fullName     | String   |                          | Nom complet                |
| contact      | String   |                          | Numéro de téléphone        |
| studyLevel   | String   |                          | Niveau d'étude             |
| age          | Int      |                          | Âge                        |
| fieldOfStudy | String   |                          | Filière                    |
| magazineId   | Int      | FK → Magazine.id         | Magazine téléchargé        |
| createdAt    | DateTime | Default: now()           | Date du téléchargement     |

**Relations** : `magazine` → Magazine (N:1)

### Magazine (existant)

Utilisé pour les graphiques de répartition et les chiffres clés.

| Champ       | Type    | Contraintes       | Utilisé dans cette feature  |
|-------------|---------|-------------------|-----------------------------|
| id          | Int     | PK                | FK depuis Download          |
| name        | String  |                   | Affiché dans les graphiques |
| isFeatured  | Boolean | Default: false    | Non utilisé                 |
| publishedAt | DateTime|                   | Non utilisé                 |

**Relations** : `downloads` → Download[] (1:N)

---

## Schéma Prisma (ajouts)

```prisma
model NewsletterSubscriber {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  createdAt DateTime @default(now())
}

model PageVisit {
  id        Int      @id @default(autoincrement())
  path      String
  visitedAt DateTime @default(now())
}
```

---

## Requêtes d'agrégation clés

### Stats summary (chiffres clés)
- `prisma.download.count()` → total téléchargements
- `prisma.pageVisit.count()` → total visites
- `prisma.newsletterSubscriber.count()` → total abonnés
- `prisma.magazine.count()` → total magazines

### Téléchargements par période
- `prisma.download.findMany({ where: { createdAt: { gte: dateDebut } } })` puis agrégation JS par jour/semaine/mois
- Alternative : `prisma.download.groupBy({ by: ['createdAt'], _count: true, where: ... })` — mais le groupBy par date truncated nécessite un traitement JS car SQLite n'a pas de `DATE_TRUNC`

### Répartition par magazine
- `prisma.download.groupBy({ by: ['magazineId'], _count: { id: true } })` + jointure avec `prisma.magazine.findMany()` pour les noms

### Répartition par niveau d'étude
- `prisma.download.groupBy({ by: ['studyLevel'], _count: { id: true } })`

### Visites par période
- Même pattern que téléchargements : `findMany` avec filtre date puis agrégation JS

### Recherche téléchargements
- `prisma.download.findMany({ where: { OR: [{ fullName: { contains: query } }, { contact: { contains: query } }, { fieldOfStudy: { contains: query } }] }, skip, take, orderBy })`
