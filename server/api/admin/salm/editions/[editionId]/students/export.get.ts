import { defineEventHandler, setResponseHeaders } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { csvDateTime, csvFileDate, toCsv } from '../../../../../../utils/csv'
import { adminError, parseIdParam, studentOrderBy, studentWhere } from '../../../../../../utils/salm-admin'
import { formatIvorianPhone } from '#shared/utils/phone'
import { formatBadgeNumber } from '#shared/utils/salm'

// Export CSV des étudiant·e·s, mêmes filtres que la liste (FR-063).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await prisma.salmEdition.findUnique({ where: { id: editionId }, select: { year: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  const rows = await prisma.salmStudentRegistration.findMany({
    where: studentWhere(event, editionId),
    orderBy: studentOrderBy(event),
    select: { badgeSeq: true, fullName: true, phone: true, studyLevel: true, createdAt: true },
  })

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="salm-${edition.year}-etudiants-${csvFileDate()}.csv"`,
    'Cache-Control': 'private, no-store',
  })
  return toCsv(
    ['N° de badge', 'Nom & prénoms', 'Téléphone', 'Niveau d\'étude', 'Date d\'inscription'],
    rows.map((r) => [
      formatBadgeNumber(edition.year, r.badgeSeq),
      r.fullName,
      formatIvorianPhone(r.phone),
      r.studyLevel,
      csvDateTime(r.createdAt),
    ]),
  )
})
