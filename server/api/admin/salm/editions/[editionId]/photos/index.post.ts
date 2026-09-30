import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import { asBody, assertValid, nextSortOrder, requireEdition, validatePhoto } from '../../../../../../utils/salm-content'

// Ajout d'une photo en fin de catalogue ; texte alternatif prérempli « Photo du SALM <année> n° <position> » (FR-163).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const edition = await requireEdition(editionId)
  const { data, errors } = await validatePhoto(asBody(await readBody(event).catch(() => null)))
  assertValid(errors)
  const position = (await prisma.salmPhoto.count({ where: { editionId } })) + 1
  const photo = await prisma.salmPhoto.create({
    data: {
      editionId,
      imagePath: data.imagePath!,
      originalPath: data.originalPath ?? null,
      alt: data.alt ?? `Photo du SALM ${edition.year} n° ${position}`,
      caption: data.caption ?? null,
      sortOrder: await nextSortOrder('salmPhoto', { editionId }),
    },
    select: { id: true, imagePath: true, alt: true, caption: true },
  })
  setResponseStatus(event, 201)
  return photo
})
