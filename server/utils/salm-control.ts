import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { adminError } from './salm-admin'
import { getEditionTimeline } from './salm-edition'
import { getSiteUrl, isUniqueViolation } from './salm-registration'
import { badgeQrSvg } from './salm-badge-pdf'
import { formatBadgeNumber } from '#shared/utils/salm'
import { badgeTokenHash, controlDayFor, resolveControlResult, type ControlResolution } from '#shared/utils/salm-control'
import type {
  SalmControlCounter,
  SalmControlDay,
  SalmControlEntry,
  SalmControlKnownEntry,
  SalmControlPerson,
  SalmControlResult,
  SalmControlSnapshot,
  SalmControlSyncItem,
  SalmControlSyncResult,
} from '#shared/types/salm'

// Contrôle d'entrée SALM (specs/008, contracts/control-api.md) : toujours sur l'édition publiée.
// Règle : aucune réponse ne contient de téléphone (FR-230), ni `verifyToken` ou `downloadToken` en clair.

export interface ControlContext {
  edition: { id: number; year: number; endsAt: Date | null }
  /** Jours de salon de l'édition publiée, par date */
  days: SalmControlDay[]
  /** Jour contrôlé ; `null` en mode essai (R9) */
  day: SalmControlDay | null
  now: Date
}

/** Édition publiée et jour contrôlé, sinon `404 NO_PUBLISHED_EDITION`. */
export async function getControlContext(now = new Date()): Promise<ControlContext> {
  const edition = await prisma.salmEdition.findFirst({
    where: { status: 'published' },
    orderBy: { year: 'desc' },
    select: {
      id: true,
      year: true,
      days: {
        select: { id: true, label: true, date: true, opensAt: true, closesAt: true },
        orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }],
      },
    },
  })
  if (!edition) throw adminError(404, 'NO_PUBLISHED_EDITION', 'Aucune édition SALM publiée.')
  const days = edition.days.map((d) => ({ id: d.id, label: d.label, date: d.date }))
  return {
    edition: { id: edition.id, year: edition.year, endsAt: getEditionTimeline(edition.days).endsAt },
    days,
    day: controlDayFor(days, now),
    now,
  }
}

/** Sélection minimale d'une inscription pour le poste de contrôle. */
export const controlRegistrationSelect = {
  id: true,
  fullName: true,
  studyLevel: true,
  badgeSeq: true,
  editionId: true,
} as const

export function toControlPerson(
  registration: { id: number; fullName: string; studyLevel: string; badgeSeq: number },
  year: number,
): SalmControlPerson {
  return {
    registrationId: registration.id,
    fullName: registration.fullName,
    studyLevel: registration.studyLevel,
    badgeNumber: formatBadgeNumber(year, registration.badgeSeq),
  }
}

/** Nombre d'entrées de chaque jour ; 0 pour un jour sans entrée (FR-224, FR-225). */
export async function getDayCounters(days: { id: number }[]): Promise<SalmControlCounter[]> {
  const ids = days.map((d) => d.id)
  const groups = ids.length
    ? await prisma.salmEntry.groupBy({ by: ['dayId'], where: { dayId: { in: ids } }, _count: { _all: true } })
    : []
  return ids.map((dayId) => ({ dayId, entries: groups.find((g) => g.dayId === dayId)?._count._all ?? 0 }))
}

export function toControlEntry(entry: { id: number; enteredAt: Date }): SalmControlEntry {
  return { id: entry.id, enteredAt: entry.enteredAt.toISOString() }
}

export function findEntry(registrationId: number, dayId: number) {
  return prisma.salmEntry.findUnique({
    where: { registrationId_dayId: { registrationId, dayId } },
    select: { id: true, enteredAt: true },
  })
}

/**
 * Insertion optimiste (R4) : la contrainte unique `(registrationId, dayId)` départage deux postes.
 * Le perdant relit l'entrée existante et affiche son heure (« déjà entré·e »).
 */
export async function recordEntry(input: {
  registrationId: number
  dayId: number
  mode: 'scan' | 'manual'
  enteredAt?: Date
  offline?: boolean
}): Promise<{ created: boolean; entry: { id: number; enteredAt: Date } }> {
  try {
    const entry = await prisma.salmEntry.create({
      data: {
        registrationId: input.registrationId,
        dayId: input.dayId,
        mode: input.mode,
        enteredAt: input.enteredAt ?? new Date(),
        offline: input.offline ?? false,
      },
      select: { id: true, enteredAt: true },
    })
    return { created: true, entry }
  }
  catch (error) {
    if (!isUniqueViolation(error, ['registrationId', 'dayId'])) throw error
    const entry = await findEntry(input.registrationId, input.dayId)
    if (!entry) throw error
    return { created: false, entry }
  }
}

export async function buildControlResult(
  ctx: ControlContext,
  resolution: ControlResolution,
  extra: { person?: SalmControlPerson; entry?: SalmControlEntry } = {},
): Promise<SalmControlResult> {
  return {
    ...resolution,
    day: ctx.day,
    // Aucune donnée personnelle pour un badge refusé (FR-207)
    ...(resolution.status === 'refused' ? {} : extra),
    counters: await getDayCounters(ctx.days),
  }
}

/** Résultat d'un badge de l'édition publiée : essai, ou entrée enregistrée (`entered` / `already`). */
export async function controlRegistration(
  ctx: ControlContext,
  registration: { id: number; fullName: string; studyLevel: string; badgeSeq: number; editionId: number },
  editionYear: number,
  mode: 'scan' | 'manual',
): Promise<SalmControlResult> {
  const person = toControlPerson(registration, editionYear)
  const pre = resolveControlResult({
    registration: { editionId: registration.editionId, editionYear },
    publishedEditionId: ctx.edition.id,
    dayId: ctx.day?.id ?? null,
    alreadyEntered: false,
  })
  if (pre.status !== 'entered' || !ctx.day) return buildControlResult(ctx, pre, { person })
  const { created, entry } = await recordEntry({ registrationId: registration.id, dayId: ctx.day.id, mode })
  return buildControlResult(
    ctx,
    { ...pre, status: created ? 'entered' : 'already' },
    { person, entry: toControlEntry(entry) },
  )
}

/** Adresse courte du formulaire public et son QR code (FR-240, FR-241). */
export async function registrationPoster(event: H3Event) {
  const url = `${getSiteUrl(event).replace(/\/+$/, '')}/inscription`
  return { url, qrSvg: await badgeQrSvg(url) }
}

/** Entrées connues des jours de l'édition, avec l'empreinte du jeton à la place du jeton. */
export async function knownEntries(
  days: { id: number }[],
  options: { afterId?: number; take?: number } = {},
): Promise<SalmControlKnownEntry[]> {
  const rows = await prisma.salmEntry.findMany({
    where: { dayId: { in: days.map((d) => d.id) }, ...(options.afterId ? { id: { gt: options.afterId } } : {}) },
    orderBy: { id: 'asc' },
    take: options.take,
    select: { id: true, dayId: true, enteredAt: true, registration: { select: { verifyToken: true } } },
  })
  return Promise.all(rows.map(async (r) => ({
    id: r.id,
    h: await badgeTokenHash(r.registration.verifyToken),
    dayId: r.dayId,
    at: r.enteredAt.toISOString(),
  })))
}

/** Précharge du poste (FR-232, R5) : badges hachés, entrées, compteurs, QR code d'inscription. */
export async function buildSnapshot(event: H3Event, ctx: ControlContext): Promise<SalmControlSnapshot> {
  const [registrations, entries, counters, registration] = await Promise.all([
    prisma.salmStudentRegistration.findMany({
      where: { editionId: ctx.edition.id },
      orderBy: { badgeSeq: 'asc' },
      select: { badgeSeq: true, fullName: true, studyLevel: true, verifyToken: true },
    }),
    knownEntries(ctx.days),
    getDayCounters(ctx.days),
    registrationPoster(event),
  ])
  const badges = await Promise.all(registrations.map(async (r) => ({
    h: await badgeTokenHash(r.verifyToken),
    seq: r.badgeSeq,
    name: r.fullName,
    level: r.studyLevel,
  })))
  return {
    serverTime: ctx.now.toISOString(),
    edition: { id: ctx.edition.id, year: ctx.edition.year, endsAt: ctx.edition.endsAt?.toISOString() ?? null },
    days: ctx.days,
    todayDayId: ctx.day?.id ?? null,
    badges,
    entries,
    counters,
    registration,
  }
}

// ---- Synchronisation des entrées enregistrées hors ligne (R5, FR-234, FR-235) ----

export type OfflineMergeResult = SalmControlSyncResult['results'][number]

/**
 * Fusionne une entrée de la file d'un poste. Le badge est désigné par son numéro dans l'édition publiée,
 * jamais par son jeton (S1). L'heure retenue est la plus ancienne des passages, par une mise à jour
 * conditionnelle atomique : deux synchronisations concurrentes ne peuvent pas la rendre plus récente.
 */
export async function mergeOfflineEntry(item: SalmControlSyncItem, ctx: ControlContext): Promise<OfflineMergeResult> {
  const { clientId } = item
  const registration = await prisma.salmStudentRegistration.findUnique({
    where: { editionId_badgeSeq: { editionId: ctx.edition.id, badgeSeq: item.seq } },
    select: { id: true },
  })
  if (!registration) return { clientId, status: 'ignored', reason: 'UNKNOWN_BADGE' }

  const day = ctx.days.find((d) => d.id === item.dayId)
  const dayStart = day ? new Date(`${day.date}T00:00:00.000Z`) : null
  // Jour d'une autre édition, ou pas encore commencé (horloge du téléphone en avance)
  if (!day || !dayStart || dayStart > ctx.now) return { clientId, status: 'ignored', reason: 'OUT_OF_EDITION' }

  // Heure bornée au jour de l'entrée et à l'heure du serveur (R9)
  const dayEnd = new Date(Math.min(ctx.now.getTime(), new Date(`${day.date}T23:59:59.000Z`).getTime()))
  const scanned = new Date(item.scannedAt).getTime()
  const enteredAt = new Date(Math.min(Math.max(scanned, dayStart.getTime()), dayEnd.getTime()))

  const { created } = await recordEntry({
    registrationId: registration.id,
    dayId: day.id,
    mode: item.mode,
    enteredAt,
    offline: true,
  })
  if (created) return { clientId, status: 'created' }
  await prisma.salmEntry.updateMany({
    where: { registrationId: registration.id, dayId: day.id, enteredAt: { gt: enteredAt } },
    data: { enteredAt, mode: item.mode, offline: true },
  })
  return { clientId, status: 'merged' }
}
