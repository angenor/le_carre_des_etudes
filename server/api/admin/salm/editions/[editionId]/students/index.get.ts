import { defineEventHandler } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { adminError, parseIdParam, parsePagination, studentOrderBy, studentWhere } from '../../../../../../utils/salm-admin'
import { formatIvorianPhone } from '#shared/utils/phone'
import { formatBadgeNumber } from '#shared/utils/salm'

// Liste des étudiant·e·s inscrit·e·s (FR-062).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await prisma.salmEdition.findUnique({ where: { id: editionId }, select: { year: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  const { page, limit, skip } = parsePagination(event)
  const where = studentWhere(event, editionId)
  const [rows, total, grandTotal] = await Promise.all([
    prisma.salmStudentRegistration.findMany({
      where,
      orderBy: studentOrderBy(event),
      skip,
      take: limit,
      select: { id: true, badgeSeq: true, fullName: true, phone: true, studyLevel: true, createdAt: true },
    }),
    prisma.salmStudentRegistration.count({ where }),
    prisma.salmStudentRegistration.count({ where: { editionId } }),
  ])

  return {
    data: rows.map((r) => ({
      id: r.id,
      badgeNumber: formatBadgeNumber(edition.year, r.badgeSeq),
      fullName: r.fullName,
      phone: formatIvorianPhone(r.phone),
      studyLevel: r.studyLevel,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    grandTotal,
  }
})
