import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { asBody, assertValid, found, validateHighlight } from '../../../../utils/salm-content'
import { releaseSalmFiles } from '../../../../utils/salm-files'

// Modification d'un temps fort ; l'ancienne photo est libérée si elle n'est plus utilisée (FR-136, FR-146).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const current = found(await prisma.salmHighlight.findUnique({ where: { id }, select: { title: true, imagePath: true } }))
  const { data, errors } = await validateHighlight(asBody(await readBody(event).catch(() => null)), { partial: true, current })
  assertValid(errors)
  const highlight = await prisma.salmHighlight.update({
    where: { id },
    data,
    select: { id: true, title: true, imagePath: true, imageAlt: true },
  })
  if (data.imagePath && data.imagePath !== current.imagePath) await releaseSalmFiles([current.imagePath])
  return highlight
})
