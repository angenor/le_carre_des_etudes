# Quickstart: Site Vitrine Le Carré des Études

**Branch**: `001-magazine-landing-site`

## Prerequisites

- Node.js (compatible with Nuxt 4)
- pnpm installed globally

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
# Ensure .env contains:
#   DATABASE_URL="file:./dev.db"
#   ADMIN_PASSWORD="your-secure-admin-password"

# 3. Run database migrations
pnpm prisma migrate dev

# 4. Start development server
pnpm dev
```

The site is available at `http://localhost:3000`.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Page d'accueil — présentation du magazine |
| `/magazine` | Liste des magazines à télécharger |
| `/rubriques` | Interviews & Rubriques (portrait, parcours inspirant, en vedette) |
| `/partenaires` | Logos et noms des partenaires |
| `/admin/login` | Connexion admin |
| `/admin` | Tableau de bord admin |
| `/admin/magazines` | Gestion des magazines |
| `/admin/rubriques` | Gestion des rubriques |
| `/admin/partenaires` | Gestion des partenaires |

## Adding Content (Admin)

1. Go to `/admin/login`
2. Enter the admin password (from `ADMIN_PASSWORD` env var)
3. Use the admin pages to:
   - Upload and publish magazines (PDF + metadata)
   - Add content items (portrait, parcours inspirant, en vedette)
   - Add partners (logo + name)

## Download Flow (Visitor)

1. Visitor goes to `/magazine`
2. Clicks "Télécharger" on a magazine
3. A modal opens with the form (nom, contact, niveau
   d'étude, âge, filière)
4. On submit, data is saved and PDF download starts

## File Storage

Uploaded files are stored in `public/uploads/`:
- `public/uploads/magazines/` — PDF files
- `public/uploads/rubriques/` — Content images
- `public/uploads/partenaires/` — Partner logos

## Verification Checklist

- [ ] Homepage shows magazine presentation image
- [ ] Navigation works across all 4 pages
- [ ] Magazine list displays available issues
- [ ] Download modal opens and validates form fields
- [ ] Form submission saves to DB and triggers download
- [ ] Rubriques page shows content grouped by type
- [ ] Empty rubrique types are hidden
- [ ] Partners page shows logo grid
- [ ] Admin login works with ADMIN_PASSWORD
- [ ] Admin can create/edit/delete magazines
- [ ] Admin can create/edit/delete content items
- [ ] Admin can create/edit/delete partners
- [ ] All pages are responsive (mobile/tablet/desktop)
