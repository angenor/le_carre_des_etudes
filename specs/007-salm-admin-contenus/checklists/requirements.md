# Specification Quality Checklist: Module SALM (2/3) — back-office des éditions et des contenus, statistiques

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-28
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Validation passée à la première itération.
- YouTube, les formats d'image (JPEG, PNG, WebP) et le PDF sont des exigences de la demande (contenus hébergés et fichiers acceptés), pas des choix d'implémentation.
- Aucun marqueur [NEEDS CLARIFICATION] : les points ouverts ont reçu une valeur par défaut documentée dans « Assumptions ». Ceux qui méritent une validation par l'équipe SALM :
  - l'édition dépubliée passe au statut « Archivée » ;
  - les dates des jours copiés sont décalées de 52 semaines, et le lieu n'est pas copié ;
  - l'upload du PDF du programme est ajouté au périmètre ;
  - la suppression d'une édition est limitée aux brouillons sans inscription ;
  - la comparaison statistique est alignée sur J-n avant l'ouverture.
- Ces points peuvent être tranchés avec `/speckit-clarify` avant `/speckit-plan`.
