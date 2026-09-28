import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { found } from '../../../../utils/salm-content'
import { releaseSalmFiles } from '../../../../utils/salm-files'

// Suppression d'une photo, puis libération de son fichier (FR-164).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { imagePath } = found(await prisma.salmPhoto.findUnique({ where: { id }, select: { imagePath: true } }))
  await prisma.salmPhoto.delete({ where: { id } })
  await releaseSalmFiles([imagePath])
  return { success: true }
})
