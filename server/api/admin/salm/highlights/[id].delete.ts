import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { found } from '../../../../utils/salm-content'
import { releaseSalmFiles } from '../../../../utils/salm-files'

// Suppression d'un temps fort, puis libération de sa photo (FR-131, FR-146).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { imagePath } = found(await prisma.salmHighlight.findUnique({ where: { id }, select: { imagePath: true } }))
  await prisma.salmHighlight.delete({ where: { id } })
  await releaseSalmFiles([imagePath])
  return { success: true }
})
