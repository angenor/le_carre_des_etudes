import { prisma } from './prisma'
import { adminError } from './salm-admin'
import { editionFlags, isUniqueViolation, yearTaken } from './salm-content'
import { isEditionEnded } from './salm-edition'
import { releaseSalmFiles } from './salm-files'
import type { Prisma } from '../../app/generated/prisma/client'

// Transitions de statut, suppression et duplication des éditions SALM
// (specs/007-salm-admin-contenus, research R4 et R5, data-model § 2).
// Aucune transition ne modifie les interrupteurs d'inscription, les inscriptions ni `lastBadgeSeq` (FR-118).

const STATUSES = ['draft', 'published', 'archived']

function notFound() {
  return adminError(404, 'NOT_FOUND')
}

/**
 * Publie une édition et archive, dans la même transaction, celle qui était publiée : une seule édition
 * publiée à la fois (FR-115). SQLite n'ayant qu'un écrivain, deux publications simultanées sont sérialisées.
 */
export function publishEdition(id: number) {
  return prisma.$transaction(async (tx) => {
    const edition = await tx.salmEdition.findUnique({
      where: { id },
      select: { id: true, year: true, status: true, days: { select: { date: true, opensAt: true, closesAt: true } } },
    })
    if (!edition) throw notFound()
    if (!STATUSES.includes(edition.status)) throw adminError(409, 'INVALID_TRANSITION')
    if (!edition.days.length) throw adminError(409, 'NO_DAYS')
    if (edition.status === 'archived' && isEditionEnded(edition.days)) throw adminError(409, 'EDITION_ENDED')
    if (edition.status === 'published') return { published: { id, year: edition.year }, archived: [] }

    const archived = await tx.salmEdition.findMany({
      where: { status: 'published', id: { not: id } },
      select: { id: true, year: true },
    })
    await tx.salmEdition.updateMany({ where: { status: 'published', id: { not: id } }, data: { status: 'archived' } })
    await tx.salmEdition.update({ where: { id }, data: { status: 'published' } })
    return { published: { id, year: edition.year }, archived }
  })
}

export async function archiveEdition(id: number) {
  const edition = await prisma.salmEdition.findUnique({ where: { id }, select: { year: true, status: true } })
  if (!edition) throw notFound()
  if (edition.status === 'archived') throw adminError(409, 'ALREADY_ARCHIVED')
  if (!STATUSES.includes(edition.status)) throw adminError(409, 'INVALID_TRANSITION')
  await prisma.salmEdition.update({ where: { id }, data: { status: 'archived' } })
  return { id, year: edition.year, status: 'archived', wasPublished: edition.status === 'published' }
}

/** Supprime un brouillon qui n'a jamais reçu d'inscription (FR-119), puis libère ses fichiers. */
export async function deleteDraftEdition(id: number) {
  const edition = await prisma.salmEdition.findUnique({
    where: { id },
    select: {
      status: true,
      lastBadgeSeq: true,
      personalDataPurgedAt: true,
      posterPath: true,
      recapPosterPath: true,
      programPdfPath: true,
      days: { select: { date: true, opensAt: true, closesAt: true } },
      highlights: { select: { imagePath: true } },
      photos: { select: { imagePath: true } },
      videos: { select: { thumbnailPath: true } },
      _count: { select: { studentRegistrations: true, schoolRegistrations: true } },
    },
  })
  if (!edition) throw notFound()
  const counts = { students: edition._count.studentRegistrations, schools: edition._count.schoolRegistrations }
  if (!editionFlags(edition, counts).canDelete) throw adminError(409, 'EDITION_NOT_DELETABLE')

  const paths = [
    edition.posterPath,
    edition.recapPosterPath,
    edition.programPdfPath,
    ...edition.highlights.map((h) => h.imagePath),
    ...edition.photos.map((p) => p.imagePath),
    ...edition.videos.map((v) => v.thumbnailPath),
  ]
  await prisma.salmEdition.delete({ where: { id } })
  await releaseSalmFiles(paths)
}

/** `2027-03-12` → `2028-03-10` : + 364 jours en UTC, même jour de la semaine (FR-182). */
function shiftDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return new Date(d.getTime() + 364 * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Crée l'édition N + 1 en brouillon à partir de l'édition N, par une seule écriture imbriquée (atomique) :
 * textes, contacts, publics, jours (+ 364 jours) et créneaux, temps forts (fichiers partagés), types de stands.
 * Jamais le lieu, l'affiche, le PDF, les médias ni les inscriptions (FR-180 à FR-184, research R5).
 */
export async function duplicateEdition(sourceId: number) {
  const source = await prisma.salmEdition.findUnique({
    where: { id: sourceId },
    select: {
      year: true,
      salonName: true,
      organizerName: true,
      city: true,
      tagline: true,
      whyTitle: true,
      whyText: true,
      audiences: true,
      contacts: true,
      days: {
        orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }],
        select: {
          date: true,
          label: true,
          opensAt: true,
          closesAt: true,
          sortOrder: true,
          slots: {
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            select: { startTime: true, endTime: true, title: true, description: true, kind: true, isHighlighted: true, sortOrder: true },
          },
        },
      },
      highlights: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { title: true, imagePath: true, imageAlt: true, sortOrder: true },
      },
      standTypes: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { name: true, description: true, priceLabel: true, isVisible: true, sortOrder: true },
      },
    },
  })
  if (!source) throw notFound()
  const year = source.year + 1
  if (await prisma.salmEdition.findUnique({ where: { year }, select: { id: true } })) throw yearTaken(year)

  let created: { id: number }
  try {
    created = await prisma.salmEdition.create({
      data: {
        year,
        status: 'draft',
        salonName: source.salonName,
        organizerName: source.organizerName,
        city: source.city,
        tagline: source.tagline,
        whyTitle: source.whyTitle,
        whyText: source.whyText,
        audiences: source.audiences as Prisma.InputJsonValue,
        contacts: source.contacts as Prisma.InputJsonValue,
        days: {
          create: source.days.map(({ slots, date, ...day }) => ({
            ...day,
            date: shiftDate(date),
            slots: { create: slots },
          })),
        },
        highlights: { create: source.highlights },
        standTypes: { create: source.standTypes },
      },
      select: { id: true },
    })
  }
  catch (err) {
    if (isUniqueViolation(err)) throw yearTaken(year)
    throw err
  }

  return {
    id: created.id,
    year,
    copied: {
      days: source.days.length,
      slots: source.days.reduce((n, d) => n + d.slots.length, 0),
      highlights: source.highlights.length,
      standTypes: source.standTypes.length,
      contacts: Array.isArray(source.contacts) ? source.contacts.length : 0,
    },
  }
}
