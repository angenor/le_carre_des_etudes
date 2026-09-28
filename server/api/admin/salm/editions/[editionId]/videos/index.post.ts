import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import { asBody, assertValid, nextSortOrder, requireEdition, validateVideo, videoWarnings } from '../../../../../../utils/salm-content'
import { parseYoutubeId } from '#shared/utils/salm'

// Ajout d'une vidéo du canapé, en fin de liste ; un doublon est accepté avec un avertissement (FR-134, FR-162).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  await requireEdition(editionId)
  const { data, errors } = validateVideo(asBody(await readBody(event).catch(() => null)))
  assertValid(errors)
  const warnings = await videoWarnings(editionId, data.youtubeUrl!)
  const video = await prisma.salmVideo.create({
    data: {
      editionId,
      youtubeUrl: data.youtubeUrl!,
      title: data.title ?? null,
      guest: data.guest ?? null,
      institution: data.institution ?? null,
      sortOrder: await nextSortOrder('salmVideo', { editionId }),
    },
    select: { id: true, youtubeUrl: true, title: true, guest: true, institution: true },
  })
  setResponseStatus(event, 201)
  return { ...video, youtubeId: parseYoutubeId(video.youtubeUrl), ...(warnings.length ? { warnings } : {}) }
})
