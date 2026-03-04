import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const [totalDownloads, totalVisits, totalSubscribers, totalMagazines] = await Promise.all([
    prisma.download.count(),
    prisma.pageVisit.count(),
    prisma.newsletterSubscriber.count(),
    prisma.magazine.count(),
  ])

  return {
    totalDownloads,
    totalVisits,
    totalSubscribers,
    totalMagazines,
  }
})
