import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { found } from '../../../../utils/salm-content'
import { releaseSalmFiles } from '../../../../utils/salm-files'

// Suppression d'une photo, puis libération de ses fichiers : version web et original (FR-164).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { imagePath, originalPath } = found(await prisma.salmPhoto.findUnique({ where: { id }, select: { imagePath: true, originalPath: true } }))
  await prisma.salmPhoto.delete({ where: { id } })
  await releaseSalmFiles([imagePath, originalPath])
  return { success: true }
})
