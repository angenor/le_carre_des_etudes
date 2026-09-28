import { defineEventHandler, readBody, setResponseHeader, setResponseStatus } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { adminError } from '../../../../utils/salm-admin'
import {
  buildControlResult,
  controlRegistrationSelect,
  findEntry,
  getControlContext,
  recordEntry,
  toControlEntry,
  toControlPerson,
} from '../../../../utils/salm-control'
import { createStudentRegistration, pickStudentFields, validateStudent, validationError } from '../../../../utils/salm-registration'
import type { SalmFieldError } from '#shared/utils/salm'
import type { SalmControlLookup, SalmControlResult } from '#shared/types/salm'

// Inscription sur place par l'équipe, puis entrée du jour (FR-242 à FR-246, research R13).
// Même validation que le formulaire public, sans contrôle anti-robot ; l'interrupteur public n'est pas consulté.
export default defineEventHandler(async (event): Promise<SalmControlResult | { created: false; lookup: SalmControlLookup }> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const body = (await readBody(event).catch(() => null) ?? {}) as Record<string, unknown>
  const fields = pickStudentFields({ fullName: body.fullName, phone: body.phone, studyLevel: body.studyLevel })

  let data
  try {
    data = validateStudent(fields)
  }
  catch (error) {
    // Case « informée » ajoutée aux erreurs des champs (FR-243)
    const errors = (error as { data?: { errors?: Record<string, SalmFieldError> } }).data?.errors
    if (errors && body.informed !== true) throw validationError({ ...errors, informed: 'REQUIRED' })
    throw error
  }
  if (body.informed !== true) throw validationError({ informed: 'REQUIRED' })

  const ctx = await getControlContext()
  if (!ctx.day) throw adminError(409, 'NOT_A_SALON_DAY', 'Aucun jour de salon aujourd\'hui.')

  const created = await createStudentRegistration(ctx.edition.id, data, { origin: 'onsite' })

  if (created.kind === 'existing') {
    // Téléphone déjà inscrit : rien n'est créé ni modifié, la fiche existante est renvoyée (FR-245)
    const registration = await prisma.salmStudentRegistration.findUnique({
      where: { editionId_phone: { editionId: ctx.edition.id, phone: data.phone } },
      select: controlRegistrationSelect,
    })
    if (!registration) throw adminError(500, 'INTERNAL')
    const entry = await findEntry(registration.id, ctx.day.id)
    return {
      created: false,
      lookup: {
        found: true,
        validity: 'valid',
        otherEditionYear: null,
        person: toControlPerson(registration, ctx.edition.year),
        today: { day: ctx.day, entry: entry ? toControlEntry(entry) : null },
      },
    }
  }

  setResponseStatus(event, 201)
  const person = toControlPerson(created.registration, ctx.edition.year)
  try {
    const { entry } = await recordEntry({ registrationId: created.registration.id, dayId: ctx.day.id, mode: 'manual' })
    return {
      ...(await buildControlResult(ctx, { status: 'entered', reason: null, otherEditionYear: null }, { person, entry: toControlEntry(entry) })),
      created: true,
    }
  }
  catch (error) {
    // L'inscription reste créée : l'équipe validera l'entrée depuis la fiche
    console.error('[SALM] Entrée non enregistrée après une inscription sur place', { code: (error as { code?: string })?.code })
    return {
      ...(await buildControlResult(ctx, { status: 'entered', reason: null, otherEditionYear: null }, { person })),
      created: true,
      entryError: 'INTERNAL',
    }
  }
})
