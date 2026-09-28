import { defineEventHandler, setResponseHeaders } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { csvFileDate, toCsv } from '../../../../../../utils/csv'
import { adminError, exhibitorsOf, parseIdParam } from '../../../../../../utils/salm-admin'
import { formatIvorianPhone } from '#shared/utils/phone'

// « Liste des exposants » pour le pointage à l'accueil (FR-068a) : inscriptions annulées exclues.
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await prisma.salmEdition.findUnique({ where: { id: editionId }, select: { year: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  const schools = await prisma.salmSchoolRegistration.findMany({
    where: { editionId, status: { not: 'annulee' } },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: { name: true, exhibitors: true, standType: { select: { name: true } } },
  })

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="salm-${edition.year}-exposants-${csvFileDate()}.csv"`,
    'Cache-Control': 'private, no-store',
  })
  return toCsv(
    ['Établissement', 'Stand', 'Nom & prénoms', 'Contact'],
    schools.flatMap((s) =>
      exhibitorsOf(s.exhibitors).map((e) => [s.name, s.standType.name, e.fullName, formatIvorianPhone(e.contact)]),
    ),
  )
})
