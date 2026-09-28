import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { adminError } from '../../../../utils/salm-admin'
import {
  controlRegistrationSelect,
  findEntry,
  getControlContext,
  toControlEntry,
  toControlPerson,
} from '../../../../utils/salm-control'
import { parseControlQuery } from '#shared/utils/salm-control'
import type { SalmControlLookup } from '#shared/types/salm'

const TOKEN_REGEX = /^[A-Za-z0-9_-]{22}$/

// Fiche d'un·e inscrit·e, sans rien enregistrer : saisie manuelle (FR-218 à FR-221)
// et validité d'un jeton pour un admin connecté (FR-223). Jamais de téléphone.
export default defineEventHandler(async (event): Promise<SalmControlLookup> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 40) : ''
  const token = typeof query.token === 'string' ? query.token : ''
  if (!q === !token) throw adminError(400, 'INVALID_QUERY')

  const ctx = await getControlContext()
  let registration: { id: number; fullName: string; studyLevel: string; badgeSeq: number; editionId: number } | null

  if (q) {
    const parsed = parseControlQuery(q, ctx.edition.year)
    if (!parsed) throw adminError(400, 'INVALID_QUERY')
    registration = await prisma.salmStudentRegistration.findUnique({
      where: parsed.kind === 'badge'
        ? { editionId_badgeSeq: { editionId: ctx.edition.id, badgeSeq: parsed.seq } }
        : { editionId_phone: { editionId: ctx.edition.id, phone: parsed.phone } },
      select: controlRegistrationSelect,
    })
    // Aucun détail sur la cause (FR-221)
    if (!registration) return { found: false }
  }
  else {
    const row = TOKEN_REGEX.test(token)
      ? await prisma.salmStudentRegistration.findUnique({
          where: { verifyToken: token },
          select: { ...controlRegistrationSelect, edition: { select: { year: true } } },
        })
      : null
    if (!row) return { found: false, validity: 'invalid', otherEditionYear: null }
    if (row.editionId !== ctx.edition.id) {
      return { found: true, validity: 'other_edition', otherEditionYear: row.edition.year }
    }
    registration = row
  }

  const entry = ctx.day ? await findEntry(registration.id, ctx.day.id) : null
  return {
    found: true,
    validity: 'valid',
    otherEditionYear: null,
    person: toControlPerson(registration, ctx.edition.year),
    today: { day: ctx.day, entry: entry ? toControlEntry(entry) : null },
  }
})
