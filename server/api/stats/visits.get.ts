import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'

type Period = '7d' | '30d' | '90d' | '12m'

function getStartDate(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    case '30d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    case '90d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)
    case '12m':
      return new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
  }
}

function formatDateKey(date: Date, period: Period): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  if (period === '12m') return `${y}-${m}`
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function generateLabels(start: Date, period: Period): string[] {
  const labels: string[] = []
  const now = new Date()

  if (period === '12m') {
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 1)
    while (current <= end) {
      labels.push(formatDateKey(current, period))
      current.setMonth(current.getMonth() + 1)
    }
  } else {
    const current = new Date(start)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    while (current <= today) {
      labels.push(formatDateKey(current, period))
      current.setDate(current.getDate() + 1)
    }
  }

  return labels
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = (['7d', '30d', '90d', '12m'].includes(query.period as string)
    ? query.period
    : '30d') as Period

  const startDate = getStartDate(period)

  const visits = await prisma.pageVisit.findMany({
    where: { visitedAt: { gte: startDate } },
    select: { visitedAt: true, visitorId: true },
  })

  const countsByDate = new Map<string, number>()
  const uniqueByDate = new Map<string, Set<string>>()

  for (const v of visits) {
    const key = formatDateKey(v.visitedAt, period)
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1)

    if (v.visitorId) {
      if (!uniqueByDate.has(key)) uniqueByDate.set(key, new Set())
      uniqueByDate.get(key)!.add(v.visitorId)
    }
  }

  const labels = generateLabels(startDate, period)
  const pageViews = labels.map((label) => countsByDate.get(label) || 0)
  const uniqueVisitors = labels.map((label) => uniqueByDate.get(label)?.size || 0)

  return {
    labels,
    datasets: [
      {
        label: 'Pages vues',
        data: pageViews,
      },
      {
        label: 'Visiteurs uniques',
        data: uniqueVisitors,
      },
    ],
  }
})
