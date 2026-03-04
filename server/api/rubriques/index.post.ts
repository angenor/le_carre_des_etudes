import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

const VALID_TYPES = ['parcours_inspirant', 'en_vedette', 'agenda_et_opportunites', 'focus']

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Type invalide. Valeurs autorisées : parcours_inspirant, en_vedette, agenda_et_opportunites, focus' })
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
      content: body.content ?? null,
      subtitle: body.type === 'parcours_inspirant' ? (body.subtitle ?? null) : null,
      eventDate: body.type === 'agenda_et_opportunites' && body.eventDate ? new Date(body.eventDate) : null,
      eventLocation: body.type === 'agenda_et_opportunites' ? (body.eventLocation ?? null) : null,
      imagePath: body.imagePath.trim(),
      order: body.order ?? 0,
    },
  })

  return contentItem
})
