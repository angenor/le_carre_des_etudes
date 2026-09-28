import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { assertRateLimit, getClientIp, STUDENT_LIMIT } from '../../../utils/rate-limit'
import { getPublishedEdition, isRegistrationOpen } from '../../../utils/salm-edition'
import {
  apiError,
  assertHuman,
  createStudentRegistration,
  findStudentByPhone,
  pickStudentFields,
  resolveExistingStudent,
  toBadgePayload,
  validateStudent,
} from '../../../utils/salm-registration'
import type { SalmStudentResponse } from '#shared/types/salm'

// Inscription étudiante, ou badge existant si le numéro est déjà inscrit (contracts/public-api.md).
export default defineEventHandler(async (event): Promise<SalmStudentResponse> => {
  assertRateLimit(`students:ip:${getClientIp(event)}`, STUDENT_LIMIT, event)

  const fields = pickStudentFields(await readBody(event).catch(() => null))
  assertHuman(event, fields)

  const edition = await getPublishedEdition()
  if (!edition) throw apiError(404, 'NO_EDITION')

  const data = validateStudent(fields)

  // Deux passages au plus : une création concurrente (même numéro) renvoie vers l'inscription existante
  for (let pass = 0; pass < 2; pass++) {
    const existing = await findStudentByPhone(edition.id, data.phone)
    if (existing) {
      const registration = resolveExistingStudent(event, existing, data.phone, data.fullName)
      return { status: 'existing', badge: await toBadgePayload(event, registration, edition.year) }
    }

    if (!isRegistrationOpen(edition, 'students')) throw apiError(403, 'REGISTRATION_CLOSED')

    const result = await createStudentRegistration(edition.id, data)
    if (result.kind === 'created') {
      setResponseStatus(event, 201)
      return { status: 'created', badge: await toBadgePayload(event, result.registration, edition.year) }
    }
  }
  throw apiError(500, 'INTERNAL')
})
