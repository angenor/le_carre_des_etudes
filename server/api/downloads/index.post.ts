import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

const IVORIAN_PHONE_REGEX = /^(01|05|07|27)\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/

const STUDY_LEVELS = [
  'Terminale / Futur bachelier',
  'BTS / DUT (Bac+2)',
  'Licence (Bac+3)',
  'Master (Bac+5)',
  'Doctorat',
  'Autre',
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const errors: Record<string, string> = {}

  if (!body?.fullName?.trim()) {
    errors.fullName = 'Le nom complet est requis'
  }

  if (!body?.contact) {
    errors.contact = 'Le numéro de téléphone est requis'
  } else if (!IVORIAN_PHONE_REGEX.test(body.contact.trim())) {
    errors.contact = 'Format invalide (ex: 07 12 34 56 78)'
  }

  if (!body?.studyLevel) {
    errors.studyLevel = 'Le niveau d\'étude est requis'
  } else if (!STUDY_LEVELS.includes(body.studyLevel)) {
    errors.studyLevel = 'Niveau d\'étude invalide'
  }

  const age = Number(body?.age)
  if (!body?.age) {
    errors.age = 'L\'âge est requis'
  } else if (isNaN(age) || age < 15 || age > 99) {
    errors.age = 'L\'âge doit être entre 15 et 99'
  }

  if (!body?.fieldOfStudy?.trim()) {
    errors.fieldOfStudy = 'La filière est requise'
  }

  if (!body?.magazineId) {
    errors.magazineId = 'Le magazine est requis'
  }

  if (Object.keys(errors).length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Erreur de validation',
      data: { errors },
    })
  }

  const magazine = await prisma.magazine.findUnique({
    where: { id: Number(body.magazineId) },
  })

  if (!magazine) {
    throw createError({ statusCode: 404, message: 'Magazine non trouvé' })
  }

  if (!magazine.pdfPath) {
    throw createError({ statusCode: 400, message: 'Ce magazine n\'a pas de fichier PDF disponible' })
  }

  const download = await prisma.download.create({
    data: {
      fullName: body.fullName.trim(),
      contact: body.contact.trim(),
      studyLevel: body.studyLevel,
      age,
      fieldOfStudy: body.fieldOfStudy.trim(),
      magazineId: magazine.id,
    },
  })

  return {
    id: download.id,
    pdfUrl: magazine.pdfPath,
  }
})
