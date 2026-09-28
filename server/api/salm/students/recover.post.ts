import { defineEventHandler, readBody } from 'h3'
import { assertRateLimit, getClientIp, STUDENT_LIMIT } from '../../../utils/rate-limit'
import { getPublishedEdition } from '../../../utils/salm-edition'
import {
  apiError,
  assertHuman,
  findStudentByPhone,
  pickStudentFields,
  resolveExistingStudent,
  toBadgePayload,
  validateStudent,
} from '../../../utils/salm-registration'
import type { SalmStudentResponse } from '#shared/types/salm'

// Récupération d'un badge (téléphone + nom), y compris inscriptions fermées.
export default defineEventHandler(async (event): Promise<SalmStudentResponse> => {
  assertRateLimit(`students:ip:${getClientIp(event)}`, STUDENT_LIMIT, event)

  const { studyLevel: _ignored, ...fields } = pickStudentFields(await readBody(event).catch(() => null))
  assertHuman(event, fields)

  const edition = await getPublishedEdition()
  if (!edition) throw apiError(404, 'NO_EDITION')

  const data = validateStudent(fields, { withLevel: false })
  const existing = await findStudentByPhone(edition.id, data.phone)
  if (!existing) throw apiError(404, 'NOT_FOUND')

  const registration = resolveExistingStudent(event, existing, data.phone, data.fullName)
  return { status: 'existing', badge: await toBadgePayload(event, registration, edition.year) }
})
