import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const magazine = await prisma.magazine.findFirst({
    where: { isFeatured: true },
  })

  return magazine ?? null
})
