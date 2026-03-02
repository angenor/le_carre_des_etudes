import { defineEventHandler, getRouterParam, createError } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const contentItem = await prisma.contentItem.findUnique({ where: { id } })
  if (!contentItem) {
    throw createError({ statusCode: 404, message: 'Rubrique non trouvée' })
  }

  // Supprimer l'image associée
  if (contentItem.imagePath) {
    const publicDir = join(process.cwd(), 'public')
    try {
      await fs.unlink(join(publicDir, contentItem.imagePath))
    } catch {
      // Fichier peut-être déjà supprimé
    }
  }

  await prisma.contentItem.delete({ where: { id } })

  return { success: true }
})
