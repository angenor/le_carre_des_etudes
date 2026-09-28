import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { editionFlags } from '../../../../utils/salm-content'
import { getEditionTimeline, isEditionEnded } from '../../../../utils/salm-edition'
import type { SalmAdminEditionListItem, SalmAdminEditionsResponse, SalmPurgedStats } from '#shared/types/salm'

// Éditions pour le sélecteur et l'en-tête du back-office (FR-061, FR-065a, FR-069),
// et pour la liste des éditions (specs/007, FR-110, FR-113, FR-114, FR-119).
export default defineEventHandler(async (): Promise<SalmAdminEditionsResponse> => {
  const editions = await prisma.salmEdition.findMany({
    orderBy: { year: 'desc' },
    select: {
      id: true,
      year: true,
      status: true,
      venue: true,
      city: true,
      lastBadgeSeq: true,
      studentRegistrationOpen: true,
      schoolRegistrationOpen: true,
      personalDataPurgedAt: true,
      purgedStats: true,
      days: { select: { date: true, opensAt: true, closesAt: true } },
      _count: { select: { studentRegistrations: true, schoolRegistrations: true } },
    },
  })
  const now = new Date()

  const data = editions.map((e): SalmAdminEditionListItem => {
    const timeline = getEditionTimeline(e.days)
    const ended = isEditionEnded(e.days, now)
    const counts = { students: e._count.studentRegistrations, schools: e._count.schoolRegistrations }
    const purgedAt = e.personalDataPurgedAt?.toISOString() ?? null
    const dates = e.days.map((d) => d.date).sort()
    const flags = editionFlags(e, counts, now)
    return {
      id: e.id,
      year: e.year,
      status: e.status,
      studentRegistrationOpen: e.studentRegistrationOpen,
      schoolRegistrationOpen: e.schoolRegistrationOpen,
      endsAtIso: timeline.endsAt?.toISOString() ?? null,
      ended,
      counts,
      retention: {
        deadlineIso: timeline.retentionDeadline?.toISOString() ?? null,
        exceeded: !!timeline.retentionDeadline && now > timeline.retentionDeadline && !purgedAt
          && counts.students + counts.schools > 0,
        canPurge: e.status === 'archived' && !!timeline.endsAt && ended && !purgedAt,
        purgedAt,
      },
      purgedStats: (e.purgedStats as SalmPurgedStats | null) ?? null,
      venue: e.venue,
      city: e.city,
      firstDay: dates[0] ?? null,
      lastDay: dates.at(-1) ?? null,
      dayCount: dates.length,
      yearLocked: flags.yearLocked,
      canDelete: flags.canDelete,
      canPublish: flags.canPublish,
    }
  })

  const defaultEditionId = (data.find((e) => e.status === 'published') ?? data[0])?.id ?? null
  return { data, defaultEditionId }
})
