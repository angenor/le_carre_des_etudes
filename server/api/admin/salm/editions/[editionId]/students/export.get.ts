import { defineEventHandler, setResponseHeaders } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { csvDateTime, csvFileDate, toCsv } from '../../../../../../utils/csv'
import { adminError, parseIdParam, studentOrderBy, studentWhere } from '../../../../../../utils/salm-admin'
import { formatIvorianPhone } from '#shared/utils/phone'
import { formatBadgeNumber } from '#shared/utils/salm'

// Export CSV des étudiant·e·s, mêmes filtres que la liste (FR-063), avec la présence par jour (008, FR-227).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await prisma.salmEdition.findUnique({
    where: { id: editionId },
    select: {
      year: true,
      days: { select: { id: true, label: true, date: true }, orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }] },
    },
  })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  const rows = await prisma.salmStudentRegistration.findMany({
    where: studentWhere(event, editionId, edition.days.map((d) => d.id)),
    orderBy: studentOrderBy(event),
    select: {
      badgeSeq: true,
      fullName: true,
      phone: true,
      studyLevel: true,
      createdAt: true,
      origin: true,
      entries: { select: { dayId: true } },
    },
  })

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="salm-${edition.year}-etudiants-${csvFileDate()}.csv"`,
    'Cache-Control': 'private, no-store',
  })
  // Une colonne par jour de salon, même sans aucune entrée (US3-6)
  const dayHeaders = edition.days.map((d) => `Présent ${d.label} (${d.date.split('-').reverse().join('/')})`)
  return toCsv(
    ['N° de badge', 'Nom & prénoms', 'Téléphone', 'Niveau d\'étude', 'Date d\'inscription', 'Origine', ...dayHeaders],
    rows.map((r) => [
      formatBadgeNumber(edition.year, r.badgeSeq),
      r.fullName,
      formatIvorianPhone(r.phone),
      r.studyLevel,
      csvDateTime(r.createdAt),
      r.origin === 'onsite' ? 'Sur place' : 'En ligne',
      ...edition.days.map((d) => (r.entries.some((e) => e.dayId === d.id) ? 'Oui' : 'Non')),
    ]),
  )
})
