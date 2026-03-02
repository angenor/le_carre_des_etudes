# Research: Site Vitrine Le Carré des Études

**Branch**: `001-magazine-landing-site`
**Date**: 2026-03-02

## Technical Context Resolution

No NEEDS CLARIFICATION items existed in the Technical
Context — the stack is fully defined by the existing
project setup (Nuxt 4, Prisma 7, Tailwind CSS v4, SQLite).

## Research Decisions

### R-001: Admin Authentication Strategy

**Decision**: Simple password-based session authentication
using Nuxt server-side sessions (via `useSession` from
`h3` / Nitro built-in) with a single admin password
stored as an environment variable (`ADMIN_PASSWORD`).

**Rationale**: The spec requires a password-protected
admin interface (FR-014) but does not require multi-user
admin accounts. A single shared password with a
server-side session is the simplest approach that
satisfies the requirement (Principle II: YAGNI). No
external auth library needed.

**Alternatives considered**:
- `nuxt-auth-utils` module: Would add a dependency for
  a feature that only needs a single password check.
  Rejected per Principle IV (no unnecessary deps).
- JWT tokens: Adds complexity (token refresh, storage)
  for a single-admin use case. Rejected per Principle II.

### R-002: File Upload Strategy

**Decision**: Use Nitro's built-in `readMultipartFormData`
to handle file uploads. Files are saved to `public/uploads/`
subdirectories (magazines/, rubriques/, partenaires/) and
served as static assets by Nitro.

**Rationale**: Nuxt/Nitro can handle multipart form data
natively. Saving to `public/` makes files immediately
accessible via URL without additional serving logic.
This is the simplest approach for a V1 with local storage
(Principle II).

**Alternatives considered**:
- External storage (S3, Cloudinary): Unnecessary for V1
  with ~2000 readers. Adds external dependency.
  Rejected per Principle IV.
- Base64 in database: Would bloat SQLite and degrade
  performance. Rejected.

### R-003: Download Form Modal Implementation

**Decision**: Build a simple Vue component (`DownloadModal.vue`)
using Tailwind CSS for styling. The modal opens when
clicking "Télécharger" on a magazine card, captures form
data, submits to `POST /api/downloads`, and triggers a
file download on success.

**Rationale**: A custom modal component with Tailwind
is sufficient. No UI component library needed for a
single modal (Principle II: YAGNI). The modal is
purely client-side interactive, while the form submission
goes through a server API route.

**Alternatives considered**:
- HeadlessUI / Radix Vue: Would add a dependency for
  one component. Rejected per Principle IV.
- Native `<dialog>` element: Good accessibility but
  inconsistent styling across browsers. The Tailwind
  overlay approach is more predictable.

### R-004: Phone Number Validation (Ivorian Format)

**Decision**: Validate the "contact" field against
Ivorian mobile number patterns: 10 digits starting
with 01, 05, 07, or 27. Accept formats with or without
spaces (e.g., "0712345678" or "07 12 34 56 78").

**Rationale**: The spec specifies an Ivorian audience
and phone contact format. Ivorian mobile numbers follow
the pattern `0X XX XX XX XX` where X is the operator
prefix. Simple regex validation is sufficient.

**Alternatives considered**:
- `libphonenumber`: Heavy library for a single-country
  validation. Rejected per Principle IV.
- No validation: Would allow garbage data. Rejected
  per FR-005.

### R-005: Education Level Dropdown Values

**Decision**: Predefined list for "niveau d'étude":
- Terminale / Futur bachelier
- BTS / DUT (Bac+2)
- Licence (Bac+3)
- Master (Bac+5)
- Doctorat
- Autre

**Rationale**: Covers the target audience (students,
future bacheliers, young graduates) described in the
project documentation. "Autre" provides a catch-all.

**Alternatives considered**:
- More granular levels (L1, L2, L3): Over-specific for
  a lead-capture form. Would slow down the UX.
- International standards (ISCED): Not relevant for
  the Ivorian context.
