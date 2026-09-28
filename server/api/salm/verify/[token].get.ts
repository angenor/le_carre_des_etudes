import { defineEventHandler, getRouterParam } from 'h3'
import { prisma } from '../../../utils/prisma'
import { BADGE_TOKEN_REGEX } from '../../../utils/salm-registration'
import type { SalmVerifyResponse } from '#shared/types/salm'

// Page de vérification ouverte par le QR code : édition et validité, aucune donnée personnelle (FR-028).
export default defineEventHandler(async (event): Promise<SalmVerifyResponse> => {
  const token = getRouterParam(event, 'token') ?? ''
  const registration = BADGE_TOKEN_REGEX.test(token)
    ? await prisma.salmStudentRegistration.findUnique({
        where: { verifyToken: token },
        select: { edition: { select: { year: true, salonName: true } } },
      })
    : null
  return registration
    ? { valid: true, edition: registration.edition }
    : { valid: false, edition: null }
})
