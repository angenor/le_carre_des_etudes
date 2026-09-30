import { defineEventHandler, readBody, createError } from 'h3'
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
  const body = await readBody(event)

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Type invalide. Valeurs autorisées : parcours_inspirant, en_vedette, agenda_et_opportunites, focus' })
  }
  if (!body.imagePath?.trim()) {
    throw createError({ statusCode: 400, message: "Le chemin de l'image est requis" })
  }

  // Valider que le magazine existe si magazineId est fourni
  if (body.magazineId) {
    const magazine = await prisma.magazine.findUnique({ where: { id: body.magazineId } })
    if (!magazine) {
      throw createError({ statusCode: 400, message: 'Magazine non trouvé' })
    }
  }

  const contentItem = await prisma.contentItem.create({
    data: {
      type: body.type,
      title: body.title?.trim() || '',
      description: body.description?.trim() || '',
      content: body.content ?? null,
      subtitle: body.type === 'parcours_inspirant' ? (body.subtitle ?? null) : null,
      eventDate: body.type === 'agenda_et_opportunites' && body.eventDate ? new Date(body.eventDate) : null,
      eventLocation: body.type === 'agenda_et_opportunites' ? (body.eventLocation ?? null) : null,
      imagePath: body.imagePath.trim(),
      originalPath: readOriginalPath(body.originalPath),
      order: body.order ?? 0,
      magazineId: body.magazineId ?? null,
    },
    include: {
      magazine: { select: { id: true, slug: true, name: true } },
    },
  })

  setResponseStatus(event, 201)
  return contentItem
})
