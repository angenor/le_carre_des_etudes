import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const magazine = await prisma.magazine.findUnique({
    where: { id },
  })

  if (!magazine) {
    throw createError({ statusCode: 404, message: 'Magazine non trouvé' })
  }

  return magazine
})
