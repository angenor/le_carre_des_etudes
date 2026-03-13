import { defineEventHandler, setHeaders } from 'h3'
import { prisma } from '../../utils/prisma'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return `"${value}"`
}

export default defineEventHandler(async (event) => {
  const downloads = await prisma.download.findMany({
    include: { magazine: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const today = new Date().toISOString().slice(0, 10)

  setHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="telechargements-${today}.csv"`,
  })

  const header = '"Nom complet","Contact","Niveau d\'étude","Magazine","Date"'
  const rows = downloads.map((dl) => {
    const date = dl.createdAt.toISOString().slice(0, 10)
    return [
      escapeCsv(dl.fullName),
      escapeCsv(dl.contact),
      escapeCsv(dl.studyLevel),
      escapeCsv(dl.magazine.name),
      escapeCsv(date),
    ].join(',')
  })

  return '\uFEFF' + header + '\n' + rows.join('\n')
})
