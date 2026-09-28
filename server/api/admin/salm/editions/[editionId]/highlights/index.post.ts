import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import { asBody, assertValid, nextSortOrder, requireEdition, validateHighlight } from '../../../../../../utils/salm-content'

// Ajout d'un temps fort, en fin de liste (FR-146).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  await requireEdition(editionId)
  const { data, errors } = await validateHighlight(asBody(await readBody(event).catch(() => null)))
  assertValid(errors)
  const highlight = await prisma.salmHighlight.create({
    data: {
      editionId,
      title: data.title!,
      imagePath: data.imagePath!,
      imageAlt: data.imageAlt!,
      sortOrder: await nextSortOrder('salmHighlight', { editionId }),
    },
    select: { id: true, title: true, imagePath: true, imageAlt: true },
  })
  setResponseStatus(event, 201)
  return highlight
})
