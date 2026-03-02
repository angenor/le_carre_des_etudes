import { defineEventHandler, readMultipartFormData, createError, setResponseStatus } from 'h3'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const ALLOWED_CATEGORIES = ['magazines', 'rubriques', 'partenaires'] as const
type Category = typeof ALLOWED_CATEGORIES[number]

/**
 * Nettoie un nom de fichier : supprime les caractères spéciaux,
 * remplace les espaces par des tirets, met en minuscules.
 */
function sanitizeFilename(filename: string): string {
  const ext = extname(filename)
  const name = filename.slice(0, filename.length - ext.length)

  const sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-zA-Z0-9_\-. ]/g, '') // Garde uniquement alphanumérique, _, -, .
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/-+/g, '-') // Tirets multiples → un seul
    .replace(/^-|-$/g, '') // Supprime tirets en début/fin
    .toLowerCase()

  return sanitized + ext.toLowerCase()
}

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Aucune donnée reçue. Envoyez un formulaire multipart avec un fichier et une catégorie.',
    })
  }

  // Extraire le fichier et la catégorie depuis les champs du formulaire
  const filePart = formData.find((part) => part.name === 'file')
  const categoryPart = formData.find((part) => part.name === 'category')

  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({
      statusCode: 400,
      message: 'Le champ "file" est requis et doit contenir un fichier.',
    })
  }

  const category = categoryPart?.data?.toString().trim()

  if (!category) {
    throw createError({
      statusCode: 400,
      message: 'Le champ "category" est requis.',
    })
  }

  if (!ALLOWED_CATEGORIES.includes(category as Category)) {
    throw createError({
      statusCode: 400,
      message: `Catégorie invalide : "${category}". Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}.`,
    })
  }

  // Générer un nom de fichier unique : timestamp + nom original nettoyé
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(filePart.filename)
  const uniqueFilename = `${timestamp}-${sanitized}`

  // Résoudre le chemin de destination
  const uploadDir = join(process.cwd(), 'public', 'uploads', category)
  const filePath = join(uploadDir, uniqueFilename)

  // Créer le répertoire s'il n'existe pas
  await mkdir(uploadDir, { recursive: true })

  // Écrire le fichier sur le disque
  await writeFile(filePath, filePart.data)

  // Retourner le chemin public du fichier
  const publicPath = `/uploads/${category}/${uniqueFilename}`

  setResponseStatus(event, 201)
  return { path: publicPath }
})
