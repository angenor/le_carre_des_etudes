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
    /** Entrées par date de jour de salon `AAAA-MM-JJ` (008, FR-228) ; absent des compteurs plus anciens */
    entriesByDay?: Record<string, number>
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

export interface SalmAdminEditionListItem extends SalmAdminEdition {
  venue: string | null
  city: string
  firstDay: string | null
  lastDay: string | null
  dayCount: number
  yearLocked: boolean
  canDelete: boolean
  canPublish: boolean
}

export interface SalmAdminEditionsResponse {
  data: SalmAdminEditionListItem[]
  defaultEditionId: number | null
}

export interface SalmAdminStudentRow {
  id: number
  badgeNumber: string
  fullName: string
  phone: string
  studyLevel: string
  createdAt: string
  /** Inscription par le formulaire public ou par l'équipe au salon (008, FR-247) */
  origin: 'online' | 'onsite' | string
  /** Heure d'entrée (ISO) par identifiant de jour de salon ; jour absent = pas d'entrée (008) */
  entries: Record<string, string>
}

/** Jour de salon et nombre total d'entrées ce jour, indépendamment des filtres (008, FR-225). */
export interface SalmAdminStudentDay {
  id: number
  label: string
  date: string
  entries: number
}

export interface SalmAdminStudentsResponse {
  data: SalmAdminStudentRow[]
  total: number
  page: number
  limit: number
  grandTotal: number
  days: SalmAdminStudentDay[]
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

// ---- Back-office des éditions et des contenus (specs/007-salm-admin-contenus/contracts/admin-api.md) ----

export type SalmAdminWarning = 'DUPLICATE_VIDEO'

export interface SalmAdminSlot {
  id: number
  startTime: string
  endTime: string
  title: string
  kind: string
  description: string | null
  isHighlighted: boolean
}

export interface SalmAdminDay {
  id: number
  date: string
  label: string
  opensAt: string
  closesAt: string
  slots: SalmAdminSlot[]
}

export interface SalmAdminHighlight {
  id: number
  title: string
  imagePath: string
  imageAlt: string
}

export interface SalmAdminVideo {
  id: number
  youtubeUrl: string
  youtubeId: string | null
  title: string | null
  guest: string | null
  institution: string | null
}

export interface SalmAdminPhoto {
  id: number
  imagePath: string
  alt: string
  caption: string | null
}

export interface SalmAdminStandType {
  id: number
  name: string
  description: string | null
  priceLabel: string | null
  isVisible: boolean
  schoolCount: number
}

export interface SalmAdminEditionDetail {
  id: number
  year: number
  status: 'draft' | 'published' | 'archived' | string
  salonName: string
  organizerName: string
  city: string
  venue: string | null
  tagline: string | null
  whyTitle: string | null
  whyText: string | null
  audiences: SalmAudience[]
  contacts: SalmContact[]
  poster: { path: string; alt: string | null } | null
  programPdfPath: string | null
  recap: { youtubeUrl: string | null; youtubeId: string | null; posterPath: string | null }
  days: SalmAdminDay[]
  highlights: SalmAdminHighlight[]
  videos: SalmAdminVideo[]
  photos: SalmAdminPhoto[]
  standTypes: SalmAdminStandType[]
  counts: { students: number; schools: number }
  yearLocked: boolean
  canDelete: boolean
  canPublish: boolean
  ended: boolean
  registrationOpen: { students: boolean; schools: boolean }
  previousEdition: { id: number; year: number } | null
  nextEditionYear: number
}

export interface SalmAdminStatsBlock {
  source: 'live' | 'purged'
  purgedAt: string | null
  stats: SalmPurgedStats
}

export interface SalmAdminStats extends SalmAdminStatsBlock {
  edition: { id: number; year: number; opensAtIso: string | null }
  standTypes: { name: string; isVisible: boolean }[]
  comparison: (SalmAdminStatsBlock & { year: number; opensAtIso: string | null }) | null
}

export type SalmAdminSummary = {
  year: number
  students: number
  schools: number
  comparison: { year: number; students: number; schools: number } | null
} | null

// ---- Contrôle d'entrée (specs/008-salm-controle-entree/contracts/control-api.md) ----

/** Personne affichée sur le poste de contrôle : jamais de téléphone (FR-230). */
export interface SalmControlPerson {
  registrationId: number
  fullName: string
  studyLevel: string
  badgeNumber: string
}

export interface SalmControlDay {
  id: number
  label: string
  date: string
}

export interface SalmControlCounter {
  dayId: number
  entries: number
}

export type SalmControlStatus = 'entered' | 'already' | 'refused' | 'valid_trial'
export type SalmControlRefusal = 'OTHER_EDITION' | 'INVALID'

export interface SalmControlEntry {
  id: number
  enteredAt: string
}

export interface SalmControlResult {
  status: SalmControlStatus
  reason: SalmControlRefusal | null
  otherEditionYear: number | null
  /** `null` en mode essai */
  day: SalmControlDay | null
  /** Absent si `refused` (FR-207) */
  person?: SalmControlPerson
  /** Présent si `entered` ou `already` */
  entry?: SalmControlEntry
  counters: SalmControlCounter[]
  /** Inscription sur place (POST /control/registrations) */
  created?: true
  entryError?: 'INTERNAL'
}

/** Badge préchargé : `h` = empreinte du jeton, jamais le jeton ni le téléphone (R5). */
export interface SalmControlBadge {
  h: string
  seq: number
  name: string
  level: string
}

export interface SalmControlKnownEntry {
  id: number
  h: string
  dayId: number
  at: string
}

export interface SalmControlSnapshot {
  serverTime: string
  edition: { id: number; year: number; endsAt: string | null }
  days: SalmControlDay[]
  todayDayId: number | null
  badges: SalmControlBadge[]
  entries: SalmControlKnownEntry[]
  counters: SalmControlCounter[]
  registration: { url: string; qrSvg: string }
}

export interface SalmControlState {
  serverTime: string
  todayDayId: number | null
  counters: SalmControlCounter[]
  entries: SalmControlKnownEntry[]
  hasMore: boolean
}

export type SalmControlValidity = 'valid' | 'other_edition' | 'invalid'

export interface SalmControlLookup {
  found: boolean
  validity?: SalmControlValidity
  otherEditionYear?: number | null
  person?: SalmControlPerson
  today?: { day: SalmControlDay | null; entry: SalmControlEntry | null }
}

/** Entrée validée hors ligne, en attente d'envoi : le numéro de badge, jamais le jeton (S1). */
export interface SalmControlSyncItem {
  clientId: string
  seq: number
  dayId: number
  scannedAt: string
  mode: 'scan' | 'manual'
}

export interface SalmControlSyncResult {
  results: {
    clientId: string
    status: 'created' | 'merged' | 'ignored'
    reason?: 'UNKNOWN_BADGE' | 'OUT_OF_EDITION' | 'INVALID_ITEM'
  }[]
  counters: SalmControlCounter[]
}

export interface SalmControlPoster {
  year: number
  url: string
  qrSvg: string
}
