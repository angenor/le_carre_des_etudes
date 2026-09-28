import { defineEventHandler } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import {
  adminError,
  exhibitorsOf,
  parseIdParam,
  parsePagination,
  schoolOrderBy,
  schoolWhere,
} from '../../../../../../utils/salm-admin'
import { SCHOOL_STATUSES } from '#shared/utils/salm'

// Liste des établissements inscrits, avec compteurs par statut (FR-066).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await prisma.salmEdition.findUnique({ where: { id: editionId }, select: { id: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  const { page, limit, skip } = parsePagination(event)
  const where = schoolWhere(event, editionId)
  const [rows, total, byStatus] = await Promise.all([
    prisma.salmSchoolRegistration.findMany({
      where,
      orderBy: schoolOrderBy(event),
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        exhibitors: true,
        status: true,
        internalNote: true,
        createdAt: true,
        standType: { select: { name: true } },
      },
    }),
    prisma.salmSchoolRegistration.count({ where }),
    prisma.salmSchoolRegistration.groupBy({ by: ['status'], where: { editionId }, _count: { _all: true } }),
  ])

  const countsByStatus = Object.fromEntries(SCHOOL_STATUSES.map((s) => [s, 0])) as Record<string, number>
  for (const s of byStatus) countsByStatus[s.status] = s._count._all

  return {
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      standName: r.standType.name,
      exhibitorCount: exhibitorsOf(r.exhibitors).length,
      status: r.status,
      hasNote: !!r.internalNote,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    countsByStatus,
  }
})
