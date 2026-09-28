import { createError } from 'h3'
import { prisma } from './prisma'
import { adminError } from './salm-admin'
import { asAudiences, asContacts, isEditionEnded, isRegistrationOpen } from './salm-edition'
import { isSalmImagePath, isSalmPdfPath, salmFileExists } from './salm-files'
import { formatIvorianPhone, normalizeIvorianPhone } from '#shared/utils/phone'
import {
  canonicalYoutubeUrl,
  collapseSpaces,
  isValidEmail,
  parseYoutubeId,
  SLOT_KINDS,
  type SalmFieldError,
} from '#shared/utils/salm'
import type { SalmAdminEditionDetail, SalmAudience, SalmContact } from '#shared/types/salm'

// Écritures du back-office des contenus SALM (specs/007-salm-admin-contenus, data-model § 3 et § 4).
// Chaque corps passe par une liste blanche de champs (research R15) : tout autre champ est ignoré.

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export type ContentFieldError = SalmFieldError | 'FILE_NOT_FOUND'
export type ContentErrors = Record<string, ContentFieldError>
type Body = Record<string, unknown>

export function contentValidationError(errors: ContentErrors) {
  return createError({ statusCode: 400, message: 'VALIDATION', data: { code: 'VALIDATION', errors } })
}

/** `409 YEAR_TAKEN` avec l'année en conflit (`data.year`). */
export function yearTaken(year: number) {
  return createError({ statusCode: 409, message: 'YEAR_TAKEN', data: { code: 'YEAR_TAKEN', year } })
}

/** Erreur Prisma de contrainte d'unicité (`P2002`). */
export function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === 'P2002'
}

/** Lève `400 VALIDATION` s'il y a des erreurs. */
export function assertValid(errors: ContentErrors) {
  if (Object.keys(errors).length) throw contentValidationError(errors)
}

// ---- Lecture des champs ----

function has(body: Body, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined
}

interface TextRule {
  max: number
  min?: number
  /** Valeur non vide exigée (et présence exigée hors mode partiel). */
  required?: boolean
  partial?: boolean
  /** Conserve les retours à la ligne (texte long). */
  multiline?: boolean
  errorKey?: string
}

/** `undefined` : champ absent ou invalide ; `null` : champ vidé ; sinon la valeur nettoyée. */
function readText(body: Body, key: string, errors: ContentErrors, rule: TextRule): string | null | undefined {
  const errorKey = rule.errorKey ?? key
  if (!has(body, key)) {
    if (rule.required && !rule.partial) errors[errorKey] = 'REQUIRED'
    return undefined
  }
  const raw = body[key]
  if (raw !== null && typeof raw !== 'string') {
    errors[errorKey] = 'INVALID_FORMAT'
    return undefined
  }
  const value = raw === null ? '' : rule.multiline ? raw.replace(/\r\n?/g, '\n').trim() : collapseSpaces(raw)
  if (!value) {
    if (rule.required) errors[errorKey] = 'REQUIRED'
    return rule.required ? undefined : null
  }
  const length = [...value].length
  if (length < (rule.min ?? 1)) errors[errorKey] = 'TOO_SHORT'
  else if (length > rule.max) errors[errorKey] = 'TOO_LONG'
  return value
}

function readBoolean(body: Body, key: string, errors: ContentErrors): boolean | undefined {
  if (!has(body, key)) return undefined
  if (typeof body[key] !== 'boolean') {
    errors[key] = 'INVALID_FORMAT'
    return undefined
  }
  return body[key] as boolean
}

async function readImagePath(
  body: Body, key: string, errors: ContentErrors, { required = false, partial = false } = {},
): Promise<string | null | undefined> {
  if (!has(body, key)) {
    if (required && !partial) errors[key] = 'REQUIRED'
    return undefined
  }
  const raw = body[key]
  if (raw === null || raw === '') {
    if (required) errors[key] = 'REQUIRED'
    return required ? undefined : null
  }
  if (typeof raw !== 'string' || !isSalmImagePath(raw)) {
    errors[key] = 'INVALID_FORMAT'
    return undefined
  }
  if (!(await salmFileExists(raw))) {
    errors[key] = 'FILE_NOT_FOUND'
    return undefined
  }
  return raw
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

function readTime(body: Body, key: string, errors: ContentErrors, partial: boolean): string | undefined {
  if (!has(body, key)) {
    if (!partial) errors[key] = 'REQUIRED'
    return undefined
  }
  const raw = body[key]
  if (typeof raw !== 'string' || !raw.trim()) {
    errors[key] = 'REQUIRED'
    return undefined
  }
  if (!HHMM.test(raw.trim())) {
    errors[key] = 'INVALID_FORMAT'
    return undefined
  }
  return raw.trim()
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

function requireSomeField(data: object, errors: ContentErrors) {
  if (!Object.keys(data).length && !Object.keys(errors).length) errors.body = 'REQUIRED'
}

// ---- Édition (PATCH /editions/:id) ----

export interface EditionPatchContext {
  id: number
  year: number
  yearLocked: boolean
  posterPath: string | null
}

export interface EditionPatchData {
  year?: number
  salonName?: string
  organizerName?: string
  city?: string
  venue?: string | null
  tagline?: string | null
  whyTitle?: string | null
  whyText?: string | null
  audiences?: SalmAudience[]
  contacts?: SalmContact[]
  posterPath?: string | null
  posterAlt?: string | null
  programPdfPath?: string | null
  recapVideoUrl?: string | null
  recapPosterPath?: string | null
}

function setIfDefined<T extends object, K extends keyof T>(data: T, key: K, value: T[K] | undefined) {
  if (value !== undefined) data[key] = value
}

function readAudiences(body: Body, errors: ContentErrors): SalmAudience[] | undefined {
  if (!has(body, 'audiences')) return undefined
  const raw = body.audiences
  if (!Array.isArray(raw)) {
    errors.audiences = 'INVALID_FORMAT'
    return undefined
  }
  if (raw.length > 6) {
    errors.audiences = 'TOO_MANY'
    return undefined
  }
  return raw.map((item, i) => {
    const entry = (item && typeof item === 'object' ? item : {}) as Body
    const title = readText(entry, 'title', errors, { max: 80, required: true, errorKey: `audiences.${i}.title` })
    const text = readText(entry, 'text', errors, { max: 300, required: true, multiline: true, errorKey: `audiences.${i}.text` })
    return { title: title ?? '', text: text ?? '' }
  })
}

function readContacts(body: Body, errors: ContentErrors): SalmContact[] | undefined {
  if (!has(body, 'contacts')) return undefined
  const raw = body.contacts
  if (!Array.isArray(raw)) {
    errors.contacts = 'INVALID_FORMAT'
    return undefined
  }
  if (raw.length > 8) {
    errors.contacts = 'TOO_MANY'
    return undefined
  }
  const contacts: SalmContact[] = raw.map((item, i) => {
    const entry = (item && typeof item === 'object' ? item : {}) as Body
    const kind = entry.kind
    if (kind !== 'phone' && kind !== 'email' && kind !== 'address') {
      errors[`contacts.${i}.kind`] = 'INVALID_CHOICE'
      return { kind: 'address', value: '' }
    }
    const valueKey = `contacts.${i}.value`
    const text = typeof entry.value === 'string' ? collapseSpaces(entry.value) : ''
    let value = text
    if (!text) errors[valueKey] = 'REQUIRED'
    else if (kind === 'phone') {
      const phone = normalizeIvorianPhone(text, { landline: true })
      if (phone) value = `+225 ${formatIvorianPhone(phone)}`
      else errors[valueKey] = 'INVALID_FORMAT'
    }
    else if (kind === 'email') {
      value = text.toLowerCase()
      if (value.length > 254) errors[valueKey] = 'TOO_LONG'
      else if (!isValidEmail(value)) errors[valueKey] = 'INVALID_FORMAT'
    }
    else if ([...text].length < 2) errors[valueKey] = 'TOO_SHORT'
    else if ([...text].length > 200) errors[valueKey] = 'TOO_LONG'

    const contact: SalmContact = { kind, value }
    if (entry.onBadge === true) {
      if (kind === 'phone') contact.onBadge = true
      else errors[`contacts.${i}.onBadge`] = 'INVALID_CHOICE'
    }
    return contact
  })
  // Au plus un contact imprimé sur le badge : le dernier marqué l'emporte (FR-145)
  const lastMarked = contacts.findLastIndex((c) => c.onBadge)
  contacts.forEach((c, i) => {
    if (c.onBadge && i !== lastMarked) delete c.onBadge
  })
  return contacts
}

/**
 * Valide un `PATCH` d'édition. Lève `409 YEAR_LOCKED` ou `409 YEAR_TAKEN` pour l'année ;
 * renvoie les erreurs de champ à lever par `assertValid`.
 */
export async function validateEditionPatch(body: Body, edition: EditionPatchContext) {
  const errors: ContentErrors = {}
  const data: EditionPatchData = {}

  if (has(body, 'year')) {
    const year = body.year
    if (typeof year !== 'number' || !Number.isInteger(year) || year < 2020 || year > 2100) {
      errors.year = 'INVALID_FORMAT'
    }
    else if (year !== edition.year) {
      if (edition.yearLocked) throw adminError(409, 'YEAR_LOCKED')
      const taken = await prisma.salmEdition.findUnique({ where: { year }, select: { id: true } })
      if (taken) throw yearTaken(year)
      data.year = year
    }
  }

  setIfDefined(data, 'salonName', readText(body, 'salonName', errors, { min: 2, max: 150, required: true, partial: true }) ?? undefined)
  setIfDefined(data, 'organizerName', readText(body, 'organizerName', errors, { min: 2, max: 150, required: true, partial: true }) ?? undefined)
  setIfDefined(data, 'city', readText(body, 'city', errors, { min: 2, max: 80, required: true, partial: true }) ?? undefined)
  setIfDefined(data, 'venue', readText(body, 'venue', errors, { max: 200 }))
  setIfDefined(data, 'tagline', readText(body, 'tagline', errors, { max: 150 }))
  setIfDefined(data, 'whyTitle', readText(body, 'whyTitle', errors, { max: 200 }))
  setIfDefined(data, 'whyText', readText(body, 'whyText', errors, { max: 2000, multiline: true }))
  setIfDefined(data, 'audiences', readAudiences(body, errors))
  setIfDefined(data, 'contacts', readContacts(body, errors))

  // Affiche et texte alternatif (prérempli « Affiche du SALM <année> »)
  const posterPath = await readImagePath(body, 'posterPath', errors)
  setIfDefined(data, 'posterPath', posterPath)
  const posterAlt = readText(body, 'posterAlt', errors, { max: 200 })
  const effectivePoster = posterPath !== undefined ? posterPath : edition.posterPath
  if (posterPath !== undefined || posterAlt !== undefined) {
    if (!effectivePoster) data.posterAlt = null
    else if (posterAlt) data.posterAlt = posterAlt
    else if (posterPath !== undefined || posterAlt === null) {
      data.posterAlt = `Affiche du SALM ${data.year ?? edition.year}`
    }
  }

  if (has(body, 'programPdfPath')) {
    const raw = body.programPdfPath
    if (raw === null || raw === '') data.programPdfPath = null
    else if (typeof raw !== 'string' || !isSalmPdfPath(raw)) errors.programPdfPath = 'INVALID_FORMAT'
    else if (!(await salmFileExists(raw))) errors.programPdfPath = 'FILE_NOT_FOUND'
    else data.programPdfPath = raw
  }

  if (has(body, 'recapVideoUrl')) {
    const raw = body.recapVideoUrl
    if (raw === null || raw === '') data.recapVideoUrl = null
    else {
      const id = typeof raw === 'string' ? parseYoutubeId(raw) : null
      if (id) data.recapVideoUrl = canonicalYoutubeUrl(id)
      else errors.recapVideoUrl = 'INVALID_FORMAT'
    }
  }
  setIfDefined(data, 'recapPosterPath', await readImagePath(body, 'recapPosterPath', errors))

  requireSomeField(data, errors)
  return { data, errors }
}

// ---- Éléments des listes ----

interface ItemOptions<C> {
  partial?: boolean
  /** Valeurs actuelles, pour les contrôles croisés d'un `PATCH`. */
  current?: C
}

export function validateDay(body: Body, { partial = false, current }: ItemOptions<{ opensAt: string; closesAt: string }> = {}) {
  const errors: ContentErrors = {}
  const data: { date?: string; label?: string | null; opensAt?: string; closesAt?: string } = {}

  if (has(body, 'date') || !partial) {
    const raw = body.date
    if (typeof raw !== 'string' || !raw.trim()) errors.date = 'REQUIRED'
    else if (!isValidDate(raw.trim())) errors.date = 'INVALID_FORMAT'
    else data.date = raw.trim()
  }
  // Libellé absent à la création : « Jour N », calculé par la route
  setIfDefined(data, 'label', readText(body, 'label', errors, { max: 40, required: partial, partial }))
  setIfDefined(data, 'opensAt', readTime(body, 'opensAt', errors, partial))
  setIfDefined(data, 'closesAt', readTime(body, 'closesAt', errors, partial))

  const opensAt = data.opensAt ?? current?.opensAt
  const closesAt = data.closesAt ?? current?.closesAt
  if (!errors.opensAt && !errors.closesAt && opensAt && closesAt && closesAt <= opensAt) {
    errors.closesAt = 'INVALID_FORMAT'
  }
  if (partial) requireSomeField(data, errors)
  return { data, errors }
}

export function validateSlot(body: Body, { partial = false, current }: ItemOptions<{ startTime: string; endTime: string }> = {}) {
  const errors: ContentErrors = {}
  const data: {
    startTime?: string
    endTime?: string
    title?: string
    kind?: string
    description?: string | null
    isHighlighted?: boolean
  } = {}

  setIfDefined(data, 'startTime', readTime(body, 'startTime', errors, partial))
  setIfDefined(data, 'endTime', readTime(body, 'endTime', errors, partial))
  const startTime = data.startTime ?? current?.startTime
  const endTime = data.endTime ?? current?.endTime
  if (!errors.startTime && !errors.endTime && startTime && endTime && endTime <= startTime) {
    errors.endTime = 'INVALID_FORMAT'
  }
  setIfDefined(data, 'title', readText(body, 'title', errors, { max: 150, required: true, partial }) ?? undefined)
  if (has(body, 'kind') || !partial) {
    if ((SLOT_KINDS as readonly unknown[]).includes(body.kind)) data.kind = body.kind as string
    else errors.kind = has(body, 'kind') ? 'INVALID_CHOICE' : 'REQUIRED'
  }
  setIfDefined(data, 'description', readText(body, 'description', errors, { max: 1000, multiline: true }))
  setIfDefined(data, 'isHighlighted', readBoolean(body, 'isHighlighted', errors))
  if (partial) requireSomeField(data, errors)
  return { data, errors }
}

export async function validateHighlight(body: Body, { partial = false, current }: ItemOptions<{ title: string }> = {}) {
  const errors: ContentErrors = {}
  const data: { title?: string; imagePath?: string; imageAlt?: string } = {}

  setIfDefined(data, 'title', readText(body, 'title', errors, { max: 100, required: true, partial }) ?? undefined)
  setIfDefined(data, 'imagePath', (await readImagePath(body, 'imagePath', errors, { required: true, partial })) ?? undefined)
  const imageAlt = readText(body, 'imageAlt', errors, { max: 200 })
  // Texte alternatif vide : le titre
  if (imageAlt) data.imageAlt = imageAlt
  else if (imageAlt === null || !partial) {
    const title = data.title ?? current?.title
    if (title) data.imageAlt = title
  }
  if (partial) requireSomeField(data, errors)
  return { data, errors }
}

export function validateVideo(body: Body, { partial = false }: ItemOptions<never> = {}) {
  const errors: ContentErrors = {}
  const data: { youtubeUrl?: string; title?: string | null; guest?: string | null; institution?: string | null } = {}

  if (has(body, 'youtubeUrl') || !partial) {
    const raw = body.youtubeUrl
    if (typeof raw !== 'string' || !raw.trim()) errors.youtubeUrl = 'REQUIRED'
    else {
      const id = parseYoutubeId(raw)
      if (id) data.youtubeUrl = canonicalYoutubeUrl(id)
      else errors.youtubeUrl = 'INVALID_FORMAT'
    }
  }
  setIfDefined(data, 'title', readText(body, 'title', errors, { max: 150 }))
  setIfDefined(data, 'guest', readText(body, 'guest', errors, { max: 150 }))
  setIfDefined(data, 'institution', readText(body, 'institution', errors, { max: 150 }))
  if (partial) requireSomeField(data, errors)
  return { data, errors }
}

/** Photo : `imagePath` à la création seulement ; `alt` vide à la création : prérempli par la route. */
export async function validatePhoto(body: Body, { partial = false }: ItemOptions<never> = {}) {
  const errors: ContentErrors = {}
  const data: { imagePath?: string; alt?: string | null; caption?: string | null } = {}

  if (!partial) setIfDefined(data, 'imagePath', (await readImagePath(body, 'imagePath', errors, { required: true })) ?? undefined)
  setIfDefined(data, 'alt', readText(body, 'alt', errors, { max: 200, required: partial, partial }))
  setIfDefined(data, 'caption', readText(body, 'caption', errors, { max: 200 }))
  if (partial) requireSomeField(data, errors)
  return { data, errors }
}

/** `otherNames` : noms des autres types de stand de l'édition (unicité sans tenir compte de la casse). */
export function validateStandType(body: Body, { partial = false, otherNames = [] }: { partial?: boolean; otherNames?: string[] } = {}) {
  const errors: ContentErrors = {}
  const data: { name?: string; description?: string | null; priceLabel?: string | null; isVisible?: boolean } = {}

  const name = readText(body, 'name', errors, { max: 60, required: true, partial })
  if (name) {
    const key = name.toLocaleLowerCase('fr-FR')
    if (otherNames.some((n) => n.toLocaleLowerCase('fr-FR') === key)) errors.name = 'DUPLICATE'
    else data.name = name
  }
  setIfDefined(data, 'description', readText(body, 'description', errors, { max: 500, multiline: true }))
  setIfDefined(data, 'priceLabel', readText(body, 'priceLabel', errors, { max: 60 }))
  setIfDefined(data, 'isVisible', readBoolean(body, 'isVisible', errors))
  if (partial) requireSomeField(data, errors)
  return { data, errors }
}

// ---- Ordre des listes (research R8) ----

export type OrderModel = 'salmHighlight' | 'salmVideo' | 'salmPhoto' | 'salmStandType' | 'salmSlot'
export type OrderScope = { editionId: number } | { dayId: number }

interface OrderDelegate {
  findMany(args: { where: OrderScope; select: { id: true } }): Promise<{ id: number }[]>
  update(args: { where: { id: number }; data: { sortOrder: number } }): Promise<unknown>
  aggregate(args: { where: OrderScope; _max: { sortOrder: true } }): Promise<{ _max: { sortOrder: number | null } }>
}

function delegate(client: Tx | typeof prisma, model: OrderModel): OrderDelegate {
  return client[model] as unknown as OrderDelegate
}

/** `ids` doit contenir exactement les éléments du périmètre (sinon `400 ORDER_MISMATCH`) ; `sortOrder = index`. */
export async function applyOrder(model: OrderModel, scopeWhere: OrderScope, rawIds: unknown): Promise<number[]> {
  const ids = Array.isArray(rawIds) && rawIds.every((id) => Number.isSafeInteger(id) && id > 0)
    ? (rawIds as number[])
    : null
  if (!ids || new Set(ids).size !== ids.length) throw adminError(400, 'ORDER_MISMATCH')

  await prisma.$transaction(async (tx) => {
    const items = await delegate(tx, model).findMany({ where: scopeWhere, select: { id: true } })
    const scope = new Set(items.map((i) => i.id))
    if (scope.size !== ids.length || !ids.every((id) => scope.has(id))) throw adminError(400, 'ORDER_MISMATCH')
    for (const [sortOrder, id] of ids.entries()) {
      await delegate(tx, model).update({ where: { id }, data: { sortOrder } })
    }
  })
  return ids
}

/** Position de fin de liste : `max(sortOrder) + 1`. */
export async function nextSortOrder(model: OrderModel, scopeWhere: OrderScope): Promise<number> {
  const { _max } = await delegate(prisma, model).aggregate({ where: scopeWhere, _max: { sortOrder: true } })
  return _max.sortOrder === null ? 0 : _max.sortOrder + 1
}

/** `sortOrder` des jours de l'édition par date croissante. */
export async function resortDays(tx: Tx, editionId: number) {
  const days = await tx.salmDay.findMany({ where: { editionId }, orderBy: { date: 'asc' }, select: { id: true } })
  for (const [sortOrder, day] of days.entries()) {
    await tx.salmDay.update({ where: { id: day.id }, data: { sortOrder } })
  }
}

// ---- Valeurs dérivées et fiche (data-model § 3, contrat § 3) ----

interface FlagsInput {
  status: string
  lastBadgeSeq: number
  personalDataPurgedAt: Date | null
  days: { date: string; opensAt: string; closesAt: string }[]
}

export function editionFlags(edition: FlagsInput, counts: { students: number; schools: number }, now = new Date()) {
  const everRegistered = counts.students + counts.schools > 0 || edition.lastBadgeSeq > 0 || !!edition.personalDataPurgedAt
  const ended = isEditionEnded(edition.days, now)
  return {
    everRegistered,
    yearLocked: everRegistered,
    canDelete: edition.status === 'draft' && !everRegistered,
    canPublish: edition.status !== 'published' && edition.days.length > 0 && !(edition.status === 'archived' && ended),
  }
}

const byOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }]

export async function getEditionDetail(id: number): Promise<SalmAdminEditionDetail | null> {
  const e = await prisma.salmEdition.findUnique({
    where: { id },
    select: {
      id: true,
      year: true,
      status: true,
      salonName: true,
      organizerName: true,
      city: true,
      venue: true,
      tagline: true,
      whyTitle: true,
      whyText: true,
      audiences: true,
      contacts: true,
      posterPath: true,
      posterAlt: true,
      programPdfPath: true,
      recapVideoUrl: true,
      recapPosterPath: true,
      studentRegistrationOpen: true,
      schoolRegistrationOpen: true,
      lastBadgeSeq: true,
      personalDataPurgedAt: true,
      days: {
        orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }],
        select: {
          id: true,
          date: true,
          label: true,
          opensAt: true,
          closesAt: true,
          slots: {
            orderBy: byOrder,
            select: { id: true, startTime: true, endTime: true, title: true, kind: true, description: true, isHighlighted: true },
          },
        },
      },
      highlights: { orderBy: byOrder, select: { id: true, title: true, imagePath: true, imageAlt: true } },
      videos: { orderBy: byOrder, select: { id: true, youtubeUrl: true, title: true, guest: true, institution: true } },
      photos: { orderBy: byOrder, select: { id: true, imagePath: true, alt: true, caption: true } },
      standTypes: {
        orderBy: byOrder,
        select: {
          id: true,
          name: true,
          description: true,
          priceLabel: true,
          isVisible: true,
          _count: { select: { schoolRegistrations: true } },
        },
      },
      _count: { select: { studentRegistrations: true, schoolRegistrations: true } },
    },
  })
  if (!e) return null

  const [previous, next] = await Promise.all([
    prisma.salmEdition.findFirst({ where: { year: { lt: e.year } }, orderBy: { year: 'desc' }, select: { id: true, year: true } }),
    prisma.salmEdition.findFirst({ where: { year: { gt: e.year } }, orderBy: { year: 'asc' }, select: { year: true } }),
  ])
  const now = new Date()
  const counts = { students: e._count.studentRegistrations, schools: e._count.schoolRegistrations }
  const flags = editionFlags(e, counts, now)

  return {
    id: e.id,
    year: e.year,
    status: e.status,
    salonName: e.salonName,
    organizerName: e.organizerName,
    city: e.city,
    venue: e.venue,
    tagline: e.tagline,
    whyTitle: e.whyTitle,
    whyText: e.whyText,
    audiences: asAudiences(e.audiences),
    contacts: asContacts(e.contacts),
    poster: e.posterPath ? { path: e.posterPath, alt: e.posterAlt } : null,
    programPdfPath: e.programPdfPath,
    recap: { youtubeUrl: e.recapVideoUrl, youtubeId: parseYoutubeId(e.recapVideoUrl), posterPath: e.recapPosterPath },
    days: e.days,
    highlights: e.highlights,
    videos: e.videos.map((v) => ({ ...v, youtubeId: parseYoutubeId(v.youtubeUrl) })),
    photos: e.photos,
    standTypes: e.standTypes.map(({ _count, ...s }) => ({ ...s, schoolCount: _count.schoolRegistrations })),
    counts,
    yearLocked: flags.yearLocked,
    canDelete: flags.canDelete,
    canPublish: flags.canPublish,
    ended: isEditionEnded(e.days, now),
    registrationOpen: {
      students: isRegistrationOpen(e, 'students', now),
      schools: isRegistrationOpen(e, 'schools', now),
    },
    previousEdition: previous,
    nextEditionYear: next?.year ?? e.year + 1,
  }
}

// ---- Aides des routes de contenu ----

/** Édition de la route, sinon `404 NOT_FOUND`. */
export async function requireEdition(id: number) {
  const edition = await prisma.salmEdition.findUnique({ where: { id }, select: { id: true, year: true, status: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND')
  return edition
}

/** Élément de la route (`null` → `404 NOT_FOUND`). */
export function found<T>(item: T | null): T {
  if (!item) throw adminError(404, 'NOT_FOUND')
  return item
}

/** Corps JSON d'une requête admin, toujours un objet. */
export function asBody(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

/** `warnings: ['DUPLICATE_VIDEO']` si la même vidéo YouTube figure déjà dans l'édition (FR-162). */
export async function videoWarnings(editionId: number, youtubeUrl: string, excludeId?: number) {
  const id = parseYoutubeId(youtubeUrl)
  const others = await prisma.salmVideo.findMany({
    where: { editionId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { youtubeUrl: true },
  })
  return others.some((v) => parseYoutubeId(v.youtubeUrl) === id) ? ['DUPLICATE_VIDEO' as const] : []
}
