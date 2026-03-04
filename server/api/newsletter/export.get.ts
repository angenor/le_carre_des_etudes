import { defineEventHandler, setHeaders } from 'h3'
import { prisma } from '../../utils/prisma'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return `"${value}"`
}

export default defineEventHandler(async (event) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const today = new Date().toISOString().slice(0, 10)

  setHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="newsletter-${today}.csv"`,
  })

  const header = '"Email","Date d\'inscription"'
  const rows = subscribers.map((s) => {
    const date = s.createdAt.toISOString().slice(0, 10)
    return [escapeCsv(s.email), escapeCsv(date)].join(',')
  })

  return '\uFEFF' + header + '\n' + rows.join('\n')
})
