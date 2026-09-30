import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

const VALID_TYPES = ['parcours_inspirant', 'en_vedette', 'agenda_et_opportunites', 'focus']

// Image d'origine d'une rubrique (affichée à l'agrandissement) : un envoi du dossier des rubriques, ou rien.
const ORIGINAL_PATH = /^\/uploads\/rubriques\/[a-z0-9][a-z0-9._-]*$/

function readOriginalPath(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !ORIGINAL_PATH.test(value) || value.includes('..')) {
    throw createError({ statusCode: 400, message: "Chemin de l'image d'origine invalide" })
  }
  return value
}

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

  // Valider que le magazine existe si magazineId est fourni (non null)
  if (body.magazineId !== undefined && body.magazineId !== null) {
    const magazine = await prisma.magazine.findUnique({ where: { id: body.magazineId } })
    if (!magazine) {
      throw createError({ statusCode: 400, message: 'Magazine non trouvé' })
    }
  }

  const type = body.type ?? existing.type
  const imagePath = body.imagePath?.trim() || existing.imagePath
  // Nouvelle image : son original l'accompagne (ou aucun) ; même image : l'original en place est gardé
  const originalPath = imagePath !== existing.imagePath ? readOriginalPath(body.originalPath) : existing.originalPath

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
      imagePath,
      originalPath,
      order: body.order ?? existing.order,
      ...(body.magazineId !== undefined && { magazineId: body.magazineId }),
    },
    include: {
      magazine: { select: { id: true, slug: true, name: true } },
    },
  })

  return contentItem
})
