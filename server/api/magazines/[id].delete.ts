import { defineEventHandler, getRouterParam, createError } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const magazine = await prisma.magazine.findUnique({ where: { id } })
  if (!magazine) {
    throw createError({ statusCode: 404, message: 'Magazine non trouvé' })
  }

  // Supprimer les fichiers associés
  const publicDir = join(process.cwd(), 'public')
  if (magazine.pdfPath) {
    try {
      await fs.unlink(join(publicDir, magazine.pdfPath))
    } catch {
      // Fichier peut-être déjà supprimé
    }
  }
  if (magazine.coverImage) {
    try {
      await fs.unlink(join(publicDir, magazine.coverImage))
    } catch {
      // Fichier peut-être déjà supprimé
    }
  }

  // Supprimer les downloads associés puis le magazine
  await prisma.download.deleteMany({ where: { magazineId: id } })
  await prisma.magazine.delete({ where: { id } })

  return { success: true }
})
