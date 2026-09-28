import { createError } from 'h3'
import { prisma } from './prisma'
import { getEditionTimeline } from './salm-edition'
import type { SalmPurgedStats } from '#shared/types/salm'

// Suppression des données personnelles d'une édition archivée (FR-065b, research R16).

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

function conflict(code: string) {
  return createError({ statusCode: 409, message: code, data: { code } })
}

/** Compteurs agrégés anonymes, calculés juste avant la suppression. */
export async function computePurgedStats(tx: Tx, editionId: number): Promise<SalmPurgedStats> {
  const [byLevel, students, byStatus, byStand, schools] = await Promise.all([
    tx.salmStudentRegistration.groupBy({ by: ['studyLevel'], where: { editionId }, _count: { _all: true } }),
    tx.salmStudentRegistration.findMany({ where: { editionId }, select: { createdAt: true } }),
    tx.salmSchoolRegistration.groupBy({ by: ['status'], where: { editionId }, _count: { _all: true } }),
    tx.salmSchoolRegistration.groupBy({ by: ['standTypeId'], where: { editionId }, _count: { _all: true } }),
    tx.salmSchoolRegistration.findMany({ where: { editionId }, select: { exhibitors: true } }),
  ])
  const standNames = await tx.salmStandType.findMany({
    where: { id: { in: byStand.map((s) => s.standTypeId) } },
    select: { id: true, name: true },
  })

  const byRegistrationDay: Record<string, number> = {}
  for (const s of students) {
    const day = s.createdAt.toISOString().slice(0, 10)
    byRegistrationDay[day] = (byRegistrationDay[day] ?? 0) + 1
  }
  const statusCounts: Record<string, number> = { nouvelle: 0, contactee: 0, confirmee: 0, annulee: 0 }
  for (const s of byStatus) statusCounts[s.status] = s._count._all

  return {
    computedAt: new Date().toISOString(),
    students: {
      total: students.length,
      byStudyLevel: Object.fromEntries(byLevel.map((l) => [l.studyLevel, l._count._all])),
      byRegistrationDay,
    },
    schools: {
      total: schools.length,
      byStandType: Object.fromEntries(
        byStand.map((s) => [standNames.find((n) => n.id === s.standTypeId)?.name ?? String(s.standTypeId), s._count._all]),
      ),
      byStatus: statusCounts,
      exhibitors: schools.reduce((n, s) => n + (Array.isArray(s.exhibitors) ? s.exhibitors.length : 0), 0),
    },
  }
}

/**
 * Une seule transaction : contrôles d'éligibilité, compteurs, suppression des inscriptions,
 * puis `personalDataPurgedAt` et `purgedStats`. `lastBadgeSeq` n'est jamais modifié.
 */
export function purgeEditionPersonalData(editionId: number) {
  return prisma.$transaction(async (tx) => {
    const edition = await tx.salmEdition.findUnique({
      where: { id: editionId },
      select: {
        status: true,
        personalDataPurgedAt: true,
        days: { select: { date: true, opensAt: true, closesAt: true } },
      },
    })
    if (!edition) throw createError({ statusCode: 404, message: 'NOT_FOUND', data: { code: 'NOT_FOUND' } })
    if (edition.status !== 'archived') throw conflict('EDITION_NOT_ARCHIVED')
    const { endsAt } = getEditionTimeline(edition.days)
    // Sans jours, la fin du salon est inconnue : suppression refusée
    if (!endsAt || new Date() < endsAt) throw conflict('EDITION_NOT_ENDED')
    if (edition.personalDataPurgedAt) throw conflict('ALREADY_PURGED')

    const purgedStats = await computePurgedStats(tx, editionId)
    const students = await tx.salmStudentRegistration.deleteMany({ where: { editionId } })
    const schools = await tx.salmSchoolRegistration.deleteMany({ where: { editionId } })
    const purgedAt = new Date()
    await tx.salmEdition.update({
      where: { id: editionId },
      data: { personalDataPurgedAt: purgedAt, purgedStats },
    })
    return { purgedAt: purgedAt.toISOString(), deleted: { students: students.count, schools: schools.count }, purgedStats }
  })
}
