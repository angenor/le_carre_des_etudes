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

  const downloads = await prisma.download.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, magazineId: true, studyLevel: true },
  })

  // Agrégation par jour/mois
  const countsByDate = new Map<string, number>()
  for (const dl of downloads) {
    const key = formatDateKey(dl.createdAt, period)
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1)
  }

  const labels = generateLabels(startDate, period)
  const data = labels.map((label) => countsByDate.get(label) || 0)

  // Répartition par magazine
  const magazineCounts = new Map<number, number>()
  for (const dl of downloads) {
    magazineCounts.set(dl.magazineId, (magazineCounts.get(dl.magazineId) || 0) + 1)
  }

  const magazines = await prisma.magazine.findMany({
    where: { id: { in: Array.from(magazineCounts.keys()) } },
    select: { id: true, name: true },
  })

  const byMagazine = magazines.map((m) => ({
    name: m.name,
    count: magazineCounts.get(m.id) || 0,
  })).sort((a, b) => b.count - a.count)

  // Répartition par niveau d'étude
  const levelCounts = new Map<string, number>()
  for (const dl of downloads) {
    if (dl.studyLevel) {
      levelCounts.set(dl.studyLevel, (levelCounts.get(dl.studyLevel) || 0) + 1)
    }
  }

  const byStudyLevel = Array.from(levelCounts.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count)

  return {
    labels,
    datasets: [
      {
        label: 'Téléchargements',
        data,
      },
    ],
    byMagazine,
    byStudyLevel,
  }
})
