import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const magazines = await prisma.magazine.findMany({
    orderBy: { publishedAt: 'desc' },
  })
  return magazines
})
