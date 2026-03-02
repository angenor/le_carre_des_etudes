import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const partners = await prisma.partner.findMany({
    orderBy: { order: 'asc' },
  })
  return partners
})
