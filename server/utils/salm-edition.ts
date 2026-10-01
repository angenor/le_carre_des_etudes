import { prisma } from './prisma'
import { formatHour, parseYoutubeId } from '#shared/utils/salm'
import type { Prisma } from '../../app/generated/prisma/client'
import type {
  SalmAudience,
  SalmContact,
  SalmEditionResponse,
  SalmKeyFigure,
  SalmPartner,
  SalmPreviousEdition,
  SalmPublicEdition,
  SalmTimeline,
} from '#shared/types/salm'

// Accès aux éditions SALM et sérialisation publique (contracts/public-api.md).
// Règle : `select` explicites, jamais d'objet Prisma complet dans une réponse publique.

interface DayTimes {
  date: string
  opensAt: string
  closesAt: string
}

const dayOrder = [{ date: 'asc' as const }, { sortOrder: 'asc' as const }]

/** Champs de l'édition nécessaires aux inscriptions et au badge. */
const editionCoreSelect = {
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
  days: { select: { date: true, label: true, opensAt: true, closesAt: true }, orderBy: dayOrder },
} as const

export type SalmEditionCore = NonNullable<Awaited<ReturnType<typeof getPublishedEdition>>>

/** Édition publiée (au plus une, règle applicative), ou `null`. */
export function getPublishedEdition() {
  return prisma.salmEdition.findFirst({
    where: { status: 'published' },
    orderBy: { year: 'desc' },
    select: editionCoreSelect,
  })
}

export function getEditionCoreById(id: number) {
  return prisma.salmEdition.findUnique({ where: { id }, select: editionCoreSelect })
}

/** Édition précédente : la plus récente d'année inférieure, quel que soit son statut (FR-006). */
export function getPreviousEdition(year: number) {
  return prisma.salmEdition.findFirst({
    where: { year: { lt: year } },
    orderBy: { year: 'desc' },
    select: {
      year: true,
      recapVideoUrl: true,
      recapPosterPath: true,
      videos: {
        select: { youtubeUrl: true, title: true, guest: true, institution: true, thumbnailPath: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
      photos: {
        select: { imagePath: true, originalPath: true, alt: true, caption: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
  })
}

function instant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00Z`)
}

/** Dates dérivées des jours (UTC = heure d'Abidjan). */
export function getEditionTimeline(days: DayTimes[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) {
    return { opensAt: null, endsAt: null, retentionDeadline: null, hoursLabel: null }
  }
  const opensAt = instant(first.date, first.opensAt)
  const endsAt = instant(last.date, last.closesAt)
  const retentionDeadline = new Date(endsAt)
  retentionDeadline.setUTCFullYear(retentionDeadline.getUTCFullYear() + 1)
  const minOpen = sorted.map((d) => d.opensAt).sort()[0]!
  const maxClose = sorted.map((d) => d.closesAt).sort().at(-1)!
  return { opensAt, endsAt, retentionDeadline, hoursLabel: `${formatHour(minOpen)} – ${formatHour(maxClose)}` }
}

export function toPublicTimeline(days: DayTimes[]): SalmTimeline {
  const t = getEditionTimeline(days)
  return {
    opensAtIso: t.opensAt?.toISOString() ?? null,
    endsAtIso: t.endsAt?.toISOString() ?? null,
    hoursLabel: t.hoursLabel,
  }
}

/** Le salon est terminé (ou n'a pas de jours). */
export function isEditionEnded(days: DayTimes[], now = new Date()): boolean {
  const { endsAt } = getEditionTimeline(days)
  return !endsAt || now >= endsAt
}

/** Inscriptions ouvertes au sens effectif : interrupteur ET avant la fin du dernier jour (FR-053). */
export function isRegistrationOpen(
  edition: { studentRegistrationOpen: boolean; schoolRegistrationOpen: boolean; days: DayTimes[] },
  kind: 'students' | 'schools',
  now = new Date(),
): boolean {
  const toggle = kind === 'students' ? edition.studentRegistrationOpen : edition.schoolRegistrationOpen
  return toggle && !isEditionEnded(edition.days, now)
}

export function asContacts(value: unknown): SalmContact[] {
  return Array.isArray(value) ? (value as SalmContact[]) : []
}

export function asAudiences(value: unknown): SalmAudience[] {
  return Array.isArray(value) ? (value as SalmAudience[]) : []
}

/** Contenu complet de l'édition publiée pour `GET /api/salm/edition`. */
export function getPublicEditionPayload(): Promise<SalmEditionResponse> {
  return loadEditionPayload({ status: 'published' })
}

/**
 * Contenu public d'une édition : l'édition publiée (`GET /api/salm/edition`) ou n'importe quelle
 * édition pour l'aperçu du back-office (`GET /api/admin/salm/editions/:id/preview`, research R6).
 */
export async function loadEditionPayload(where: Prisma.SalmEditionWhereInput): Promise<SalmEditionResponse> {
  const edition = await prisma.salmEdition.findFirst({
    where,
    orderBy: { year: 'desc' },
    select: {
      year: true,
      salonName: true,
      tagline: true,
      city: true,
      venue: true,
      organizerName: true,
      whyTitle: true,
      whyText: true,
      audiences: true,
      contacts: true,
      posterPath: true,
      posterAlt: true,
      programPdfPath: true,
      studentRegistrationOpen: true,
      schoolRegistrationOpen: true,
      days: {
        select: {
          date: true,
          label: true,
          opensAt: true,
          closesAt: true,
          slots: {
            select: {
              startTime: true,
              endTime: true,
              title: true,
              description: true,
              kind: true,
              isHighlighted: true,
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          },
        },
        orderBy: dayOrder,
      },
      highlights: {
        select: { title: true, imagePath: true, imageAlt: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
      standTypes: {
        where: { isVisible: true },
        select: { id: true, name: true, description: true, priceLabel: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
  })

  const [keyFigures, partners] = await Promise.all([getKeyFigures(), getSalmPartners()])
  if (!edition) return { edition: null, previous: null, keyFigures, partners }

  const previous = await getPreviousEdition(edition.year)
  return { edition: serializePublicEdition(edition), previous: serializePreviousEdition(previous), keyFigures, partners }
}

/** Partenaires du SALM, toutes éditions confondues, dans l'ordre du back-office. */
export function getSalmPartners(): Promise<SalmPartner[]> {
  return prisma.salmPartner.findMany({
    select: { name: true, logoPath: true, url: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })
}

/** Chiffres clés du SALM, toutes éditions confondues, dans l'ordre du back-office. */
export function getKeyFigures(): Promise<SalmKeyFigure[]> {
  return prisma.salmKeyFigure.findMany({
    select: { value: true, label: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })
}

type PublicEditionRow = {
  year: number
  salonName: string
  tagline: string | null
  city: string
  venue: string | null
  organizerName: string
  whyTitle: string | null
  whyText: string | null
  audiences: unknown
  contacts: unknown
  posterPath: string | null
  posterAlt: string | null
  programPdfPath: string | null
  studentRegistrationOpen: boolean
  schoolRegistrationOpen: boolean
  days: SalmPublicEdition['days']
  highlights: SalmPublicEdition['highlights']
  standTypes: SalmPublicEdition['standTypes']
}

export function serializePublicEdition(edition: PublicEditionRow, now = new Date()): SalmPublicEdition {
  return {
    year: edition.year,
    salonName: edition.salonName,
    tagline: edition.tagline,
    city: edition.city,
    venue: edition.venue,
    organizerName: edition.organizerName,
    whyTitle: edition.whyTitle,
    whyText: edition.whyText,
    audiences: asAudiences(edition.audiences),
    contacts: asContacts(edition.contacts),
    poster: edition.posterPath ? { path: edition.posterPath, alt: edition.posterAlt } : null,
    programPdfPath: edition.programPdfPath,
    days: edition.days,
    highlights: edition.highlights,
    standTypes: edition.standTypes,
    registration: {
      students: { open: isRegistrationOpen(edition, 'students', now) },
      schools: { open: isRegistrationOpen(edition, 'schools', now) },
    },
    timeline: toPublicTimeline(edition.days),
  }
}

export function serializePreviousEdition(
  previous: Awaited<ReturnType<typeof getPreviousEdition>>,
): SalmPreviousEdition | null {
  if (!previous) return null
  const recapId = parseYoutubeId(previous.recapVideoUrl)
  return {
    year: previous.year,
    recapVideo: recapId ? { youtubeId: recapId, posterPath: previous.recapPosterPath } : null,
    recapPosterPath: previous.recapPosterPath,
    videos: previous.videos.flatMap((v) => {
      const youtubeId = parseYoutubeId(v.youtubeUrl)
      if (!youtubeId) return []
      return [{
        youtubeId,
        title: v.title,
        guest: v.guest,
        institution: v.institution,
        thumbnailUrl: v.thumbnailPath ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      }]
    }),
    photos: previous.photos,
  }
}
