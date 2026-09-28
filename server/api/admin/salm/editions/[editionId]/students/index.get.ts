import { defineEventHandler } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { adminError, parseIdParam, parsePagination, studentOrderBy, studentWhere } from '../../../../../../utils/salm-admin'
import { getDayCounters } from '../../../../../../utils/salm-control'
import { formatIvorianPhone } from '#shared/utils/phone'
import { formatBadgeNumber } from '#shared/utils/salm'

// Liste des étudiant·e·s inscrit·e·s (FR-062), avec les entrées par jour de salon (008, FR-225, FR-226).
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

  const { page, limit, skip } = parsePagination(event)
  const where = studentWhere(event, editionId, edition.days.map((d) => d.id))
  const [rows, total, grandTotal, counters] = await Promise.all([
    prisma.salmStudentRegistration.findMany({
      where,
      orderBy: studentOrderBy(event),
      skip,
      take: limit,
      select: {
        id: true,
        badgeSeq: true,
        fullName: true,
        phone: true,
        studyLevel: true,
        createdAt: true,
        origin: true,
        entries: { select: { dayId: true, enteredAt: true } },
      },
    }),
    prisma.salmStudentRegistration.count({ where }),
    prisma.salmStudentRegistration.count({ where: { editionId } }),
    // Toutes les entrées du jour, indépendamment des filtres
    getDayCounters(edition.days),
  ])

  return {
    data: rows.map((r) => ({
      id: r.id,
      badgeNumber: formatBadgeNumber(edition.year, r.badgeSeq),
      fullName: r.fullName,
      phone: formatIvorianPhone(r.phone),
      studyLevel: r.studyLevel,
      createdAt: r.createdAt.toISOString(),
      origin: r.origin,
      entries: Object.fromEntries(r.entries.map((e) => [String(e.dayId), e.enteredAt.toISOString()])),
    })),
    total,
    page,
    limit,
    grandTotal,
    days: edition.days.map((d) => ({ ...d, entries: counters.find((c) => c.dayId === d.id)?.entries ?? 0 })),
  }
})
