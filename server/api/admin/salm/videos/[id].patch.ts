import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { asBody, assertValid, found, validateVideo, videoWarnings } from '../../../../utils/salm-content'
import { parseYoutubeId } from '#shared/utils/salm'

// Modification d'une vidéo du canapé (FR-134, FR-162).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { editionId } = found(await prisma.salmVideo.findUnique({ where: { id }, select: { editionId: true } }))
  const { data, errors } = validateVideo(asBody(await readBody(event).catch(() => null)), { partial: true })
  assertValid(errors)
  const video = await prisma.salmVideo.update({
    where: { id },
    data,
    select: { id: true, youtubeUrl: true, title: true, guest: true, institution: true },
  })
  const warnings = data.youtubeUrl ? await videoWarnings(editionId, data.youtubeUrl, id) : []
  return { ...video, youtubeId: parseYoutubeId(video.youtubeUrl), ...(warnings.length ? { warnings } : {}) }
})
