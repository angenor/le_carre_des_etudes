import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { asBody, assertValid, found, validatePhoto } from '../../../../utils/salm-content'

// Texte alternatif et légende d'une photo ; l'image n'est pas remplaçable (FR-164).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  found(await prisma.salmPhoto.findUnique({ where: { id }, select: { id: true } }))
  const { data, errors } = await validatePhoto(asBody(await readBody(event).catch(() => null)), { partial: true })
  assertValid(errors)
  return prisma.salmPhoto.update({
    where: { id },
    data: { ...(data.alt ? { alt: data.alt } : {}), ...(data.caption !== undefined ? { caption: data.caption } : {}) },
    select: { id: true, imagePath: true, alt: true, caption: true },
  })
})
