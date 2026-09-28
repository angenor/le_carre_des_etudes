// Types du module SALM, partagés entre l'app et le serveur.
// Formes des réponses : specs/006-salm-inscriptions/contracts/public-api.md

// ---- Colonnes JSON de la base ----

export interface SalmContact {
  kind: 'phone' | 'email' | 'address'
  value: string
  onBadge?: boolean
}

export interface SalmAudience {
  title: string
  text: string
}

export interface SalmExhibitor {
  fullName: string
  contact: string
}

export interface SalmPurgedStats {
  computedAt: string
  students: {
    total: number
    byStudyLevel: Record<string, number>
    byRegistrationDay: Record<string, number>
  }
  schools: {
    total: number
    byStandType: Record<string, number>
    byStatus: Record<string, number>
    exhibitors: number
  }
}

// ---- API publique ----

export interface SalmStatus {
  published: boolean
  year: number | null
}

export interface SalmPublicSlot {
  startTime: string
  endTime: string
  title: string
  description: string | null
  kind: string
  isHighlighted: boolean
}

export interface SalmPublicDay {
  date: string
  label: string
  opensAt: string
  closesAt: string
  slots: SalmPublicSlot[]
}

export interface SalmPublicHighlight {
  title: string
  imagePath: string
  imageAlt: string
}

export interface SalmPublicStandType {
  id: number
  name: string
  description: string | null
  priceLabel: string | null
}

export interface SalmTimeline {
  opensAtIso: string | null
  endsAtIso: string | null
  hoursLabel: string | null
}

export interface SalmPublicEdition {
  year: number
  salonName: string
  tagline: string | null
  city: string
  venue: string | null
  organizerName: string
  whyTitle: string | null
  whyText: string | null
  audiences: SalmAudience[]
  contacts: SalmContact[]
  poster: { path: string; alt: string | null } | null
  programPdfPath: string | null
  days: SalmPublicDay[]
  highlights: SalmPublicHighlight[]
  standTypes: SalmPublicStandType[]
  registration: {
    students: { open: boolean }
    schools: { open: boolean }
  }
  timeline: SalmTimeline
}

export interface SalmPublicVideo {
  youtubeId: string
  title: string | null
  guest: string | null
  institution: string | null
  thumbnailUrl: string
}

export interface SalmPublicPhoto {
  imagePath: string
  alt: string
  caption: string | null
}

export interface SalmPreviousEdition {
  year: number
  recapVideo: { youtubeId: string; posterPath: string | null } | null
  recapPosterPath: string | null
  videos: SalmPublicVideo[]
  photos: SalmPublicPhoto[]
}

export interface SalmEditionResponse {
  edition: SalmPublicEdition | null
  previous: SalmPreviousEdition | null
}

export interface SalmBadgePayload {
  number: string
  fullName: string
  studyLevel: string
  qrSvg: string
  downloadUrl: string
}

export interface SalmStudentResponse {
  status: 'created' | 'existing'
  badge: SalmBadgePayload
}

export interface SalmSchoolSummary {
  name: string
  standName: string
  exhibitorCount: number
  programmes: string[]
  otherProgramme: string | null
}

export interface SalmSchoolResponse {
  status: 'created'
  summary: SalmSchoolSummary
}

export interface SalmVerifyResponse {
  valid: boolean
  edition: { year: number; salonName: string } | null
}

// ---- API d'administration (contracts/admin-api.md) ----

export interface SalmAdminEdition {
  id: number
  year: number
  status: 'draft' | 'published' | 'archived' | string
  studentRegistrationOpen: boolean
  schoolRegistrationOpen: boolean
  endsAtIso: string | null
  ended: boolean
  counts: { students: number; schools: number }
  retention: { deadlineIso: string | null; exceeded: boolean; canPurge: boolean; purgedAt: string | null }
  purgedStats: SalmPurgedStats | null
}

export interface SalmAdminEditionsResponse {
  data: SalmAdminEdition[]
  defaultEditionId: number | null
}

export interface SalmAdminStudentRow {
  id: number
  badgeNumber: string
  fullName: string
  phone: string
  studyLevel: string
  createdAt: string
}

export interface SalmAdminSchoolRow {
  id: number
  name: string
  standName: string
  exhibitorCount: number
  status: string
  hasNote: boolean
  createdAt: string
}

export interface SalmAdminSchoolDetail {
  id: number
  editionYear: number
  name: string
  phone: string
  email: string
  programmes: string[]
  otherProgramme: string | null
  exhibitors: SalmExhibitor[]
  stand: { id: number; name: string; isVisible: boolean }
  question: string | null
  status: string
  internalNote: string | null
  createdAt: string
  updatedAt: string
}
