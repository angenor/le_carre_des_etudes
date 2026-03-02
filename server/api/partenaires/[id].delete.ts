import { defineEventHandler, getRouterParam, createError } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const partner = await prisma.partner.findUnique({ where: { id } })
  if (!partner) {
    throw createError({ statusCode: 404, message: 'Partenaire non trouvé' })
  }

  // Supprimer le logo associé
  if (partner.logoPath) {
    const publicDir = join(process.cwd(), 'public')
    try {
      await fs.unlink(join(publicDir, partner.logoPath))
    } catch {
      // Fichier peut-être déjà supprimé
    }
  }

  await prisma.partner.delete({ where: { id } })

  return { success: true }
})
