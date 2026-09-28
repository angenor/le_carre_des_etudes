import { createError, defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { adminError, getSchoolDetail, parseIdParam } from '../../../../utils/salm-admin'
import { SCHOOL_STATUSES, type SalmFieldError } from '#shared/utils/salm'

// Suivi d'un établissement : statut et note interne uniquement (FR-067).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const body = ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>

  const errors: Record<string, SalmFieldError> = {}
  const data: { status?: string; internalNote?: string | null } = {}
  if (body.status !== undefined) {
    if ((SCHOOL_STATUSES as readonly unknown[]).includes(body.status)) data.status = body.status as string
    else errors.status = 'INVALID_CHOICE'
  }
  if (body.internalNote !== undefined) {
    if (body.internalNote !== null && typeof body.internalNote !== 'string') errors.internalNote = 'INVALID_FORMAT'
    else {
      const note = (body.internalNote ?? '').trim()
      if (note.length > 2000) errors.internalNote = 'TOO_LONG'
      else data.internalNote = note || null
    }
  }
  if (Object.keys(errors).length || !Object.keys(data).length) {
    throw createError({ statusCode: 400, message: 'VALIDATION', data: { code: 'VALIDATION', errors } })
  }

  const { count } = await prisma.salmSchoolRegistration.updateMany({ where: { id }, data })
  if (!count) throw adminError(404, 'NOT_FOUND', 'Inscription introuvable.')
  return getSchoolDetail(id)
})
