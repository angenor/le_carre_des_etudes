import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))

  const [data, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newsletterSubscriber.count(),
  ])

  return { data, total, page, limit }
})
