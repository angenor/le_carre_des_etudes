import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const item = await prisma.contentItem.findUnique({ where: { id } })
  if (!item) {
    throw createError({ statusCode: 404, message: 'Rubrique non trouvée' })
  }

  // Mapper portrait → parcours_inspirant
  const type = item.type === 'portrait' ? 'parcours_inspirant' : item.type

  return { ...item, type }
})
