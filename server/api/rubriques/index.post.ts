import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

const VALID_TYPES = ['portrait', 'parcours_inspirant', 'en_vedette']

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Type invalide. Valeurs autorisées : portrait, parcours_inspirant, en_vedette' })
  }
  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, message: 'Le titre est requis' })
  }
  if (!body.description?.trim()) {
    throw createError({ statusCode: 400, message: 'La description est requise' })
  }
  if (!body.imagePath?.trim()) {
    throw createError({ statusCode: 400, message: "Le chemin de l'image est requis" })
  }

  const contentItem = await prisma.contentItem.create({
    data: {
      type: body.type,
      title: body.title.trim(),
      description: body.description.trim(),
      imagePath: body.imagePath.trim(),
      order: body.order ?? 0,
    },
  })

  return contentItem
})
