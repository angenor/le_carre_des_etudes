import { randomBytes } from 'node:crypto'
import { createError, getRequestHeader, type H3Event } from 'h3'
import { prisma } from './prisma'
import { isBot } from './is-bot'
import { assertBelowFailureLimit, NAME_MISMATCH_LIMIT, recordFailure } from './rate-limit'
import { asContacts, type SalmEditionCore } from './salm-edition'
import { badgeQrSvg, badgeVerifyUrl, type BadgeEdition, type BadgeRegistration } from './salm-badge-pdf'
import { normalizeIvorianPhone } from '#shared/utils/phone'
import { isStudyLevel } from '#shared/utils/study-levels'
import {
  collapseSpaces,
  formatBadgeNumber,
  nameMatchKey,
  nameSearchKey,
  SCHOOL_MAX_EXHIBITORS,
  SCHOOL_PROGRAMMES,
  validateStudentName,
  type SalmFieldError,
  type SchoolProgramme,
} from '#shared/utils/salm'
import type { SalmBadgePayload, SalmExhibitor } from '#shared/types/salm'

// Inscriptions SALM : anti-robots, liste blanche, validation, création atomique (research R4, R11).

// ---- Erreurs : des codes, jamais de phrases (D6) ----

export function apiError(statusCode: number, code: string) {
  return createError({ statusCode, message: code, data: { code } })
}

export function validationError(errors: Record<string, SalmFieldError>) {
  return createError({ statusCode: 400, message: 'VALIDATION', data: { code: 'VALIDATION', errors } })
}

// ---- Anti-robots (FR-080) ----

const MIN_FILL_MS = 3000
const MAX_FILL_MS = 24 * 60 * 60 * 1000

/** User-Agent, champ piège `website` et délai de remplissage. Échec : `400 REJECTED`, sans raison. */
export function assertHuman(event: H3Event, fields: { website?: unknown; startedAt?: unknown }) {
  const elapsed = Date.now() - Number(fields.startedAt)
  const honeypotFilled = fields.website !== undefined && fields.website !== null && fields.website !== ''
  if (
    isBot(getRequestHeader(event, 'user-agent'))
    || honeypotFilled
    || typeof fields.startedAt !== 'number'
    || !Number.isFinite(elapsed)
    || elapsed < MIN_FILL_MS
    || elapsed > MAX_FILL_MS
  ) {
    throw apiError(400, 'REJECTED')
  }
}

// ---- Étudiant·e·s : liste blanche et validation (FR-081a) ----

export interface StudentFields {
  fullName?: unknown
  phone?: unknown
  studyLevel?: unknown
  website?: unknown
  startedAt?: unknown
}

export function pickStudentFields(body: unknown): StudentFields {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  return {
    fullName: b.fullName,
    phone: b.phone,
    studyLevel: b.studyLevel,
    website: b.website,
    startedAt: b.startedAt,
  }
}

export interface StudentData {
  fullName: string
  phone: string
  studyLevel: string
}

/** Valide nom et téléphone (et le niveau si `withLevel`), ou lève `400 VALIDATION`. */
export function validateStudent(fields: StudentFields, { withLevel = true } = {}): StudentData {
  const errors: Record<string, SalmFieldError> = {}

  const name = validateStudentName(fields.fullName)
  if ('error' in name) errors.fullName = name.error

  const phone = normalizeIvorianPhone(fields.phone)
  if (typeof fields.phone !== 'string' || !fields.phone.trim()) errors.phone = 'REQUIRED'
  else if (!phone) errors.phone = 'INVALID_FORMAT'

  if (withLevel) {
    if (typeof fields.studyLevel !== 'string' || !fields.studyLevel) errors.studyLevel = 'REQUIRED'
    else if (!isStudyLevel(fields.studyLevel)) errors.studyLevel = 'INVALID_CHOICE'
  }

  if (Object.keys(errors).length) throw validationError(errors)
  return {
    fullName: (name as { value: string }).value,
    phone: phone!,
    studyLevel: withLevel ? (fields.studyLevel as string) : '',
  }
}

// ---- Recherche et comparaison ----

const badgeRegistrationSelect = {
  id: true,
  fullName: true,
  studyLevel: true,
  badgeSeq: true,
  verifyToken: true,
  downloadToken: true,
} as const

export type StudentBadgeRow = BadgeRegistration & { id: number; downloadToken: string }

export function findStudentByPhone(editionId: number, phone: string): Promise<StudentBadgeRow | null> {
  return prisma.salmStudentRegistration.findUnique({
    where: { editionId_phone: { editionId, phone } },
    select: badgeRegistrationSelect,
  })
}

export function namesMatch(a: string, b: string): boolean {
  return nameMatchKey(a) === nameMatchKey(b)
}

/**
 * Inscription existante pour ce téléphone (FR-025) : renvoie la ligne si le nom concorde,
 * sinon compte l'échec et lève `409 NAME_MISMATCH` (ou `429` au-delà de 5 échecs par heure).
 * Le nom enregistré n'est jamais renvoyé.
 */
export function resolveExistingStudent(event: H3Event, existing: StudentBadgeRow, phone: string, fullName: string) {
  const key = `mismatch:${phone}`
  assertBelowFailureLimit(key, NAME_MISMATCH_LIMIT, event)
  if (namesMatch(existing.fullName, fullName)) return existing
  recordFailure(key, NAME_MISMATCH_LIMIT)
  throw apiError(409, 'NAME_MISMATCH')
}

// ---- Création atomique (research R4) ----

let creationQueue: Promise<unknown> = Promise.resolve()

/** Exécute les créations une par une dans le processus (conteneur unique, constat F14). */
export function withStudentCreationLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = creationQueue.then(fn, fn)
  creationQueue = run.catch(() => undefined)
  return run
}

function newToken(): string {
  return randomBytes(16).toString('base64url')
}

/** Champ en cause d'une erreur Prisma P2002, quelle que soit la forme de `meta` (adaptateur ou non). */
function uniqueViolationField(error: unknown): string | null {
  const e = error as { code?: string; meta?: unknown; message?: string }
  if (e?.code !== 'P2002') return null
  const info = `${JSON.stringify(e.meta ?? {})} ${e.message ?? ''}`
  for (const field of ['verifyToken', 'downloadToken', 'badgeSeq', 'phone']) {
    if (info.includes(field)) return field
  }
  return 'unknown'
}

export type CreateStudentResult = { kind: 'created'; registration: StudentBadgeRow } | { kind: 'existing' }

export function createStudentRegistration(editionId: number, data: StudentData): Promise<CreateStudentResult> {
  return withStudentCreationLock(async () => {
    // Doublon arrivé pendant l'attente dans la file : repasser par la vérification du nom
    if (await findStudentByPhone(editionId, data.phone)) return { kind: 'existing' as const }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const registration = await prisma.$transaction(async (tx) => {
          const { lastBadgeSeq } = await tx.salmEdition.update({
            where: { id: editionId },
            data: { lastBadgeSeq: { increment: 1 } },
            select: { lastBadgeSeq: true },
          })
          return tx.salmStudentRegistration.create({
            data: {
              editionId,
              fullName: data.fullName,
              phone: data.phone,
              studyLevel: data.studyLevel,
              badgeSeq: lastBadgeSeq,
              verifyToken: newToken(),
              downloadToken: newToken(),
              nameSearch: nameSearchKey(data.fullName),
            },
            select: badgeRegistrationSelect,
          })
        })
        return { kind: 'created' as const, registration }
      } catch (error) {
        const field = uniqueViolationField(error)
        if (field === 'phone') return { kind: 'existing' as const }
        if ((field === 'verifyToken' || field === 'downloadToken') && attempt < 3) continue
        // Journal sans nom ni téléphone
        console.error('[SALM] Échec de création d\'inscription', {
          editionId,
          code: (error as { code?: string })?.code,
          field,
        })
        throw apiError(500, 'INTERNAL')
      }
    }
    throw apiError(500, 'INTERNAL')
  })
}

// ---- Badge ----

export function getSiteUrl(event: H3Event): string {
  return (useRuntimeConfig(event).public.siteUrl as string) || 'https://lecarredesetudes.com'
}

export async function toBadgePayload(
  event: H3Event,
  registration: StudentBadgeRow,
  year: number,
): Promise<SalmBadgePayload> {
  return {
    number: formatBadgeNumber(year, registration.badgeSeq),
    fullName: registration.fullName,
    studyLevel: registration.studyLevel,
    qrSvg: await badgeQrSvg(badgeVerifyUrl(getSiteUrl(event), registration.verifyToken)),
    downloadUrl: `/api/salm/badges/${registration.downloadToken}`,
  }
}

export function toBadgeEdition(edition: SalmEditionCore): BadgeEdition {
  return {
    year: edition.year,
    salonName: edition.salonName,
    city: edition.city,
    venue: edition.venue,
    organizerName: edition.organizerName,
    contacts: asContacts(edition.contacts),
    days: edition.days,
  }
}

/** Inscription + édition nécessaires au PDF, par jeton de téléchargement ou par identifiant. */
export async function findBadgeData(where: { downloadToken: string } | { id: number }) {
  const row = await prisma.salmStudentRegistration.findUnique({
    where,
    select: {
      ...badgeRegistrationSelect,
      edition: {
        select: {
          id: true,
          year: true,
          status: true,
          salonName: true,
          city: true,
          venue: true,
          organizerName: true,
          contacts: true,
          studentRegistrationOpen: true,
          schoolRegistrationOpen: true,
          days: {
            select: { date: true, label: true, opensAt: true, closesAt: true },
            orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }],
          },
        },
      },
    },
  })
  if (!row) return null
  const { edition, ...registration } = row
  return { registration, edition: toBadgeEdition(edition) }
}

export const BADGE_TOKEN_REGEX = /^[\w-]{22}$/

// ---- Établissements : liste blanche et validation (FR-040 à FR-047) ----

export interface SchoolFields {
  name?: unknown
  phone?: unknown
  email?: unknown
  programmes?: unknown
  otherProgramme?: unknown
  exhibitors?: unknown
  standTypeId?: unknown
  question?: unknown
  website?: unknown
  startedAt?: unknown
}

export function pickSchoolFields(body: unknown): SchoolFields {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  return {
    name: b.name,
    phone: b.phone,
    email: b.email,
    programmes: b.programmes,
    otherProgramme: b.otherProgramme,
    // Chaque exposant est réduit à ses 2 champs
    exhibitors: Array.isArray(b.exhibitors)
      ? b.exhibitors.map((x) => {
          const e = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
          return { fullName: e.fullName, contact: e.contact }
        })
      : b.exhibitors,
    standTypeId: b.standTypeId,
    question: b.question,
    website: b.website,
    startedAt: b.startedAt,
  }
}

export interface SchoolData {
  name: string
  phone: string
  email: string
  programmes: SchoolProgramme[]
  otherProgramme: string | null
  exhibitors: SalmExhibitor[]
  standTypeId: number
  question: string | null
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown): string {
  return typeof value === 'string' ? collapseSpaces(value) : ''
}

/** Valide l'inscription d'un établissement, ou lève `400 VALIDATION` (codes de public-api.md). */
export function validateSchool(fields: SchoolFields, visibleStandIds: number[]): SchoolData {
  const errors: Record<string, SalmFieldError> = {}

  const name = text(fields.name)
  if (!name) errors.name = 'REQUIRED'
  else if (name.length < 2) errors.name = 'TOO_SHORT'
  else if (name.length > 150) errors.name = 'TOO_LONG'

  const phone = normalizeIvorianPhone(fields.phone, { landline: true })
  if (!text(fields.phone)) errors.phone = 'REQUIRED'
  else if (!phone) errors.phone = 'INVALID_FORMAT'

  const email = text(fields.email).toLowerCase()
  if (!email) errors.email = 'REQUIRED'
  else if (email.length > 254) errors.email = 'TOO_LONG'
  else if (!EMAIL_REGEX.test(email)) errors.email = 'INVALID_FORMAT'

  const programmes = Array.isArray(fields.programmes) ? fields.programmes : []
  if (!programmes.length) errors.programmes = 'REQUIRED'
  else if (!programmes.every((p) => (SCHOOL_PROGRAMMES as readonly unknown[]).includes(p))) errors.programmes = 'INVALID_CHOICE'
  else if (new Set(programmes).size !== programmes.length) errors.programmes = 'DUPLICATE'

  const hasOther = programmes.includes('AUTRE')
  const otherProgramme = hasOther ? text(fields.otherProgramme) : ''
  if (otherProgramme.length > 120) errors.otherProgramme = 'TOO_LONG'

  const exhibitors: SalmExhibitor[] = []
  const rawExhibitors = Array.isArray(fields.exhibitors) ? fields.exhibitors : []
  if (!rawExhibitors.length) errors.exhibitors = 'REQUIRED'
  else if (rawExhibitors.length > SCHOOL_MAX_EXHIBITORS) errors.exhibitors = 'TOO_MANY'
  else {
    rawExhibitors.forEach((raw, i) => {
      const e = raw as { fullName?: unknown; contact?: unknown }
      const fullName = text(e.fullName)
      if (!fullName) errors[`exhibitors.${i}.fullName`] = 'REQUIRED'
      else if (fullName.length < 2) errors[`exhibitors.${i}.fullName`] = 'TOO_SHORT'
      else if (fullName.length > 100) errors[`exhibitors.${i}.fullName`] = 'TOO_LONG'
      const contact = normalizeIvorianPhone(e.contact, { landline: true })
      if (!text(e.contact)) errors[`exhibitors.${i}.contact`] = 'REQUIRED'
      else if (!contact) errors[`exhibitors.${i}.contact`] = 'INVALID_FORMAT'
      exhibitors.push({ fullName, contact: contact ?? '' })
    })
  }

  const standTypeId = typeof fields.standTypeId === 'number' ? fields.standTypeId : Number(fields.standTypeId)
  if (fields.standTypeId === undefined || fields.standTypeId === null || fields.standTypeId === '') errors.standTypeId = 'REQUIRED'
  else if (!Number.isInteger(standTypeId) || !visibleStandIds.includes(standTypeId)) errors.standTypeId = 'INVALID_CHOICE'

  const question = typeof fields.question === 'string' ? fields.question.trim() : ''
  if (question.length > 1000) errors.question = 'TOO_LONG'

  if (Object.keys(errors).length) throw validationError(errors)
  return {
    name,
    phone: phone!,
    email,
    programmes: programmes as SchoolProgramme[],
    otherProgramme: otherProgramme || null,
    exhibitors,
    standTypeId,
    question: question || null,
  }
}
