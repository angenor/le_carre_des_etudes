import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const items = await prisma.contentItem.findMany({
    orderBy: { order: 'asc' },
  })

  const grouped: Record<string, typeof items> = {
    portrait: [],
    parcours_inspirant: [],
    en_vedette: [],
  }

  for (const item of items) {
    if (grouped[item.type]) {
      grouped[item.type].push(item)
    }
  }

  return grouped
})
