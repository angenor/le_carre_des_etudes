import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'
import {
  assertValid,
  editionFlags,
  getEditionDetail,
  validateEditionPatch,
  yearTaken,
} from '../../../../../utils/salm-content'
import { isUniqueViolation } from '../../../../../utils/salm-registration'
import { releaseSalmFiles } from '../../../../../utils/salm-files'
import type { Prisma } from '../../../../../../app/generated/prisma/client'

// Informations, textes, fichiers, contacts, publics et vidéo récapitulative d'une édition
// (contrat § 4, FR-112, FR-114, FR-136, FR-141 à FR-145, FR-161). Jamais le statut, les interrupteurs,
// `lastBadgeSeq` ni les champs de purge (liste blanche de `validateEditionPatch`).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'editionId')
  const body = ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>

  const edition = await prisma.salmEdition.findUnique({
    where: { id },
    select: {
      year: true,
      status: true,
      posterPath: true,
      recapPosterPath: true,
      programPdfPath: true,
      lastBadgeSeq: true,
      personalDataPurgedAt: true,
      days: { select: { date: true, opensAt: true, closesAt: true } },
      _count: { select: { studentRegistrations: true, schoolRegistrations: true } },
    },
  })
  if (!edition) throw adminError(404, 'NOT_FOUND')
  const counts = { students: edition._count.studentRegistrations, schools: edition._count.schoolRegistrations }
  const { yearLocked } = editionFlags(edition, counts)

  const { data, errors } = await validateEditionPatch(body, {
    id,
    year: edition.year,
    yearLocked,
    posterPath: edition.posterPath,
  })
  assertValid(errors)

  try {
    await prisma.salmEdition.update({
      where: { id },
      data: {
        ...data,
        audiences: data.audiences as Prisma.InputJsonValue | undefined,
        contacts: data.contacts as Prisma.InputJsonValue | undefined,
      },
    })
  }
  catch (err) {
    if (isUniqueViolation(err) && data.year) throw yearTaken(data.year)
    throw err
  }

  // Fichiers remplacés ou retirés : libérés après l'écriture (research R3)
  await releaseSalmFiles([
    data.posterPath !== undefined && data.posterPath !== edition.posterPath ? edition.posterPath : null,
    data.recapPosterPath !== undefined && data.recapPosterPath !== edition.recapPosterPath ? edition.recapPosterPath : null,
    data.programPdfPath !== undefined && data.programPdfPath !== edition.programPdfPath ? edition.programPdfPath : null,
  ])

  return getEditionDetail(id)
})
