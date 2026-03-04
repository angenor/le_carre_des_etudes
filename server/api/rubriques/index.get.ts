import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const items = await prisma.contentItem.findMany({
    orderBy: { order: 'asc' },
    include: {
      magazine: {
        select: { id: true, slug: true, name: true },
      },
    },
  })

  const grouped: Record<string, typeof items> = {
    en_vedette: [],
    parcours_inspirant: [],
    agenda_et_opportunites: [],
    focus: [],
  }

  for (const item of items) {
    // Mapper portrait → parcours_inspirant
    const type = item.type === 'portrait' ? 'parcours_inspirant' : item.type
    if (grouped[type]) {
      grouped[type].push({ ...item, type })
    }
  }

  return grouped
})
