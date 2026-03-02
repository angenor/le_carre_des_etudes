import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

const VALID_TYPES = ['portrait', 'parcours_inspirant', 'en_vedette']

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const existing = await prisma.contentItem.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Rubrique non trouvée' })
  }

  const body = await readBody(event)

  if (body.type && !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Type invalide. Valeurs autorisées : portrait, parcours_inspirant, en_vedette' })
  }

  const contentItem = await prisma.contentItem.update({
    where: { id },
    data: {
      type: body.type ?? existing.type,
      title: body.title?.trim() ?? existing.title,
      description: body.description?.trim() ?? existing.description,
      imagePath: body.imagePath?.trim() ?? existing.imagePath,
      order: body.order ?? existing.order,
    },
  })

  return contentItem
})
