import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { adminError, parseIdParam } from '../../../../utils/salm-admin'

// Suppression définitive d'une inscription établissement, exposants compris (FR-067a).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { count } = await prisma.salmSchoolRegistration.deleteMany({ where: { id } })
  if (!count) throw adminError(404, 'NOT_FOUND', 'Inscription introuvable.')
  return { success: true }
})
