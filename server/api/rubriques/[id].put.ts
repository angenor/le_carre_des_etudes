import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

const VALID_TYPES = ['parcours_inspirant', 'en_vedette', 'agenda_et_opportunites', 'focus']

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
    throw createError({ statusCode: 400, message: 'Type invalide. Valeurs autorisées : parcours_inspirant, en_vedette, agenda_et_opportunites, focus' })
  }

  const type = body.type ?? existing.type

  const contentItem = await prisma.contentItem.update({
    where: { id },
    data: {
      type,
      title: body.title?.trim() ?? existing.title,
      description: body.description?.trim() ?? existing.description,
      content: body.content !== undefined ? body.content : existing.content,
      subtitle: type === 'parcours_inspirant' ? (body.subtitle !== undefined ? body.subtitle : existing.subtitle) : null,
      eventDate: type === 'agenda_et_opportunites' ? (body.eventDate !== undefined ? (body.eventDate ? new Date(body.eventDate) : null) : existing.eventDate) : null,
      eventLocation: type === 'agenda_et_opportunites' ? (body.eventLocation !== undefined ? body.eventLocation : existing.eventLocation) : null,
      imagePath: body.imagePath?.trim() ?? existing.imagePath,
      order: body.order ?? existing.order,
    },
  })

  return contentItem
})
