import { defineEventHandler, setResponseHeaders } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { csvDateTime, csvFileDate, toCsv } from '../../../../../../utils/csv'
import {
  adminError,
  exhibitorsOf,
  parseIdParam,
  programmesOf,
  schoolOrderBy,
  schoolWhere,
} from '../../../../../../utils/salm-admin'
import { formatIvorianPhone } from '#shared/utils/phone'
import { programmeLabel, schoolStatusLabel } from '#shared/utils/salm'

// Export CSV des établissements, mêmes filtres que la liste (FR-068).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await prisma.salmEdition.findUnique({ where: { id: editionId }, select: { year: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  const rows = await prisma.salmSchoolRegistration.findMany({
    where: schoolWhere(event, editionId),
    orderBy: schoolOrderBy(event),
    select: {
      name: true,
      phone: true,
      email: true,
      programmes: true,
      otherProgramme: true,
      exhibitors: true,
      status: true,
      internalNote: true,
      question: true,
      createdAt: true,
      standType: { select: { name: true } },
    },
  })

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="salm-${edition.year}-etablissements-${csvFileDate()}.csv"`,
    'Cache-Control': 'private, no-store',
  })
  return toCsv(
    [
      'Établissement', 'Téléphone', 'E-mail', 'Programmes', 'Précision « Autre »', 'Stand',
      'Nombre d\'exposants', 'Exposants', 'Statut', 'Note interne', 'Question', 'Date d\'inscription',
    ],
    rows.map((r) => {
      const exhibitors = exhibitorsOf(r.exhibitors)
      return [
        r.name,
        formatIvorianPhone(r.phone),
        r.email,
        programmesOf(r.programmes).map(programmeLabel).join(' · '),
        r.otherProgramme,
        r.standType.name,
        exhibitors.length,
        exhibitors.map((e) => `${e.fullName} (${formatIvorianPhone(e.contact)})`).join(' | '),
        schoolStatusLabel(r.status),
        r.internalNote,
        r.question,
        csvDateTime(r.createdAt),
      ]
    }),
  )
})
