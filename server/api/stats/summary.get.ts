import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const [totalDownloads, totalVisits, totalSubscribers, totalMagazines, uniqueVisitorRows] = await Promise.all([
    prisma.download.count(),
    prisma.pageVisit.count(),
    prisma.newsletterSubscriber.count(),
    prisma.magazine.count(),
    prisma.pageVisit.findMany({
      where: { visitorId: { not: null } },
      distinct: ['visitorId'],
      select: { visitorId: true },
    }),
  ])

  return {
    totalDownloads,
    totalVisits,
    uniqueVisitors: uniqueVisitorRows.length,
    totalSubscribers,
    totalMagazines,
  }
})
