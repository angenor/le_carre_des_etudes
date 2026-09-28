import { prisma } from './prisma'
import { adminError } from './salm-admin'
import { getEditionTimeline } from './salm-edition'
import { computePurgedStats } from './salm-purge'
import type { SalmAdminStats, SalmAdminStatsBlock, SalmAdminSummary, SalmPurgedStats } from '#shared/types/salm'

// Statistiques SALM (specs/007-salm-admin-contenus, research R11, FR-190 à FR-197a).
// Chiffres en direct par `computePurgedStats`, ou compteurs conservés après la purge : même forme,
// donc des définitions identiques pour la comparaison. Aucune donnée personnelle dans les sorties (FR-196).

const statsSelect = {
  id: true,
  year: true,
  personalDataPurgedAt: true,
  purgedStats: true,
  days: { select: { date: true, opensAt: true, closesAt: true } },
} as const

type StatsEdition = {
  id: number
  personalDataPurgedAt: Date | null
  purgedStats: unknown
  days: { date: string; opensAt: string; closesAt: string }[]
}

/** Édition de comparaison : la plus récente d'année inférieure ayant des inscriptions ou des compteurs conservés (FR-193). */
export async function findComparisonEdition(year: number) {
  const candidates = await prisma.salmEdition.findMany({
    where: { year: { lt: year } },
    orderBy: { year: 'desc' },
    select: { ...statsSelect, _count: { select: { studentRegistrations: true, schoolRegistrations: true } } },
  })
  return candidates.find((e) => e._count.studentRegistrations + e._count.schoolRegistrations > 0 || e.purgedStats !== null) ?? null
}

export async function editionStatsBlock(edition: StatsEdition): Promise<SalmAdminStatsBlock & { opensAtIso: string | null }> {
  const purged = !!edition.personalDataPurgedAt && edition.purgedStats !== null
  return {
    source: purged ? 'purged' : 'live',
    purgedAt: purged ? edition.personalDataPurgedAt!.toISOString() : null,
    stats: purged ? (edition.purgedStats as SalmPurgedStats) : await computePurgedStats(prisma, edition.id),
    opensAtIso: getEditionTimeline(edition.days).opensAt?.toISOString() ?? null,
  }
}

export async function getEditionStats(editionId: number): Promise<SalmAdminStats> {
  const edition = await prisma.salmEdition.findUnique({
    where: { id: editionId },
    select: {
      ...statsSelect,
      standTypes: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { name: true, isVisible: true } },
    },
  })
  if (!edition) throw adminError(404, 'NOT_FOUND')

  const [block, comparisonEdition] = await Promise.all([editionStatsBlock(edition), findComparisonEdition(edition.year)])
  const { opensAtIso, ...current } = block
  const comparison = comparisonEdition ? await editionStatsBlock(comparisonEdition) : null

  return {
    edition: { id: edition.id, year: edition.year, opensAtIso },
    ...current,
    standTypes: edition.standTypes,
    comparison: comparison && comparisonEdition ? { year: comparisonEdition.year, ...comparison } : null,
  }
}

/** Totaux d'une édition : compteurs conservés si elle a été purgée, sinon deux `count`. */
async function totals(edition: { id: number; personalDataPurgedAt: Date | null; purgedStats: unknown }) {
  if (edition.personalDataPurgedAt && edition.purgedStats) {
    const stats = edition.purgedStats as SalmPurgedStats
    return { students: stats.students.total, schools: stats.schools.total }
  }
  const [students, schools] = await Promise.all([
    prisma.salmStudentRegistration.count({ where: { editionId: edition.id } }),
    prisma.salmSchoolRegistration.count({ where: { editionId: edition.id } }),
  ])
  return { students, schools }
}

/** Encart du tableau de bord : `null` sans édition publiée (FR-197a). */
export async function getDashboardSummary(): Promise<SalmAdminSummary> {
  const published = await prisma.salmEdition.findFirst({
    where: { status: 'published' },
    orderBy: { year: 'desc' },
    select: { id: true, year: true, personalDataPurgedAt: true, purgedStats: true },
  })
  if (!published) return null
  const comparisonEdition = await findComparisonEdition(published.year)
  return {
    year: published.year,
    ...(await totals(published)),
    comparison: comparisonEdition ? { year: comparisonEdition.year, ...(await totals(comparisonEdition)) } : null,
  }
}
