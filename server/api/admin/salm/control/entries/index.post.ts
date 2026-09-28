import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { adminError } from '../../../../../utils/salm-admin'
import {
  buildControlResult,
  controlRegistration,
  controlRegistrationSelect,
  getControlContext,
} from '../../../../../utils/salm-control'
import { resolveControlResult } from '#shared/utils/salm-control'
import type { SalmControlResult } from '#shared/types/salm'

const TOKEN_REGEX = /^[A-Za-z0-9_-]{22}$/

// Entrée du jour, en ligne (FR-205 à FR-215, FR-220) : `token` (scan) ou `registrationId` (fiche).
export default defineEventHandler(async (event): Promise<SalmControlResult> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const body = await readBody(event).catch(() => null) as Record<string, unknown> | null
  const token = body?.token
  const registrationId = body?.registrationId
  const hasToken = token !== undefined && token !== null
  const hasId = registrationId !== undefined && registrationId !== null
  if (hasToken === hasId) throw adminError(400, 'VALIDATION')
  if (hasId && (typeof registrationId !== 'number' || !Number.isSafeInteger(registrationId))) {
    throw adminError(400, 'VALIDATION')
  }
  if (hasToken && typeof token !== 'string') throw adminError(400, 'VALIDATION')

  const ctx = await getControlContext()

  if (hasToken) {
    const registration = TOKEN_REGEX.test(token as string)
      ? await prisma.salmStudentRegistration.findUnique({
          where: { verifyToken: token as string },
          select: { ...controlRegistrationSelect, edition: { select: { year: true } } },
        })
      : null
    if (!registration || registration.editionId !== ctx.edition.id) {
      const resolution = resolveControlResult({
        registration: registration && { editionId: registration.editionId, editionYear: registration.edition.year },
        publishedEditionId: ctx.edition.id,
        dayId: ctx.day?.id ?? null,
        alreadyEntered: false,
      })
      return buildControlResult(ctx, resolution)
    }
    return controlRegistration(ctx, registration, ctx.edition.year, 'scan')
  }

  const registration = await prisma.salmStudentRegistration.findFirst({
    where: { id: registrationId as number, editionId: ctx.edition.id },
    select: controlRegistrationSelect,
  })
  if (!registration) throw adminError(404, 'NOT_FOUND')
  return controlRegistration(ctx, registration, ctx.edition.year, 'manual')
})
