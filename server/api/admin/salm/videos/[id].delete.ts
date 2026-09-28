import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { found } from '../../../../utils/salm-content'
import { releaseSalmFiles } from '../../../../utils/salm-files'

// Suppression d'une vidéo du canapé (FR-162).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { thumbnailPath } = found(await prisma.salmVideo.findUnique({ where: { id }, select: { thumbnailPath: true } }))
  await prisma.salmVideo.delete({ where: { id } })
  await releaseSalmFiles([thumbnailPath])
  return { success: true }
})
